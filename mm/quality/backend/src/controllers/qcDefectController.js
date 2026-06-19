// backend/src/controllers/qcDefectController.js
import db from "../config/db.js";

// ============================================
// LIST DEFECTS
// ============================================
export const listDefects = async (req, res, next) => {
  try {
    const { lot_id, severity, defect_type } = req.query;

    let query = `
      SELECT d.*, l.material_name
      FROM qc_defects d
      LEFT JOIN qc_lots l ON d.lot_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (lot_id) {
      query += " AND d.lot_id = ?";
      params.push(lot_id);
    }
    if (severity) {
      query += " AND d.severity = ?";
      params.push(severity);
    }
    if (defect_type) {
      query += " AND d.defect_type LIKE ?";
      params.push(`%${defect_type}%`);
    }

    query += " ORDER BY d.id DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET SINGLE DEFECT
// ============================================
export const getDefect = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT d.*, l.material_name
       FROM qc_defects d
       LEFT JOIN qc_lots l ON d.lot_id = l.id
       WHERE d.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// ============================================
// CREATE DEFECT
// ============================================
export const createDefect = async (req, res, next) => {
  try {
    const { lot_id, defect_type, qty_rejected, unit, severity, remarks } =
      req.body;

    if (!lot_id || !defect_type) {
      return res
        .status(400)
        .json({ message: "lot_id and defect_type are required" });
    }

    const [result] = await db.query(
      `INSERT INTO qc_defects (lot_id, defect_type, qty_rejected, unit, severity, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lot_id,
        defect_type,
        qty_rejected || 0,
        unit || null,
        severity || "MINOR",
        remarks || null,
      ],
    );

    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// UPDATE DEFECT
// ============================================
export const updateDefect = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { defect_type, qty_rejected, unit, severity, remarks } = req.body;

    const [result] = await db.query(
      `UPDATE qc_defects 
       SET defect_type = ?, qty_rejected = ?, unit = ?, severity = ?, remarks = ?
       WHERE id = ?`,
      [
        defect_type,
        qty_rejected || 0,
        unit || null,
        severity || "MINOR",
        remarks || null,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.json({ id, success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// DELETE DEFECT
// ============================================
export const deleteDefect = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM qc_defects WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET DEFECTS BY LOT
// ============================================
export const getDefectsByLot = async (req, res, next) => {
  try {
    const lotId = Number(req.params.lotId);
    const [rows] = await db.query(
      `SELECT * FROM qc_defects WHERE lot_id = ? ORDER BY severity DESC, id`,
      [lotId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET DEFECTS BY SEVERITY
// ============================================
export const getDefectsBySeverity = async (req, res, next) => {
  try {
    const severity = req.params.severity.toUpperCase();
    const [rows] = await db.query(
      `SELECT d.*, l.material_name
       FROM qc_defects d
       LEFT JOIN qc_lots l ON d.lot_id = l.id
       WHERE d.severity = ?
       ORDER BY d.id DESC`,
      [severity],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET DEFECTS BY TYPE
// ============================================
export const getDefectsByType = async (req, res, next) => {
  try {
    const defectType = req.params.defectType;
    const [rows] = await db.query(
      `SELECT d.*, l.material_name
       FROM qc_defects d
       LEFT JOIN qc_lots l ON d.lot_id = l.id
       WHERE d.defect_type LIKE ?
       ORDER BY d.id DESC`,
      [`%${defectType}%`],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// BULK CREATE DEFECTS
// ============================================
export const bulkCreateDefects = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const lotId = Number(req.params.lotId);
    const { defects } = req.body;

    if (!lotId || !Array.isArray(defects) || defects.length === 0) {
      return res
        .status(400)
        .json({ message: "lotId and defects array are required" });
    }

    await conn.beginTransaction();

    let inserted = 0;
    for (const d of defects) {
      await conn.query(
        `INSERT INTO qc_defects (lot_id, defect_type, qty_rejected, unit, severity, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          lotId,
          d.defect_type,
          d.qty_rejected || 0,
          d.unit || null,
          d.severity || "MINOR",
          d.remarks || null,
        ],
      );
      inserted++;
    }

    await conn.commit();
    res.status(201).json({ inserted, success: true });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// ============================================
// BULK DELETE DEFECTS
// ============================================
export const bulkDeleteDefects = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }

    const placeholders = ids.map(() => "?").join(",");
    const [result] = await db.query(
      `DELETE FROM qc_defects WHERE id IN (${placeholders})`,
      ids,
    );

    res.json({ deleted: result.affectedRows, success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET DEFECT STATS
// ============================================
export const getDefectStats = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_defects,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'MAJOR' THEN 1 ELSE 0 END) as major,
        SUM(CASE WHEN severity = 'MINOR' THEN 1 ELSE 0 END) as minor,
        COUNT(DISTINCT lot_id) as lots_affected
       FROM qc_defects`,
    );
    res.json(
      rows[0] || {
        total_defects: 0,
        critical: 0,
        major: 0,
        minor: 0,
        lots_affected: 0,
      },
    );
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET DEFECT STATS BY LOT
// ============================================
export const getDefectStatsByLot = async (req, res, next) => {
  try {
    const lotId = Number(req.params.lotId);
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_defects,
        SUM(qty_rejected) as total_rejected,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'MAJOR' THEN 1 ELSE 0 END) as major,
        SUM(CASE WHEN severity = 'MINOR' THEN 1 ELSE 0 END) as minor
       FROM qc_defects
       WHERE lot_id = ?`,
      [lotId],
    );
    res.json(
      rows[0] || {
        total_defects: 0,
        total_rejected: 0,
        critical: 0,
        major: 0,
        minor: 0,
      },
    );
  } catch (err) {
    next(err);
  }
};
