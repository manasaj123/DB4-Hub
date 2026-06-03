const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

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
  // Clean up fields
  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();
  req.body.plant = (req.body.plant || "").trim().toUpperCase();
  delete req.body.postGoodsIssue; // never set from this endpoint

  const { deliveryId, warehouse, plant, pickingStatus, packingStatus } =
    req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  // Required fields
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery is required" });
  }
  if (!warehouse?.trim()) {
    return res.status(400).json({ message: "Warehouse is required" });
  }
  if (!plant?.trim()) {
    return res.status(400).json({ message: "Plant is required" });
  }

  // Character validation
  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({ message: "Invalid Warehouse" });
  }
  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({ message: "Invalid Plant" });
  }
  if (warehouse.length > 10) {
    return res
      .status(400)
      .json({ message: "Warehouse cannot exceed 10 characters" });
  }
  if (plant.length > 10) {
    return res
      .status(400)
      .json({ message: "Plant cannot exceed 10 characters" });
  }

  // ✅ Correct business rule: Picking must be done before packing
  if (packingStatus === "PACKED" && pickingStatus !== "PICKED") {
    return res.status(400).json({
      message: "Picking must be completed before packing",
    });
  }

  // Duplicate delivery check
  const existing = await db.Picking.findOne({
    where: { deliveryId, isDeleted: false },
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Picking already exists for this delivery" });
  }

  // Create picking
  const rec = await db.Picking.create(req.body);

  // Update delivery status
  if (rec.packingStatus === "PACKED" && rec.pickingStatus === "PICKED") {
    await db.Delivery.update(
      { status: "PACKED" },
      { where: { id: rec.deliveryId } },
    );
  } else if (rec.pickingStatus === "PICKED") {
    await db.Delivery.update(
      { status: "PICKED" },
      { where: { id: rec.deliveryId } },
    );
  }

  res.status(201).json(rec);
});

// PUT /api/pickings/:id
exports.updatePicking = asyncHandler(async (req, res) => {
  req.body.warehouse = (req.body.warehouse || "").trim().toUpperCase();
  req.body.plant = (req.body.plant || "").trim().toUpperCase();
  delete req.body.postGoodsIssue; // never set from this endpoint

  const rec = await db.Picking.findByPk(req.params.id);
  if (!rec) {
    return res.status(404).json({ message: "Picking record not found" });
  }

  const { deliveryId, warehouse, plant, pickingStatus, packingStatus } =
    req.body;

  const alphaNumRegex = /^[A-Za-z0-9\s-]+$/;

  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery is required" });
  }
  if (!warehouse?.trim()) {
    return res.status(400).json({ message: "Warehouse is required" });
  }
  if (!plant?.trim()) {
    return res.status(400).json({ message: "Plant is required" });
  }
  if (!alphaNumRegex.test(warehouse)) {
    return res.status(400).json({ message: "Invalid Warehouse" });
  }
  if (!alphaNumRegex.test(plant)) {
    return res.status(400).json({ message: "Invalid Plant" });
  }
  if (warehouse.length > 10) {
    return res
      .status(400)
      .json({ message: "Warehouse cannot exceed 10 characters" });
  }
  if (plant.length > 10) {
    return res
      .status(400)
      .json({ message: "Plant cannot exceed 10 characters" });
  }

  // ✅ Correct business rule
  if (packingStatus === "PACKED" && pickingStatus !== "PICKED") {
    return res.status(400).json({
      message: "Picking must be completed before packing",
    });
  }

  // Duplicate check (exclude current)
  const existing = await db.Picking.findOne({
    where: {
      deliveryId,
      isDeleted: false,
      id: { [Op.ne]: req.params.id },
    },
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Picking already exists for this delivery" });
  }

  await rec.update(req.body);

  // Update delivery status
  if (rec.packingStatus === "PACKED" && rec.pickingStatus === "PICKED") {
    await db.Delivery.update(
      { status: "PACKED" },
      { where: { id: rec.deliveryId } },
    );
  } else if (rec.pickingStatus === "PICKED") {
    await db.Delivery.update(
      { status: "PICKED" },
      { where: { id: rec.deliveryId } },
    );
  }

  // If both picking and packing are back to OPEN, reset delivery to OPEN
  if (rec.packingStatus === "OPEN" && rec.pickingStatus === "OPEN") {
    await db.Delivery.update(
      { status: "OPEN" },
      { where: { id: rec.deliveryId } },
    );
  }

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
