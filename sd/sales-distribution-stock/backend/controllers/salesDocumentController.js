// backend/controllers/salesDocumentController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateSalesDocument = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;
  const alphaNumericSpaceRegex = /^[A-Za-z0-9\s]+$/;

  const requiredFields = [
    "documentType",
    "description",
    "transactionGroup",
    "docPricingProcedure",
    "deliveryType",
    "screenSequence",
    "creditGroup",
    "shippingConditions",
  ];

  // 1. Required fields
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // 2. Document Type
  if (data.documentType) {
    if (!alphaNumericRegex.test(data.documentType)) {
      errors.documentType = "Document Type must be alphanumeric only";
    }

    if (data.documentType.length > 4) {
      errors.documentType = "Document Type cannot exceed 4 characters";
    }
  }

  // 3. Description
  if (data.description) {
    if (!alphaNumericSpaceRegex.test(data.description)) {
      errors.description =
        "Description must contain only letters, numbers and spaces";
    }

    if (data.description.length > 100) {
      errors.description = "Description cannot exceed 100 characters";
    }
  }

  // 4. Probability
  if (data.probability !== undefined && data.probability !== null) {
    const probability = Number(data.probability);

    if (isNaN(probability) || probability < 0 || probability > 100) {
      errors.probability = "Probability must be between 0 and 100";
    }
  }

  // 5. Credit Group
  if (data.creditGroup) {
    if (!alphaNumericRegex.test(data.creditGroup)) {
      errors.creditGroup = "Credit Group must be alphanumeric only";
    }

    if (data.creditGroup.length > 4) {
      errors.creditGroup = "Credit Group cannot exceed 4 characters";
    }
  }

  // 6. Screen Sequence
  if (data.screenSequence) {
    if (!alphaNumericRegex.test(data.screenSequence)) {
      errors.screenSequence = "Screen Sequence must be alphanumeric only";
    }

    if (data.screenSequence.length > 10) {
      errors.screenSequence = "Screen Sequence cannot exceed 10 characters";
    }
  }

  // 7. Incompletion Procedure
  if (data.incompletionProcedure) {
    if (!alphaNumericRegex.test(data.incompletionProcedure)) {
      errors.incompletionProcedure =
        "Incompletion Procedure must be alphanumeric only";
    }

    if (data.incompletionProcedure.length > 10) {
      errors.incompletionProcedure =
        "Incompletion Procedure cannot exceed 10 characters";
    }
  }

  // 8. Transaction Group
  if (data.transactionGroup) {
    if (!alphaNumericRegex.test(data.transactionGroup)) {
      errors.transactionGroup = "Transaction Group must be alphanumeric only";
    }

    if (data.transactionGroup.length > 10) {
      errors.transactionGroup = "Transaction Group cannot exceed 10 characters";
    }
  }

  // 9. Document Pricing Procedure
  if (data.docPricingProcedure) {
    if (!alphaNumericRegex.test(data.docPricingProcedure)) {
      errors.docPricingProcedure =
        "Document Pricing Procedure must be alphanumeric only";
    }

    if (data.docPricingProcedure.length > 10) {
      errors.docPricingProcedure =
        "Document Pricing Procedure cannot exceed 10 characters";
    }
  }

  // 10. Delivery Type
  if (data.deliveryType) {
    if (!alphaNumericRegex.test(data.deliveryType)) {
      errors.deliveryType = "Delivery Type must be alphanumeric only";
    }

    if (data.deliveryType.length > 4) {
      errors.deliveryType = "Delivery Type cannot exceed 4 characters";
    }

    if (!["LF", "NL"].includes(data.deliveryType.toUpperCase())) {
      errors.deliveryType = "Delivery Type must be LF or NL";
    }
  }

  // 11. Delivery Block
  if (data.deliveryBlock) {
    if (!alphaNumericRegex.test(data.deliveryBlock)) {
      errors.deliveryBlock = "Delivery Block must be alphanumeric only";
    }

    if (data.deliveryBlock.length > 4) {
      errors.deliveryBlock = "Delivery Block cannot exceed 4 characters";
    }
  }

  // 12. Shipping Conditions
  if (data.shippingConditions) {
    if (!alphaNumericRegex.test(data.shippingConditions)) {
      errors.shippingConditions =
        "Shipping Conditions must be alphanumeric only";
    }

    if (data.shippingConditions.length > 4) {
      errors.shippingConditions =
        "Shipping Conditions cannot exceed 4 characters";
    }
  }

  // 13. Shipment Cost Info Profile
  if (data.shipCostInfoProfile) {
    if (!alphaNumericRegex.test(data.shipCostInfoProfile)) {
      errors.shipCostInfoProfile =
        "Shipment Cost Info Profile must be alphanumeric only";
    }

    if (data.shipCostInfoProfile.length > 10) {
      errors.shipCostInfoProfile =
        "Shipment Cost Info Profile cannot exceed 10 characters";
    }
  }

  // 14. Delivery Billing Type
  if (data.delvBillingType) {
    if (!alphaNumericRegex.test(data.delvBillingType)) {
      errors.delvBillingType =
        "Delivery Billing Type must be alphanumeric only";
    }

    if (data.delvBillingType.length > 4) {
      errors.delvBillingType =
        "Delivery Billing Type cannot exceed 4 characters";
    }
  }

  // 15. Order Related Billing Type
  if (data.orderRelBillingType) {
    if (!alphaNumericRegex.test(data.orderRelBillingType)) {
      errors.orderRelBillingType =
        "Order Related Billing Type must be alphanumeric only";
    }

    if (data.orderRelBillingType.length > 4) {
      errors.orderRelBillingType =
        "Order Related Billing Type cannot exceed 4 characters";
    }
  }

  // 16. Intercompany Billing Type
  if (data.intercompanyBillingType) {
    if (!alphaNumericRegex.test(data.intercompanyBillingType)) {
      errors.intercompanyBillingType =
        "Intercompany Billing Type must be alphanumeric only";
    }

    if (data.intercompanyBillingType.length > 4) {
      errors.intercompanyBillingType =
        "Intercompany Billing Type cannot exceed 4 characters";
    }
  }

  // 17. At least one billing type
  const billingFields = [
    data.delvBillingType,
    data.orderRelBillingType,
    data.intercompanyBillingType,
  ];

  const hasBilling = billingFields.some(
    (field) => field && field.toString().trim(),
  );

  if (!hasBilling) {
    errors.billing = "At least one Billing Type is required";
  }

  return errors;
};

