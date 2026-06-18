const express = require("express");
const router = express.Router();
const db = require("../models");

// Receive material from integration hub
router.post("/material", async (req, res) => {
  const { materialCode, description, baseUom, materialType } = req.body;

  console.log(
    `📦 SD Distribution receiving: ${description} (Code: ${materialCode})`,
  );

  try {
    const existing = await db.Material.findOne({
      where: { materialCode: materialCode },
    });

    if (existing) {
      return res.json({ id: existing.id, success: true, existing: true });
    }

    const material = await db.Material.create({
      materialCode: materialCode,
      description: description,
      baseUom: baseUom,
      materialType: materialType || "RAW",
      industrySector: "FOOD",
      plant: "PLANT01",
      storageLocation: "WH01",
      movementType: "101",
      isDeleted: false,
    });

    res.json({ id: material.id, success: true });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🆕 FIXED: Update stock from integration hub (with findOrCreate)
router.post("/stock", async (req, res) => {
  const { material_id, quantity } = req.body;

  console.log(
    `📊 SD Distribution stock update: Material ${material_id} → ${quantity}`,
  );

  try {
    // Check if stock record exists
    let stock = await db.Stock.findOne({
      where: { materialId: material_id },
    });

    if (!stock) {
      // Create new stock record
      stock = await db.Stock.create({
        materialId: material_id,
        plant: "PLANT01",
        warehouse: "WH01",
        storageLocation: "RackA",
        availableQty: 0,
        reservedQty: 0,
      });
      console.log(`   ✅ Created new stock record for material ${material_id}`);
    }

    // Update quantity
    await stock.update({ availableQty: quantity });

    // Also update material's availableStock
    await db.Material.update(
      { availableStock: quantity },
      { where: { id: material_id } },
    );

    console.log(`   ✅ Updated stock to ${quantity}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Stock update error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
