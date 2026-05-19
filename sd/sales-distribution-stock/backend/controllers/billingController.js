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

// POST /api/billings
exports.createBilling = asyncHandler(async (req, res) => {
  let {
    billingType,
    billingDate,
    referenceDeliveryId,
    documentNumber,
    totalAmount,
    currency,
  } = req.body;

  // normalize case (fix case sensitivity requirement)
  billingType = billingType?.trim().toUpperCase();
  documentNumber = documentNumber?.trim().toUpperCase();
  currency = currency?.trim().toUpperCase();

  // validations
  if (!billingType || !/^[A-Z0-9]+$/.test(billingType)) {
    return res
      .status(400)
      .json({ message: "Invalid billing type (only A-Z, 0-9 allowed)" });
  }

  if (!billingDate) {
    return res.status(400).json({ message: "Billing date required" });
  }

  if (!referenceDeliveryId) {
    return res.status(400).json({ message: "Reference delivery required" });
  }

  if (!documentNumber || !/^[A-Z0-9]+$/.test(documentNumber)) {
    return res.status(400).json({
      message: "Invalid document number (no special characters allowed)",
    });
  }

  if (
    totalAmount === undefined ||
    totalAmount === null ||
    Number(totalAmount) <= 0
  ) {
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
      currency: currency || "INR",
    });

    res.status(201).json(bill);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Document number already exists",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// PUT /api/billings/:id
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
      return res.status(400).json({
        message: "Document number already exists",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// DELETE /api/billings/:id
exports.softDeleteBilling = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id);
  if (!bill) {
    res.status(404).json({ message: "Billing document not found" });
    return;
  }
  await bill.update({ isDeleted: true });
  res.json({ message: "Billing document moved to recycle bin" });
});

// PUT /api/billings/:id/restore
exports.restoreBilling = asyncHandler(async (req, res) => {
  const bill = await db.Billing.findByPk(req.params.id);
  if (!bill) {
    res.status(404).json({ message: "Billing document not found" });
    return;
  }
  await bill.update({ isDeleted: false });
  res.json(bill);
});
