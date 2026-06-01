// backend/controllers/materialSalesController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/material-sales
exports.getSalesViews = asyncHandler(async (req, res) => {
  const list = await db.SalesView.findAll({
    where: { isDeleted: false },
    include: [{ model: db.Material }],
  });
  res.json(list);
});

// GET /api/material-sales/deleted
exports.getDeletedSalesViews = asyncHandler(async (req, res) => {
  const list = await db.SalesView.findAll({
    where: { isDeleted: true },
    include: [{ model: db.Material }],
  });
  res.json(list);
});

// GET /api/material-sales/:id
exports.getSalesViewById = asyncHandler(async (req, res) => {
  const view = await db.SalesView.findByPk(req.params.id, {
    include: [{ model: db.Material }],
  });
  if (!view) {
    res.status(404).json({ message: "Sales view not found" });
    return;
  }
  res.json(view);
});

exports.createSalesView = asyncHandler(async (req, res) => {
  let {
    materialId,
    salesOrg,
    distributionChannel,
    division,
    deliveringPlant,
    itemCategoryGroup,
    loadingGroup,
    accountAssignmentGroup,
    priceGroup,
    priceList,
    availabilityCheck,
    transportationGroup,
  } = req.body;

  // trim only if exists
  salesOrg = salesOrg?.trim();
  distributionChannel = distributionChannel?.trim();
  division = division?.trim();
  deliveringPlant = deliveringPlant?.trim();
  itemCategoryGroup = itemCategoryGroup?.trim();
  loadingGroup = loadingGroup?.trim();
  accountAssignmentGroup = accountAssignmentGroup?.trim();
  priceGroup = priceGroup?.trim();
  priceList = priceList?.trim();
  availabilityCheck = availabilityCheck?.trim();
  transportationGroup = transportationGroup?.trim();

  // ✅ REQUIRED FIELDS ONLY
  if (!materialId) {
    return res.status(400).json({ message: "Material is required" });
  }

  if (!salesOrg) {
    return res.status(400).json({ message: "Sales Org is required" });
  }

  if (!distributionChannel) {
    return res
      .status(400)
      .json({ message: "Distribution Channel is required" });
  }

  if (!deliveringPlant) {
    return res.status(400).json({ message: "Delivering Plant is required" });
  }

  // duplicate check
  const existingView = await db.SalesView.findOne({
    where: { materialId, isDeleted: false },
  });

  if (existingView) {
    return res.status(400).json({
      message: "Sales View already exists for this material",
    });
  }

  // valid distribution channel
  const validDistributionChannels = ["01", "02"];
  if (!validDistributionChannels.includes(distributionChannel)) {
    return res.status(400).json({
      message: "Distribution Channel must be 01 or 02",
    });
  }

  // optional item category validation (ONLY IF PRESENT)
  // const validItemCategories = ["001", "002"];
  // if (itemCategoryGroup && !validItemCategories.includes(itemCategoryGroup)) {
  //   return res.status(400).json({
  //     message: "Item Category Group must be 001 or 002",
  //   });
  // }
  if (itemCategoryGroup && !/^[A-Za-z0-9]+$/.test(itemCategoryGroup)) {
    return res.status(400).json({ message: "Invalid Item Category Group" });
  }

  // regex
  const alphaNumRegex = /^[A-Za-z0-9]+$/;

  if (!alphaNumRegex.test(salesOrg)) {
    return res.status(400).json({ message: "Invalid Sales Org" });
  }

  if (!alphaNumRegex.test(deliveringPlant)) {
    return res.status(400).json({ message: "Invalid Delivering Plant" });
  }

  if (division && !alphaNumRegex.test(division)) {
    return res.status(400).json({ message: "Invalid Division" });
  }

  if (loadingGroup && !alphaNumRegex.test(loadingGroup)) {
    return res.status(400).json({ message: "Invalid Loading Group" });
  }

  if (accountAssignmentGroup && !alphaNumRegex.test(accountAssignmentGroup)) {
    return res
      .status(400)
      .json({ message: "Invalid Account Assignment Group" });
  }

  if (priceGroup && !alphaNumRegex.test(priceGroup)) {
    return res.status(400).json({ message: "Invalid Price Group" });
  }

  if (priceList && !alphaNumRegex.test(priceList)) {
    return res.status(400).json({ message: "Invalid Price List" });
  }

  if (availabilityCheck && !alphaNumRegex.test(availabilityCheck)) {
    return res.status(400).json({ message: "Invalid Availability Check" });
  }

  if (transportationGroup && !alphaNumRegex.test(transportationGroup)) {
    return res.status(400).json({ message: "Invalid Transportation Group" });
  }

  const view = await db.SalesView.create({
    materialId,
    salesOrg,
    distributionChannel,
    division,
    deliveringPlant,
    itemCategoryGroup,
    loadingGroup,
    accountAssignmentGroup,
    priceGroup,
    priceList,
    availabilityCheck,
    transportationGroup,
  });

  res.status(201).json(view);
});

