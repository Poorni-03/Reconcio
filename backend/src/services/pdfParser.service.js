const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Tesseract = require("tesseract.js");

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = result.text || "";

  if (text.trim().length > 20) {
    return { text, method: "digital" };
  }

  // Fallback: likely a scanned PDF with no extractable text - use OCR
  const ocrResult = await Tesseract.recognize(filePath, "eng");
  return { text: ocrResult.data.text, method: "ocr" };
}

module.exports = { extractTextFromPdf };