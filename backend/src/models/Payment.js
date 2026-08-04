const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  utrOrRrnNumber: {
    type: String,
    trim: true,
    default: null,
  },
  amountInr: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  payerName: {
    type: String,
    trim: true,
    default: null,
  },
  rawMemoText: {
    type: String,
    default: null,
  },
  extractedJson: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: [
      "UNMATCHED",
      "TIER1_MATCHED",
      "TIER2_AUTO_MATCHED",
      "NEEDS_REVIEW",
      "PARTIALLY_MATCHED",
      "UNAPPLIED",
    ],
    default: "UNMATCHED",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

paymentSchema.index({ organizationId: 1, status: 1 });
paymentSchema.index({ organizationId: 1, utrOrRrnNumber: 1 });

module.exports = mongoose.model("Payment", paymentSchema);