const Payment = require("../models/Payment");
const MatchLineItem = require("../models/MatchLineItem");
const Invoice = require("../models/Invoice");

async function listExceptions(req, res) {
  try {
    const payments = await Payment.find({
      organizationId: req.user.organizationId,
      status: "NEEDS_REVIEW",
    }).sort({ createdAt: -1 });

    const results = [];

    for (const payment of payments) {
      const suggestedMatches = await MatchLineItem.find({
        paymentId: payment._id,
        status: "SUGGESTED",
      });

      const matchesWithInvoices = await Promise.all(
        suggestedMatches.map(async (match) => {
          const invoice = await Invoice.findById(match.invoiceId);
          return {
            matchLineItemId: match._id,
            invoiceId: invoice ? invoice._id : null,
            invoiceNumber: invoice ? invoice.invoiceNumber : null,
            customerName: invoice ? invoice.customerName : null,
            confidenceScore: match.confidenceScore,
            reasoning: match.reasoning,
            tdsAmountInr: match.tdsAmountInr,
            tdsSection: match.tdsSection,
          };
        })
      );

      results.push({
        payment,
        suggestedMatches: matchesWithInvoices,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("List exceptions error:", error);
    return res.status(500).json({ error: "Something went wrong while fetching the exception queue" });
  }
}

module.exports = { listExceptions };