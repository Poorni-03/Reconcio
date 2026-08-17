const express = require("express");
const { uploadInvoices, listInvoices, deleteAllInvoices, updateInvoice, deleteInvoiceById } = require("../controllers/invoice.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/upload", requireAuth, upload.single("file"), uploadInvoices);
router.get("/", requireAuth, listInvoices);
router.put("/:id", requireAuth, updateInvoice);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteInvoiceById);
router.delete("/", requireAuth, requireRole("ADMIN"), deleteAllInvoices);
module.exports = router;