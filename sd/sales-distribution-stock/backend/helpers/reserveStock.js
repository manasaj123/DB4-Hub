const db = require("../models");

/**
 * Reserve stock for a given material, plant, warehouse, and quantity.
 * Only checks that enough stock is available (availableQty >= quantity).
 * Increases reservedQty, leaves availableQty unchanged.
 */
async function reserveStock(materialId, plant, warehouse, quantity) {
  if (!materialId || !plant || !warehouse || quantity <= 0) {
    throw new Error("Invalid reservation parameters");
  }

  const stock = await db.Stock.findOne({
    where: { materialId, plant, warehouse },
  });

  if (!stock) {
    throw new Error(`No stock record for material ${materialId} at ${plant}/${warehouse}`);
  }

  if (Number(stock.availableQty) < Number(quantity)) {
    throw new Error(
      `Insufficient stock to reserve. Available: ${stock.availableQty}, Requested: ${quantity}`
    );
  }

  // Increase reserved quantity
  stock.reservedQty = Number(stock.reservedQty) + Number(quantity);
  await stock.save();

  return stock;
}

module.exports = reserveStock;