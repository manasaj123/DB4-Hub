const bomModel = require('../models/bomModel');

const bomController = {
  // GET /api/bom - List all BOM entries
  async list(req, res) {
    try {
      const bomList = await bomModel.findAll();
      res.json(bomList);
    } catch (err) {
      console.error('BOM List Error:', err);
      res.status(500).json({ error: 'Failed to fetch BOM entries' });
    }
  },

  // GET /api/bom/:id - Get single BOM entry
  async getById(req, res) {
    try {
      const { id } = req.params;
      const allBom = await bomModel.findAll();
      const bom = allBom.find(b => b.id === parseInt(id));
      
      if (!bom) {
        return res.status(404).json({ error: 'BOM entry not found' });
      }
      
      res.json(bom);
    } catch (err) {
      console.error('BOM Get Error:', err);
      res.status(500).json({ error: 'Failed to fetch BOM entry' });
    }
  },

  // GET /api/bom/product/:productId - Get BOM for a specific product
  async getByProduct(req, res) {
    try {
      const { productId } = req.params;
      const bomItems = await bomModel.findByProductId(productId);
      res.json(bomItems);
    } catch (err) {
      console.error('BOM By Product Error:', err);
      res.status(500).json({ error: 'Failed to fetch BOM for product' });
    }
  },

  // POST /api/bom - Create new BOM entry
  async create(req, res) {
    try {
      const { product_id, material_id, qty_per_unit, uom } = req.body;

      // Validation
      if (!product_id || !material_id) {
        return res.status(400).json({ error: 'Product and Material are required' });
      }

      if (!qty_per_unit || parseFloat(qty_per_unit) <= 0) {
        return res.status(400).json({ error: 'Quantity per unit must be greater than 0' });
      }

      if (product_id === material_id) {
        return res.status(400).json({ error: 'Product and Material cannot be the same' });
      }

      // Check for duplicate
      const exists = await bomModel.exists(product_id, material_id);
      if (exists) {
        return res.status(400).json({ error: 'This BOM entry already exists' });
      }

      const result = await bomModel.create({
        product_id,
        material_id,
        qty_per_unit: parseFloat(qty_per_unit),
        uom: uom || 'KG'
      });

      res.status(201).json({
        message: 'BOM entry created successfully',
        data: result
      });
    } catch (err) {
      console.error('BOM Create Error:', err);
      res.status(500).json({ error: 'Failed to create BOM entry' });
    }
  },

  // PUT /api/bom/:id - Update BOM entry
  async update(req, res) {
    try {
      const { id } = req.params;
      const { product_id, material_id, qty_per_unit, uom } = req.body;

      // Validation
      if (!qty_per_unit || parseFloat(qty_per_unit) <= 0) {
        return res.status(400).json({ error: 'Quantity per unit must be greater than 0' });
      }

      await bomModel.update(id, {
        product_id,
        material_id,
        qty_per_unit: parseFloat(qty_per_unit),
        uom: uom || 'KG'
      });

      res.json({ message: 'BOM entry updated successfully' });
    } catch (err) {
      console.error('BOM Update Error:', err);
      res.status(500).json({ error: 'Failed to update BOM entry' });
    }
  },

  // DELETE /api/bom/:id - Delete BOM entry
  async delete(req, res) {
    try {
      const { id } = req.params;
      await bomModel.delete(id);
      res.json({ message: 'BOM entry deleted successfully' });
    } catch (err) {
      console.error('BOM Delete Error:', err);
      res.status(500).json({ error: 'Failed to delete BOM entry' });
    }
  },

  // POST /api/bom/bulk - Bulk create BOM entries
  async bulkCreate(req, res) {
    try {
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: 'Entries array is required' });
      }

      const results = await bomModel.bulkCreate(entries);

      res.status(201).json({
        message: `${results.length} BOM entries created`,
        data: results
      });
    } catch (err) {
      console.error('BOM Bulk Create Error:', err);
      res.status(500).json({ error: 'Failed to create BOM entries' });
    }
  },

  // GET /api/bom/stats/products-with-bom - Products that have BOM
  async getProductsWithBOM(req, res) {
    try {
      const products = await bomModel.getProductsWithBOM();
      res.json(products);
    } catch (err) {
      console.error('BOM Stats Error:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },

  // GET /api/bom/stats/materials-used - Materials used in BOM
  async getMaterialsUsed(req, res) {
    try {
      const materials = await bomModel.getMaterialsInBOM();
      res.json(materials);
    } catch (err) {
      console.error('BOM Materials Error:', err);
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  }
};

module.exports = bomController;