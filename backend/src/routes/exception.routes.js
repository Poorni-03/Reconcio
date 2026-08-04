const express = require("express");
const { listExceptions } = require("../controllers/exception.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, listExceptions);

module.exports = router;