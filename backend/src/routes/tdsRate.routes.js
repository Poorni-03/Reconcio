const express = require("express");
const { createTdsRate, listTdsRates, updateTdsRate, deleteTdsRate } = require("../controllers/tdsRate.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, requireRole("ADMIN"), createTdsRate);
router.get("/", requireAuth, listTdsRates);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateTdsRate);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteTdsRate);

module.exports = router;