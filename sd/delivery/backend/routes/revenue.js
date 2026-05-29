const express = require("express");
const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const db = req.app.get("db");
    
    const [totalRevenue] = await db.execute(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'"
    );
    
    const [monthlyRevenue] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as _id,
        COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      WHERE status = 'delivered'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY _id DESC
    `);

    const [totalOrders] = await db.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'"
    );

    res.json({
      totalRevenue: parseFloat(totalRevenue[0].total),
      monthlyRevenue: monthlyRevenue,
      totalOrders: totalOrders[0].count
    });
  } catch (error) {
    console.error('Revenue fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;