const express = require("express");
const { triggerTier1Match, triggerTier2Match } = require("../controllers/matching.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/tier1/:paymentId", requireAuth, triggerTier1Match);
router.post("/tier2/:paymentId", requireAuth, triggerTier2Match);

module.exports = router;