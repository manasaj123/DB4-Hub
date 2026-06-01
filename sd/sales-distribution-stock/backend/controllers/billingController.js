// backend/controllers/billingController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/billings
exports.getBillings = asyncHandler(async (req, res) => {
  const list = await db.Billing.findAll({
    where: { isDeleted: false },
    include: [{ model: db.Delivery }],
  });
  res.json(list);
});

// GET /api/billings/deleted
exports.getDeletedBillings = asyncHandler(async (req, res) => {
  const list = await db.Billing.findAll({
    where: { isDeleted: true },
    include: [{ model: db.Delivery }],
  });
  res.json(list);
});

// GET /api/billings/:id
exports.getBillingById = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id, {
    include: [{ model: db.Delivery }],
  });
  if (!bill) {
    res.status(404).json({ message: "Billing document not found" });
    return;
  }
  res.json(bill);
});

// NEW: GET /api/billings/unbilled-deliveries
exports.getUnbilledDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await db.Delivery.findAll({
    where: {
      status: "PGI_DONE",
      isDeleted: false,
    },
    include: [
      {
        model: db.Billing,
        required: false, // LEFT JOIN
        where: { isDeleted: false },
      },
      {
        model: db.SalesOrder,
        include: [
          {
            model: db.Customer,
            as: "soldToParty",
            attributes: ["id", "customerCode", "name"],
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  // Keep only deliveries that have no billing record
  const unbilled = deliveries.filter(
    (d) => !d.Billings || d.Billings.length === 0,
  );

  res.json(unbilled);
});

// POST /api/billings (with auto‑calculation)
exports.createBilling = asyncHandler(async (req, res) => {
  let {
    billingType,
    billingDate,
    referenceDeliveryId,
    documentNumber,
    totalAmount,
    currency,
  } = req.body;

  // ----- AUTO-CALCULATE IF NO TOTAL AMOUNT PROVIDED -----
  if (referenceDeliveryId && (!totalAmount || Number(totalAmount) === 0)) {
    const delivery = await db.Delivery.findByPk(referenceDeliveryId, {
      include: [{ model: db.SalesOrder }],
    });
    if (!delivery) {
      return res.status(400).json({ message: "Delivery not found" });
    }

    let items = [];
    try {
      items = JSON.parse(delivery.itemsJson || "[]");
    } catch {
      return res.status(400).json({ message: "Invalid itemsJson in delivery" });
    }

    let sum = 0;
    for (const item of items) {
      // Look up a condition for this material (optionally include customer)
      const condition = await db.Condition.findOne({
        where: {
          materialId: item.materialId,
          // customerId: delivery.SalesOrder?.soldToPartyId,  // uncomment for customer‑specific pricing
          isDeleted: false,
        },
        order: [["validFrom", "DESC"]],
      });
      const price = condition ? Number(condition.price) : 0;
      sum += price * Number(item.quantity);
    }
    totalAmount = sum;
  }

  // Normalise
  billingType = billingType?.trim().toUpperCase() || "F2";
  billingDate = billingDate || new Date().toISOString().slice(0, 10);
  documentNumber = documentNumber?.trim().toUpperCase() || `INV-${Date.now()}`;
  currency = currency?.trim().toUpperCase() || "INR";

  // ---------- validations ----------
  if (!billingType || !/^[A-Z0-9]+$/.test(billingType)) {
    return res.status(400).json({ message: "Invalid billing type" });
  }
  if (!billingDate) {
    return res.status(400).json({ message: "Billing date required" });
  }
  if (!referenceDeliveryId) {
    return res.status(400).json({ message: "Reference delivery required" });
  }
  if (!documentNumber || !/^[A-Z0-9-]+$/.test(documentNumber)) {
    return res.status(400).json({ message: "Invalid document number" });
  }
  if (Number(totalAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Total amount must be greater than 0" });
  }

  try {
    const bill = await db.Billing.create({
      billingType,
      billingDate,
      referenceDeliveryId,
      documentNumber,
      totalAmount,
      currency,
    });

    res.status(201).json(bill);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Document number already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/billings/:id (unchanged – your existing code)
exports.updateBilling = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id);
  if (!bill) {
    return res.status(404).json({ message: "Billing document not found" });
  }

  let { billingType, documentNumber, totalAmount } = req.body;

  if (billingType) {
    billingType = billingType.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(billingType)) {
      return res.status(400).json({ message: "Invalid billing type" });
    }
  }

  if (documentNumber) {
    documentNumber = documentNumber.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(documentNumber)) {
      return res.status(400).json({ message: "Invalid document number" });
    }
  }

  if (totalAmount !== undefined && Number(totalAmount) <= 0) {
    return res
      .status(400)
      .json({ message: "Total amount must be greater than 0" });
  }

  try {
    await bill.update({
      ...req.body,
      billingType: billingType || bill.billingType,
      documentNumber: documentNumber || bill.documentNumber,
    });

    res.json(bill);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Document number already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/billings/:id (unchanged)
exports.softDeleteBilling = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id);
  if (!bill) {
    res.status(404).json({ message: "Billing document not found" });
    return;
  }
  await bill.update({ isDeleted: true });
  res.json({ message: "Billing document moved to recycle bin" });
});

// PUT /api/billings/:id/restore (unchanged)
exports.restoreBilling = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id);
  if (!bill) {
    res.status(404).json({ message: "Billing document not found" });
    return;
  }
  await bill.update({ isDeleted: false });
  res.json(bill);
});
