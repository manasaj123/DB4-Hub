const db = require("../models");

/**
 * Returns the default item category for a given sales doc type and material,
 * using the material's sales view for the sales area.
 */
async function determineItemCategory(
  salesDocumentType,
  materialId,
  salesOrg,
  distributionChannel,
  division
) {
  // 1. Find the material's sales view
  const salesView = await db.SalesView.findOne({
    where: {
      materialId,
      salesOrg,
      distributionChannel,
      division,
      isDeleted: false,
    },
  });
  if (!salesView) return null;

  const itemCategoryGroup = salesView.itemCategoryGroup;
  if (!itemCategoryGroup) return null;

  // 2. Find matching config
  const config = await db.ItemCategoriesConfig.findOne({
    where: {
      salesDocumentType,
      itemCategoryGroup,
      isDeleted: false,
    },
  });
  return config ? config.defaultItemCategory : null;
}

module.exports = determineItemCategory;