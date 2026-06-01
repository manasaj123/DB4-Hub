const db = require("../models");

/**
 * Find a suitable warehouse for a given material and plant.
 * Returns the warehouse code (string) or null.
 */
async function determineWarehouse(materialId, plant) {
  if (!materialId || !plant) return null;

  const stock = await db.Stock.findOne({
    where: {
      materialId,
      plant,
      // We prefer a record with available quantity > 0
      // but we can also just pick any warehouse for that plant
    },
    order: [["availableQty", "DESC"]], // optional: prefer the one with most stock
    // If you want to ensure there is stock, add: availableQty: { [db.Sequelize.Op.gt]: 0 }
  });

  return stock ? stock.warehouse : null;
}

module.exports = determineWarehouse;