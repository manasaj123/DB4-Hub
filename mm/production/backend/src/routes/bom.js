const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');

// GET /api/bom - List all BOM entries
router.get('/', bomController.list);

// GET /api/bom/stats/products-with-bom - Products with BOM
router.get('/stats/products-with-bom', bomController.getProductsWithBOM);

// GET /api/bom/stats/materials-used - Materials used in BOM
router.get('/stats/materials-used', bomController.getMaterialsUsed);

// GET /api/bom/product/:productId - BOM for specific product
router.get('/product/:productId', bomController.getByProduct);

// GET /api/bom/:id - Single BOM entry
router.get('/:id', bomController.getById);

// POST /api/bom - Create BOM entry
router.post('/', bomController.create);

// POST /api/bom/bulk - Bulk create
router.post('/bulk', bomController.bulkCreate);

// PUT /api/bom/:id - Update BOM entry
router.put('/:id', bomController.update);

// DELETE /api/bom/:id - Delete BOM entry
router.delete('/:id', bomController.delete);

module.exports = router;