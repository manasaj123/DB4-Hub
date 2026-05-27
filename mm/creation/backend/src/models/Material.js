import db from "../config/db.js";

const PLANT_CODE = "DB4"; // same idea as DB4-INV

// helper: generate material_number DB4-MAT-001, DB4-MAT-002, ...
const generateMaterialNumber = async () => {
  const [rows] = await db.query(
    "SELECT material_number FROM materials WHERE material_number LIKE ? ORDER BY id DESC LIMIT 1",
    [`${PLANT_CODE}-MAT-%`],
  );

  let nextSeq = 1;
  if (rows.length > 0 && rows[0].material_number) {
    const parts = String(rows[0].material_number).split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(3, "0"); // 001, 002, 003
  return `${PLANT_CODE}-MAT-${seqStr}`;
};

export const Material = {
  findAll() {
    // qty will be included because we use *
    return db.query("SELECT * FROM materials ORDER BY id DESC");
  },

  findById(id) {
    return db.query("SELECT * FROM materials WHERE id = ?", [id]);
  },

  // NEW method
  async findByNameExcludingId(name, excludeId) {
    const [rows] = await db.query(
      "SELECT id FROM materials WHERE name = ? AND id != ?",
      [name, excludeId],
    );
    return rows; // empty array if no duplicate
  },

  // auto-generate material_number, ignore value from body
  async create(data) {
    const material_number = await generateMaterialNumber();

    return db.query(
      `INSERT INTO materials (
  material_number, industry_sector, material_type, material_group,
  storage_type, warehouse_number, sales_org, storage_location,
  distribution_channel, gross_weight, net_weight, name, uom,
  shelf_life_days, valuation_method, issue_type, perishable, qty,
  batch_number, expiry_date
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        material_number,
        data.industry_sector || null,
        data.material_type || null,
        data.material_group || null,
        data.storage_type || null,
        data.warehouse_number || null,
        data.sales_org || null,
        data.storage_location || null,
        data.distribution_channel || null,
        data.gross_weight ?? null,
        data.net_weight ?? null,
        data.name,
        data.uom,
        data.shelf_life_days ?? 0,
        data.valuation_method || "MOVING_AVG",
        data.issue_type || "FIFO",
        data.perishable ? 1 : 0,
        data.qty ?? null, // NEW: save qty
        data.batch_number || "", // ← add this
        data.expiry_date || null,
      ],
    );
  },

  update(id, data) {
    return db.query(
      `UPDATE materials SET
        material_number       = ?,
        industry_sector       = ?,
        material_type         = ?,
        material_group        = ?,
        storage_type          = ?,
        warehouse_number      = ?,
        sales_org             = ?,
        storage_location      = ?,
        distribution_channel  = ?,
        gross_weight          = ?,
        net_weight            = ?,
        name                  = ?,
        uom                   = ?,
        shelf_life_days       = ?,
        valuation_method      = ?,
        issue_type            = ?,
        perishable            = ?,
        qty                   = ?,
        batch_number          = ?,
        expiry_date           = ?
        
      WHERE id = ?`,
      [
        data.material_number, // keep existing on edit
        data.industry_sector || null,
        data.material_type || null,
        data.material_group || null,
        data.storage_type || null,
        data.warehouse_number || null,
        data.sales_org || null,
        data.storage_location || null,
        data.distribution_channel || null,
        data.gross_weight ?? null,
        data.net_weight ?? null,
        data.name,
        data.uom,
        data.shelf_life_days ?? 0,
        data.valuation_method || "MOVING_AVG",
        data.issue_type || "FIFO",
        data.perishable ? 1 : 0,
        data.qty ?? null, // NEW: update qty
        data.batch_number || "", // ← batch number value
        data.expiry_date || null, // ← expiry date value
        id,
      ],
    );
  },

  // safe delete: block when used in PR / PO items
  async remove(id) {
    // check PR usage
    const [prRows] = await db.query(
      "SELECT COUNT(*) AS cnt FROM pr_items WHERE material_id = ?",
      [id],
    );
    if (prRows[0].cnt > 0) {
      const err = new Error(
        "Cannot delete material: it is used in Purchase Requisitions",
      );
      err.code = "MATERIAL_IN_USE_PR";
      throw err;
    }

    // check PO usage
    const [poRows] = await db.query(
      "SELECT COUNT(*) AS cnt FROM po_items WHERE material_id = ?",
      [id],
    );
    if (poRows[0].cnt > 0) {
      const err = new Error(
        "Cannot delete material: it is used in Purchase Orders",
      );
      err.code = "MATERIAL_IN_USE_PO";
      throw err;
    }

    // if safe, delete
    return db.query("DELETE FROM materials WHERE id = ?", [id]);
  },
};
