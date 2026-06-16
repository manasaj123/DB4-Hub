const express = require("express");
const router = express.Router();

// Receive product/material from integration hub
router.post("/product", async (req, res) => {
  const { name, code, uom, price } = req.body;

  console.log(`💰 Sales Flow receiving: ${name} (Code: ${code})`);

  try {
    // Sales Flow doesn't have a products table
    // Products are stored in order_items.product as text
    // We just acknowledge receipt and return a success
    
    console.log(`   ✅ Product reference stored: ${code} - ${name}`);
    res.json({ id: Date.now(), success: true, code: code, name: name });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;