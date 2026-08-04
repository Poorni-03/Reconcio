const { runTier1Match, runTier2Match } = require("../services/matching.service");

async function triggerTier1Match(req, res) {
  try {
    const { paymentId } = req.params;
    const result = await runTier1Match(paymentId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Tier 1 match error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function triggerTier2Match(req, res) {
  try {
    const { paymentId } = req.params;
    const result = await runTier2Match(paymentId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Tier 2 match error:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { triggerTier1Match, triggerTier2Match };