// backend/controllers/shippingController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateShipping = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  const alphaNumericSpaceRegex = /^[A-Za-z0-9\s-]+$/;

  // required fields
  if (!data.shippingPoint || !data.shippingPoint.trim()) {
    errors.shippingPoint = "Shipping Point is required";
  }

  if (!data.defaultRoute || !data.defaultRoute.trim()) {
    errors.defaultRoute = "Default Route is required";
  }

  // Shipping Point
  if (data.shippingPoint) {
    if (!alphaNumericRegex.test(data.shippingPoint)) {
      errors.shippingPoint = "Shipping Point must be alphanumeric only";
    }

    if (data.shippingPoint.length > 10) {
      errors.shippingPoint = "Shipping Point cannot exceed 10 characters";
    }
  }

  // Description
  if (data.description) {
    if (!alphaNumericSpaceRegex.test(data.description)) {
      errors.description = "Description contains invalid characters";
    }

    if (data.description.length > 100) {
      errors.description = "Description cannot exceed 100 characters";
    }
  }

  // Default Route
  if (data.defaultRoute) {
    if (!alphaNumericRegex.test(data.defaultRoute)) {
      errors.defaultRoute = "Default Route must be alphanumeric only";
    }

    if (data.defaultRoute.length > 10) {
      errors.defaultRoute = "Default Route cannot exceed 10 characters";
    }
  }

  return errors;
};

// GET /api/shipping
exports.getShippingConfigs = asyncHandler(async (req, res) => {
  const list = await db.Shipping.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/shipping/deleted
exports.getDeletedShippingConfigs = asyncHandler(async (req, res) => {
  const list = await db.Shipping.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/shipping/:id
exports.getShippingConfigById = asyncHandler(async (req, res) => {
  const rec = await db.Shipping.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Shipping record not found" });
    return;
  }
  res.json(rec);
});

// POST /api/shipping
exports.createShippingConfig = asyncHandler(async (req, res) => {
  try {
    req.body.shippingPoint = (req.body.shippingPoint || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    req.body.defaultRoute = (req.body.defaultRoute || "").trim().toUpperCase();

    const errors = validateShipping(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingShipping = await db.Shipping.findOne({
      where: {
        shippingPoint: req.body.shippingPoint,
        isDeleted: false,
      },
    });

    if (existingShipping) {
      return res.status(400).json({
        errors: {
          shippingPoint: "Shipping Point already exists",
        },
      });
    }

    const rec = await db.Shipping.create(req.body);

    res.status(201).json(rec);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          shippingPoint: "Shipping Point already exists",
        },
      });
    }

    throw err;
  }
});

// PUT /api/shipping/:id
exports.updateShippingConfig = asyncHandler(async (req, res) => {
  const rec = await db.Shipping.findByPk(req.params.id);

  if (!rec) {
    return res.status(404).json({
      message: "Shipping record not found",
    });
  }

  try {
    req.body.shippingPoint = (req.body.shippingPoint || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    req.body.defaultRoute = (req.body.defaultRoute || "").trim().toUpperCase();

    const errors = validateShipping(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingShipping = await db.Shipping.findOne({
      where: {
        shippingPoint: req.body.shippingPoint,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingShipping) {
      return res.status(400).json({
        errors: {
          shippingPoint: "Shipping Point already exists",
        },
      });
    }

    await rec.update(req.body);

    res.json(rec);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          shippingPoint: "Shipping Point already exists",
        },
      });
    }

    throw err;
  }
});

// DELETE /api/shipping/:id
exports.softDeleteShippingConfig = asyncHandler(async (req, res) => {
  const rec = await db.Shipping.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Shipping record not found" });
    return;
  }
  await rec.update({ isDeleted: true });
  res.json({ message: "Shipping record moved to recycle bin" });
});

// PUT /api/shipping/:id/restore
exports.restoreShippingConfig = asyncHandler(async (req, res) => {
  const rec = await db.Shipping.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Shipping record not found" });
    return;
  }
  await rec.update({ isDeleted: false });
  res.json(rec);
});
