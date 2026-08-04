const DeductionReasonCode = require("../models/DeductionReasonCode");

async function createReasonCode(req, res) {
  try {
    const { code, description } = req.body;
    if (!code || !description) {
      return res.status(400).json({ error: "code and description are required" });
    }
    const reasonCode = await DeductionReasonCode.create({
      organizationId: req.user.organizationId,
      code,
      description,
    });
    return res.status(201).json(reasonCode);
  } catch (error) {
    console.error("Create reason code error:", error);
    return res.status(500).json({ error: "Something went wrong while creating the reason code" });
  }
}

async function listReasonCodes(req, res) {
  try {
    const codes = await DeductionReasonCode.find({ organizationId: req.user.organizationId });
    return res.status(200).json(codes);
  } catch (error) {
    console.error("List reason codes error:", error);
    return res.status(500).json({ error: "Something went wrong while fetching reason codes" });
  }
}

async function updateReasonCode(req, res) {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const reasonCode = await DeductionReasonCode.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      { description },
      { new: true }
    );

    if (!reasonCode) {
      return res.status(404).json({ error: "Reason code not found" });
    }

    return res.status(200).json(reasonCode);
  } catch (error) {
    console.error("Update reason code error:", error);
    return res.status(500).json({ error: "Something went wrong while updating the reason code" });
  }
}

async function deleteReasonCode(req, res) {
  try {
    const { id } = req.params;
    const reasonCode = await DeductionReasonCode.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!reasonCode) {
      return res.status(404).json({ error: "Reason code not found" });
    }

    return res.status(200).json({ message: "Reason code deleted", reasonCode });
  } catch (error) {
    console.error("Delete reason code error:", error);
    return res.status(500).json({ error: "Something went wrong while deleting the reason code" });
  }
}

module.exports = { createReasonCode, listReasonCodes, updateReasonCode, deleteReasonCode };