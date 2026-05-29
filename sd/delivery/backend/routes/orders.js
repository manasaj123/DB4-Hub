const express = require("express");
const router = express.Router();

// GET all orders
router.get("/", async (req, res) => {
  try {
    const db = req.app.get("db");
    const [orders] = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(orders);
  } catch (error) {
    console.error('Orders GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE NEW ORDER
router.post("/create", async (req, res) => {
  console.log('📦 Creating order:', req.body);
  
  try {
    const db = req.app.get("db");
    const {
      order_id,
      customer_name,
      customer_phone,
      total_amount,
      status
    } = req.body;

    // Validation
    if (!order_id || !customer_name || !total_amount) {
      console.log('❌ Validation failed:', { order_id, customer_name, total_amount });
      return res.status(400).json({ 
        error: 'Order ID, Customer Name, and Total Amount are required' 
      });
    }

    // Check if order_id already exists
    const [existing] = await db.execute(
      "SELECT id FROM orders WHERE order_id = ?", 
      [order_id]
    );
    
    if (existing.length > 0) {
      console.log('❌ Order ID already exists:', order_id);
      return res.status(400).json({ error: 'Order ID already exists' });
    }

    console.log('✅ Inserting order...');
    
    const [result] = await db.execute(
      `INSERT INTO orders (order_id, customer_name, total_amount, status) 
       VALUES (?, ?, ?, ?)`,
      [order_id, customer_name, total_amount || 0, status || 'pending']
    );

    const [newOrder] = await db.execute(
      "SELECT * FROM orders WHERE id = ?", 
      [result.insertId]
    );

    console.log('✅ Order created:', newOrder[0]);

    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST cancel order
router.post("/cancel/:orderId", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { reason } = req.body;
    const orderId = req.params.orderId;
    
    await db.execute(
      "UPDATE orders SET status = 'cancelled', return_reason = ? WHERE order_id = ?",
      [reason, orderId]
    );
    
    const [order] = await db.execute("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order[0]);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST return order
router.post("/return/:orderId", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { reason, creditAmount } = req.body;
    const orderId = req.params.orderId;
    
    await db.execute(
      "UPDATE orders SET status = 'returned', return_reason = ?, credit_note_issued = TRUE, credit_note_amount = ? WHERE order_id = ?",
      [reason, creditAmount, orderId]
    );
    
    const [order] = await db.execute("SELECT * FROM orders WHERE order_id = ?", [orderId]);
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order[0]);
  } catch (error) {
    console.error('Return order error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;