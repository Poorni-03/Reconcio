const express = require("express");
const { createReasonCode, listReasonCodes, updateReasonCode, deleteReasonCode } = require("../controllers/reasonCode.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, requireRole("ADMIN"), createReasonCode);
router.get("/", requireAuth, listReasonCodes);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateReasonCode);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteReasonCode);

module.exports = router;