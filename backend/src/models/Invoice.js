const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: [true, "Invoice number is required"],
    trim: true,
  },
  customerId: {
    type: String,
    required: [true, "Customer ID is required"],
    trim: true,
  },
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  amountDueInr: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  amountPaidInr: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  balanceInr: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  status: {
    type: String,
    enum: ["OPEN", "PARTIALLY_PAID", "PAID", "DISPUTED"],
    default: "OPEN",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  embeddingText: {
    type: String,
    default: null,
  },
  embedding: {
    type: [Number],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate invoice numbers within the same organization
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);