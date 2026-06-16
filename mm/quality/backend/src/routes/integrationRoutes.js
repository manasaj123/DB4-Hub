import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.post("/material", async (req, res) => {
  const { material_name, material_code } = req.body;

  console.log(
    `📦 Quality receiving: ${material_name} (Code: ${material_code})`,
  );

  try {
    // Check if material already exists
    const [existing] = await db.query(
      "SELECT id FROM qc_lots WHERE material_id = ? OR material_name = ?",
      [material_code, material_name],
    );

    if (existing.length > 0) {
      console.log(`   ⚠️ Material already exists (ID: ${existing[0].id})`);
      return res.json({ id: existing[0].id, success: true, existing: true });
    }

    const [result] = await db.query(
      `INSERT INTO qc_lots (material_id, material_name, stage, status, source_type) 
             VALUES (?, ?, 'WAREHOUSE', 'PENDING', 'INTEGRATION')`,
      [material_code, material_name],
    );

    console.log(`   ✅ Created Quality record (ID: ${result.insertId})`);
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
