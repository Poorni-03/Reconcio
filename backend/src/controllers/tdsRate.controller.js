const TdsRateConfig = require("../models/TdsRateConfig");

async function createTdsRate(req, res) {
  try {
    const { section, ratePercent, description } = req.body;

    if (!section || ratePercent === undefined) {
      return res.status(400).json({ error: "section and ratePercent are required" });
    }

    const rate = await TdsRateConfig.create({
      organizationId: req.user.organizationId,
      section,
      ratePercent,
      description: description || null,
    });

    return res.status(201).json(rate);
  } catch (error) {
    console.error("Create TDS rate error:", error);
    return res.status(500).json({ error: "Something went wrong while creating the TDS rate" });
  }
}

async function listTdsRates(req, res) {
  try {
    const rates = await TdsRateConfig.find({
      organizationId: req.user.organizationId,
      isActive: true,
    });
    return res.status(200).json(rates);
  } catch (error) {
    console.error("List TDS rates error:", error);
    return res.status(500).json({ error: "Something went wrong while fetching TDS rates" });
  }
}

async function updateTdsRate(req, res) {
  try {
    const { id } = req.params;
    const allowedFields = ["ratePercent", "description", "isActive"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const rate = await TdsRateConfig.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      updates,
      { new: true }
    );

    if (!rate) {
      return res.status(404).json({ error: "TDS rate not found" });
    }

    return res.status(200).json(rate);
  } catch (error) {
    console.error("Update TDS rate error:", error);
    return res.status(500).json({ error: "Something went wrong while updating the TDS rate" });
  }
}

async function deleteTdsRate(req, res) {
  try {
    const { id } = req.params;
    const rate = await TdsRateConfig.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!rate) {
      return res.status(404).json({ error: "TDS rate not found" });
    }

    return res.status(200).json({ message: "TDS rate deleted", rate });
  } catch (error) {
    console.error("Delete TDS rate error:", error);
    return res.status(500).json({ error: "Something went wrong while deleting the TDS rate" });
  }
}

module.exports = { createTdsRate, listTdsRates, updateTdsRate, deleteTdsRate };
