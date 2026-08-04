const express = require("express");
const {
  confirmMatch,
  applyPartialPayment,
  applyAdjustment,
  unapplyPayment,
  unmatch,
} = require("../controllers/matchResolution.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/:id/confirm", requireAuth, confirmMatch);
router.post("/:id/partial", requireAuth, applyPartialPayment);
router.post("/:id/adjust", requireAuth, applyAdjustment);
router.post("/payments/:id/unapply", requireAuth, unapplyPayment);
router.post("/:id/unmatch", requireAuth, unmatch);

module.exports = router;