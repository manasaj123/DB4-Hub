import db from "../config/db.js";

export const GI = {
  // Create GI header
  createHeader: async (data, conn = db) => {
    const { gi_no, doc_date, posting_date, po_id, plant, status } = data;
    return conn.query(
      `INSERT INTO gi_headers
       (gi_no, doc_date, posting_date, po_id, plant, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [gi_no, doc_date, posting_date, po_id, plant, status || "POSTED"],
    );
  },

  // Create GI item
  createItem: async (item, giId, conn = db) => {
    const {
      po_item_id,
      material_id,
      qty,
      storage_location,
      stock_type,
      batch_id,
    } = item;
    return conn.query(
      `INSERT INTO gi_items
       (gi_id, po_item_id, material_id, qty, storage_location, stock_type, batch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        giId,
        po_item_id,
        material_id,
        qty,
        storage_location || null,
        stock_type || "UNRESTRICTED",
        batch_id || null,
      ],
    );
  },

  // Get all GIs with PO number
  findAll: async () => {
    return db.query(
      `SELECT g.*, p.po_no
       FROM gi_headers g
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       ORDER BY g.id DESC`,
    );
  },

  // Find GI header by ID
  findByIdHeader: async (id) => {
    return db.query(`SELECT * FROM gi_headers WHERE id = ?`, [id]);
  },

  // Find GI items by header ID
  findItemsByGI: async (giId) => {
    return db.query(`SELECT * FROM gi_items WHERE gi_id = ?`, [giId]);
  },

  // Update GI header
  updateHeader: async (id, data, conn = db) => {
    const { doc_date, posting_date, po_id, plant, status } = data;
    return conn.query(
      `UPDATE gi_headers
       SET doc_date = ?, posting_date = ?, po_id = ?, plant = ?, status = ?
       WHERE id = ?`,
      [doc_date, posting_date, po_id, plant, status || "POSTED", id],
    );
  },

  // Delete GI header (items deleted via ON DELETE CASCADE)
  delete: async (id, conn = db) => {
    return conn.query(`DELETE FROM gi_headers WHERE id = ?`, [id]);
  },
};
