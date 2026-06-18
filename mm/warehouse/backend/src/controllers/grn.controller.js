const Grn = require("../models/Grn");
const Bin = require("../models/Bins");
const Inventory = require("../models/Inventory");
const axios = require("axios");
const INTEGRATION_HUB = "http://localhost:3000";

exports.createGRN = async (req, res) => {
  try {
    const id = await Grn.create(req.body);
    res.status(201).json({ id });
  } catch (error) {
    console.error("CREATE GRN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPending = async (req, res) => {
  try {
    const [grns] = await Grn.findPending();
    res.json(grns);
  } catch (error) {
    console.error("GET GRN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.putAwayGRN = async (req, res) => {
  const grnId = req.params.id;

  const connection = await require("../config/db").getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get GRN items
    const [items] = await connection.query(
      "SELECT * FROM grn_items WHERE grn_id = ?",
      [grnId],
    );

    // 2. Get GRN + warehouse
    const [[grn]] = await connection.query("SELECT * FROM grn WHERE id = ?", [
      grnId,
    ]);

    const warehouseId = grn.warehouse_id;

    // 3. Get bins for warehouse
    const [bins] = await connection.query(
      "SELECT * FROM bins WHERE warehouse_id = ? ORDER BY current_usage ASC",
      [warehouseId],
    );

    if (!bins.length) {
      throw new Error("No bins available in warehouse");
    }

    let binIndex = 0;

    // 4. Process each GRN item
    for (const item of items) {
      const bin = bins[binIndex % bins.length]; // simple round-robin

      // 4a. Insert into inventory
      await connection.query(
        `INSERT INTO inventory (item_id, bin_id, qty)
         VALUES (?, ?, ?)`,
        [item.item_id, bin.id, item.qty_received],
      );

      // 4b. Update bin usage
      await connection.query(
        `UPDATE bins 
         SET current_usage = current_usage + ?
         WHERE id = ?`,
        [item.qty_received, bin.id],
      );

      // 4c. Update GRN item
      await connection.query(
        `UPDATE grn_items 
         SET assigned_bin_id = ?, putaway_time = NOW()
         WHERE id = ?`,
        [bin.id, item.id],
      );

      binIndex++;
    }

    // 5. Update GRN status
    await connection.query(
      `UPDATE grn 
       SET status = 'putaway', putaway_date = NOW()
       WHERE id = ?`,
      [grnId],
    );

    await connection.commit();

    // ============================================
    // STOCK SYNC AFTER PUTAWAY
    // ============================================
    try {
      // Get items with SKU and total stock
      const [items] = await connection.query(
        `SELECT 
      i.sku,
      COALESCE(SUM(inv.qty), 0) as total_qty
     FROM grn_items gi
     JOIN items i ON gi.item_id = i.id
     LEFT JOIN inventory inv ON inv.item_id = i.id
     WHERE gi.grn_id = ?
     GROUP BY i.sku`,
        [grnId],
      );

      for (const item of items) {
        await axios.post(`${INTEGRATION_HUB}/api/stock/sync`, {
          material_code: item.sku,
          quantity: Number(item.total_qty),
          module: "warehouse",
        });
        console.log(
          `✅ Stock sync from Warehouse GRN: ${item.sku} → ${item.total_qty}`,
        );
      }
    } catch (err) {
      console.error("Stock sync webhook failed:", err.message);
    }

    res.json({ message: "Put away completed successfully" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
