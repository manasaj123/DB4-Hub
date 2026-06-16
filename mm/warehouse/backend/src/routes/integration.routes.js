const express = require("express");
const db = require("../config/db");
const router = express.Router();

// Receive item from integration hub
router.post("/item", async (req, res) => {
  const { sku, name, unit } = req.body;

  console.log(`📦 Warehouse receiving: ${name} (SKU: ${sku})`);

  try {
    // Check if item already exists
    const [existing] = await db.execute(
      "SELECT id FROM items WHERE sku = ?",
      [sku]
    );
    
    if (existing.length > 0) {
      console.log(`   ⚠️ Item already exists (ID: ${existing[0].id})`);
      return res.json({ id: existing[0].id, success: true, existing: true });
    }
    
    const [result] = await db.execute(
      "INSERT INTO items (sku, name, unit) VALUES (?, ?, ?)",
      [sku, name, unit],
    );

    console.log(`   ✅ Created new item (ID: ${result.insertId})`);
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;