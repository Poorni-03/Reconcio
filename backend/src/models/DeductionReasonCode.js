const mongoose = require("mongoose");

const deductionReasonCodeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
});

deductionReasonCodeSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("DeductionReasonCode", deductionReasonCodeSchema);