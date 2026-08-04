const mongoose = require("mongoose");

const tdsRateConfigSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
  },
  ratePercent: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

tdsRateConfigSchema.index({ organizationId: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("TdsRateConfig", tdsRateConfigSchema);