// PUT /api/material-sales/:id
exports.updateSalesView = asyncHandler(async (req, res) => {
  const view = await db.SalesView.findByPk(req.params.id);

  if (!view) {
    return res.status(404).json({ message: "Sales view not found" });
  }

  let {
    salesOrg,
    distributionChannel,
    division,
    deliveringPlant,
    itemCategoryGroup,
    loadingGroup,
    accountAssignmentGroup,
    priceGroup,
    priceList,
    availabilityCheck,
    transportationGroup,
  } = req.body;

  salesOrg = salesOrg?.trim();
  distributionChannel = distributionChannel?.trim();
  division = division?.trim();
  deliveringPlant = deliveringPlant?.trim();
  itemCategoryGroup = itemCategoryGroup?.trim();
  loadingGroup = loadingGroup?.trim();
  accountAssignmentGroup = accountAssignmentGroup?.trim();
  priceGroup = priceGroup?.trim();
  priceList = priceList?.trim();
  availabilityCheck = availabilityCheck?.trim();
  transportationGroup = transportationGroup?.trim();

  // REQUIRED ONLY
  if (!salesOrg || !distributionChannel || !deliveringPlant) {
    return res.status(400).json({
      message: "Sales Org, Distribution Channel, Delivering Plant are required",
    });
  }

  const validDistributionChannels = ["01", "02"];
  if (!validDistributionChannels.includes(distributionChannel)) {
    return res.status(400).json({
      message: "Distribution Channel must be 01 or 02",
    });
  }

  // const validItemCategories = ["001", "002"];
  // if (itemCategoryGroup && !validItemCategories.includes(itemCategoryGroup)) {
  //   return res.status(400).json({
  //     message: "Item Category Group must be 001 or 002",
  //   });
  // }

  if (itemCategoryGroup && !/^[A-Za-z0-9]+$/.test(itemCategoryGroup)) {
    return res.status(400).json({ message: "Invalid Item Category Group" });
  }
  const alphaNumRegex = /^[A-Za-z0-9]+$/;

  if (!alphaNumRegex.test(salesOrg)) {
    return res.status(400).json({ message: "Invalid Sales Org" });
  }

  if (!alphaNumRegex.test(deliveringPlant)) {
    return res.status(400).json({ message: "Invalid Delivering Plant" });
  }

  if (division && !alphaNumRegex.test(division)) {
    return res.status(400).json({ message: "Invalid Division" });
  }

  if (loadingGroup && !alphaNumRegex.test(loadingGroup)) {
    return res.status(400).json({ message: "Invalid Loading Group" });
  }

  if (accountAssignmentGroup && !alphaNumRegex.test(accountAssignmentGroup)) {
    return res
      .status(400)
      .json({ message: "Invalid Account Assignment Group" });
  }

  if (priceGroup && !alphaNumRegex.test(priceGroup)) {
    return res.status(400).json({ message: "Invalid Price Group" });
  }

  if (priceList && !alphaNumRegex.test(priceList)) {
    return res.status(400).json({ message: "Invalid Price List" });
  }

  if (availabilityCheck && !alphaNumRegex.test(availabilityCheck)) {
    return res.status(400).json({ message: "Invalid Availability Check" });
  }

  if (transportationGroup && !alphaNumRegex.test(transportationGroup)) {
    return res.status(400).json({ message: "Invalid Transportation Group" });
  }

  await view.update({
    salesOrg,
    distributionChannel,
    division,
    deliveringPlant,
    itemCategoryGroup,
    loadingGroup,
    accountAssignmentGroup,
    priceGroup,
    priceList,
    availabilityCheck,
    transportationGroup,
  });

  res.json(view);
});

// DELETE /api/material-sales/:id
exports.softDeleteSalesView = asyncHandler(async (req, res) => {
  const view = await db.SalesView.findByPk(req.params.id);
  if (!view) {
    res.status(404).json({ message: "Sales view not found" });
    return;
  }
  await view.update({ isDeleted: true });
  res.json({ message: "Sales view moved to recycle bin" });
});

// PUT /api/material-sales/:id/restore
exports.restoreSalesView = asyncHandler(async (req, res) => {
  const view = await db.SalesView.findByPk(req.params.id);
  if (!view) {
    res.status(404).json({ message: "Sales view not found" });
    return;
  }
  await view.update({ isDeleted: false });
  res.json(view);
});
