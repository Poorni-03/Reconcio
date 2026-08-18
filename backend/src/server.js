require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const paymentRoutes = require("./routes/payment.routes");
const matchingRoutes = require("./routes/matching.routes");
const tdsRateRoutes = require("./routes/tdsRate.routes");
const matchResolutionRoutes = require("./routes/matchResolution.routes");
const reasonCodeRoutes = require("./routes/reasonCode.routes");
const exceptionRoutes = require("./routes/exception.routes");
const creditBalanceRoutes = require("./routes/creditBalance.routes");


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://remitpulse.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AR Cash Application API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/settings/tds-rates", tdsRateRoutes);
app.use("/api/matches", matchResolutionRoutes);
app.use("/api/reason-codes", reasonCodeRoutes);
app.use("/api/exceptions", exceptionRoutes);
app.use("/api/customers", creditBalanceRoutes);


async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();