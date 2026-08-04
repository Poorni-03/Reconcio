const express = require("express");
const { createTdsRate, listTdsRates, updateTdsRate, deleteTdsRate } = require("../controllers/tdsRate.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, createTdsRate);
router.get("/", requireAuth, listTdsRates);
router.put("/:id", requireAuth, updateTdsRate);
router.delete("/:id", requireAuth, deleteTdsRate);

module.exports = router;