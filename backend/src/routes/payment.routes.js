const express = require("express");
const { uploadPayments, listPayments, updatePayment, deletePaymentById } = require("../controllers/payment.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/upload", requireAuth, upload.single("file"), uploadPayments);
router.get("/", requireAuth, listPayments);
router.put("/:id", requireAuth, updatePayment);
router.delete("/:id", requireAuth, deletePaymentById);
module.exports = router;