const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const MatchLineItem = require("../models/MatchLineItem");
const mongoose = require("mongoose");
const TdsRateConfig = require("../models/TdsRateConfig");
const { generateEmbedding, generateMatchReasoning } = require("./OpenAI.service");
const { sendPaymentReceipt } = require("./email.service");

async function runTier1Match(paymentId) {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  if (payment.status !== "UNMATCHED") {
    return { matched: false, reason: "Payment is not in UNMATCHED status" };
  }

  const organizationId = payment.organizationId;
  let matchedInvoice = null;
  let matchTier = null;

  // Attempt 1: exact UTR/RRN match against payment memo text
  // (In this MVP, we check if any open invoice's number appears in the raw memo text,
  //  since UTR numbers don't live on invoices - this is a simple heuristic for now)
 if (payment.utrOrRrnNumber) {
    const invoiceNumberInMemo = extractInvoiceNumberFromText(payment.rawMemoText);
    if (invoiceNumberInMemo) {
      const candidateInvoice = await Invoice.findOne({
        organizationId,
        invoiceNumber: invoiceNumberInMemo,
        status: { $in: ["OPEN", "PARTIALLY_PAID"] },
      });

      if (candidateInvoice) {
        const paymentAmount = parseFloat(payment.amountInr.toString());
        const invoiceBalance = parseFloat(candidateInvoice.balanceInr.toString());
        const amountMatchesExactly = Math.abs(invoiceBalance - paymentAmount) < 0.01;

        if (amountMatchesExactly) {
          matchedInvoice = candidateInvoice;
          matchTier = "TIER1_EXACT_UTR";
        }
        // If reference matches but amount doesn't, we deliberately do NOT match here —
        // this is a short-pay/TDS case that must go to Tier 2 for reasoning.
      }
    }
  }

  // Attempt 2: exact customer name + exact amount match
  if (!matchedInvoice) {
    const paymentAmount = parseFloat(payment.amountInr.toString());

    const candidateInvoices = await Invoice.find({
      organizationId,
      status: { $in: ["OPEN", "PARTIALLY_PAID"] },
    });

    const exactMatch = candidateInvoices.find((inv) => {
      const invoiceBalance = parseFloat(inv.balanceInr.toString());
      const nameMatches =
        inv.customerName.toLowerCase().trim() === (payment.payerName || "").toLowerCase().trim();
      const amountMatches = Math.abs(invoiceBalance - paymentAmount) < 0.01;
      return nameMatches && amountMatches;
    });

    if (exactMatch) {
      matchedInvoice = exactMatch;
      matchTier = "TIER1_EXACT_AMOUNT";
    }
  }

  if (!matchedInvoice) {
    return { matched: false, reason: "No Tier 1 exact match found" };
  }

  // Apply the match
  const paymentAmount = parseFloat(payment.amountInr.toString());

  const matchLineItem = await MatchLineItem.create({
    paymentId: payment._id,
    invoiceId: matchedInvoice._id,
    matchedAmountInr: paymentAmount,
    confidenceScore: 1.0,
    matchTier,
    reasoning: `Exact ${matchTier === "TIER1_EXACT_UTR" ? "invoice reference" : "customer + amount"} match`,
    status: "CONFIRMED",
  });

  matchedInvoice.amountPaidInr = parseFloat(matchedInvoice.amountPaidInr.toString()) + paymentAmount;
  matchedInvoice.balanceInr = parseFloat(matchedInvoice.balanceInr.toString()) - paymentAmount;
  matchedInvoice.status = matchedInvoice.balanceInr <= 0 ? "PAID" : "PARTIALLY_PAID";
  await matchedInvoice.save();

  payment.status = "TIER1_MATCHED";
  await payment.save();

  if (matchedInvoice.customerEmail) {
    await sendPaymentReceipt({
      to: matchedInvoice.customerEmail,
      customerName: matchedInvoice.customerName,
      amountInr: paymentAmount,
      invoiceNumber: matchedInvoice.invoiceNumber,
    });
  }

  return { matched: true, matchLineItem, invoice: matchedInvoice };
}


