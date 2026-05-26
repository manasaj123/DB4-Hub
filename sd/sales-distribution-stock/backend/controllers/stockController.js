const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// POST /api/stock – add stock to a specific plant/warehouse/storage location
exports.addStock = asyncHandler(async (req, res) => {
  const { materialId, plant, warehouse, storageLocation, quantity } = req.body;

  if (!materialId || !plant || quantity == null) {
    return res.status(400).json({ message: "materialId, plant, quantity are required" });
  }

  const material = await db.Material.findByPk(materialId);
  if (!material) return res.status(404).json({ message: "Material not found" });

  // Upsert stock record
  const [stock, created] = await db.Stock.findOrCreate({
    where: {
      materialId,
      plant,
      warehouse: warehouse || null,
      storageLocation: storageLocation || null,
    },
    defaults: {
      availableQty: Number(quantity),
      reservedQty: 0,
    },
  });

  if (!created) {
    // already exists – add to existing quantity
    stock.availableQty = Number(stock.availableQty) + Number(quantity);
    await stock.save();
  }

  // (Optional) keep material.availableStock as a quick total for convenience
  const totalStock = await db.Stock.sum("availableQty", {
    where: { materialId },
  });
  material.availableStock = totalStock || 0;
  await material.save();

  res.status(201).json({ stock, material });
});

// GET /api/stock?materialId=1 – view all stock for a material (or all)
exports.getStock = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.materialId) where.materialId = req.query.materialId;

  const stockList = await db.Stock.findAll({
    where,
    include: [{ model: db.Material, attributes: ["materialCode", "description"] }],
  });

  res.json(stockList);
});