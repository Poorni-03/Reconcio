const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    console.warn("⚠️  Skipping email: no recipient address provided");
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    // Don't throw - a failed email shouldn't crash the matching/payment flow
    return null;
  }
}

async function sendPaymentReceipt({ to, customerName, amountInr, invoiceNumber }) {
  return sendEmail({
    to,
    subject: `Payment Received - Invoice ${invoiceNumber}`,
    text: `Dear ${customerName},\n\nWe have received your payment of ₹${amountInr} and applied it to invoice ${invoiceNumber}. Thank you.\n\nRegards,\nAR Cash Application Team`,
  });
}

async function sendBalanceDueNotice({ to, customerName, invoiceNumber, remainingBalance }) {
  return sendEmail({
    to,
    subject: `Balance Due - Invoice ${invoiceNumber}`,
    text: `Dear ${customerName},\n\nWe received a partial payment for invoice ${invoiceNumber}. A balance of ₹${remainingBalance} remains outstanding. Please arrange payment at your earliest convenience.\n\nRegards,\nAR Cash Application Team`,
  });
}

async function sendCreditAlert({ to, customerName, creditAmount }) {
  return sendEmail({
    to,
    subject: `Unapplied Payment - Action Needed`,
    text: `Dear ${customerName},\n\nWe received a payment of ₹${creditAmount} but could not match it to a specific invoice. This amount has been credited to your account. Please contact us to clarify which invoice this payment is for, or let us know if you'd like it applied to your next bill.\n\nRegards,\nAR Cash Application Team`,
  });
}

module.exports = { sendEmail, sendPaymentReceipt, sendBalanceDueNotice, sendCreditAlert };