// backend/controllers/deliveryController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/deliveries
exports.getDeliveries = asyncHandler(async (req, res) => {
  const list = await db.Delivery.findAll({
    where: { isDeleted: false },
    include: [{ model: db.SalesOrder }],
  });
  res.json(list);
});

// GET /api/deliveries/deleted
exports.getDeletedDeliveries = asyncHandler(async (req, res) => {
  const list = await db.Delivery.findAll({
    where: { isDeleted: true },
    include: [{ model: db.SalesOrder }],
  });
  res.json(list);
});

// GET /api/deliveries/:id
exports.getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await db.Delivery.findByPk(req.params.id, {
    include: [{ model: db.SalesOrder }],
  });
  if (!delivery) {
    res.status(404).json({ message: "Delivery not found" });
    return;
  }
  res.json(delivery);
});

// POST /api/deliveries
exports.createDelivery = asyncHandler(async (req, res) => {
  req.body.shippingPoint = (req.body.shippingPoint || "").trim().toUpperCase();

  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();

  req.body.plant = (req.body.plant || "").trim().toUpperCase();

  req.body.deliveryGroup = (req.body.deliveryGroup || "").trim().toUpperCase();
  const {
    shippingPoint,
    salesOrderId,
    warehouse,
    plant,
    deliveryGroup,
    postGoodsIssueDate,
  } = req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  if (!shippingPoint || !shippingPoint.trim()) {
    return res.status(400).json({
      message: "Shipping Point is required",
    });
  }

  if (!alphaNumRegex.test(shippingPoint)) {
    return res.status(400).json({
      message: "Shipping Point contains invalid characters",
    });
  }

  if (!salesOrderId) {
    return res.status(400).json({
      message: "Sales Order is required",
    });
  }

  if (!warehouse || !warehouse.trim()) {
    return res.status(400).json({
      message: "Warehouse is required",
    });
  }

  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({
      message: "Warehouse contains invalid characters",
    });
  }

  if (!plant || !plant.trim()) {
    return res.status(400).json({
      message: "Plant is required",
    });
  }

  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({
      message: "Plant contains invalid characters",
    });
  }

  if (deliveryGroup && !alphaNumRegex.test(deliveryGroup)) {
    return res.status(400).json({
      message: "Invalid Delivery Group",
    });
  }

  if (postGoodsIssueDate) {
    const date = new Date(postGoodsIssueDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid PGI Date",
      });
    }
  }

  // duplicate exact delivery check
  const existing = await db.Delivery.findOne({
    where: {
      salesOrderId,
      isDeleted: false,
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "Delivery already exists for this Sales Order",
    });
  }

  const delivery = await db.Delivery.create(req.body);

  res.status(201).json(delivery);
});

// PUT /api/deliveries/:id
exports.updateDelivery = asyncHandler(async (req, res) => {
  req.body.shippingPoint = (req.body.shippingPoint || "").trim().toUpperCase();

  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();

  req.body.plant = (req.body.plant || "").trim().toUpperCase();

  req.body.deliveryGroup = (req.body.deliveryGroup || "").trim().toUpperCase();
  const delivery = await db.Delivery.findByPk(req.params.id);

  if (!delivery) {
    return res.status(404).json({
      message: "Delivery not found",
    });
  }

  const {
    shippingPoint,
    salesOrderId,
    warehouse,
    plant,
    deliveryGroup,
    postGoodsIssueDate,
  } = req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  // Mandatory fields
  if (!shippingPoint || !shippingPoint.trim()) {
    return res.status(400).json({
      message: "Shipping Point is required",
    });
  }

  if (!alphaNumRegex.test(shippingPoint)) {
    return res.status(400).json({
      message: "Shipping Point contains invalid characters",
    });
  }

  if (!salesOrderId) {
    return res.status(400).json({
      message: "Sales Order is required",
    });
  }

  if (!plant || !plant.trim()) {
    return res.status(400).json({
      message: "Plant is required",
    });
  }

  if (deliveryGroup && !alphaNumRegex.test(deliveryGroup)) {
    return res.status(400).json({
      message: "Invalid Delivery Group",
    });
  }
  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({
      message: "Plant contains invalid characters",
    });
  }

  // Special character validation
  if (!warehouse || !warehouse.trim()) {
    return res.status(400).json({
      message: "Warehouse is required",
    });
  }

  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({
      message: "Warehouse contains invalid characters",
    });
  }

  // Date validation
  if (postGoodsIssueDate) {
    const date = new Date(postGoodsIssueDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid PGI Date",
      });
    }
  }

  // Duplicate check excluding current record
  const existing = await db.Delivery.findOne({
    where: {
      salesOrderId,
      isDeleted: false,
      id: {
        [db.Sequelize.Op.ne]: req.params.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "Delivery already exists for this Sales Order",
    });
  }

  await delivery.update(req.body);

  res.json(delivery);
});

// DELETE /api/deliveries/:id
exports.softDeleteDelivery = asyncHandler(async (req, res) => {
  const delivery = await db.Delivery.findByPk(req.params.id);
  if (!delivery) {
    res.status(404).json({ message: "Delivery not found" });
    return;
  }
  await delivery.update({ isDeleted: true });
  res.json({ message: "Delivery moved to recycle bin" });
});

// PUT /api/deliveries/:id/restore
exports.restoreDelivery = asyncHandler(async (req, res) => {
  const delivery = await db.Delivery.findByPk(req.params.id);
  if (!delivery) {
    res.status(404).json({ message: "Delivery not found" });
    return;
  }
  await delivery.update({ isDeleted: false });
  res.json(delivery);
});
