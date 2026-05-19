// backend/controllers/creditController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/credits
exports.getCredits = asyncHandler(async (req, res) => {
  const list = await db.Credit.findAll({
    where: { isDeleted: false },
    include: [{ model: db.Customer }],
  });
  res.json(list);
});

// GET /api/credits/deleted
exports.getDeletedCredits = asyncHandler(async (req, res) => {
  const list = await db.Credit.findAll({
    where: { isDeleted: true },
    include: [{ model: db.Customer }],
  });
  res.json(list);
});

// GET /api/credits/:id
exports.getCreditById = asyncHandler(async (req, res) => {
  const rec = await db.Credit.findByPk(req.params.id, {
    include: [{ model: db.Customer }],
  });
  if (!rec) {
    res.status(404).json({ message: "Credit record not found" });
    return;
  }
  res.json(rec);
});

// POST /api/credits
exports.createCredit = asyncHandler(async (req, res) => {
  let { customerId, creditLimit, currency, riskCategory, creditGroup } =
    req.body;

  // normalize
  currency = currency?.toUpperCase();
  riskCategory = riskCategory?.toUpperCase();
  creditGroup = creditGroup?.toUpperCase();

  // validations

  if (!customerId) {
    return res.status(400).json({
      message: "Customer required",
    });
  }

  if (currency && currency.length > 3) {
    return res.status(400).json({
      message: "Currency max length is 3",
    });
  }

  if (riskCategory && riskCategory.length > 4) {
    return res.status(400).json({
      message: "Risk category max length is 4",
    });
  }

  if (creditGroup && creditGroup.length > 4) {
    return res.status(400).json({
      message: "Credit group max length is 4",
    });
  }

  if (
    creditLimit === undefined ||
    creditLimit === null ||
    Number(creditLimit) <= 0
  ) {
    return res.status(400).json({
      message: "Credit limit must be greater than 0",
    });
  }

  if (currency && !/^[A-Z0-9]+$/.test(currency)) {
    return res.status(400).json({
      message: "Invalid currency",
    });
  }

  // no special characters
  if (riskCategory && !["A", "B", "C"].includes(riskCategory)) {
    return res.status(400).json({
      message: "Risk category must be A (Low), B (Medium), or C (High)",
    });
  }

  if (creditGroup && !/^[A-Z0-9]+$/.test(creditGroup)) {
    return res.status(400).json({
      message: "Invalid credit group",
    });
  }

  // duplicate customer credit check
  const existing = await db.Credit.findOne({
    where: {
      customerId,
      isDeleted: false,
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "Credit record already exists for this customer",
    });
  }

  const rec = await db.Credit.create({
    customerId,
    creditLimit,
    currency: currency || "INR",
    riskCategory,
    creditGroup,
  });

  res.status(201).json(rec);
});

// PUT /api/credits/:id
exports.updateCredit = asyncHandler(async (req, res) => {
  const rec = await db.Credit.findByPk(req.params.id);

  if (!rec) {
    return res.status(404).json({
      message: "Credit record not found",
    });
  }

  let { customerId, creditLimit, currency, riskCategory, creditGroup } =
    req.body;

  currency = currency?.toUpperCase();
  riskCategory = riskCategory?.toUpperCase();
  creditGroup = creditGroup?.toUpperCase();

  if (creditLimit !== undefined && Number(creditLimit) <= 0) {
    return res.status(400).json({
      message: "Credit limit must be greater than 0",
    });
  }

  if (currency && currency.length > 3) {
    return res.status(400).json({
      message: "Currency max length is 3",
    });
  }

  if (riskCategory && riskCategory.length > 4) {
    return res.status(400).json({
      message: "Risk category max length is 4",
    });
  }

  if (creditGroup && creditGroup.length > 4) {
    return res.status(400).json({
      message: "Credit group max length is 4",
    });
  }

  if (currency && !/^[A-Z0-9]+$/.test(currency)) {
    return res.status(400).json({
      message: "Invalid currency",
    });
  }

  if (riskCategory && !["A", "B", "C"].includes(riskCategory)) {
    return res.status(400).json({
      message: "Risk category must be A (Low), B (Medium), or C (High)",
    });
  }

  if (creditGroup && !/^[A-Z0-9]+$/.test(creditGroup)) {
    return res.status(400).json({
      message: "Invalid credit group",
    });
  }

  // duplicate customer credit check
  if (customerId) {
    const existing = await db.Credit.findOne({
      where: {
        customerId,
        isDeleted: false,
        id: {
          [db.Sequelize.Op.ne]: req.params.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Credit record already exists for this customer",
      });
    }
  }

  await rec.update({
    ...req.body,
    currency: currency || rec.currency,
    riskCategory: riskCategory || rec.riskCategory,
    creditGroup: creditGroup || rec.creditGroup,
  });

  res.json(rec);
});

// DELETE /api/credits/:id
exports.softDeleteCredit = asyncHandler(async (req, res) => {
  const rec = await db.Credit.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Credit record not found" });
    return;
  }
  await rec.update({ isDeleted: true });
  res.json({ message: "Credit record moved to recycle bin" });
});

// PUT /api/credits/:id/restore
exports.restoreCredit = asyncHandler(async (req, res) => {
  const rec = await db.Credit.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Credit record not found" });
    return;
  }
  await rec.update({ isDeleted: false });
  res.json(rec);
});
