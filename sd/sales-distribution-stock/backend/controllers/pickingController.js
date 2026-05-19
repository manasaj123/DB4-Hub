// backend/controllers/pickingController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/pickings
exports.getPickings = asyncHandler(async (req, res) => {
  const list = await db.Picking.findAll({
    where: { isDeleted: false },
    include: [{ model: db.Delivery }],
  });
  res.json(list);
});

// GET /api/pickings/deleted
exports.getDeletedPickings = asyncHandler(async (req, res) => {
  const list = await db.Picking.findAll({
    where: { isDeleted: true },
    include: [{ model: db.Delivery }],
  });
  res.json(list);
});

// GET /api/pickings/:id
exports.getPickingById = asyncHandler(async (req, res) => {
  const rec = await db.Picking.findByPk(req.params.id, {
    include: [{ model: db.Delivery }],
  });
  if (!rec) {
    res.status(404).json({ message: "Picking record not found" });
    return;
  }
  res.json(rec);
});

// POST /api/pickings
exports.createPicking = asyncHandler(async (req, res) => {
  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();

  req.body.plant = (req.body.plant || "").trim().toUpperCase();
  const { deliveryId, warehouse, plant, pickingStatus, packingStatus } =
    req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  // 1. Required fields
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery is required" });
  }

  if (!warehouse?.trim()) {
    return res.status(400).json({ message: "Warehouse is required" });
  }

  if (!plant || !plant.trim()) {
    return res.status(400).json({
      message: "Plant is required",
    });
  }

  // 2. Special character check
  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({ message: "Invalid Warehouse" });
  }

  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({ message: "Invalid Plant" });
  }

  if (warehouse && warehouse.length > 10) {
    return res.status(400).json({
      message: "Warehouse cannot exceed 10 characters",
    });
  }

  if (plant && plant.length > 10) {
    return res.status(400).json({
      message: "Plant cannot exceed 10 characters",
    });
  }

  // 3. Business rule: Packing before Picking
  if (pickingStatus === "PICKED" && packingStatus !== "PACKED") {
    return res.status(400).json({
      // message: "Cannot PICKED before PACKED is completed",
      message: "Packing must be completed before Picking",
    });
  }

  // 4. Duplicate delivery check
  const existing = await db.Picking.findOne({
    where: {
      deliveryId,
      isDeleted: false,
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "Picking already exists for this delivery",
    });
  }

  // 5. Create record
  const rec = await db.Picking.create(req.body);
  res.status(201).json(rec);
});

// PUT /api/pickings/:id
exports.updatePicking = asyncHandler(async (req, res) => {
  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();

  req.body.plant = (req.body.plant || "").trim().toUpperCase();
  const rec = await db.Picking.findByPk(req.params.id);
  if (!rec) {
    return res.status(404).json({ message: "Picking record not found" });
  }

  const { deliveryId, warehouse, plant, pickingStatus, packingStatus } =
    req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  // Required fields
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery is required" });
  }

  if (!warehouse || !warehouse.trim()) {
    return res.status(400).json({
      message: "Warehouse is required",
    });
  }

  if (!plant?.trim()) {
    return res.status(400).json({ message: "Plant is required" });
  }

  // Special char check
  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({ message: "Invalid Warehouse" });
  }

  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({ message: "Invalid Plant" });
  }

  if (warehouse && warehouse.length > 10) {
    return res.status(400).json({
      message: "Warehouse cannot exceed 10 characters",
    });
  }

  if (plant && plant.length > 10) {
    return res.status(400).json({
      message: "Plant cannot exceed 10 characters",
    });
  }

  // Business rule
  if (pickingStatus === "PICKED" && packingStatus !== "PACKED") {
    return res.status(400).json({
      message: "Packing must be completed before Picking",
    });
  }

  // Duplicate check (exclude current record)
  const existing = await db.Picking.findOne({
    where: {
      deliveryId,
      isDeleted: false,
      id: {
        [db.Sequelize.Op.ne]: req.params.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({
      message: "Picking already exists for this delivery",
    });
  }

  await rec.update(req.body);
  res.json(rec);
});
// DELETE /api/pickings/:id
exports.softDeletePicking = asyncHandler(async (req, res) => {
  const rec = await db.Picking.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Picking record not found" });
    return;
  }
  await rec.update({ isDeleted: true });
  res.json({ message: "Picking record moved to recycle bin" });
});

// PUT /api/pickings/:id/restore
exports.restorePicking = asyncHandler(async (req, res) => {
  const rec = await db.Picking.findByPk(req.params.id);
  if (!rec) {
    res.status(404).json({ message: "Picking record not found" });
    return;
  }
  await rec.update({ isDeleted: false });
  res.json(rec);
});
