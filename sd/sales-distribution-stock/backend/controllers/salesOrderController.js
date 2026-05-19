// backend/controllers/salesOrderController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

// validation
const validateSalesOrder = (data) => {
  const errors = {};

  const alphaNumericRegex = /^[A-Za-z0-9]+$/;

  const requiredFields = [
    "orderType",
    "salesOrg",
    "distributionChannel",
    "division",
    "salesOffice",
    "salesGroup",
    "soldToPartyId",
    "shipToPartyId",
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

  // Order Type -> varchar(4)
  if (data.orderType) {
    if (!alphaNumericRegex.test(data.orderType)) {
      errors.orderType = "Order Type must be alphanumeric only";
    }

    if (data.orderType.length > 4) {
      errors.orderType = "Order Type cannot exceed 4 characters";
    }
  }

  // Common varchar(10) fields
  const varchar10Fields = [
    { key: "salesOrg", label: "Sales Organization" },
    { key: "distributionChannel", label: "Distribution Channel" },
    { key: "division", label: "Division" },
    { key: "salesOffice", label: "Sales Office" },
    { key: "salesGroup", label: "Sales Group" },
  ];

  varchar10Fields.forEach((field) => {
    if (data[field.key]) {
      if (!alphaNumericRegex.test(data[field.key])) {
        errors[field.key] = `${field.label} must be alphanumeric only`;
      }

      if (data[field.key].length > 10) {
        errors[field.key] = `${field.label} cannot exceed 10 characters`;
      }
    }
  });

  // sold-to / ship-to
  if (
    data.soldToPartyId &&
    data.shipToPartyId &&
    Number(data.soldToPartyId) === Number(data.shipToPartyId)
  ) {
    errors.shipToPartyId = "Sold-To Party and Ship-To Party cannot be same";
  }

  // items validation

  const allowedUoms = ["KG", "LITERS", "PACKETS", "PIECES", "NOS"];

  let parsedItems = [];

  try {
    parsedItems =
      typeof data.itemsJson === "string"
        ? JSON.parse(data.itemsJson)
        : data.itemsJson;
  } catch {
    errors.itemsJson = "Invalid items data";
    return errors;
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    errors.itemsJson = "At least one item is required";
  } else {
    parsedItems.forEach((item, index) => {
      if (!item.materialId) {
        errors[`item_${index}_materialId`] = "Material is required";
      }

      if (
        !item.quantity ||
        isNaN(item.quantity) ||
        Number(item.quantity) <= 0
      ) {
        errors[`item_${index}_quantity`] =
          "Quantity must be a valid positive number";
      }

      if (!item.uom) {
        errors[`item_${index}_uom`] = "UoM is required";
      }

      if (item.uom && item.uom.length > 10) {
        errors[`item_${index}_uom`] = "UoM cannot exceed 10 characters";
      }

      if (item.uom && !allowedUoms.includes(item.uom)) {
        errors[`item_${index}_uom`] = "Invalid UoM";
      }
    });
  }

  return errors;
};

// GET /api/sales-orders
exports.getSalesOrders = asyncHandler(async (req, res) => {
  const list = await db.SalesOrder.findAll({
    where: { isDeleted: false },
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
      { model: db.Inquiry, as: "referenceInquiry" },
      { model: db.Quotation, as: "referenceQuotation" },
    ],
  });
  res.json(list);
});

// GET /api/sales-orders/deleted
exports.getDeletedSalesOrders = asyncHandler(async (req, res) => {
  const list = await db.SalesOrder.findAll({
    where: { isDeleted: true },
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
      { model: db.Inquiry, as: "referenceInquiry" },
      { model: db.Quotation, as: "referenceQuotation" },
    ],
  });
  res.json(list);
});

// GET /api/sales-orders/:id
exports.getSalesOrderById = asyncHandler(async (req, res) => {
  const order = await db.SalesOrder.findByPk(req.params.id, {
    include: [
      { model: db.Customer, as: "soldToParty" },
      { model: db.Customer, as: "shipToParty" },
      { model: db.Inquiry, as: "referenceInquiry" },
      { model: db.Quotation, as: "referenceQuotation" },
    ],
  });
  if (!order) {
    res.status(404).json({ message: "Sales order not found" });
    return;
  }
  res.json(order);
});

// POST /api/sales-orders

// exports.createSalesOrder = async (req, res) => {
//   try {
//     const payload = { ...req.body };

//     // normalize optional integer fields
//     if (payload.referenceInquiryId === "") payload.referenceInquiryId = null;
//     if (payload.referenceQuotationId === "")
//       payload.referenceQuotationId = null;

//     const order = await db.SalesOrder.create(payload);
//     return res.status(201).json(order);
//   } catch (err) {
//     console.error(
//       "DB error in createSalesOrder:",
//       err.message,
//       err.original?.sqlMessage,
//       err.original?.sql,
//     );
//     return res.status(500).json({
//       error: err.message,
//       sqlMessage: err.original?.sqlMessage,
//       sql: err.original?.sql,
//     });
//   }
// };

// POST /api/sales-orders
exports.createSalesOrder = asyncHandler(async (req, res) => {
  try {
    req.body.orderType = (req.body.orderType || "").trim().toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.division = (req.body.division || "").trim().toUpperCase();

    req.body.salesOffice = (req.body.salesOffice || "").trim().toUpperCase();

    req.body.salesGroup = (req.body.salesGroup || "").trim().toUpperCase();

    // normalize optional refs
    if (req.body.referenceInquiryId === "") {
      req.body.referenceInquiryId = null;
    }

    if (req.body.referenceQuotationId === "") {
      req.body.referenceQuotationId = null;
    }

    const errors = validateSalesOrder(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const order = await db.SalesOrder.create(req.body);

    res.status(201).json(order);
  } catch (err) {
    throw err;
  }
});
// PUT /api/sales-orders/:id
exports.updateSalesOrder = asyncHandler(async (req, res) => {
  const order = await db.SalesOrder.findByPk(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: "Sales order not found",
    });
  }

  try {
    req.body.orderType = (req.body.orderType || "").trim().toUpperCase();

    req.body.salesOrg = (req.body.salesOrg || "").trim().toUpperCase();

    req.body.distributionChannel = (req.body.distributionChannel || "")
      .trim()
      .toUpperCase();

    req.body.division = (req.body.division || "").trim().toUpperCase();

    req.body.salesOffice = (req.body.salesOffice || "").trim().toUpperCase();

    req.body.salesGroup = (req.body.salesGroup || "").trim().toUpperCase();

    const errors = validateSalesOrder(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    await order.update(req.body);

    res.json(order);
  } catch (err) {
    throw err;
  }
});

// DELETE /api/sales-orders/:id
exports.softDeleteSalesOrder = asyncHandler(async (req, res) => {
  const order = await db.SalesOrder.findByPk(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Sales order not found" });
    return;
  }
  await order.update({ isDeleted: true });
  res.json({ message: "Sales order moved to recycle bin" });
});

// PUT /api/sales-orders/:id/restore
exports.restoreSalesOrder = asyncHandler(async (req, res) => {
  const order = await db.SalesOrder.findByPk(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Sales order not found" });
    return;
  }
  await order.update({ isDeleted: false });
  res.json(order);
});
