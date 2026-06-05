const db = require('../config/db');

const bomModel = {
  // Get all BOM entries with product and material details
  async findAll() {
    const [rows] = await db.query(`
      SELECT 
        b.*,
        p.code as product_code, 
        p.name as product_name,
        p.type as product_type,
        m.code as material_code, 
        m.name as material_name,
        m.type as material_type
      FROM bom b
      JOIN products p ON b.product_id = p.id
      JOIN products m ON b.material_id = m.id
      ORDER BY p.code, m.code
    `);
    return rows;
  },

  // Get BOM by product ID
  async findByProductId(productId) {
    const [rows] = await db.query(
      `SELECT b.*, m.code as material_code, m.name as material_name 
       FROM bom b 
       JOIN products m ON b.material_id = m.id 
       WHERE b.product_id = ?`,
      [productId]
    );
    return rows;
  },

  // Get BOM by product ID and grade_pack_id (optional)
  async findByProductAndGrade(productId, gradePackId = null) {
    if (gradePackId) {
      const [rows] = await db.query(
        'SELECT * FROM bom WHERE product_id = ? AND grade_pack_id = ?',
        [productId, gradePackId]
      );
      return rows;
    }
    const [rows] = await db.query(
      'SELECT * FROM bom WHERE product_id = ?',
      [productId]
    );
    return rows;
  },

  // Check if BOM entry exists
  async exists(productId, materialId) {
    const [rows] = await db.query(
      'SELECT id FROM bom WHERE product_id = ? AND material_id = ?',
      [productId, materialId]
    );
    return rows.length > 0;
  },

  // Create BOM entry
  async create(data) {
    const { product_id, material_id, qty_per_unit, uom } = data;
    const [result] = await db.query(
      'INSERT INTO bom (product_id, material_id, qty_per_unit, uom) VALUES (?, ?, ?, ?)',
      [product_id, material_id, qty_per_unit, uom || 'KG']
    );
    return { id: result.insertId, ...data };
  },

  // Update BOM entry
  async update(id, data) {
    const { product_id, material_id, qty_per_unit, uom } = data;
    await db.query(
      'UPDATE bom SET product_id = ?, material_id = ?, qty_per_unit = ?, uom = ? WHERE id = ?',
      [product_id, material_id, qty_per_unit, uom, id]
    );
    return { id, ...data };
  },

  // Delete BOM entry
  async delete(id) {
    await db.query('DELETE FROM bom WHERE id = ?', [id]);
    return { id };
  },

  // Delete all BOM for a product
  async deleteByProductId(productId) {
    const [result] = await db.query('DELETE FROM bom WHERE product_id = ?', [productId]);
    return result.affectedRows;
  },

  // Bulk insert BOM entries
  async bulkCreate(entries) {
    const results = [];
    for (const entry of entries) {
      const result = await this.create(entry);
      results.push(result);
    }
    return results;
  },

  // Get products that have BOM defined
  async getProductsWithBOM() {
    const [rows] = await db.query(`
      SELECT DISTINCT p.id, p.code, p.name, p.type
      FROM bom b
      JOIN products p ON b.product_id = p.id
      ORDER BY p.code
    `);
    return rows;
  },

  // Get materials used in BOM
  async getMaterialsInBOM() {
    const [rows] = await db.query(`
      SELECT DISTINCT m.id, m.code, m.name, m.type,
             COUNT(DISTINCT b.product_id) as used_in_products
      FROM bom b
      JOIN products m ON b.material_id = m.id
      GROUP BY m.id, m.code, m.name, m.type
      ORDER BY m.code
    `);
    return rows;
  }
};

module.exports = bomModel;