// GET /api/sales-documents
exports.getSalesDocuments = asyncHandler(async (req, res) => {
  const list = await db.SalesDocumentConfig.findAll({
    where: { isDeleted: false },
  });
  res.json(list);
});

// GET /api/sales-documents/deleted
exports.getDeletedSalesDocuments = asyncHandler(async (req, res) => {
  const list = await db.SalesDocumentConfig.findAll({
    where: { isDeleted: true },
  });
  res.json(list);
});

// GET /api/sales-documents/:id
exports.getSalesDocumentById = asyncHandler(async (req, res) => {
  const doc = await db.SalesDocumentConfig.findByPk(req.params.id);
  if (!doc) {
    res.status(404).json({ message: "Sales document config not found" });
    return;
  }
  res.json(doc);
});

// POST /api/sales-documents
// backend/controllers/salesDocumentController.js
exports.createSalesDocument = asyncHandler(async (req, res) => {
  try {
    req.body.documentType = (req.body.documentType || "").trim().toUpperCase();

    req.body.creditGroup = (req.body.creditGroup || "").trim().toUpperCase();

    req.body.screenSequence = (req.body.screenSequence || "")
      .trim()
      .toUpperCase();

    req.body.incompletionProcedure = (req.body.incompletionProcedure || "")
      .trim()
      .toUpperCase();

    req.body.transactionGroup = (req.body.transactionGroup || "")
      .trim()
      .toUpperCase();

    req.body.docPricingProcedure = (req.body.docPricingProcedure || "")
      .trim()
      .toUpperCase();

    req.body.deliveryType = (req.body.deliveryType || "").trim().toUpperCase();

    req.body.deliveryBlock = (req.body.deliveryBlock || "")
      .trim()
      .toUpperCase();

    req.body.shippingConditions = (req.body.shippingConditions || "")
      .trim()
      .toUpperCase();

    req.body.shipCostInfoProfile = (req.body.shipCostInfoProfile || "")
      .trim()
      .toUpperCase();

    req.body.delvBillingType = (req.body.delvBillingType || "")
      .trim()
      .toUpperCase();

    req.body.orderRelBillingType = (req.body.orderRelBillingType || "")
      .trim()
      .toUpperCase();

    req.body.intercompanyBillingType = (req.body.intercompanyBillingType || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validateSalesDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const doc = await db.SalesDocumentConfig.create(req.body);

    res.status(201).json(doc);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          documentType: "Document Type already exists",
        },
      });
    }

    throw err;
  }
});

