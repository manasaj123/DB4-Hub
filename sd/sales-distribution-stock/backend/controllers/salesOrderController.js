// backend/controllers/salesOrderController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");
const checkCreditLimit = require("../helpers/creditCheck");
const determineItemCategory = require("../helpers/itemCategoryDetermination");
const axios = require("axios");
const INTEGRATION_HUB = "http://localhost:3000";

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

    // Sales Document Config lookup
    const docConfig = await db.SalesDocumentConfig.findOne({
      where: { documentType: req.body.orderType, isDeleted: false },
    });

    // Credit limit check
    let orderAmount = 0;
    try {
      const items = JSON.parse(req.body.itemsJson || "[]");
      for (const item of items) {
        const condition = await db.Condition.findOne({
          where: { materialId: item.materialId, isDeleted: false },
          order: [["validFrom", "DESC"]],
        });
        const price = condition ? Number(condition.price) : 0;
        orderAmount += price * Number(item.quantity);
      }
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid itemsJson in order update" });
    }

    const shouldCheckCredit =
      !docConfig || docConfig.checkCreditLimit !== false;
    if (shouldCheckCredit) {
      const creditCheck = await checkCreditLimit(
        req.body.soldToPartyId,
        orderAmount,
      );
      if (!creditCheck.allowed) {
        return res.status(400).json({ message: creditCheck.message });
      }
    }

    // Enrich items with item category
    let parsedItems;
    try {
      parsedItems = JSON.parse(req.body.itemsJson);
    } catch {
      return res.status(400).json({ message: "Invalid itemsJson" });
    }

    const enrichedItems = [];
    for (const item of parsedItems) {
      const cat = await determineItemCategory(
        req.body.orderType,
        item.materialId,
        req.body.salesOrg,
        req.body.distributionChannel,
        req.body.division,
      );
      enrichedItems.push({ ...item, itemCategory: cat || "" });
    }
    req.body.itemsJson = JSON.stringify(enrichedItems);

    const order = await db.SalesOrder.create(req.body);

    // SEND WEBHOOK TO INTEGRATION HUB FOR TRACEABILITY
    try {
      const customer = await db.Customer.findByPk(req.body.soldToPartyId);
      const items = JSON.parse(req.body.itemsJson || "[]");

      for (const item of items) {
        const material = await db.Material.findByPk(item.materialId);

        await axios.post(`${INTEGRATION_HUB}/webhook/sales-order-created`, {
          order_id: order.id,
          order_number: order.id,
          customer_name: customer?.name || "Unknown",
          material_code: material?.materialCode || "Unknown",
          quantity: item.quantity,
          uom: item.uom,
        });
      }
      console.log(`✅ Sales Order ${order.id} sent to integration hub`);
    } catch (webhookError) {
      console.error("Webhook failed:", webhookError.message);
    }

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

    // ======================== Sales Document Config lookup ========================
    const docConfig = await db.SalesDocumentConfig.findOne({
      where: { documentType: req.body.orderType, isDeleted: false },
    });
    // ===========================================================================

    // ---- Credit limit check (configurable) ----
    let orderAmount = 0;
    try {
      const items = JSON.parse(req.body.itemsJson || "[]");
      for (const item of items) {
        const condition = await db.Condition.findOne({
          where: { materialId: item.materialId, isDeleted: false },
          order: [["validFrom", "DESC"]],
        });
        const price = condition ? Number(condition.price) : 0;
        orderAmount += price * Number(item.quantity);
      }
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid itemsJson in order update" });
    }

    const shouldCheckCredit =
      !docConfig || docConfig.checkCreditLimit !== false;
    if (shouldCheckCredit) {
      const creditCheck = await checkCreditLimit(
        req.body.soldToPartyId,
        orderAmount,
      );
      if (!creditCheck.allowed) {
        return res.status(400).json({ message: creditCheck.message });
      }
    }
    // ---- End credit check ----

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
