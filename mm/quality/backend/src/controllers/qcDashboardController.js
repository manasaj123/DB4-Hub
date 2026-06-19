// backend/src/controllers/qcDashboardController.js
import db from "../config/db.js";

export const getSummary = async (req, res, next) => {
  try {
    // Get QC Lots stats
    const [lotsStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'ACCEPTED_WITH_DEVIATION' THEN 1 ELSE 0 END) as accepted_with_deviation
       FROM qc_lots`,
    );

    // Get QC Plans stats
    const [plansStats] = await db.query(
      `SELECT COUNT(DISTINCT material_id) as total FROM material_qc_templates`,
    );

    // Get CAPA stats
    const [capaStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed
       FROM capa`,
    );

    // Get Defects stats
    const [defectStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'MAJOR' THEN 1 ELSE 0 END) as major,
        SUM(CASE WHEN severity = 'MINOR' THEN 1 ELSE 0 END) as minor
       FROM qc_defects`,
    );

    // Get Results stats
    const [resultStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pass_fail = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN pass_fail = 0 THEN 1 ELSE 0 END) as failed
       FROM qc_results`,
    );

    res.json({
      lots: lotsStats[0] || {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        accepted_with_deviation: 0,
      },
      plans: plansStats[0] || { total: 0 },
      capa: capaStats[0] || { total: 0, open: 0, in_progress: 0, closed: 0 },
      defects: defectStats[0] || { total: 0, critical: 0, major: 0, minor: 0 },
      results: resultStats[0] || { total: 0, passed: 0, failed: 0 },
    });
  } catch (err) {
    next(err);
  }
};
