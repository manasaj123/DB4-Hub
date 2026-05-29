const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// GET all complaints
router.get('/', async (req, res) => {
  try {
    const [complaints] = await pool.execute(
      'SELECT * FROM complaints ORDER BY created_at DESC'
    );
    res.json(complaints);
  } catch (error) {
    console.error('Complaints GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new complaint
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      order_id,
      subject,
      description,
      priority
    } = req.body;

    if (!customer_name || !description) {
      return res.status(400).json({ 
        error: 'customer_name and description are required' 
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO complaints (
        customer_name, customer_phone, order_id, subject, description, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [customer_name, customer_phone || null, order_id || null, subject || null, description, priority || 'medium']
    );

    const [rows] = await pool.execute('SELECT * FROM complaints WHERE id = ?', [result.insertId]);
    
    const complaint = rows[0];
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('complaintCreated', complaint);
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Complaints POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT escalate complaint - THIS WAS MISSING!
router.put('/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const { escalation_level, assigned_to } = req.body;

    await pool.execute(
      `UPDATE complaints 
       SET status = 'escalated', 
           escalation_level = ?, 
           assigned_to = ? 
       WHERE id = ?`,
      [escalation_level || 1, assigned_to || 'manager', id]
    );

    const [rows] = await pool.execute('SELECT * FROM complaints WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Complaint escalation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;