// backend/controllers/inquiryController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateInquiry = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  const quantityRegex = /^\d+(\.\d{1,3})?$/;
  const uomRegex = /^(KG|LITERS|PACKETS|PIECES|NOS)$/;

  const requiredFields = [
    "inquiryType",
    "salesOrg",
    "distributionChannel",
    "division",
    "soldToPartyId",
    "shipToPartyId",
  ];

  // 1. Required fields
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // 2. Inquiry Type
  if (data.inquiryType) {
    if (!alphaNumericRegex.test(data.inquiryType)) {
      errors.inquiryType = "Inquiry Type must be alphanumeric only";
    }

    if (data.inquiryType.length > 4) {
      errors.inquiryType = "Inquiry Type cannot exceed 4 characters";
    }
  }

  // 3. Sales Org
  if (data.salesOrg) {
    if (!alphaNumericRegex.test(data.salesOrg)) {
      errors.salesOrg = "Sales Organization must be alphanumeric only";
    }

    if (data.salesOrg.length > 10) {
      errors.salesOrg = "Sales Organization cannot exceed 10 characters";
    }
  }

  // 4. Distribution Channel
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

  // 5. Division
  if (data.division) {
    if (!alphaNumericRegex.test(data.division)) {
      errors.division = "Division must be alphanumeric only";
    }

    if (data.division.length > 10) {
      errors.division = "Division cannot exceed 10 characters";
    }
  }

  // 6. Sold-To and Ship-To validation
  if (
    data.soldToPartyId &&
    data.shipToPartyId &&
    Number(data.soldToPartyId) === Number(data.shipToPartyId)
  ) {
    errors.shipToPartyId = "Sold-To Party and Ship-To Party cannot be the same";
  }

  // 7. Items validation
  let parsedItems = [];

  try {
    parsedItems =
      typeof data.itemsJson === "string"
        ? JSON.parse(data.itemsJson)
        : data.itemsJson;
  } catch {
    errors.itemsJson = "Invalid items format";
    return errors;
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    errors.itemsJson = "At least one item is required";
    return errors;
  }

  parsedItems.forEach((item, index) => {
    if (!item.materialId) {
      errors[`materialId_${index}`] =
        `Material is required for item ${index + 1}`;
    }

    if (!item.quantity) {
      errors[`quantity_${index}`] =
        `Quantity is required for item ${index + 1}`;
    } else {
      if (
        !quantityRegex.test(item.quantity.toString()) ||
        Number(item.quantity) <= 0
      ) {
        errors[`quantity_${index}`] =
          `Quantity must be a positive number with max 3 decimals for item ${
            index + 1
          }`;
      }
    }

    if (!item.uom) {
      errors[`uom_${index}`] = `UoM is required for item ${index + 1}`;
    } else if (!uomRegex.test(item.uom.toUpperCase())) {
      errors[`uom_${index}`] = `Invalid UoM for item ${index + 1}`;
    }
  });

  return errors;
};

// GET /api/inquiries
exports.getInquiries = asyncHandler(async (req, res) => {
  const list = await db.Inquiry.findAll({
    where: { isDeleted: false },
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
    ],
  });
  res.json(list);
});

// GET /api/inquiries/deleted
exports.getDeletedInquiries = asyncHandler(async (req, res) => {
  const list = await db.Inquiry.findAll({
    where: { isDeleted: true },
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
    ],
  });
  res.json(list);
});

// GET /api/inquiries/:id
exports.getInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await db.Inquiry.findByPk(req.params.id, {
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
    ],
  });
  if (!inquiry) {
    res.status(404).json({ message: "Inquiry not found" });
    return;
  }
  res.json(inquiry);
});

// POST /api/inquiries
// controllers/inquiryController.js
exports.createInquiry = asyncHandler(async (req, res) => {
  try {
    req.body.inquiryType = (req.body.inquiryType || "").trim().toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.division = (req.body.division || "").trim().toUpperCase();

    const errors = validateInquiry(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingInquiry = await db.Inquiry.findOne({
      where: {
        inquiryType: req.body.inquiryType,
        salesOrg: req.body.salesOrg,
        distributionChannel: req.body.distributionChannel,
        division: req.body.division,
        soldToPartyId: req.body.soldToPartyId,
        shipToPartyId: req.body.shipToPartyId,
        itemsJson: req.body.itemsJson,
        isDeleted: false,
      },
    });

    if (existingInquiry) {
      return res.status(400).json({
        errors: {
          duplicate: "Duplicate Inquiry already exists",
        },
      });
    }

    const inquiry = await db.Inquiry.create(req.body);

    res.status(201).json(inquiry);
  } catch (err) {
    console.error("Create inquiry error:", err.original || err);
    res.status(500).json({
      message: err.message,
    });
  }
});

// PUT /api/inquiries/:id
// PUT /api/inquiries/:id
exports.updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await db.Inquiry.findByPk(req.params.id);

  if (!inquiry) {
    return res.status(404).json({
      message: "Inquiry not found",
    });
  }

  try {
    req.body.inquiryType = (req.body.inquiryType || "").trim().toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.division = (req.body.division || "").trim().toUpperCase();

    const errors = validateInquiry(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingInquiry = await db.Inquiry.findOne({
      where: {
        inquiryType: req.body.inquiryType,
        salesOrg: req.body.salesOrg,
        distributionChannel: req.body.distributionChannel,
        division: req.body.division,
        soldToPartyId: req.body.soldToPartyId,
        shipToPartyId: req.body.shipToPartyId,
        itemsJson: req.body.itemsJson,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingInquiry) {
      return res.status(400).json({
        errors: {
          duplicate: "Duplicate Inquiry already exists",
        },
      });
    }

    await inquiry.update(req.body);

    res.json(inquiry);
  } catch (err) {
    console.error("Update inquiry error:", err.original || err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// DELETE /api/inquiries/:id
exports.softDeleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await db.Inquiry.findByPk(req.params.id);
  if (!inquiry) {
    res.status(404).json({ message: "Inquiry not found" });
    return;
  }
  await inquiry.update({ isDeleted: true });
  res.json({ message: "Inquiry moved to recycle bin" });
});

// PUT /api/inquiries/:id/restore
exports.restoreInquiry = asyncHandler(async (req, res) => {
  const inquiry = await db.Inquiry.findByPk(req.params.id);
  if (!inquiry) {
    res.status(404).json({ message: "Inquiry not found" });
    return;
  }
  await inquiry.update({ isDeleted: false });
  res.json(inquiry);
});
