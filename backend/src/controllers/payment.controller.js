const fs = require("fs");
const Payment = require("../models/Payment");
const { parseCsv } = require("../services/csvParser.service");
const path = require("path");
const { extractTextFromPdf } = require("../services/pdfParser.service");
const { extractPaymentDetails, generateEmbedding } = require("../services/OpenAI.service");

function parseIndianDate(dateString) {
  const cleaned = String(dateString).trim();

  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }

  return new Date(cleaned);
}

async function uploadPayments(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const rows = await parseCsv(req.file.path);
    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const { utrOrRrnNumber, amountInr, paymentDate, payerName, rawMemoText } = row;

        if (!amountInr || !paymentDate) {
          results.skipped += 1;
          results.errors.push(`Row skipped, missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        const amount = parseFloat(String(amountInr).trim());
        const parsedDate = parseIndianDate(paymentDate);

        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date format: "${paymentDate}"`);
        }

        await Payment.create({
          organizationId: req.user.organizationId,
          utrOrRrnNumber: utrOrRrnNumber ? String(utrOrRrnNumber).trim() : null,
          amountInr: amount,
          paymentDate: parsedDate,
          payerName: payerName ? String(payerName).trim() : null,
          rawMemoText: rawMemoText ? String(rawMemoText).trim() : null,
        });

        results.created += 1;
      } catch (rowError) {
        results.skipped += 1;
        results.errors.push(rowError.message);
      }
    }

    fs.unlinkSync(req.file.path);

    return res.status(201).json(results);
  } catch (error) {
    console.error("Payment upload error:", error);
    return res.status(500).json({ error: "Something went wrong while uploading payments" });
  }
}

async function listPayments(req, res) {
  try {
    const { status } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    console.error("List payments error:", error);
    return res.status(500).json({ error: "Something went wrong while fetching payments" });
  }
}

async function updatePayment(req, res) {
  try {
    const { id } = req.params;
    const allowedFields = ["payerName", "utrOrRrnNumber", "amountInr", "paymentDate", "rawMemoText"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      updates,
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Update payment error:", error);
    return res.status(500).json({ error: "Something went wrong while updating the payment" });
  }
}

async function deletePaymentById(req, res) {
  try {
    const { id } = req.params;
    const payment = await Payment.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.status(200).json({ message: "Payment deleted", payment });
  } catch (error) {
    console.error("Delete payment error:", error);
    return res.status(500).json({ error: "Something went wrong while deleting the payment" });
  }
}

async function uploadRemittance(req, res) {
  try {
    let rawText = "";

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === ".pdf") {
        const result = await extractTextFromPdf(req.file.path);
        rawText = result.text;
      } else {
        rawText = fs.readFileSync(req.file.path, "utf-8");
      }
      fs.unlinkSync(req.file.path);
    } else if (req.body.emailText) {
      rawText = req.body.emailText;
    } else {
      return res.status(400).json({ error: "Provide either a PDF file or emailText in body" });
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract any text from the remittance" });
    }

    const extracted = await extractPaymentDetails(rawText);

    const totalAmount = extracted.amountInr || (extracted.lineItems || []).reduce((sum, li) => sum + (li.amountApplied || 0), 0);

    const payment = await Payment.create({
      organizationId: req.user.organizationId,
      utrOrRrnNumber: extracted.utrOrRrnNumber || null,
      amountInr: totalAmount,
      paymentDate: new Date(),
      payerName: extracted.customerName || null,
      rawMemoText: rawText.substring(0, 2000),
      extractedJson: extracted,
    });

    return res.status(201).json({ payment, extracted });
  } catch (error) {
    console.error("Remittance upload error:", error);
    return res.status(500).json({ error: "Something went wrong processing the remittance" });
  }
}

module.exports = { uploadPayments, listPayments, updatePayment, deletePaymentById, uploadRemittance};
