const db = require("../models");

/**
 * Check if a new order amount exceeds the customer's credit limit.
 * @param {number} customerId
 * @param {number} newOrderAmount - net value of the new order
 * @returns {Promise<{allowed: boolean, message: string, limit: number|null, exposure: number}>}
 */
async function checkCreditLimit(customerId, newOrderAmount) {
  // 1. Fetch the credit record for this customer
  const credit = await db.Credit.findOne({
    where: { customerId, isDeleted: false },
  });
  if (!credit) {
    // No credit record → no limit → allowed
    return { allowed: true, message: "", limit: null, exposure: 0 };
  }

  // 2. Calculate current exposure
  //    a) Sum of all non‑deleted billings (invoices) for this customer
  const billings = await db.Billing.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: db.Delivery,
        required: true,
        where: { isDeleted: false },
        include: [
          {
            model: db.SalesOrder,
            required: true,
            where: { soldToPartyId: customerId, isDeleted: false },
          },
        ],
      },
    ],
  });
  const billingTotal = billings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );

  //    b) Sum of all PGI‑done deliveries that are NOT yet billed
  const unbilledDeliveries = await db.Delivery.findAll({
    where: { status: "PGI_DONE", isDeleted: false },
    include: [
      {
        model: db.Billing,
        required: false,          // LEFT JOIN
        where: { isDeleted: false },
      },
      {
        model: db.SalesOrder,
        required: true,
        where: { soldToPartyId: customerId, isDeleted: false },
      },
    ],
  });
  const trulyUnbilled = unbilledDeliveries.filter(
    (d) => !d.Billings || d.Billings.length === 0
  );

  let unbilledTotal = 0;
  for (const del of trulyUnbilled) {
    try {
      const items = JSON.parse(del.itemsJson || "[]");
      for (const item of items) {
        const condition = await db.Condition.findOne({
          where: { materialId: item.materialId, isDeleted: false },
          order: [["validFrom", "DESC"]],
        });
        const price = condition ? Number(condition.price) : 0;
        unbilledTotal += price * Number(item.quantity);
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const exposure = billingTotal + unbilledTotal;
  const limit = Number(credit.creditLimit);

  if (exposure + newOrderAmount > limit) {
    return {
      allowed: false,
      message: `Credit limit exceeded! Limit: ${limit} INR, Current Exposure: ${exposure} INR, Order Amount: ${newOrderAmount} INR`,
      limit,
      exposure,
    };
  }

  return { allowed: true, message: "", limit, exposure };
}

module.exports = checkCreditLimit;