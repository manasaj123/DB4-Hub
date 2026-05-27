import { Material } from "../models/Material.js";

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
    // Model will generate material_number = DB4-MAT-00X
    const [result] = await Material.create(req.body);

    // return generated number to frontend
    const [rows] = await Material.findById(result.insertId);
    const created = rows[0] || null;

    res.status(201).json({
      id: result.insertId,
      material_number: created?.material_number || null,
      // if you want, you can include qty and other fields here too:
      // qty: created?.qty ?? null
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
