const fs = require("fs");
const Invoice = require("../models/Invoice");
const { parseCsv } = require("../services/csvParser.service");
const { generateEmbedding } = require("../services/OpenAI.service");

function parseIndianDate(dateString) {
  const cleaned = String(dateString).trim();

  // Try DD/MM/YYYY or DD-MM-YYYY first
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  }

  // Fall back to standard parsing (handles YYYY-MM-DD)
  return new Date(cleaned);
}

async function uploadInvoices(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const rows = await parseCsv(req.file.path);

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const {
          invoiceNumber,
          customerId,
          customerName,
          customerEmail,
          amountDueInr,
          dueDate,
        } = row;

        if (
          !invoiceNumber ||
          !customerId ||
          !customerName ||
          !amountDueInr ||
          !dueDate
        ) {
          results.skipped += 1;
          results.errors.push(
            `Row skipped, missing fields: ${JSON.stringify(row)}`,
          );
          continue;
        }

        const amount = parseFloat(String(amountDueInr).trim());
        const cleanedDueDate = String(dueDate).trim();
        const parsedDueDate = parseIndianDate(cleanedDueDate);

        if (isNaN(parsedDueDate.getTime())) {
          throw new Error(`Invalid date format: "${dueDate}"`);
        }

        const embeddingText = `${String(customerName).trim()} invoice ${String(invoiceNumber).trim()}`;
        let embedding = null;

        try {
          console.log(
            `🔵 Attempting embedding generation for: "${embeddingText}"`,
          );
          embedding = await generateEmbedding(embeddingText);
          console.log(
            `🟢 Embedding generated successfully, length: ${embedding ? embedding.length : "null"}`,
          );
        } catch (embeddingError) {
          console.error(
            "Embedding generation failed for row:",
            embeddingError.message,
          );
          // We still create the invoice even if embedding fails - it just won't be
          // findable via vector search until re-processed
        }

        await Invoice.create({
          organizationId: req.user.organizationId,
          invoiceNumber: String(invoiceNumber).trim(),
          customerId: String(customerId).trim(),
          customerName: String(customerName).trim(),
                    customerEmail: customerEmail ? String(customerEmail).trim().toLowerCase() : null,
          amountDueInr: amount,
          balanceInr: amount,
          dueDate: parsedDueDate,
          embeddingText,
          embedding,
        });

        results.created += 1;
      } catch (rowError) {
        results.skipped += 1;
        results.errors.push(rowError.message);
      }
    }

    fs.unlinkSync(req.file.path); // clean up uploaded file after processing

    return res.status(201).json(results);
  } catch (error) {
    console.error("Invoice upload error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong while uploading invoices" });
  }
}

async function listInvoices(req, res) {
  try {
    const { status } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(invoices);
  } catch (error) {
    console.error("List invoices error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong while fetching invoices" });
  }
}

async function deleteAllInvoices(req, res) {
  try {
    const result = await Invoice.deleteMany({
      organizationId: req.user.organizationId,
    });
    return res.status(200).json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Delete invoices error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong while deleting invoices" });
  }
}


async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const allowedFields = ["customerName", "customerEmail", "amountDueInr", "dueDate", "status"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      updates,
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);
    return res.status(500).json({ error: "Something went wrong while updating the invoice" });
  }
}

async function deleteInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    return res.status(200).json({ message: "Invoice deleted", invoice });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return res.status(500).json({ error: "Something went wrong while deleting the invoice" });
  }
}
module.exports = { uploadInvoices, listInvoices, deleteAllInvoices, updateInvoice, deleteInvoiceById };