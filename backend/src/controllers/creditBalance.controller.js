const CustomerCreditBalance = require("../models/CustomerCreditBalance");

async function getCreditBalance(req, res) {
  try {
    const { customerId } = req.params;

    const balance = await CustomerCreditBalance.findOne({
      organizationId: req.user.organizationId,
      customerId,
    });

    if (!balance) {
      return res.status(200).json({ customerId, balanceInr: 0 });
    }

    return res.status(200).json(balance);
  } catch (error) {
    console.error("Get credit balance error:", error);
    return res.status(500).json({ error: "Something went wrong while fetching the credit balance" });
  }
}

module.exports = { getCreditBalance };