const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Receive material from integration hub (using callbacks, NOT async/await)
router.post("/material", (req, res) => {
  const { material_code, material_name } = req.body;

  console.log(
    `🔍 Inspection receiving: ${material_name} (Code: ${material_code})`,
  );

  // Validate code format
  const codeRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!codeRegex.test(material_code)) {
    console.log(`   ❌ Invalid code format: ${material_code}`);
    return res
      .status(400)
      .json({ error: "Code must be alphanumeric, hyphens, or underscores" });
  }

  // Check if material already exists
  db.query(
    "SELECT id FROM inspection_lots WHERE material = ?",
    [material_code],
    (err, existing) => {
      if (err) {
        console.error("Integration error:", err);
        return res.status(500).json({ error: err.message });
      }

      if (existing && existing.length > 0) {
        console.log(`   ⚠️ Material already exists (ID: ${existing[0].id})`);
        return res.json({ id: existing[0].id, success: true, existing: true });
      }

      // Insert new inspection lot
      db.query(
        `INSERT INTO inspection_lots (material, batch, lot_created_from, plant, lot_origin) 
       VALUES (?, ?, CURDATE(), ?, 'INTEGRATION')`,
        [material_code, `BATCH-${Date.now()}`, "PLANT-01"],
        (err2, result) => {
          if (err2) {
            console.error("Integration error:", err2);
            return res.status(500).json({ error: err2.message });
          }

          console.log(
            `   ✅ Created Inspection record (ID: ${result.insertId})`,
          );
          res.json({ id: result.insertId, success: true });
        },
      );
    },
  );
});

module.exports = router;
