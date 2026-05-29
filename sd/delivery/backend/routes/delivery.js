const express = require("express");
const router = express.Router();
const pool = require("../utils/db");

// GET all deliveries
router.get("/", async (req, res) => {
  try {
    const [deliveries] = await pool.execute(
      "SELECT * FROM deliveries ORDER BY created_at DESC"
    );
    res.json(deliveries);
  } catch (error) {
    console.error("GET /delivery ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST schedule new delivery
router.post("/schedule", async (req, res) => {
  try {
    console.log("📦 RAW REQUEST:", req.body);

    const {
      order_id,
      customer_name,
      customer_phone,
      address,
      scheduled_time,
      driver_id,
      driver_name,
      lat,
      lng
    } = req.body;

    // Validation
    if (!order_id?.trim() || !customer_name?.trim() || !address?.trim() || !scheduled_time) {
      console.log("❌ VALIDATION FAILED:", { order_id, customer_name, address, scheduled_time });
      return res.status(400).json({ error: "Order ID, Name, Address, Time required" });
    }

    console.log("✅ INSERTING:", { order_id, customer_name, address, scheduled_time });

    // Insert with ALL columns including status
    const [result] = await pool.execute(
      `INSERT INTO deliveries (
        order_id, customer_name, customer_phone, address, 
        scheduled_time, driver_id, driver_name, lat, lng, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        order_id.trim(),
        customer_name.trim(),
        customer_phone || null,
        address.trim(),
        scheduled_time,
        driver_id || null,
        driver_name || null,
        lat || 17.3850,
        lng || 78.4867
      ]
    );

    // Get the created delivery using insertId
    const [rows] = await pool.execute(
      "SELECT * FROM deliveries WHERE id = ?",
      [result.insertId]
    );

    if (rows.length === 0) {
      return res.status(500).json({ error: "Failed to fetch created delivery" });
    }

    const delivery = rows[0];
    console.log("✅ DELIVERY CREATED:", delivery);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('deliveryScheduled', delivery);
    }

    res.status(201).json(delivery);
  } catch (error) {
    console.error("🚨 FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update delivery status
router.put("/:id/status", async (req, res) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;
    const { status, driver_id, driver_name } = req.body;

    await db.execute(
      `UPDATE deliveries 
       SET status = ?, driver_id = ?, driver_name = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, driver_id, driver_name, id]
    );

    const [rows] = await db.execute('SELECT * FROM deliveries WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;