const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/product", async (req, res) => {
  const { code, name, type } = req.body;

  console.log(`📦 Production receiving: ${name} (Code: ${code})`);

  try {
    // Validate Code - only alphanumeric (no spaces)
    const codeRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!codeRegex.test(code)) {
      console.log(`   ❌ Invalid code format: ${code}`);
      return res
        .status(400)
        .json({ error: "Code must be alphanumeric, no spaces" });
    }

    // Check if product already exists
    const [existing] = await db.query(
      "SELECT id FROM products WHERE code = ?",
      [code],
    );

    if (existing.length > 0) {
      console.log(`   ⚠️ Product already exists (ID: ${existing[0].id})`);
      return res.json({ id: existing[0].id, success: true, existing: true });
    }

    const [result] = await db.query(
      "INSERT INTO products (code, name, type) VALUES (?, ?, ?)",
      [code, name, type || "raw_material"],
    );

    console.log(`   ✅ Created Product (ID: ${result.insertId})`);
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
