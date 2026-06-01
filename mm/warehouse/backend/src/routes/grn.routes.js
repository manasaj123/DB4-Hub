const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET pending GRNs
 */
router.get("/pending", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, grn_no, warehouse_id, received_date, total_items, status
       FROM grn
       WHERE status = 'pending'
       ORDER BY received_date DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error("GRN pending error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * CREATE GRN
 */
// ... imports and other routes remain unchanged

router.post("/", async (req, res) => {
  const { grn_no, warehouse_id, received_date, items } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Compute total_items from the items array
    const totalItems = items.reduce((sum, i) => sum + i.qty_received, 0);

    // 2. Create GRN header
    const [grnResult] = await connection.query(
      `INSERT INTO grn (grn_no, warehouse_id, received_date, total_items, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [grn_no, warehouse_id, received_date, totalItems],
    );
    const grnId = grnResult.insertId;

    // 3. Insert each GRN item into grn_items
    for (const item of items) {
      await connection.query(
        `INSERT INTO grn_items (grn_id, item_id, qty_received, expiry_date)
     VALUES (?, ?, ?, ?)`,
        [grnId, item.item_id, item.qty_received, item.expiry_date || null],
      );
    }

    await connection.commit();
    res.status(201).json({ id: grnId });
  } catch (err) {
    await connection.rollback();
    console.error("GRN create error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

/**
 * Smart bin selection:
 * - Must have enough free space (capacity - current_usage >= qty)
 * - Choose the bin with the smallest current usage (least filled)
 */
function findBestBin(bins, qty) {
  const suitable = bins.filter(
    (bin) => bin.capacity - bin.current_usage >= qty,
  );
  if (suitable.length === 0) return null;
  suitable.sort((a, b) => a.current_usage - b.current_usage);
  return suitable[0];
}

// ... putaway route remains unchanged

/**
 * PUTAWAY – SMART BIN ALLOCATION
 */
router.put("/:id/putaway", async (req, res) => {
  const grnId = req.params.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get GRN
    const [[grn]] = await connection.query("SELECT * FROM grn WHERE id = ?", [
      grnId,
    ]);
    if (!grn) {
      await connection.rollback();
      return res.status(404).json({ error: "GRN not found" });
    }

    // 2. Get GRN items
    const [items] = await connection.query(
      "SELECT * FROM grn_items WHERE grn_id = ?",
      [grnId],
    );
    if (!items.length) {
      await connection.rollback();
      return res.status(400).json({ error: "No GRN items found" });
    }

    // 3. Get bins for the warehouse (already sorted by current_usage ASC is good)
    const [bins] = await connection.query(
      "SELECT * FROM bins WHERE warehouse_id = ? ORDER BY current_usage ASC",
      [grn.warehouse_id],
    );
    if (!bins.length) {
      await connection.rollback();
      return res.status(400).json({ error: "No bins in warehouse" });
    }

    // 4. Smart allocation
    for (const item of items) {
      const bin = findBestBin(bins, item.qty_received);

      if (!bin) {
        throw new Error(
          `Not enough space in any bin for item ${item.item_id} (needs ${item.qty_received})`,
        );
      }

      // Insert into inventory
      await connection.query(
        `INSERT INTO inventory (item_id, bin_id, qty, expiry_date) VALUES (?, ?, ?, ?)`,
        [item.item_id, bin.id, item.qty_received, item.expiry_date], // item.expiry_date comes from grn_items
      );

      // Update bin usage in database
      await connection.query(
        `UPDATE bins SET current_usage = current_usage + ? WHERE id = ?`,
        [item.qty_received, bin.id],
      );

      // Update GRN item with assigned bin
      await connection.query(
        `UPDATE grn_items SET assigned_bin_id = ?, putaway_time = NOW() WHERE id = ?`,
        [bin.id, item.id],
      );

      // Reflect the change in our local bins array (so next items see updated capacity)
      bin.current_usage += item.qty_received;
    }

    // 5. Mark GRN as complete
    await connection.query(
      `UPDATE grn SET status = 'complete', putaway_date = NOW() WHERE id = ?`,
      [grnId],
    );

    await connection.commit();
    res.json({ message: "Putaway completed successfully", grn_id: grnId });
  } catch (err) {
    await connection.rollback();
    console.error("PUTAWAY ERROR:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
