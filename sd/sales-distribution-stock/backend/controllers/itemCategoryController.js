// // backend/controllers/itemCategoriesController.js
// const asyncHandler = require('../middleware/asyncHandler');
// const db = require('../models');

// // GET /api/item-categories-config
// exports.getItemCategoriesConfigs = asyncHandler(async (req, res) => {
//   const list = await db.ItemCategoriesConfig.findAll({
//     where: { isDeleted: false },
//   });
//   res.json(list);
// });

// // GET /api/item-categories-config/deleted
// exports.getDeletedItemCategoriesConfigs = asyncHandler(async (req, res) => {
//   const list = await db.ItemCategoriesConfig.findAll({
//     where: { isDeleted: true },
//   });
//   res.json(list);
// });

// // GET /api/item-categories-config/:id
// exports.getItemCategoriesConfigById = asyncHandler(async (req, res) => {
//   const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
//   if (!cfg) {
//     res.status(404).json({ message: 'Item categories config not found' });
//     return;
//   }
//   res.json(cfg);
// });

// // POST /api/item-categories-config
// exports.createItemCategoriesConfig = asyncHandler(async (req, res) => {
//   const cfg = await db.ItemCategoriesConfig.create(req.body);
//   res.status(201).json(cfg);
// });

// // PUT /api/item-categories-config/:id
// exports.updateItemCategoriesConfig = asyncHandler(async (req, res) => {
//   const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
//   if (!cfg) {
//     res.status(404).json({ message: 'Item categories config not found' });
//     return;
//   }
//   await cfg.update(req.body);
//   res.json(cfg);
// });

// // DELETE /api/item-categories-config/:id  (soft delete)
// exports.softDeleteItemCategoriesConfig = asyncHandler(async (req, res) => {
//   const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
//   if (!cfg) {
//     res.status(404).json({ message: 'Item categories config not found' });
//     return;
//   }
//   await cfg.update({ isDeleted: true });
//   res.json({ message: 'Item categories config moved to recycle bin' });
// });

// // PUT /api/item-categories-config/:id/restore
// exports.restoreItemCategoriesConfig = asyncHandler(async (req, res) => {
//   const cfg = await db.ItemCategoriesConfig.findByPk(req.params.id);
//   if (!cfg) {
//     res.status(404).json({ message: 'Item categories config not found' });
//     return;
//   }
//   await cfg.update({ isDeleted: false });
//   res.json(cfg);
// });