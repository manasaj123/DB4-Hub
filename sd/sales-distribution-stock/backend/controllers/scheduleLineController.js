// backend/controllers/scheduleLineController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateScheduleLine = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  const alphaNumericSpaceRegex = /^[A-Za-z0-9\s]+$/;

  const requiredFields = ["scheduleLineCategory", "description"];

  // required fields
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // Schedule Line Category
  if (data.scheduleLineCategory) {
    if (!alphaNumericRegex.test(data.scheduleLineCategory)) {
      errors.scheduleLineCategory =
        "Schedule Line Category must be alphanumeric only";
    }

    if (data.scheduleLineCategory.length > 3) {
      errors.scheduleLineCategory =
        "Schedule Line Category cannot exceed 3 characters";
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

  // Requirement Relevant
  if (data.requirementRelevant) {
    const validValues = ["Y", "N"];

    if (!validValues.includes(data.requirementRelevant.toUpperCase())) {
      errors.requirementRelevant = "Requirement Relevant must be Y or N";
    }

    if (data.requirementRelevant.length > 1) {
      errors.requirementRelevant =
        "Requirement Relevant cannot exceed 1 character";
    }
  }

  // Availability Check
  if (data.availabilityCheck) {
    if (!alphaNumericRegex.test(data.availabilityCheck)) {
      errors.availabilityCheck = "Availability Check must be alphanumeric only";
    }

    if (data.availabilityCheck.length > 2) {
      errors.availabilityCheck =
        "Availability Check cannot exceed 2 characters";
    }
  }

  // Delivery Block
  if (data.deliveryBlock) {
    if (!alphaNumericRegex.test(data.deliveryBlock)) {
      errors.deliveryBlock = "Delivery Block must be alphanumeric only";
    }

    if (data.deliveryBlock.length > 4) {
      errors.deliveryBlock = "Delivery Block cannot exceed 4 characters";
    }
  }

  // Movement Type
  if (data.movementType) {
    if (!alphaNumericRegex.test(data.movementType)) {
      errors.movementType = "Movement Type must be alphanumeric only";
    }

    if (data.movementType.length > 4) {
      errors.movementType = "Movement Type cannot exceed 4 characters";
    }
  }

  // Order Type
  if (data.orderType) {
    if (!alphaNumericRegex.test(data.orderType)) {
      errors.orderType = "Order Type must be alphanumeric only";
    }

    if (data.orderType.length > 4) {
      errors.orderType = "Order Type cannot exceed 4 characters";
    }
  }

  // Item Category
  if (data.itemCategory) {
    if (!alphaNumericRegex.test(data.itemCategory)) {
      errors.itemCategory = "Item Category must be alphanumeric only";
    }

    if (data.itemCategory.length > 4) {
      errors.itemCategory = "Item Category cannot exceed 4 characters";
    }
  }

  // Mvt Iss Val Slt
  if (data.mvtIssValSlt) {
    if (!alphaNumericRegex.test(data.mvtIssValSlt)) {
      errors.mvtIssValSlt = "Mvt Iss Val Slt must be alphanumeric only";
    }

    if (data.mvtIssValSlt.length > 4) {
      errors.mvtIssValSlt = "Mvt Iss Val Slt cannot exceed 4 characters";
    }
  }

  // Spec Iss Val Slt
  if (data.specIssValSlt) {
    if (!alphaNumericRegex.test(data.specIssValSlt)) {
      errors.specIssValSlt = "Spec Iss Val Slt must be alphanumeric only";
    }

    if (data.specIssValSlt.length > 4) {
      errors.specIssValSlt = "Spec Iss Val Slt cannot exceed 4 characters";
    }
  }

  return errors;
};

// GET /api/schedule-lines
exports.getScheduleLines = asyncHandler(async (req, res) => {
  const list = await db.ScheduleLine.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/schedule-lines/deleted
exports.getDeletedScheduleLines = asyncHandler(async (req, res) => {
  const list = await db.ScheduleLine.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/schedule-lines/:id
exports.getScheduleLineById = asyncHandler(async (req, res) => {
  const sl = await db.ScheduleLine.findByPk(req.params.id);
  if (!sl) {
    res.status(404).json({ message: "Schedule line not found" });
    return;
  }
  res.json(sl);
});

// POST /api/schedule-lines
exports.createScheduleLine = asyncHandler(async (req, res) => {
  try {
    req.body.scheduleLineCategory = (req.body.scheduleLineCategory || "")
      .trim()
      .toUpperCase();

    req.body.requirementRelevant = (req.body.requirementRelevant || "")
      .trim()
      .toUpperCase();

    req.body.availabilityCheck = (req.body.availabilityCheck || "")
      .trim()
      .toUpperCase();

    req.body.deliveryBlock = (req.body.deliveryBlock || "")
      .trim()
      .toUpperCase();

    req.body.movementType = (req.body.movementType || "").trim().toUpperCase();

    req.body.orderType = (req.body.orderType || "").trim().toUpperCase();

    req.body.itemCategory = (req.body.itemCategory || "").trim().toUpperCase();

    req.body.mvtIssValSlt = (req.body.mvtIssValSlt || "").trim().toUpperCase();

    req.body.specIssValSlt = (req.body.specIssValSlt || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validateScheduleLine(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingLine = await db.ScheduleLine.findOne({
      where: {
        scheduleLineCategory: req.body.scheduleLineCategory,
        isDeleted: false,
      },
    });

    if (existingLine) {
      return res.status(400).json({
        errors: {
          scheduleLineCategory: "Schedule Line Category already exists",
        },
      });
    }

    const sl = await db.ScheduleLine.create(req.body);

    res.status(201).json(sl);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          scheduleLineCategory: "Schedule Line Category already exists",
        },
      });
    }

    throw err;
  }
});

// PUT /api/schedule-lines/:id
exports.updateScheduleLine = asyncHandler(async (req, res) => {
  const sl = await db.ScheduleLine.findByPk(req.params.id);

  if (!sl) {
    return res.status(404).json({
      message: "Schedule line not found",
    });
  }

  try {
    req.body.scheduleLineCategory = (req.body.scheduleLineCategory || "")
      .trim()
      .toUpperCase();

    req.body.requirementRelevant = (req.body.requirementRelevant || "")
      .trim()
      .toUpperCase();

    req.body.availabilityCheck = (req.body.availabilityCheck || "")
      .trim()
      .toUpperCase();

    req.body.deliveryBlock = (req.body.deliveryBlock || "")
      .trim()
      .toUpperCase();

    req.body.movementType = (req.body.movementType || "").trim().toUpperCase();

    req.body.orderType = (req.body.orderType || "").trim().toUpperCase();

    req.body.itemCategory = (req.body.itemCategory || "").trim().toUpperCase();

    req.body.mvtIssValSlt = (req.body.mvtIssValSlt || "").trim().toUpperCase();

    req.body.specIssValSlt = (req.body.specIssValSlt || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validateScheduleLine(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingLine = await db.ScheduleLine.findOne({
      where: {
        scheduleLineCategory: req.body.scheduleLineCategory,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingLine) {
      return res.status(400).json({
        errors: {
          scheduleLineCategory: "Schedule Line Category already exists",
        },
      });
    }

    await sl.update(req.body);

    res.json(sl);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          scheduleLineCategory: "Schedule Line Category already exists",
        },
      });
    }

    throw err;
  }
});

// DELETE /api/schedule-lines/:id
exports.softDeleteScheduleLine = asyncHandler(async (req, res) => {
  const sl = await db.ScheduleLine.findByPk(req.params.id);
  if (!sl) {
    res.status(404).json({ message: "Schedule line not found" });
    return;
  }
  await sl.update({ isDeleted: true });
  res.json({ message: "Schedule line moved to recycle bin" });
});

// PUT /api/schedule-lines/:id/restore
exports.restoreScheduleLine = asyncHandler(async (req, res) => {
  const sl = await db.ScheduleLine.findByPk(req.params.id);
  if (!sl) {
    res.status(404).json({ message: "Schedule line not found" });
    return;
  }
  await sl.update({ isDeleted: false });
  res.json(sl);
});
