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
    console.error('GET /complaints error:', error);
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

    // Validation
    if (!customer_name || !description) {
      return res.status(400).json({ 
        error: 'Customer name and description are required' 
      });
    }

    console.log('📝 Creating complaint:', { customer_name, order_id, subject });

    // Insert complaint
    const [result] = await pool.execute(
      `INSERT INTO complaints (
        customer_name, 
        customer_phone, 
        order_id, 
        subject, 
        description, 
        priority, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [
        customer_name,
        customer_phone || null,
        order_id || null,
        subject || 'No Subject',
        description,
        priority || 'medium'
      ]
    );

    // Fetch created complaint
    const [newComplaint] = await pool.execute(
      'SELECT * FROM complaints WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Complaint created:', newComplaint[0]);

    res.status(201).json(newComplaint[0]);
  } catch (error) {
    console.error('POST /complaints error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT escalate/assign complaint
router.put('/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const { escalation_level, assigned_to, status } = req.body;

    console.log(`🔄 Escalating complaint ${id}:`, { escalation_level, assigned_to, status });

    // Check if complaint exists
    const [existing] = await pool.execute(
      'SELECT * FROM complaints WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Determine the new status based on escalation level
    let newStatus = status;
    if (!newStatus) {
      // If no status provided, determine based on escalation level
      switch (escalation_level) {
        case 1:
          newStatus = 'assigned';
          break;
        case 2:
          newStatus = 'in_progress';
          break;
        default:
          newStatus = 'assigned';
      }
    }

    // Update complaint
    await pool.execute(
      `UPDATE complaints 
       SET status = ?, 
           escalation_level = ?, 
           assigned_to = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, escalation_level || 1, assigned_to || 'team_lead', id]
    );

    // Fetch updated complaint
    const [updated] = await pool.execute(
      'SELECT * FROM complaints WHERE id = ?',
      [id]
    );

    console.log('✅ Complaint updated:', updated[0]);

    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /complaints/:id/escalate error:', error);
    
    // Check if it's a data truncation error
    if (error.code === 'WARN_DATA_TRUNCATED' || error.code === 'ER_WARN_DATA_TRUNCATED') {
      return res.status(400).json({ 
        error: 'Invalid status value. Allowed values: new, assigned, in_progress, resolved, closed' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// PUT resolve complaint
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`✅ Resolving complaint ${id}`);

    // Check if complaint exists
    const [existing] = await pool.execute(
      'SELECT * FROM complaints WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Update status to resolved
    await pool.execute(
      `UPDATE complaints 
       SET status = 'resolved',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    // Fetch updated complaint
    const [updated] = await pool.execute(
      'SELECT * FROM complaints WHERE id = ?',
      [id]
    );

    console.log('✅ Complaint resolved:', updated[0]);

    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /complaints/:id/resolve error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;