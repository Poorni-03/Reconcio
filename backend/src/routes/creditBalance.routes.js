const express = require("express");
const { getCreditBalance } = require("../controllers/creditBalance.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:customerId", requireAuth, getCreditBalance);

module.exports = router;