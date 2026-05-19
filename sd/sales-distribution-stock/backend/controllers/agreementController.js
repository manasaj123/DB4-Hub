// backend/controllers/agreementController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op, fn, col, where } = require("sequelize");

// GET /api/agreements
exports.getAgreements = asyncHandler(async (req, res) => {
  const list = await db.Agreement.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/agreements/deleted
exports.getDeletedAgreements = asyncHandler(async (req, res) => {
  const list = await db.Agreement.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/agreements/:id
exports.getAgreementById = asyncHandler(async (req, res) => {
  const agr = await db.Agreement.findByPk(req.params.id);
  if (!agr) {
    res.status(404).json({ message: "Agreement not found" });
    return;
  }
  res.json(agr);
});

// POST /api/agreements
exports.createAgreement = asyncHandler(async (req, res) => {
  const {
    vendorName,
    contractType,
    purchasingOrg,
    purchasingGroup,
    plant,
    agreementDate,
  } = req.body;

  // Mandatory fields
  if (
    !vendorName ||
    !contractType ||
    !purchasingOrg ||
    !purchasingGroup ||
    !plant ||
    !agreementDate
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  // Vendor validation
  // const vendorRegex = /^[a-zA-Z\s\-().]+$/;

  const vendorRegex = /^[a-zA-Z0-9\s\-().]+$/;

  if (!vendorRegex.test(vendorName)) {
    return res.status(400).json({
      message: "Invalid Vendor Name",
    });
  }

  // Contract Type validation
  if (!["MK", "WK"].includes(contractType.toUpperCase())) {
    return res.status(400).json({
      message: "Contract Type must be MK or WK",
    });
  }

  // Future date validation
  const today = new Date().toISOString().split("T")[0];

  if (agreementDate > today) {
    return res.status(400).json({
      message: "Future date is not allowed",
    });
  }

  // Duplicate Vendor validation (case insensitive)
  const existingVendor = await db.Agreement.findOne({
    where: where(fn("LOWER", col("vendorName")), vendorName.toLowerCase()),
  });

  if (existingVendor) {
    return res.status(400).json({
      message: "Vendor Name already exists",
    });
  }

  const agr = await db.Agreement.create({
    vendorName,
    contractType: contractType.toUpperCase(),
    purchasingOrg: purchasingOrg.toUpperCase(),
    purchasingGroup: purchasingGroup.toUpperCase(),
    plant: plant.toUpperCase(),
    agreementDate,
  });

  res.status(201).json(agr);
});

// PUT /api/agreements/:id
exports.updateAgreement = asyncHandler(async (req, res) => {
  const agr = await db.Agreement.findByPk(req.params.id);

  if (!agr) {
    return res.status(404).json({
      message: "Agreement not found",
    });
  }

  const {
    vendorName,
    contractType,
    purchasingOrg,
    purchasingGroup,
    plant,
    agreementDate,
  } = req.body;

  // Required validation
  if (
    !vendorName ||
    !contractType ||
    !purchasingOrg ||
    !purchasingGroup ||
    !plant ||
    !agreementDate
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  // Vendor validation
  const vendorRegex = /^[a-zA-Z0-9\s\-().]+$/;

  if (!vendorRegex.test(vendorName)) {
    return res.status(400).json({
      message: "Invalid Vendor Name",
    });
  }

  // Contract Type validation
  if (!["MK", "WK"].includes(contractType.toUpperCase())) {
    return res.status(400).json({
      message: "Contract Type must be MK or WK",
    });
  }

  // Future date validation
  const today = new Date().toISOString().split("T")[0];

  if (agreementDate > today) {
    return res.status(400).json({
      message: "Future date is not allowed",
    });
  }

  // Duplicate Vendor validation (case insensitive)
  const existingVendor = await db.Agreement.findOne({
    where: {
      [Op.and]: [
        where(fn("LOWER", col("vendorName")), vendorName.toLowerCase()),
        {
          id: {
            [Op.ne]: agr.id,
          },
        },
      ],
    },
  });

  if (existingVendor) {
    return res.status(400).json({
      message: "Vendor Name already exists",
    });
  }

  await agr.update({
    vendorName: vendorName.trim(),
    contractType: contractType.toUpperCase(),
    purchasingOrg: purchasingOrg.toUpperCase(),
    purchasingGroup: purchasingGroup.toUpperCase(),
    plant: plant.toUpperCase(),
    agreementDate,
  });

  res.json(agr);
});

// DELETE /api/agreements/:id
exports.softDeleteAgreement = asyncHandler(async (req, res) => {
  const agr = await db.Agreement.findByPk(req.params.id);
  if (!agr) {
    res.status(404).json({ message: "Agreement not found" });
    return;
  }
  await agr.update({ isDeleted: true });
  res.json({ message: "Agreement moved to recycle bin" });
});

// PUT /api/agreements/:id/restore
exports.restoreAgreement = asyncHandler(async (req, res) => {
  const agr = await db.Agreement.findByPk(req.params.id);
  if (!agr) {
    res.status(404).json({ message: "Agreement not found" });
    return;
  }
  await agr.update({ isDeleted: false });
  res.json(agr);
});
