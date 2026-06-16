import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Receive material from integration hub
router.post("/material", (req, res) => {
  const { name, unit, shelf_life } = req.body;
  
  const sql = "INSERT INTO materials (name, unit, shelf_life, qty) VALUES (?, ?, ?, 0)";
  
  db.query(sql, [name, unit, shelf_life || 0], (err, result) => {
    if (err) {
      console.error("Integration error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, success: true });
  });
});

export default router;