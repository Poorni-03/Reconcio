const express = require("express");
const { createReasonCode, listReasonCodes, updateReasonCode, deleteReasonCode } = require("../controllers/reasonCode.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, createReasonCode);
router.get("/", requireAuth, listReasonCodes);
router.put("/:id", requireAuth, updateReasonCode);
router.delete("/:id", requireAuth, deleteReasonCode);

module.exports = router;