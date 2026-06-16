import { Material } from "../models/Material.js";
import axios from "axios";

const INTEGRATION_HUB = "http://localhost:3000";

export const getMaterials = async (req, res, next) => {
  try {
    const [rows] = await Material.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    // 1. Create material in MM Creation (YOUR EXISTING CODE)
    const [result] = await Material.create(req.body);
    const [rows] = await Material.findById(result.insertId);
    const created = rows[0] || null;

    // 2. 🆕 Send to Integration Hub (UPDATED - includes material_number)
    try {
      await axios.post(`${INTEGRATION_HUB}/api/material/sync`, {
        source: "mm_creation",
        material: {
          id: result.insertId,
          name: created.name,
          uom: created.uom,
          shelf_life_days: created.shelf_life_days,
          material_number: created.material_number, // ← ADD THIS LINE
          material_type: created.material_type, // ← ADD THIS LINE (optional)
        },
      });
      console.log(
        `✅ Material "${created.name}" (${created.material_number}) sent to integration hub`,
      );
    } catch (syncError) {
      console.error("Sync failed:", syncError.message);
      // Don't fail the request - material still created in MM Creation
    }

    // 3. Return response (YOUR EXISTING CODE)
    res.status(201).json({
      id: result.insertId,
      material_number: created?.material_number || null,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "A material with this name already exists." });
    }
    next(err);
  }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    // If the request tries to change the name, check it's not already used
    if (req.body.name) {
      const duplicate = await Material.findByNameExcludingId(req.body.name, id);
      if (duplicate.length > 0) {
        return res
          .status(409)
          .json({ error: "Another material already uses this name." });
      }
    }
    await Material.update(id, req.body);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "A material with this name already exists." });
    }
    next(err);
  }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Material.remove(id);
    res.json({ success: true });
  } catch (err) {
    if (
      err.code === "MATERIAL_IN_USE_PR" ||
      err.code === "MATERIAL_IN_USE_PO"
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};
