// backend/src/controllers/qcResultController.js
import db from "../config/db.js";

// ============================================
// LIST RESULTS
// ============================================
export const listResults = async (req, res, next) => {
  try {
    const { lot_id, parameter_id, pass_fail } = req.query;

    let query = `
      SELECT r.*, p.name as parameter_name, p.unit as param_unit,
      p.lower_spec_limit, p.upper_spec_limit
      FROM qc_results r
      LEFT JOIN qc_parameters p ON r.parameter_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (lot_id) {
      query += " AND r.lot_id = ?";
      params.push(lot_id);
    }
    if (parameter_id) {
      query += " AND r.parameter_id = ?";
      params.push(parameter_id);
    }
    if (pass_fail !== undefined && pass_fail !== "") {
      query += " AND r.pass_fail = ?";
      params.push(pass_fail);
    }

    query += " ORDER BY r.id DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET SINGLE RESULT
// ============================================
export const getResult = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT r.*, p.name as parameter_name, p.unit as param_unit
       FROM qc_results r
       LEFT JOIN qc_parameters p ON r.parameter_id = p.id
       WHERE r.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// ============================================
// CREATE RESULT
// ============================================
export const createResult = async (req, res, next) => {
  try {
    const { lot_id, parameter_id, measured_value, unit, pass_fail, remark } =
      req.body;

    if (!lot_id || !parameter_id) {
      return res
        .status(400)
        .json({ message: "lot_id and parameter_id are required" });
    }

    const [result] = await db.query(
      `INSERT INTO qc_results (lot_id, parameter_id, measured_value, unit, pass_fail, remark)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lot_id,
        parameter_id,
        measured_value || null,
        unit || null,
        pass_fail || 0,
        remark || null,
      ],
    );

    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// UPDATE RESULT
// ============================================
export const updateResult = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { measured_value, unit, pass_fail, remark } = req.body;

    const [result] = await db.query(
      `UPDATE qc_results 
       SET measured_value = ?, unit = ?, pass_fail = ?, remark = ?
       WHERE id = ?`,
      [
        measured_value || null,
        unit || null,
        pass_fail || 0,
        remark || null,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json({ id, success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// DELETE RESULT
// ============================================
export const deleteResult = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM qc_results WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET RESULTS BY LOT
// ============================================
export const getResultsByLot = async (req, res, next) => {
  try {
    const lotId = Number(req.params.lotId);
    const [rows] = await db.query(
      `SELECT r.*, p.name as parameter_name, p.unit as param_unit,
       p.lower_spec_limit, p.upper_spec_limit
       FROM qc_results r
       LEFT JOIN qc_parameters p ON r.parameter_id = p.id
       WHERE r.lot_id = ?
       ORDER BY r.id`,
      [lotId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET RESULTS BY PARAMETER
// ============================================
export const getResultsByParameter = async (req, res, next) => {
  try {
    const parameterId = Number(req.params.parameterId);
    const [rows] = await db.query(
      `SELECT r.*, l.material_name
       FROM qc_results r
       LEFT JOIN qc_lots l ON r.lot_id = l.id
       WHERE r.parameter_id = ?
       ORDER BY r.id DESC
       LIMIT 100`,
      [parameterId],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET RESULTS BY STATUS
// ============================================
export const getResultsByStatus = async (req, res, next) => {
  try {
    const passFail = Number(req.params.passFail);
    const [rows] = await db.query(
      `SELECT r.*, p.name as parameter_name, l.material_name
       FROM qc_results r
       LEFT JOIN qc_parameters p ON r.parameter_id = p.id
       LEFT JOIN qc_lots l ON r.lot_id = l.id
       WHERE r.pass_fail = ?
       ORDER BY r.id DESC`,
      [passFail],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// ============================================
// BULK CREATE RESULTS
// ============================================
export const bulkCreateResults = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { lotId, results } = req.body;

    if (!lotId || !Array.isArray(results) || results.length === 0) {
      return res
        .status(400)
        .json({ message: "lotId and results array are required" });
    }

    await conn.beginTransaction();

    // Delete existing results for this lot
    await conn.query("DELETE FROM qc_results WHERE lot_id = ?", [lotId]);

    let inserted = 0;
    for (const r of results) {
      await conn.query(
        `INSERT INTO qc_results (lot_id, parameter_id, measured_value, unit, pass_fail, remark)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          lotId,
          r.parameter_id,
          r.measured_value || null,
          r.unit || null,
          r.pass_fail || 0,
          r.remark || null,
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
// GET PASS RATE
// ============================================
export const getPassRate = async (req, res, next) => {
  try {
    const lotId = Number(req.params.lotId);
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pass_fail = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN pass_fail = 0 THEN 1 ELSE 0 END) as failed
       FROM qc_results
       WHERE lot_id = ?`,
      [lotId],
    );

    const total = rows[0]?.total || 0;
    const passed = rows[0]?.passed || 0;
    const failed = rows[0]?.failed || 0;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    res.json({
      total,
      passed,
      failed,
      passRate: Math.round(passRate * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================
// GET RESULT STATS
// ============================================
export const getResultStats = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_results,
        SUM(CASE WHEN pass_fail = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN pass_fail = 0 THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT lot_id) as lots_tested
       FROM qc_results`,
    );
    res.json(
      rows[0] || { total_results: 0, passed: 0, failed: 0, lots_tested: 0 },
    );
  } catch (err) {
    next(err);
  }
};
