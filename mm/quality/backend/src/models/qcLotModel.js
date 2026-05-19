// backend/src/models/qcLotModel.js
import db from "../config/db.js";

export const QCLot = {
  async create(header) {
  const [res] = await db.query(
    `INSERT INTO qc_lots
     (batch_id, material_id, material_name, vendor_id, location_id,
      stage, source_type, source_id, status, planned_date, inspected_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      header.batch_id,
      header.material_id,
      header.material_name,
      header.vendor_id,
      header.location_id,
      header.stage,
      header.source_type,
      header.source_id,
      header.status || "PENDING",
      header.planned_date || null,
      null
    ]
  );
  return res.insertId;
},

  async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM qc_lots WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async list(filter = {}) {
    const { status, stage } = filter;
    const where = [];
    const params = [];

    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (stage) {
      where.push("stage = ?");
      params.push(stage);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const [rows] = await db.query(
      `SELECT * FROM qc_lots ${whereSql} ORDER BY id DESC`,
      params
    );
    return rows;
  },

  async updateStatus(id, status, inspectedDate = null) {
    await db.query(
      `UPDATE qc_lots
       SET status = ?, inspected_date = COALESCE(?, inspected_date)
       WHERE id = ?`,
      [status, inspectedDate, id]
    );
  }
};
export default QCLot;