// PUT /api/sales-documents/:id
exports.updateSalesDocument = asyncHandler(async (req, res) => {
  const doc = await db.SalesDocumentConfig.findByPk(req.params.id);

  if (!doc) {
    return res.status(404).json({
      message: "Sales document config not found",
    });
  }

  try {
    req.body.documentType = (req.body.documentType || "").trim().toUpperCase();

    req.body.creditGroup = (req.body.creditGroup || "").trim().toUpperCase();

    req.body.screenSequence = (req.body.screenSequence || "")
      .trim()
      .toUpperCase();

    req.body.incompletionProcedure = (req.body.incompletionProcedure || "")
      .trim()
      .toUpperCase();

    req.body.transactionGroup = (req.body.transactionGroup || "")
      .trim()
      .toUpperCase();

    req.body.docPricingProcedure = (req.body.docPricingProcedure || "")
      .trim()
      .toUpperCase();

    req.body.deliveryType = (req.body.deliveryType || "").trim().toUpperCase();

    req.body.deliveryBlock = (req.body.deliveryBlock || "")
      .trim()
      .toUpperCase();

    req.body.shippingConditions = (req.body.shippingConditions || "")
      .trim()
      .toUpperCase();

    req.body.shipCostInfoProfile = (req.body.shipCostInfoProfile || "")
      .trim()
      .toUpperCase();

    req.body.delvBillingType = (req.body.delvBillingType || "")
      .trim()
      .toUpperCase();

    req.body.orderRelBillingType = (req.body.orderRelBillingType || "")
      .trim()
      .toUpperCase();

    req.body.intercompanyBillingType = (req.body.intercompanyBillingType || "")
      .trim()
      .toUpperCase();

    req.body.description = (req.body.description || "").trim();

    const errors = validateSalesDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingDoc = await db.SalesDocumentConfig.findOne({
      where: {
        documentType: req.body.documentType,
        isDeleted: false,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingDoc) {
      return res.status(400).json({
        errors: {
          documentType: "Document Type already exists",
        },
      });
    }

    await doc.update(req.body);

    res.json(doc);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          documentType: "Document Type already exists",
        },
      });
    }

    throw err;
  }
});

// DELETE /api/sales-documents/:id
exports.softDeleteSalesDocument = asyncHandler(async (req, res) => {
  const doc = await db.SalesDocumentConfig.findByPk(req.params.id);
  if (!doc) {
    res.status(404).json({ message: "Sales document config not found" });
    return;
  }
  await doc.update({ isDeleted: true });
  res.json({ message: "Sales document config moved to recycle bin" });
});

// PUT /api/sales-documents/:id/restore
exports.restoreSalesDocument = asyncHandler(async (req, res) => {
  const doc = await db.SalesDocumentConfig.findByPk(req.params.id);
  if (!doc) {
    res.status(404).json({ message: "Sales document config not found" });
    return;
  }
  await doc.update({ isDeleted: false });
  res.json(doc);
});
