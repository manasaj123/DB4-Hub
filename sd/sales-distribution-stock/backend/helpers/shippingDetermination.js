const db = require("../models");

/**
 * Find the shipping point (and default route) assigned to a given plant.
 * @param {string} plant - e.g., "PL01"
 * @returns {Promise<{shippingPoint: string, routeCode: string|null}|null>}
 */
async function determineShipping(plant) {
  if (!plant) return null;

  const shipping = await db.Shipping.findOne({
    where: { plant, isDeleted: false },
  });

  if (!shipping) return null;

  return {
    shippingPoint: shipping.shippingPoint,
    routeCode: shipping.defaultRoute || null,
  };
}

module.exports = determineShipping;