const MatchLineItem = require("../models/MatchLineItem");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const CustomerCreditBalance = require("../models/CustomerCreditBalance");
const { sendPaymentReceipt, sendBalanceDueNotice, sendCreditAlert } = require("../services/email.service");

// Choice A: Confirm a suggested match
async function confirmMatch(req, res) {
  try {
    const { id } = req.params;
    const matchLineItem = await MatchLineItem.findById(id);
    if (!matchLineItem) {
      return res.status(404).json({ error: "Match line item not found" });
    }

    const invoice = await Invoice.findById(matchLineItem.invoiceId);
    const payment = await Payment.findById(matchLineItem.paymentId);

    const matchedAmount = parseFloat(matchLineItem.matchedAmountInr.toString());

    invoice.amountPaidInr = parseFloat(invoice.amountPaidInr.toString()) + matchedAmount;
    invoice.balanceInr = parseFloat(invoice.balanceInr.toString()) - matchedAmount;
    invoice.status = invoice.balanceInr <= 0 ? "PAID" : "PARTIALLY_PAID";
    await invoice.save();

    matchLineItem.status = "CONFIRMED";
    matchLineItem.confirmedByUserId = req.user.userId;
    await matchLineItem.save();

    payment.status = "TIER2_AUTO_MATCHED";
    await payment.save();

if (invoice.customerEmail) {
      await sendPaymentReceipt({
        to: invoice.customerEmail,
        customerName: invoice.customerName,
        amountInr: matchedAmount,
        invoiceNumber: invoice.invoiceNumber,
      });
    }

    return res.status(200).json({ matchLineItem, invoice });  } catch (error) {
    console.error("Confirm match error:", error);
    return res.status(500).json({ error: "Something went wrong while confirming the match" });
  }
}

// Choice B: Partial payment
async function applyPartialPayment(req, res) {
  try {
    const { id } = req.params;
    const matchLineItem = await MatchLineItem.findById(id);
    if (!matchLineItem) {
      return res.status(404).json({ error: "Match line item not found" });
    }

    const invoice = await Invoice.findById(matchLineItem.invoiceId);
    const payment = await Payment.findById(matchLineItem.paymentId);

    const paidAmount = parseFloat(payment.amountInr.toString());

    invoice.amountPaidInr = parseFloat(invoice.amountPaidInr.toString()) + paidAmount;
    invoice.balanceInr = parseFloat(invoice.balanceInr.toString()) - paidAmount;
    invoice.status = "PARTIALLY_PAID";
    await invoice.save();

    matchLineItem.status = "CONFIRMED";
    matchLineItem.matchedAmountInr = paidAmount;
    matchLineItem.confirmedByUserId = req.user.userId;
    await matchLineItem.save();

    payment.status = "PARTIALLY_MATCHED";
    await payment.save();

    if (invoice.customerEmail) {
      await sendBalanceDueNotice({
        to: invoice.customerEmail,
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        remainingBalance: invoice.balanceInr,
      });
    }

    return res.status(200).json({
      matchLineItem,
      invoice,
      message: `Partial payment applied. Remaining balance: ₹${invoice.balanceInr}`,
    });
  } catch (error) {
    console.error("Partial payment error:", error);
    return res.status(500).json({ error: "Something went wrong while applying the partial payment" });
  }
}

// Choice C: Short-pay adjustment / discount
async function applyAdjustment(req, res) {
  try {
    const { id } = req.params;
    const { deductionReasonId } = req.body;

    if (!deductionReasonId) {
      return res.status(400).json({ error: "deductionReasonId is required" });
    }

    const matchLineItem = await MatchLineItem.findById(id);
    if (!matchLineItem) {
      return res.status(404).json({ error: "Match line item not found" });
    }

    const invoice = await Invoice.findById(matchLineItem.invoiceId);
    const payment = await Payment.findById(matchLineItem.paymentId);

    const paidAmount = parseFloat(payment.amountInr.toString());

    invoice.amountPaidInr = parseFloat(invoice.amountPaidInr.toString()) + paidAmount;
    invoice.balanceInr = 0;
    invoice.status = "PAID";
    await invoice.save();

    matchLineItem.status = "CONFIRMED";
    matchLineItem.isShortPay = true;
    matchLineItem.deductionReasonId = deductionReasonId;
    matchLineItem.confirmedByUserId = req.user.userId;
    await matchLineItem.save();

    payment.status = "TIER2_AUTO_MATCHED";
    await payment.save();

    return res.status(200).json({ matchLineItem, invoice });
  } catch (error) {
    console.error("Adjustment error:", error);
    return res.status(500).json({ error: "Something went wrong while applying the adjustment" });
  }
}

// Choice D: Unmatched / overpayment -> credit balance
async function unapplyPayment(req, res) {
  try {
    const { id } = req.params; // payment id
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const amount = parseFloat(payment.amountInr.toString());
    const customerId = payment.payerName || "UNKNOWN";

    let creditBalance = await CustomerCreditBalance.findOne({
      organizationId: req.user.organizationId,
      customerId,
    });

    if (!creditBalance) {
      creditBalance = await CustomerCreditBalance.create({
        organizationId: req.user.organizationId,
        customerId,
        balanceInr: amount,
      });
    } else {
      creditBalance.balanceInr = parseFloat(creditBalance.balanceInr.toString()) + amount;
      await creditBalance.save();
    }

    payment.status = "UNAPPLIED";
    await payment.save();

// Note: no invoice/customerEmail available here since payment wasn't matched to an invoice.
    // We only have payerName - if you want email alerts here, payerName would need to double as
    // a lookup key, or this endpoint would need an email passed in directly.

    return res.status(200).json({ payment, creditBalance });  } catch (error) {
    console.error("Unapply payment error:", error);
    return res.status(500).json({ error: "Something went wrong while unapplying the payment" });
  }
}

// Reverse a previously applied match
async function unmatch(req, res) {
  try {
    const { id } = req.params; // matchLineItem id

    const matchLineItem = await MatchLineItem.findById(id);
    if (!matchLineItem) {
      return res.status(404).json({ error: "Match line item not found" });
    }

    const invoice = await Invoice.findById(matchLineItem.invoiceId);
    const payment = await Payment.findById(matchLineItem.paymentId);

    if (!invoice || !payment) {
      return res.status(404).json({ error: "Related invoice or payment not found" });
    }

    const matchedAmount = parseFloat(matchLineItem.matchedAmountInr.toString());

    invoice.amountPaidInr = parseFloat(invoice.amountPaidInr.toString()) - matchedAmount;
    invoice.balanceInr = parseFloat(invoice.balanceInr.toString()) + matchedAmount;
    invoice.status = invoice.amountPaidInr <= 0 ? "OPEN" : "PARTIALLY_PAID";
    await invoice.save();

    payment.status = "UNMATCHED";
    await payment.save();

    await MatchLineItem.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Match reversed successfully",
      payment,
      invoice,
    });
  } catch (error) {
    console.error("Unmatch error:", error);
    return res.status(500).json({ error: "Something went wrong while reversing the match" });
  }
}

module.exports = { confirmMatch, applyPartialPayment, applyAdjustment, unapplyPayment, unmatch };