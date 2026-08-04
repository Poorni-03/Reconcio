const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
});

const EMBEDDING_MODEL = process.env.NVIDIA_EMBEDDING_MODEL || "nvidia/nv-embed-v1";
const CHAT_MODEL = process.env.NVIDIA_CHAT_MODEL || "nvidia/nemotron-mini-4b-instruct";

async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

 const response = await client.embeddings.create({
    input: [text],
    model: EMBEDDING_MODEL,
    encoding_format: "float",
    input_type: "passage",
    truncate: "NONE",
  });

  return response.data[0].embedding; // array of numbers (4096-dim for nv-embed-v1)
}

async function extractPaymentDetails(rawText) {
  const prompt = `You are an AI assistant for an Indian accounts receivable system.
Extract structured data from the following remittance/payment text.

Return ONLY valid JSON, no markdown formatting, no backticks, no explanation.

JSON shape:
{
  "utrOrRrnNumber": string or null,
  "amountInr": number or null,
  "customerName": string or null,
  "lineItems": [
    {
      "invoiceNumber": string,
      "amountApplied": number,
      "shortPay": number,
      "deductionReason": string or null
    }
  ]
}

Text to extract from:
"""
${rawText}
"""`;

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const responseText = completion.choices[0].message.content.trim();
  const cleaned = responseText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    throw new Error(`AI returned invalid JSON: ${cleaned}`);
  }
}

async function generateMatchReasoning({ paymentAmount, invoiceAmount, invoiceNumber, tdsPercent, tdsSection }) {
  const shortfall = invoiceAmount - paymentAmount;

  const prompt = `A payment of ₹${paymentAmount} was received against an invoice of ₹${invoiceAmount} (invoice ${invoiceNumber}). The shortfall is ₹${shortfall}.
${tdsPercent ? `This shortfall exactly matches a configured ${tdsPercent}% TDS deduction under Section ${tdsSection}. You may mention this.` : `IMPORTANT: No TDS rate or discount configuration explains this shortfall. Do NOT invent a tax section, percentage, or reason. If there is a shortfall and no explanation, say so plainly and give a LOWER confidence score (below 0.7).`}

Return ONLY valid JSON, no markdown, no backticks:
{
  "confidenceScore": number between 0 and 1,
  "reasoning": "short one-sentence explanation using ONLY the facts given above, never inventing tax sections or percentages"
}`;

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 300,
  });

  const responseText = completion.choices[0].message.content.trim();
  const cleaned = responseText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    throw new Error(`AI returned invalid JSON: ${cleaned}`);
  }
}

module.exports = { generateEmbedding, extractPaymentDetails, generateMatchReasoning };