const mongoose = require("mongoose");

const matchLineItemSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  matchedAmountInr: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  tdsAmountInr: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  tdsSection: {
    type: String,
    default: null,
  },
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  matchTier: {
    type: String,
    enum: [
      "TIER1_EXACT_UTR",
      "TIER1_EXACT_AMOUNT",
      "TIER2_VECTOR_TDS",
      "TIER2_VECTOR_DISCOUNT",
      "MANUAL",
    ],
    required: true,
  },
  reasoning: {
    type: String,
    default: null,
  },
  isShortPay: {
    type: Boolean,
    default: false,
  },
  deductionReasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeductionReasonCode",
    default: null,
  },
  status: {
    type: String,
    enum: ["SUGGESTED", "CONFIRMED", "REJECTED"],
    default: "SUGGESTED",
  },
  confirmedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

matchLineItemSchema.index({ paymentId: 1 });
matchLineItemSchema.index({ invoiceId: 1 });

module.exports = mongoose.model("MatchLineItem", matchLineItemSchema);