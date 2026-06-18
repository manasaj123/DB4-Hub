import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ============================================
// Receive material from integration hub
// ============================================
router.post("/material", (req, res) => {
  const { name, unit, shelf_life } = req.body;
  
  console.log(`📦 MM Core receiving material: ${name}`);
  console.log(`   Unit: ${unit}, Shelf Life: ${shelf_life || 0} days`);

  const sql = "INSERT INTO materials (name, unit, shelf_life, qty) VALUES (?, ?, ?, 0)";
  
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

  // Normalize type
  const normalizedType = (type && type.toUpperCase() === 'VENDOR') ? 'VENDOR' : 'FARMER';

  console.log(`🏢 MM Core receiving ${normalizedType}: ${name}`);
  console.log(`   Address: ${address || 'Not provided'}`);
  console.log(`   Contact: ${contact || 'Not provided'}`);
  console.log(`   Type: ${normalizedType}`);

  // Generate farmer_code
  const farmerCode = `FARM-${Date.now()}`;

  const sql = `
    INSERT INTO farmers (name, address, contact, farmer_code, bank_account, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql, 
    [
      name, 
      address, 
      contact, 
      farmerCode, 
      bank_account, 
      normalizedType
    ], 
    (err, result) => {
      if (err) {
        console.error("❌ Integration vendor error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`   ✅ Created ${normalizedType} with ID: ${result.insertId}, Code: ${farmerCode}`);
      
      res.json({ 
        id: result.insertId, 
        farmer_code: farmerCode,
        type: normalizedType,
        success: true 
      });
    }
  );
});

// ============================================
// Update stock
// ============================================
router.post("/stock", (req, res) => {
  const { material_id, quantity } = req.body;
  
  console.log(`📊 MM Core updating stock for material ID: ${material_id}`);
  console.log(`   New Quantity: ${quantity}`);
  
  db.query("UPDATE materials SET qty = ? WHERE id = ?", [quantity, material_id], (err, result) => {
    if (err) {
      console.error("❌ Integration stock error:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Material not found" });
    }
    
    console.log(`   ✅ Stock updated successfully`);
    res.json({ success: true });
  });
});

export default router;