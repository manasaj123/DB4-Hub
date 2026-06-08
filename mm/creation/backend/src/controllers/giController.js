import db from "../config/db.js";
import { GI } from "../models/giModel.js";

const toMysqlDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().split("T")[0];
};

// GET all Goods Issues
export const getGIs = async (req, res, next) => {
  try {
    const [rows] = await GI.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET one Goods Issue by ID
export const getGIById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[header]] = await GI.findByIdHeader(id);
    if (!header)
      return res.status(404).json({ message: "Goods Issue not found" });
    const [items] = await GI.findItemsByGI(id);
    res.json({ header, items });
  } catch (err) {
    next(err);
  }
};

// CREATE Goods Issue (decrease stock)
export const createGI = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { header, items } = req.body;
    await conn.beginTransaction();

    // Generate GI number (GI-001, GI-002...)
    const [rows] = await conn.query(
      `SELECT gi_no FROM gi_headers WHERE gi_no LIKE 'GI-%' ORDER BY id DESC LIMIT 1`,
    );
    let nextSeq = 1;
    if (rows.length && rows[0].gi_no) {
      const parts = rows[0].gi_no.split("-");
      if (parts.length === 2 && !isNaN(parts[1]))
        nextSeq = parseInt(parts[1], 10) + 1;
    }
    const generatedGiNo = `GI-${String(nextSeq).padStart(3, "0")}`;

    // Insert GI header using model
    const [hRes] = await GI.createHeader(
      {
        gi_no: generatedGiNo,
        doc_date: toMysqlDate(header.doc_date),
        posting_date: toMysqlDate(header.posting_date),
        po_id: header.po_id || null,
        plant: header.plant || null,
        status: header.status || "POSTED",
      },
      conn,
    );
    const giId = hRes.insertId;

    // Process each item
    for (const item of items || []) {
      // Stock availability check (raw SQL – no model method needed)
      const [stockRow] = await conn.query(
        `SELECT COALESCE(SUM(qty_in - qty_out), 0) AS available
         FROM stock_ledger
         WHERE material_id = ? AND location_id = ?`,
        [item.material_id, header.location_id || 1],
      );
      const available = parseFloat(stockRow[0].available);
      const issueQty = Number(item.qty);
      if (available < issueQty) {
        await conn.rollback();
        return res.status(400).json({
          error: `Insufficient stock for material ID ${item.material_id}. Available: ${available}, Requested: ${issueQty}`,
        });
      }

      // Insert GI item using model
      await GI.createItem(
        {
          po_item_id: item.po_item_id,
          material_id: item.material_id,
          qty: issueQty,
          storage_location: item.storage_location,
          stock_type: item.stock_type,
          batch_id: item.batch_id || null,
        },
        giId,
        conn,
      );

      // Decrease stock in ledger (raw SQL)
      await conn.query(
        `INSERT INTO stock_ledger
         (material_id, location_id, batch_id, txn_type, qty_in, qty_out, unit_cost, txn_ref_type, txn_ref_id, txn_date)
         VALUES (?, ?, ?, 'GI', 0, ?, 0, 'GI', ?, ?)`,
        [
          item.material_id,
          header.location_id || 1,
          item.batch_id || null,
          issueQty,
          giId,
          toMysqlDate(header.posting_date),
        ],
      );
    }

    await conn.commit();
    res.status(201).json({ id: giId, gi_no: generatedGiNo });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// UPDATE Goods Issue
export const updateGI = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const { header, items } = req.body;
    await conn.beginTransaction();

    // 1) Delete old stock ledger entries and items
    await conn.query(
      `DELETE FROM stock_ledger WHERE txn_ref_type = 'GI' AND txn_ref_id = ?`,
      [id],
    );
    await conn.query(`DELETE FROM gi_items WHERE gi_id = ?`, [id]);

    // 2) Update header using model
    await GI.updateHeader(
      id,
      {
        doc_date: toMysqlDate(header.doc_date),
        posting_date: toMysqlDate(header.posting_date),
        po_id: header.po_id,
        plant: header.plant,
        status: header.status || "POSTED",
      },
      conn,
    );

    // 3) Re‑insert items and stock ledger (same as create)
    for (const item of items || []) {
      // Stock check again
      const [stockRow] = await conn.query(
        `SELECT COALESCE(SUM(qty_in - qty_out), 0) AS available
         FROM stock_ledger
         WHERE material_id = ? AND location_id = ?`,
        [item.material_id, header.location_id || 1],
      );
      const available = parseFloat(stockRow[0].available);
      const issueQty = Number(item.qty);
      if (available < issueQty) {
        await conn.rollback();
        return res.status(400).json({
          error: `Insufficient stock for material ID ${item.material_id}. Available: ${available}, Requested: ${issueQty}`,
        });
      }

      // Insert GI item
      await GI.createItem(
        {
          po_item_id: item.po_item_id,
          material_id: item.material_id,
          qty: issueQty,
          storage_location: item.storage_location,
          stock_type: item.stock_type,
          batch_id: item.batch_id,
        },
        id,
        conn,
      );

      // Stock ledger (decrease)
      await conn.query(
        `INSERT INTO stock_ledger
         (material_id, location_id, batch_id, txn_type, qty_in, qty_out, unit_cost, txn_ref_type, txn_ref_id, txn_date)
         VALUES (?, ?, ?, 'GI', 0, ?, 0, 'GI', ?, ?)`,
        [
          item.material_id,
          header.location_id || 1,
          item.batch_id || null,
          issueQty,
          id,
          toMysqlDate(header.posting_date),
        ],
      );
    }

    await conn.commit();
    res.json({ message: "Goods Issue updated" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// DELETE Goods Issue
export const deleteGI = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();

    // Delete stock ledger entries
    await conn.query(
      `DELETE FROM stock_ledger WHERE txn_ref_type = 'GI' AND txn_ref_id = ?`,
      [id],
    );
    // Delete items (cascade not needed if foreign key is set, but we do it manually)
    await conn.query(`DELETE FROM gi_items WHERE gi_id = ?`, [id]);
    // Delete header using model
    const [result] = await GI.delete(id, conn);
    await conn.commit();

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Goods Issue not found" });
    res.status(204).end();
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// Get POs that still have remaining quantity to issue (not fully issued)
export const getPOsForIssue = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        po.id,
        po.po_no,
        po.vendor_id,
        v.name AS vendor_name,
        SUM(pi.qty) AS total_ordered,
        COALESCE(SUM(gi.qty), 0) AS total_issued
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      JOIN po_items pi ON pi.po_id = po.id
      LEFT JOIN gi_items gi ON gi.po_item_id = pi.id
      GROUP BY po.id
      HAVING total_ordered > total_issued
      ORDER BY po.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get available batches for a material (with positive stock)
export const getAvailableBatches = async (req, res, next) => {
  try {
    const { materialId, locationId } = req.query;
    if (!materialId) {
      return res.status(400).json({ error: "materialId is required" });
    }
    const locId = locationId || 1;

    const [rows] = await db.query(
      `SELECT 
         b.id AS batch_id,
         b.batch_no,
         b.expiry_date,
         SUM(sl.qty_in - sl.qty_out) AS qty
       FROM stock_ledger sl
       JOIN batches b ON b.id = sl.batch_id
       WHERE sl.material_id = ? AND sl.location_id = ? AND sl.batch_id IS NOT NULL
       GROUP BY b.id, b.batch_no, b.expiry_date
       HAVING qty > 0
       ORDER BY b.expiry_date ASC`,
      [materialId, locId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
