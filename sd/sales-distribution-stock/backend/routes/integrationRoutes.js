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
    // Check if material already exists
    const existing = await db.Material.findOne({
      where: { materialCode: materialCode },
    });

    if (existing) {
      return res.json({ id: existing.id, success: true, existing: true });
    }

    // Create new material
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

module.exports = router;
