import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ============================================
// Receive material from integration hub
// ============================================
router.post("/material", (req, res) => {
  const { name, unit, shelf_life } = req.body;

  const sql =
    "INSERT INTO materials (name, unit, shelf_life, qty) VALUES (?, ?, ?, 0)";

  db.query(sql, [name, unit, shelf_life || 0], (err, result) => {
    if (err) {
      console.error("❌ Integration error:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`   ✅ Created material with ID: ${result.insertId}`);
    res.json({ id: result.insertId, success: true });
  });
});

// ============================================
// Receive vendor/farmer from integration hub
// ============================================
router.post("/vendor", (req, res) => {
  const { name, address, contact, bank_account, type } = req.body;

  console.log(`🏢 MM Core receiving ${type || "FARMER"}: ${name}`);

  const farmerCode = `FARM-${Date.now()}`;

  const sql = `
    INSERT INTO farmers (name, address, contact, farmer_code, bank_account, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, address, contact, farmerCode, bank_account, type || "FARMER"],
    (err, result) => {
      if (err) {
        console.error("Integration vendor error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, success: true });
    },
  );
});

// Receive customer from integration hub
router.post("/customer", (req, res) => {
  const { name, address, contact, email, gst_number, customer_code } = req.body;

  console.log(`👤 MM Core receiving customer: ${name}`);

  const sql = `
    INSERT INTO customers (name, address, contact, customer_code, email, gst_number, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `;

  db.query(
    sql,
    [name, address, contact, customer_code, email, gst_number],
    (err, result) => {
      if (err) {
        console.error("Integration customer error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, success: true });
    },
  );
});

//  Update stock from integration hub
router.post("/stock", (req, res) => {
  const { material_id, quantity } = req.body;
  db.query(
    "UPDATE materials SET qty = ? WHERE id = ?",
    [quantity, material_id],
    (err) => {
      if (err) {
        console.error("Integration stock error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    },
  );
});

export default router;