function extractInvoiceNumberFromText(text) {
  if (!text) return null;
  // Looks for patterns like "INV-1001", "inv 1001", "invoice #1001"
  const match = text.match(/inv(?:oice)?[\s#-]*(\d+)/i);
  if (!match) return null;
  return `INV-${match[1]}`;
}

async function findSimilarInvoices(organizationId, embedding, limit = 5) {
  const Invoice = require("../models/Invoice");

  const results = await Invoice.aggregate([
    {
      $vectorSearch: {
        index: "invoice_vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 50,
        limit: limit,
        filter: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $in: ["OPEN", "PARTIALLY_PAID"] },
        },
      },
    },
    {
      $project: {
        invoiceNumber: 1,
        customerName: 1,
        balanceInr: 1,
        amountDueInr: 1,
        status: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
}

async function runTier2Match(paymentId) {
  const Payment = require("../models/Payment");
  const Invoice = require("../models/Invoice");
  const MatchLineItem = require("../models/MatchLineItem");

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  if (payment.status !== "UNMATCHED") {
    return { matched: false, reason: "Payment is not in UNMATCHED status" };
  }

  const organizationId = payment.organizationId;

  // Build a search text from whatever info we have on the payment
  const searchText = `${payment.payerName || ""} ${payment.rawMemoText || ""}`.trim();

  if (!searchText) {
    return { matched: false, reason: "No payer name or memo text to search with" };
  }

  const paymentEmbedding = await generateEmbedding(searchText);
  const candidates = await findSimilarInvoices(organizationId, paymentEmbedding, 5);

  if (candidates.length === 0) {
    return { matched: false, reason: "No candidate invoices found via vector search" };
  }

  const paymentAmount = parseFloat(payment.amountInr.toString());

  // Get this org's active TDS rates to check against the shortfall
  const tdsRates = await TdsRateConfig.find({ organizationId, isActive: true });

  let bestMatch = null;
  let bestReasoning = null;
  let bestConfidence = 0;
  let bestTdsAmount = 0;
  let bestTdsSection = null;
  let bestMatchTier = null;

  for (const candidate of candidates) {
    const invoiceAmount = parseFloat(candidate.balanceInr.toString());
    const shortfall = invoiceAmount - paymentAmount;

    if (shortfall < 0) continue; // payment is more than invoice, not a short-pay case

    let matchedTdsRate = null;
    for (const rate of tdsRates) {
      const ratePercent = parseFloat(rate.ratePercent.toString());
      const expectedTds = invoiceAmount * (ratePercent / 100);
      if (Math.abs(expectedTds - shortfall) < 1) {
        // within ₹1 tolerance for rounding
        matchedTdsRate = rate;
        break;
      }
    }

    const reasoningInput = {
      paymentAmount,
      invoiceAmount,
      invoiceNumber: candidate.invoiceNumber,
      tdsPercent: matchedTdsRate ? parseFloat(matchedTdsRate.ratePercent.toString()) : null,
      tdsSection: matchedTdsRate ? matchedTdsRate.section : null,
    };

    let aiResult;
    try {
      aiResult = await generateMatchReasoning(reasoningInput);
    } catch (aiError) {
      console.error("Gemini reasoning failed:", aiError.message);
      continue;
    }

    // Safety check: if there's a shortfall but no verified TDS match, cap confidence
// so it can never auto-apply purely on the AI's say-so
if (shortfall > 0 && !matchedTdsRate && aiResult.confidenceScore > 0.7) {
  aiResult.confidenceScore = 0.7;
}

    if (aiResult.confidenceScore > bestConfidence) {
      bestConfidence = aiResult.confidenceScore;
      bestMatch = candidate;
      bestReasoning = aiResult.reasoning;
      bestTdsAmount = matchedTdsRate ? shortfall : 0;
      bestTdsSection = matchedTdsRate ? matchedTdsRate.section : null;
      bestMatchTier = matchedTdsRate ? "TIER2_VECTOR_TDS" : "TIER2_VECTOR_DISCOUNT";
    }
  }

  if (!bestMatch) {
    payment.status = "NEEDS_REVIEW";
    await payment.save();
    return { matched: false, reason: "No confident candidate found, sent to review", needsReview: true };
  }

  const invoiceDoc = await Invoice.findById(bestMatch._id);
  const AUTO_APPLY_THRESHOLD = 0.85;

  if (bestConfidence > AUTO_APPLY_THRESHOLD) {
    const matchLineItem = await MatchLineItem.create({
      paymentId: payment._id,
      invoiceId: invoiceDoc._id,
      matchedAmountInr: paymentAmount,
      tdsAmountInr: bestTdsAmount,
      tdsSection: bestTdsSection,
      confidenceScore: bestConfidence,
      matchTier: bestMatchTier,
      reasoning: bestReasoning,
      isShortPay: bestTdsAmount > 0,
      status: "CONFIRMED",
    });

    invoiceDoc.amountPaidInr = parseFloat(invoiceDoc.amountPaidInr.toString()) + paymentAmount;
    invoiceDoc.balanceInr = parseFloat(invoiceDoc.balanceInr.toString()) - paymentAmount;
    invoiceDoc.status = invoiceDoc.balanceInr <= 0 ? "PAID" : "PARTIALLY_PAID";
    await invoiceDoc.save();

    payment.status = "TIER2_AUTO_MATCHED";
    await payment.save();

    if (invoiceDoc.customerEmail) {
      await sendPaymentReceipt({
        to: invoiceDoc.customerEmail,
        customerName: invoiceDoc.customerName,
        amountInr: paymentAmount,
        invoiceNumber: invoiceDoc.invoiceNumber,
      });
    }

    return { matched: true, autoApplied: true, matchLineItem, invoice: invoiceDoc };
  } else {
    const matchLineItem = await MatchLineItem.create({
      paymentId: payment._id,
      invoiceId: invoiceDoc._id,
      matchedAmountInr: paymentAmount,
      tdsAmountInr: bestTdsAmount,
      tdsSection: bestTdsSection,
      confidenceScore: bestConfidence,
      matchTier: bestMatchTier,
      reasoning: bestReasoning,
      isShortPay: bestTdsAmount > 0,
      status: "SUGGESTED",
    });

    payment.status = "NEEDS_REVIEW";
    await payment.save();

    return { matched: false, needsReview: true, suggestedMatch: matchLineItem };
  }
}

module.exports = { runTier1Match, runTier2Match };