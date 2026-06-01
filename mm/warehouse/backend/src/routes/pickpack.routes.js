const express = require("express");
const db = require("../config/db");
const Pick = require("../models/Pick");
const router = express.Router();

router.get("/pending", async (req, res) => {
  try {
    const picks = await Pick.getPending();
    res.json(picks || []);
  } catch (error) {
    console.error("PickPack error:", error);
    res.status(500).json({ error: "Failed to load picks" });
  }
});

// Create new pick
router.post("/", async (req, res) => {
  const { pick_no, order_id, item_id, qty_picked } = req.body;

  console.log("📦 Create pick request:", req.body);

  try {
    // Validate inputs
    const itemId = parseInt(item_id, 10);
    const qtyPicked = parseInt(qty_picked, 10);

    console.log("✅ Parsed:", { itemId, qtyPicked });

    if (!itemId || isNaN(itemId)) {
      console.error("❌ Invalid item_id:", item_id);
      return res.status(400).json({ error: "Valid item ID is required" });
    }

    if (!qtyPicked || isNaN(qtyPicked) || qtyPicked <= 0) {
      console.error("❌ Invalid qty:", qty_picked);
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    if (!order_id || !order_id.trim()) {
      console.error("❌ Missing order_id");
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Validate Pick No format
    const finalPickNo = pick_no?.trim().toUpperCase() || `PICK${Date.now()}`;
    console.log("✅ Final pick_no:", finalPickNo);

    if (!/^[A-Z0-9\-]+$/i.test(finalPickNo)) {
      return res.status(400).json({
        error: "Pick No can only contain letters, numbers, and dashes",
      });
    }

    // Validate Order ID format
    const finalOrderId = order_id.trim().toUpperCase();
    console.log("✅ Final order_id:", finalOrderId);

    if (!/^[A-Z0-9\-]+$/i.test(finalOrderId)) {
      return res.status(400).json({
        error: "Order ID can only contain letters, numbers, and dashes",
      });
    }

    // Check if item exists
    console.log("🔍 Checking if item exists:", itemId);
    const [item] = await db.execute("SELECT id FROM items WHERE id = ?", [
      itemId,
    ]);
    console.log("✅ Item found:", item);

    if (item.length === 0) {
      return res
        .status(400)
        .json({ error: `Item with ID ${itemId} does not exist` });
    }

    // Get FIFO inventory for this item (oldest first)
    console.log("🔍 Looking for inventory for item:", itemId);
    const [inventory] = await db.execute(
      `SELECT id, bin_id, qty 
       FROM inventory 
       WHERE item_id = ? AND qty > 0 
       ORDER BY expiry_date ASC, id ASC 
       LIMIT 1`,
      [itemId],
    );
    console.log("✅ Inventory found:", inventory);

    if (inventory.length === 0) {
      return res.status(400).json({
        error: "No inventory available for this item",
      });
    }

    const availableQty = inventory[0].qty;
    const binId = inventory[0].bin_id;

    console.log("✅ Available qty:", availableQty, "in bin:", binId);

    if (qtyPicked > availableQty) {
      return res.status(400).json({
        error: `Only ${availableQty} units available in inventory`,
      });
    }

    // Insert pick record
    console.log("💾 Inserting pick:", {
      pick_no: finalPickNo,
      order_id: finalOrderId,
      item_id: itemId,
      bin_id: binId,
      qty_required: qtyPicked,
    });

    const [result] = await db.execute(
      `INSERT INTO picks (pick_no, order_id, item_id, bin_id, qty_required, qty_picked, status)
       VALUES (?, ?, ?, ?, ?, 0, 'pending')`,
      [finalPickNo, finalOrderId, itemId, binId, qtyPicked],
    );

    console.log("✅ Pick created successfully, ID:", result.insertId);

    res.status(201).json({
      message: "Pick created successfully",
      id: result.insertId,
      pick_no: finalPickNo,
      bin_id: binId,
    });
  } catch (err) {
    console.error("❌ Create pick error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

// MARK AS PACKED (with inventory deduction)
router.put("/:id/packed", async (req, res) => {
  const pickId = req.params.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the pick
    const [[pick]] = await connection.query(
      `SELECT p.id, p.bin_id, p.item_id, p.qty_required, p.status
       FROM picks p
       WHERE p.id = ?`,
      [pickId],
    );

    if (!pick) {
      await connection.rollback();
      return res.status(404).json({ error: "Pick not found" });
    }

    if (pick.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ error: "Pick is not pending" });
    }

    const { bin_id, item_id, qty_required } = pick;

    // 2. Find inventory row (same bin, enough quantity)
    const [[inventoryRow]] = await connection.query(
      `SELECT id, qty FROM inventory
       WHERE item_id = ? AND bin_id = ? AND qty >= ?
       ORDER BY expiry_date ASC, id ASC
       LIMIT 1`,
      [item_id, bin_id, qty_required],
    );

    if (!inventoryRow) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Not enough stock in assigned bin" });
    }

    // 3. Deduct inventory
    const newQty = inventoryRow.qty - qty_required;
    if (newQty > 0) {
      await connection.query(`UPDATE inventory SET qty = ? WHERE id = ?`, [
        newQty,
        inventoryRow.id,
      ]);
    } else {
      await connection.query(`DELETE FROM inventory WHERE id = ?`, [
        inventoryRow.id,
      ]);
    }

    // 4. Release bin capacity
    await connection.query(
      `UPDATE bins SET current_usage = current_usage - ? WHERE id = ?`,
      [qty_required, bin_id],
    );

    // 5. Mark as packed – no packed_at column needed
    await connection.query(`UPDATE picks SET status = 'packed' WHERE id = ?`, [
      pickId,
    ]);

    await connection.commit();
    res.json({ message: "Pick packed, inventory updated" });
  } catch (err) {
    await connection.rollback();
    console.error("Pack error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});
module.exports = router;
