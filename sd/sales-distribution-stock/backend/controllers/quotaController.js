// backend/controllers/quotaController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op, fn, col, where } = require("sequelize");

// GET /api/quotas
exports.getQuotas = asyncHandler(async (req, res) => {
  const list = await db.Quota.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/quotas/deleted
exports.getDeletedQuotas = asyncHandler(async (req, res) => {
  const list = await db.Quota.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/quotas/:id
exports.getQuotaById = asyncHandler(async (req, res) => {
  const quota = await db.Quota.findByPk(req.params.id);
  if (!quota) {
    res.status(404).json({ message: "Quota arrangement not found" });
    return;
  }
  res.json(quota);
});

// POST /api/quotas
exports.createQuota = asyncHandler(async (req, res) => {
  const {
    purchasingGroup,
    plant,
    plantSpecialMaterialStatus,
    taxIndicatorForMaterial,
    materialFreightGroup,
    materialGroup,
    validFrom,
    validTo,
    quotaUsage,
  } = req.body;

  // Required validation
  if (
    !purchasingGroup?.trim() ||
    !plant?.trim() ||
    !materialGroup?.trim() ||
    !validFrom ||
    !validTo ||
    quotaUsage === ""
  ) {
    return res.status(400).json({
      message: "Required fields are missing",
    });
  }

  // Alphanumeric validation
  const alphaNumericRegex = /^[a-zA-Z0-9\s\-]+$/;

  const fieldsToValidate = [
    purchasingGroup,
    plant,
    plantSpecialMaterialStatus,
    taxIndicatorForMaterial,
    materialFreightGroup,
    materialGroup,
  ];

  for (const field of fieldsToValidate) {
    if (field && !alphaNumericRegex.test(field)) {
      return res.status(400).json({
        message: "Special characters are not allowed",
      });
    }
  }

  // Date validation
  if (validFrom > validTo) {
    return res.status(400).json({
      message: "Valid To must be greater than Valid From",
    });
  }

  // Negative validation
  if (Number(quotaUsage) < 0) {
    return res.status(400).json({
      message: "Negative quota usage is not allowed",
    });
  }

  // Duplicate purchasing group
  const existingQuota = await db.Quota.findOne({
    where: {
      [Op.and]: [
        where(
          fn("LOWER", col("purchasingGroup")),
          purchasingGroup.toLowerCase(),
        ),
        { isDeleted: false },
      ],
    },
  });

  if (existingQuota) {
    return res.status(400).json({
      message: "Purchasing Group already exists",
    });
  }

  const quota = await db.Quota.create({
    purchasingGroup: purchasingGroup.toUpperCase(),
    plant: plant.toUpperCase(),
    plantSpecialMaterialStatus: plantSpecialMaterialStatus?.toUpperCase(),
    taxIndicatorForMaterial: taxIndicatorForMaterial?.toUpperCase(),
    materialFreightGroup: materialFreightGroup?.toUpperCase(),
    materialGroup: materialGroup.toUpperCase(),
    validFrom,
    validTo,
    quotaUsage,
  });

  res.status(201).json(quota);
});

// PUT /api/quotas/:id
exports.updateQuota = asyncHandler(async (req, res) => {
  const quota = await db.Quota.findByPk(req.params.id);

  if (!quota) {
    return res.status(404).json({
      message: "Quota arrangement not found",
    });
  }

  const {
    purchasingGroup,
    plant,
    plantSpecialMaterialStatus,
    taxIndicatorForMaterial,
    materialFreightGroup,
    materialGroup,
    validFrom,
    validTo,
    quotaUsage,
  } = req.body;

  // Required validation
  if (
    !purchasingGroup?.trim() ||
    !plant?.trim() ||
    !materialGroup?.trim() ||
    !validFrom ||
    !validTo ||
    quotaUsage === ""
  ) {
    return res.status(400).json({
      message: "Required fields are missing",
    });
  }

  // Alphanumeric validation
  const alphaNumericRegex = /^[a-zA-Z0-9\s\-]+$/;

  const fieldsToValidate = [
    purchasingGroup,
    plant,
    plantSpecialMaterialStatus,
    taxIndicatorForMaterial,
    materialFreightGroup,
    materialGroup,
  ];

  for (const field of fieldsToValidate) {
    if (field && !alphaNumericRegex.test(field)) {
      return res.status(400).json({
        message: "Special characters are not allowed",
      });
    }
  }

  // Date validation
  if (validFrom > validTo) {
    return res.status(400).json({
      message: "Valid To must be greater than Valid From",
    });
  }

  // Negative validation
  if (Number(quotaUsage) < 0) {
    return res.status(400).json({
      message: "Negative quota usage is not allowed",
    });
  }

  // Duplicate validation
  const existingQuota = await db.Quota.findOne({
    where: {
      [Op.and]: [
        where(
          fn("LOWER", col("purchasingGroup")),
          purchasingGroup.toLowerCase(),
        ),
        { isDeleted: false },
        {
          id: {
            [Op.ne]: quota.id,
          },
        },
      ],
    },
  });

  if (existingQuota) {
    return res.status(400).json({
      message: "Purchasing Group already exists",
    });
  }

  await quota.update({
    purchasingGroup: purchasingGroup.toUpperCase(),
    plant: plant.toUpperCase(),
    plantSpecialMaterialStatus: plantSpecialMaterialStatus?.toUpperCase(),
    taxIndicatorForMaterial: taxIndicatorForMaterial?.toUpperCase(),
    materialFreightGroup: materialFreightGroup?.toUpperCase(),
    materialGroup: materialGroup.toUpperCase(),
    validFrom,
    validTo,
    quotaUsage,
  });

  res.json(quota);
});

// DELETE /api/quotas/:id
exports.softDeleteQuota = asyncHandler(async (req, res) => {
  const quota = await db.Quota.findByPk(req.params.id);
  if (!quota) {
    res.status(404).json({ message: "Quota arrangement not found" });
    return;
  }
  await quota.update({ isDeleted: true });
  res.json({ message: "Quota arrangement moved to recycle bin" });
});

// PUT /api/quotas/:id/restore
exports.restoreQuota = asyncHandler(async (req, res) => {
  const quota = await db.Quota.findByPk(req.params.id);
  if (!quota) {
    res.status(404).json({ message: "Quota arrangement not found" });
    return;
  }
  await quota.update({ isDeleted: false });
  res.json(quota);
});
