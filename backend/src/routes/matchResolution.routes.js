const express = require("express");
const {
  confirmMatch,
  applyPartialPayment,
  applyAdjustment,
  unapplyPayment,
  unmatch,
} = require("../controllers/matchResolution.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/:id/confirm", requireAuth, requireRole("ADMIN", "CLERK"), confirmMatch);
router.post("/:id/partial", requireAuth, requireRole("ADMIN", "CLERK"), applyPartialPayment);
router.post("/:id/adjust", requireAuth, requireRole("ADMIN", "CLERK"), applyAdjustment);
router.post("/payments/:id/unapply", requireAuth, requireRole("ADMIN", "CLERK"), unapplyPayment);
router.post("/:id/unmatch", requireAuth, requireRole("ADMIN", "CLERK"), unmatch);

module.exports = router;