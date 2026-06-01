const express = require('express');
const router = express.Router();

// GET all drivers
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const [drivers] = await db.execute('SELECT * FROM drivers ORDER BY name ASC');
    res.json(drivers);
  } catch (error) {
    console.error('Drivers GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new driver
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { driver_id, name, phone, vehicle_number, vehicle_type } = req.body;

    if (!driver_id || !name) {
      return res.status(400).json({ error: 'Driver ID and Name are required' });
    }

    // Check duplicate
    const [existing] = await db.execute('SELECT id FROM drivers WHERE driver_id = ?', [driver_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Driver ID already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO drivers (driver_id, name, phone, vehicle_number, vehicle_type) VALUES (?, ?, ?, ?, ?)',
      [driver_id, name, phone, vehicle_number, vehicle_type || 'Bike']
    );

    const [newDriver] = await db.execute('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
    res.status(201).json(newDriver[0]);
  } catch (error) {
    console.error('Driver creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update driver status
router.put('/:driverId/status', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status } = req.body;
    const { driverId } = req.params;

    await db.execute('UPDATE drivers SET status = ? WHERE driver_id = ?', [status, driverId]);
    
    const [updated] = await db.execute('SELECT * FROM drivers WHERE driver_id = ?', [driverId]);
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;