// backend/controllers/conditionController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateCondition = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;

  const requiredFields = [
    "conditionType",
    "customerId",
    "salesOrg",
    "distributionChannel",
    "price",
    "currency",
    "validFrom",
    "validTo",
  ];

  // required fields
  requiredFields.forEach((field) => {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field].toString().trim() === ""
    ) {
      errors[field] = `${field} is required`;
    }
  });

  // Condition Type -> varchar(4)
  if (data.conditionType) {
    if (!alphaNumericRegex.test(data.conditionType)) {
      errors.conditionType = "Condition Type must be alphanumeric only";
    }

    if (data.conditionType.length > 4) {
      errors.conditionType = "Condition Type cannot exceed 4 characters";
    }
  }

  // Sales Org -> varchar(10)
  if (data.salesOrg) {
    if (!alphaNumericRegex.test(data.salesOrg)) {
      errors.salesOrg = "Sales Organization must be alphanumeric only";
    }

    if (data.salesOrg.length > 10) {
      errors.salesOrg = "Sales Organization cannot exceed 10 characters";
    }
  }

  // Distribution Channel -> varchar(10)
  if (data.distributionChannel) {
    if (!alphaNumericRegex.test(data.distributionChannel)) {
      errors.distributionChannel =
        "Distribution Channel must be alphanumeric only";
    }

    if (data.distributionChannel.length > 10) {
      errors.distributionChannel =
        "Distribution Channel cannot exceed 10 characters";
    }
  }

  // Currency -> varchar(3)
  if (data.currency) {
    if (!/^[A-Z]+$/.test(data.currency)) {
      errors.currency = "Currency must contain only uppercase letters";
    }

    if (data.currency.length > 3) {
      errors.currency = "Currency cannot exceed 3 characters";
    }
  }

  // Price -> decimal(15,2)
  if (data.price) {
    if (isNaN(data.price) || Number(data.price) <= 0) {
      errors.price = "Price must be a valid positive number";
    }
  }

  // prevent past validFrom date
  if (data.validFrom) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFromDate = new Date(data.validFrom);

    if (validFromDate < today) {
      errors.validFrom = "Valid From date cannot be in the past";
    }
  }

  // date validation
  if (
    data.validFrom &&
    data.validTo &&
    new Date(data.validTo) < new Date(data.validFrom)
  ) {
    errors.validTo = "Valid To date cannot be earlier than Valid From date";
  }

  return errors;
};

// GET /api/conditions
exports.getConditions = asyncHandler(async (req, res) => {
  const list = await db.Condition.findAll({
    where: { isDeleted: false },
    include: [
      { model: db.Customer, as: "customer" },
      { model: db.Material, as: "material" },
    ],
  });
  res.json(list);
});

// GET /api/conditions/deleted
exports.getDeletedConditions = asyncHandler(async (req, res) => {
  const list = await db.Condition.findAll({
    where: { isDeleted: true },
    include: [
      { model: db.Customer, as: "customer" },
      { model: db.Material, as: "material" },
    ],
  });
  res.json(list);
});

// GET /api/conditions/:id
exports.getConditionById = asyncHandler(async (req, res) => {
  const cond = await db.Condition.findByPk(req.params.id, {
    include: [
      { model: db.Customer, as: "customer" },
      { model: db.Material, as: "material" },
    ],
  });
  if (!cond) {
    res.status(404).json({ message: "Condition record not found" });
    return;
  }
  res.json(cond);
});

// POST /api/conditions
// POST /api/conditions
exports.createCondition = asyncHandler(async (req, res) => {
  try {
    req.body.conditionType = (req.body.conditionType || "")
      .trim()
      .toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.currency = (req.body.currency || "").trim().toUpperCase();

    const errors = validateCondition(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingCondition = await db.Condition.findOne({
      where: {
        conditionType: req.body.conditionType,
        customerId: req.body.customerId,
        materialId: req.body.materialId,
        salesOrg: req.body.salesOrg,
        distributionChannel: req.body.distributionChannel,
        isDeleted: false,
      },
    });

    if (existingCondition) {
      return res.status(400).json({
        errors: {
          conditionType: "Condition record already exists",
        },
      });
    }

    const cond = await db.Condition.create(req.body);

    res.status(201).json(cond);
  } catch (err) {
    throw err;
  }
});

// PUT /api/conditions/:id
// PUT /api/conditions/:id
exports.updateCondition = asyncHandler(async (req, res) => {
  const cond = await db.Condition.findByPk(req.params.id);

  if (!cond) {
    return res.status(404).json({
      message: "Condition record not found",
    });
  }

  try {
    req.body.conditionType = (req.body.conditionType || "")
      .trim()
      .toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.currency = (req.body.currency || "").trim().toUpperCase();

    const errors = validateCondition(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingCondition = await db.Condition.findOne({
      where: {
        conditionType: req.body.conditionType,
        customerId: req.body.customerId,
        materialId: req.body.materialId,
        salesOrg: req.body.salesOrg,
        distributionChannel: req.body.distributionChannel,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingCondition) {
      return res.status(400).json({
        errors: {
          conditionType: "Condition record already exists",
        },
      });
    }

    await cond.update(req.body);

    res.json(cond);
  } catch (err) {
    throw err;
  }
});

// DELETE /api/conditions/:id
exports.softDeleteCondition = asyncHandler(async (req, res) => {
  const cond = await db.Condition.findByPk(req.params.id);
  if (!cond) {
    res.status(404).json({ message: "Condition record not found" });
    return;
  }
  await cond.update({ isDeleted: true });
  res.json({ message: "Condition record moved to recycle bin" });
});

// PUT /api/conditions/:id/restore
exports.restoreCondition = asyncHandler(async (req, res) => {
  const cond = await db.Condition.findByPk(req.params.id);
  if (!cond) {
    res.status(404).json({ message: "Condition record not found" });
    return;
  }
  await cond.update({ isDeleted: false });
  res.json(cond);
});
