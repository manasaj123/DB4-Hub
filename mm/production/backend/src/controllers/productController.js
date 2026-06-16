// controllers/productController.js

const db = require("../config/db");

// GET /api/products - List all or filter by type
exports.list = async (req, res) => {
  try {
    const { type } = req.query;

    let query = "SELECT * FROM products";
    const params = [];

    if (type) {
      query += " WHERE type = ?";
      params.push(type);
    }

    query += " ORDER BY type, code";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /products Error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

// POST /api/products - Create product
exports.create = async (req, res) => {
  try {
    const { code, name, type } = req.body;

    // Validate Code - only alphanumeric (letters and numbers), no special characters
    const codeRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!codeRegex.test(code)) {
      return res.status(400).json({
        error:
          "Code must contain only letters and numbers (no special characters)",
      });
    }

    // Validate Name - only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        error: "Name must contain only letters and spaces",
      });
    }

    // Check for duplicate code
    const [existing] = await db.query(
      "SELECT id FROM products WHERE code = ?",
      [code],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Product with this code already exists" });
    }

    const [result] = await db.query(
      "INSERT INTO products (code, name, type) VALUES (?, ?, ?)",
      [code, name, type || "finished"],
    );

    res.status(201).json({
      id: result.insertId,
      code,
      name,
      type: type || "finished",
    });
  } catch (err) {
    console.error("POST /products Error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

// PUT /api/products/:id - Update product
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, type } = req.body;

    // Validate Code
    const codeRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!codeRegex.test(code)) {
      return res.status(400).json({
        error:
          "Code must contain only letters and numbers (no special characters)",
      });
    }

    // Validate Name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        error: "Name must contain only letters and spaces",
      });
    }

    // Check if product exists
    const [product] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for duplicate code (excluding current product)
    const [duplicate] = await db.query(
      "SELECT id FROM products WHERE code = ? AND id != ?",
      [code, id],
    );
    if (duplicate.length > 0) {
      return res
        .status(400)
        .json({ error: "Product with this code already exists" });
    }

    await db.query(
      "UPDATE products SET code = ?, name = ?, type = ? WHERE id = ?",
      [code, name, type || "finished", id],
    );

    const [updated] = await db.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    res.json(updated[0]);
  } catch (err) {
    console.error("PUT /products Error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

// DELETE /api/products/:id - Delete product with all related records
exports.delete = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    // Check product exists
    const [product] = await conn.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (product.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete all child records first (foreign key dependencies)
    await conn.query("DELETE FROM demand_forecast WHERE product_id = ?", [id]);
    await conn.query("DELETE FROM production_plan WHERE product_id = ?", [id]);
    await conn.query("DELETE FROM work_orders WHERE product_id = ?", [id]);
    await conn.query("DELETE FROM process_batches WHERE product_id = ?", [id]);
    await conn.query(
      "DELETE FROM bom WHERE product_id = ? OR material_id = ?",
      [id, id],
    );
    await conn.query(
      "DELETE FROM mrp_requirements WHERE product_id = ? OR material_id = ?",
      [id, id],
    );

    // Delete the product
    await conn.query("DELETE FROM products WHERE id = ?", [id]);

    await conn.commit();

    res.json({
      message: "Product deleted successfully",
      deletedProduct: product[0],
    });
  } catch (err) {
    await conn.rollback();
    console.error("DELETE /products Error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  } finally {
    conn.release();
  }
};
