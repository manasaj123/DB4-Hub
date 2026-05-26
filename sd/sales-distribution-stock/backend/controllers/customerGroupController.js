// backend/controllers/customerGroupController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// ---------------- VALIDATION ----------------

const normalizeFieldStatus = (v) => {
  const map = {
    required: "Required",
    optional: "Optional",
    hidden: "Hidden",
  };

  return map[(v || "").trim().toLowerCase()] || null;
};
const validateCustomerGroup = (data) => {
  const errors = {};

  const accountGroupRegex = /^[A-Z0-9]{4}$/;
  const nameRegex = /^[A-Za-z\s]+$/;
  const statusValues = ["Required", "Optional", "Hidden"];

  // Required fields
  const requiredFields = ["accountGroup", "name"];

  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // Account Group
  if (data.accountGroup) {
    if (!accountGroupRegex.test(data.accountGroup)) {
      errors.accountGroup =
        "Account Group must be exactly 4 uppercase letters/numbers";
    }
  }

  // Name
  if (data.name) {
    if (!nameRegex.test(data.name)) {
      errors.name = "Name must contain only letters and spaces";
    }
    if (data.name.length > 150) {
      errors.name = "Name cannot exceed 150 characters";
    }
  }

  // Field Status validation
  ["fieldStatusGeneral", "fieldStatusCompanyCode", "fieldStatusSales"].forEach(
    (field) => {
      if (data[field] && !statusValues.includes(data[field])) {
        errors[field] = `${field} must be Required, Optional, or Hidden`;
      }
    },
  );

  return errors;
};

// GET /api/customer-groups
exports.getCustomerGroups = asyncHandler(async (req, res) => {
  const list = await db.CustomerGroup.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/customer-groups/deleted
exports.getDeletedCustomerGroups = asyncHandler(async (req, res) => {
  const list = await db.CustomerGroup.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/customer-groups/:id
exports.getCustomerGroupById = asyncHandler(async (req, res) => {
  const group = await db.CustomerGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Customer group not found" });
    return;
  }
  res.json(group);
});

// POST /api/customer-groups
exports.createCustomerGroup = asyncHandler(async (req, res) => {
  try {
    // normalization
    req.body.accountGroup = (req.body.accountGroup || "").trim().toUpperCase();

    req.body.name = (req.body.name || "").trim();

    req.body.fieldStatusGeneral = normalizeFieldStatus(
      req.body.fieldStatusGeneral,
    );

    req.body.fieldStatusCompanyCode = normalizeFieldStatus(
      req.body.fieldStatusCompanyCode,
    );

    req.body.fieldStatusSales = normalizeFieldStatus(req.body.fieldStatusSales);

    const errors = validateCustomerGroup(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const group = await db.CustomerGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    throw err;
  }
});

// PUT /api/customer-groups/:id
exports.updateCustomerGroup = asyncHandler(async (req, res) => {
  const group = await db.CustomerGroup.findByPk(req.params.id);

  if (!group) {
    return res.status(404).json({ message: "Customer group not found" });
  }

  try {
    req.body.accountGroup = (req.body.accountGroup || "").trim().toUpperCase();

    req.body.name = (req.body.name || "").trim();

    req.body.fieldStatusGeneral = normalizeFieldStatus(
      req.body.fieldStatusGeneral,
    );

    req.body.fieldStatusCompanyCode = normalizeFieldStatus(
      req.body.fieldStatusCompanyCode,
    );

    req.body.fieldStatusSales = normalizeFieldStatus(req.body.fieldStatusSales);

    const errors = validateCustomerGroup(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    await group.update(req.body);
    res.json(group);
  } catch (err) {
    throw err;
  }
});

// DELETE /api/customer-groups/:id
exports.softDeleteCustomerGroup = asyncHandler(async (req, res) => {
  const group = await db.CustomerGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Customer group not found" });
    return;
  }
  await group.update({ isDeleted: true });
  res.json({ message: "Customer group moved to recycle bin" });
});

// PUT /api/customer-groups/:id/restore
exports.restoreCustomerGroup = asyncHandler(async (req, res) => {
  const group = await db.CustomerGroup.findByPk(req.params.id);
  if (!group) {
    res.status(404).json({ message: "Customer group not found" });
    return;
  }
  await group.update({ isDeleted: false });
  res.json(group);
});
