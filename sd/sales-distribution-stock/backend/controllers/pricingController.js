// backend/controllers/pricingController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validatePricingConfig = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  const alphaNumericSpaceRegex = /^[A-Za-z0-9\s]+$/;

  // required fields
  const requiredFields = ["pricingProcedure", "description"];

  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // Pricing Procedure
  if (data.pricingProcedure) {
    if (!alphaNumericRegex.test(data.pricingProcedure)) {
      errors.pricingProcedure = "Pricing Procedure must be alphanumeric only";
    }

    if (data.pricingProcedure.length > 10) {
      errors.pricingProcedure = "Pricing Procedure cannot exceed 10 characters";
    }
  }

  // Description
  if (data.description) {
    if (!alphaNumericSpaceRegex.test(data.description)) {
      errors.description =
        "Description must contain only letters, numbers and spaces";
    }

    if (data.description.length > 100) {
      errors.description = "Description cannot exceed 100 characters";
    }
  }

  return errors;
};

// GET /api/pricing
exports.getPricingConfigs = asyncHandler(async (req, res) => {
  const list = await db.PricingConfig.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/pricing/deleted
exports.getDeletedPricingConfigs = asyncHandler(async (req, res) => {
  const list = await db.PricingConfig.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/pricing/:id
exports.getPricingConfigById = asyncHandler(async (req, res) => {
  const rec = await db.PricingConfig.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Pricing configuration not found" });
    return;
  }
  res.json(rec);
});

// POST /api/pricing
exports.createPricingConfig = asyncHandler(async (req, res) => {
  try {
    req.body.pricingProcedure = (req.body.pricingProcedure || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validatePricingConfig(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingConfig = await db.PricingConfig.findOne({
      where: {
        pricingProcedure: req.body.pricingProcedure,
        isDeleted: false,
      },
    });

    if (existingConfig) {
      return res.status(400).json({
        errors: {
          pricingProcedure: "Pricing Procedure already exists",
        },
      });
    }

    const rec = await db.PricingConfig.create(req.body);

    res.status(201).json(rec);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          pricingProcedure: "Pricing Procedure already exists",
        },
      });
    }

    throw err;
  }
});

// PUT /api/pricing/:id
exports.updatePricingConfig = asyncHandler(async (req, res) => {
  const rec = await db.PricingConfig.findByPk(req.params.id);

  if (!rec) {
    return res.status(404).json({
      message: "Pricing configuration not found",
    });
  }

  try {
    req.body.pricingProcedure = (req.body.pricingProcedure || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validatePricingConfig(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingConfig = await db.PricingConfig.findOne({
      where: {
        pricingProcedure: req.body.pricingProcedure,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingConfig) {
      return res.status(400).json({
        errors: {
          pricingProcedure: "Pricing Procedure already exists",
        },
      });
    }

    await rec.update(req.body);

    res.json(rec);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          pricingProcedure: "Pricing Procedure already exists",
        },
      });
    }

    throw err;
  }
});

// DELETE /api/pricing/:id
exports.softDeletePricingConfig = asyncHandler(async (req, res) => {
  const rec = await db.PricingConfig.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Pricing configuration not found" });
    return;
  }
  await rec.update({ isDeleted: true });
  res.json({ message: "Pricing configuration moved to recycle bin" });
});

// PUT /api/pricing/:id/restore
exports.restorePricingConfig = asyncHandler(async (req, res) => {
  const rec = await db.PricingConfig.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Pricing configuration not found" });
    return;
  }
  await rec.update({ isDeleted: false });
  res.json(rec);
});
