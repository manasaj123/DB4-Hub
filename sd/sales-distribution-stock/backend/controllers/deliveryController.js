// backend/controllers/deliveryController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const determineShipping = require("../helpers/shippingDetermination");
const determineWarehouse = require("../helpers/warehouseDetermination");
const reserveStock = require("../helpers/reserveStock");

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
  // 1. Normalise fields
  req.body.shippingPoint = (req.body.shippingPoint || "").trim().toUpperCase();
  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();
  req.body.plant = (req.body.plant || "").trim().toUpperCase();
  req.body.deliveryGroup = (req.body.deliveryGroup || "").trim().toUpperCase();

  // 2. Fetch the sales order (we'll need it for itemsJson and the sales area)
  const { salesOrderId } = req.body;
  const order = await db.SalesOrder.findByPk(salesOrderId);
  if (!order) {
    return res.status(400).json({ message: "Sales order not found" });
  }

  // 3. Auto‑determine shipping point & plant from the material's delivering plant
  let deliveringPlant = null;
  if (order.itemsJson) {
    try {
      const items = JSON.parse(order.itemsJson);
      if (items.length > 0) {
        const firstMaterialId = items[0].materialId;
        const salesView = await db.SalesView.findOne({
          where: {
            materialId: firstMaterialId,
            salesOrg: order.salesOrg,
            distributionChannel: order.distributionChannel,
            division: order.division,
            isDeleted: false,
          },
        });
        if (salesView) {
          deliveringPlant = salesView.deliveringPlant;
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  if (deliveringPlant) {
    const shippingInfo = await determineShipping(deliveringPlant);
    if (shippingInfo) {
      req.body.shippingPoint = shippingInfo.shippingPoint;
      req.body.plant = deliveringPlant; // set plant to the delivering plant
      req.body.route = shippingInfo.routeCode; // ← add this
    }
  }

  // 4. Auto‑determine warehouse from stock (if not provided)
  if (!req.body.warehouse || req.body.warehouse.trim() === "") {
    // Use the first material from the order items
    let materialId = null;
    try {
      const items = JSON.parse(order.itemsJson);
      if (items.length > 0) {
        materialId = items[0].materialId;
      }
    } catch {
      /* ignore */
    }

    if (materialId && req.body.plant) {
      const wh = await determineWarehouse(materialId, req.body.plant);
      if (wh) {
        req.body.warehouse = wh;
      }
    }
  }

  // 4. Destructure (after possible overrides)
  const { shippingPoint, warehouse, plant, deliveryGroup, postGoodsIssueDate } =
    req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  // 5. Validations
  if (!shippingPoint || !shippingPoint.trim()) {
    return res.status(400).json({ message: "Shipping Point is required" });
  }
  if (!alphaNumRegex.test(shippingPoint)) {
    return res
      .status(400)
      .json({ message: "Shipping Point contains invalid characters" });
  }
  if (!salesOrderId) {
    return res.status(400).json({ message: "Sales Order is required" });
  }
  if (!warehouse || !warehouse.trim()) {
    return res.status(400).json({ message: "Warehouse is required" });
  }
  if (!alphaNumRegex.test(warehouse)) {
    return res
      .status(400)
      .json({ message: "Warehouse contains invalid characters" });
  }
  if (!plant || !plant.trim()) {
    return res.status(400).json({ message: "Plant is required" });
  }
  if (!alphaNumRegex.test(plant)) {
    return res
      .status(400)
      .json({ message: "Plant contains invalid characters" });
  }
  if (deliveryGroup && !alphaNumRegex.test(deliveryGroup)) {
    return res.status(400).json({ message: "Invalid Delivery Group" });
  }
  if (postGoodsIssueDate) {
    const date = new Date(postGoodsIssueDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid PGI Date" });
    }
  }

  // 6. Duplicate delivery check
  const existing = await db.Delivery.findOne({
    where: { salesOrderId, isDeleted: false },
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Delivery already exists for this Sales Order" });
  }

  // 7. Create delivery (itemsJson copied from the order)
  const delivery = await db.Delivery.create({
    ...req.body,
    itemsJson: order.itemsJson,
  });

  // ---- Reserve stock for each item in the delivery ----
  try {
    const items = JSON.parse(delivery.itemsJson);
    for (const item of items) {
      await reserveStock(
        item.materialId,
        delivery.plant,
        delivery.warehouse,
        item.quantity,
      );
    }
  } catch (reserveErr) {
    // If reservation fails, we could delete the delivery to roll back,
    // but for now we just log the error and continue (the delivery is still created).
    console.error("Stock reservation failed:", reserveErr.message);
    // Optionally: await delivery.destroy(); return res.status(400).json(...);
  }
  // ------------------------------------------------------------

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
  // Ignore any itemsJson sent during update – it stays as originally copied
  delete req.body.itemsJson;

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
