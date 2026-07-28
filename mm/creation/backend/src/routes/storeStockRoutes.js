import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all store stock
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM store_stock WHERE qty > 0 ORDER BY location_name, material_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET store stock ledger (history)
router.get("/ledger", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM store_stock_ledger ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;