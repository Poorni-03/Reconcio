const mongoose = require("mongoose");

const customerCreditBalanceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  customerId: {
    type: String,
    required: true,
    trim: true,
  },
  balanceInr: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

customerCreditBalanceSchema.index({ organizationId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model("CustomerCreditBalance", customerCreditBalanceSchema);