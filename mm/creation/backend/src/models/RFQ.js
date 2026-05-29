import db from "../config/db.js";

export const RFQ = {
  findAll: async () => {
    return await db.query(
      `SELECT h.*, 
        COUNT(DISTINCT ri.id) as item_count,
        SUM(ri.qty) as total_qty,
        COUNT(DISTINCT rv.vendor_id) as vendor_count
       FROM rfq_headers h
       LEFT JOIN rfq_items ri ON h.id = ri.rfq_id
       LEFT JOIN rfq_vendors rv ON h.id = rv.rfq_id
       GROUP BY h.id
       ORDER BY h.id DESC`
    );
  },

  findByIdHeader: async (id) => {
    return await db.query(
      `SELECT * FROM rfq_headers WHERE id = ?`,
      [id]
    );
  },

  findItemsByRFQ: async (rfqId) => {
    return await db.query(
      `SELECT ri.*, m.name as material_name, m.uom
       FROM rfq_items ri
       JOIN materials m ON ri.material_id = m.id
       WHERE ri.rfq_id = ?`,
      [rfqId]
    );
  },

  findVendorsByRFQ: async (rfqId) => {
    return await db.query(
      `SELECT rv.*, v.name as vendor_name, v.email, v.phone
       FROM rfq_vendors rv
       JOIN vendors v ON rv.vendor_id = v.id
       WHERE rv.rfq_id = ?`,
      [rfqId]
    );
  }
};