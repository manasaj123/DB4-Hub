// backend/controllers/itemCategoriesController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateItemCategoryConfig = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;

  const requiredFields = [
    "salesDocumentType",
    "itemCategoryGroup",
    "defaultItemCategory",
  ];

  // required fields
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // sales document type
  if (data.salesDocumentType) {
    if (!alphaNumericRegex.test(data.salesDocumentType)) {
      errors.salesDocumentType =
        "Sales Document Type must be alphanumeric only";
    }

    if (data.salesDocumentType.length > 10) {
      errors.salesDocumentType =
        "Sales Document Type cannot exceed 10 characters";
    }
  }

  // item category group
  if (data.itemCategoryGroup) {
    const validGroups = ["HIGH", "MID", "LOW"];

    if (!validGroups.includes(data.itemCategoryGroup.toUpperCase())) {
      errors.itemCategoryGroup = "Item Category Group must be HIGH, MID or LOW";
    }

    if (data.itemCategoryGroup.length > 10) {
      errors.itemCategoryGroup =
        "Item Category Group cannot exceed 10 characters";
    }
  }

  // item usage
  if (data.itemUsage) {
    if (!alphaNumericRegex.test(data.itemUsage)) {
      errors.itemUsage = "Item Usage must be alphanumeric only";
    }

    if (data.itemUsage.length > 10) {
      errors.itemUsage = "Item Usage cannot exceed 10 characters";
    }
  }

  // high level item
  if (data.itemCategoryHighLevelItem) {
    if (!alphaNumericRegex.test(data.itemCategoryHighLevelItem)) {
      errors.itemCategoryHighLevelItem =
        "High Level Item Category must be alphanumeric only";
    }

    if (data.itemCategoryHighLevelItem.length > 10) {
      errors.itemCategoryHighLevelItem =
        "High Level Item Category cannot exceed 10 characters";
    }
  }

  // default item category
  if (data.defaultItemCategory) {
    if (!alphaNumericRegex.test(data.defaultItemCategory)) {
      errors.defaultItemCategory =
        "Default Item Category must be alphanumeric only";
    }

    if (data.defaultItemCategory.length > 4) {
      errors.defaultItemCategory =
        "Default Item Category cannot exceed 4 characters";
    }
  }

  // manual item category
  if (data.manualItemCategory) {
    if (!alphaNumericRegex.test(data.manualItemCategory)) {
      errors.manualItemCategory =
        "Manual Item Category must be alphanumeric only";
    }

    if (data.manualItemCategory.length > 4) {
      errors.manualItemCategory =
        "Manual Item Category cannot exceed 4 characters";
    }
  }

  return errors;
};

// GET /api/item-categories-config
exports.getItemCategoriesConfigs = asyncHandler(async (req, res) => {
  const list = await db.ItemCategoriesConfig.findAll({
    where: { isDeleted: false },
  });
  res.json(list);
});

// GET /api/item-categories-config/deleted
exports.getDeletedItemCategoriesConfigs = asyncHandler(async (req, res) => {
  const list = await db.ItemCategoriesConfig.findAll({
    where: { isDeleted: true },
  });
  res.json(list);
});

// GET /api/item-categories-config/:id
exports.getItemCategoriesConfigById = asyncHandler(async (req, res) => {
  const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
  if (!cfg) {
    res.status(404).json({ message: "Item categories config not found" });
    return;
  }
  res.json(cfg);
});

// POST /api/item-categories-config
exports.createItemCategoriesConfig = asyncHandler(async (req, res) => {
  try {
    req.body.salesDocumentType = (req.body.salesDocumentType || "")
      .trim()
      .toUpperCase();

    req.body.itemCategoryGroup = (req.body.itemCategoryGroup || "")
      .trim()
      .toUpperCase();

    req.body.itemUsage = (req.body.itemUsage || "").trim().toUpperCase();

    req.body.itemCategoryHighLevelItem = (
      req.body.itemCategoryHighLevelItem || ""
    )
      .trim()
      .toUpperCase();

    req.body.defaultItemCategory = (req.body.defaultItemCategory || "")
      .trim()
      .toUpperCase();

    req.body.manualItemCategory = (req.body.manualItemCategory || "")
      .trim()
      .toUpperCase();

    const errors = validateItemCategoryConfig(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingConfig = await db.ItemCategoriesConfig.findOne({
      where: {
        salesDocumentType: req.body.salesDocumentType,
        itemCategoryGroup: req.body.itemCategoryGroup,
        itemUsage: req.body.itemUsage,
        itemCategoryHighLevelItem: req.body.itemCategoryHighLevelItem,
        isDeleted: false,
      },
    });

    if (existingConfig) {
      return res.status(400).json({
        errors: {
          duplicate: "Configuration already exists",
        },
      });
    }

    const cfg = await db.ItemCategoriesConfig.create(req.body);

    res.status(201).json(cfg);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          duplicate: "Configuration already exists",
        },
      });
    }

    throw err;
  }
});

// PUT /api/item-categories-config/:id
exports.updateItemCategoriesConfig = asyncHandler(async (req, res) => {
  const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);

  if (!cfg) {
    return res
      .status(404)
      .json({ message: "Item categories config not found" });
  }

  try {
    req.body.salesDocumentType = (req.body.salesDocumentType || "")
      .trim()
      .toUpperCase();

    req.body.itemCategoryGroup = (req.body.itemCategoryGroup || "")
      .trim()
      .toUpperCase();

    req.body.itemUsage = (req.body.itemUsage || "").trim().toUpperCase();

    req.body.itemCategoryHighLevelItem = (
      req.body.itemCategoryHighLevelItem || ""
    )
      .trim()
      .toUpperCase();

    req.body.defaultItemCategory = (req.body.defaultItemCategory || "")
      .trim()
      .toUpperCase();

    req.body.manualItemCategory = (req.body.manualItemCategory || "")
      .trim()
      .toUpperCase();

    const errors = validateItemCategoryConfig(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // duplicate check
    const existingConfig = await db.ItemCategoriesConfig.findOne({
      where: {
        salesDocumentType: req.body.salesDocumentType,
        itemCategoryGroup: req.body.itemCategoryGroup,
        itemUsage: req.body.itemUsage,
        itemCategoryHighLevelItem: req.body.itemCategoryHighLevelItem,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingConfig) {
      return res.status(400).json({
        errors: {
          duplicate: "Configuration already exists",
        },
      });
    }

    await cfg.update(req.body);

    res.json(cfg);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          duplicate: "Configuration already exists",
        },
      });
    }

    throw err;
  }
});

// DELETE /api/item-categories-config/:id
exports.softDeleteItemCategoriesConfig = asyncHandler(async (req, res) => {
  const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
  if (!cfg) {
    res.status(404).json({ message: "Item categories config not found" });
    return;
  }
  await cfg.update({ isDeleted: true });
  res.json({ message: "Item categories config moved to recycle bin" });
});

// PUT /api/item-categories-config/:id/restore
exports.restoreItemCategoriesConfig = asyncHandler(async (req, res) => {
  const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
  if (!cfg) {
    res.status(404).json({ message: "Item categories config not found" });
    return;
  }
  await cfg.update({ isDeleted: false });
  res.json(cfg);
});
