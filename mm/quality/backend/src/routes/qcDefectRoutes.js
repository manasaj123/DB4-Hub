// backend/src/routes/qcDefectRoutes.js
import express from "express";
import {
  listDefects,
  getDefect,
  createDefect,
  updateDefect,
  deleteDefect,
  getDefectsByLot,
  getDefectsBySeverity,
  getDefectsByType,
  bulkCreateDefects,
  bulkDeleteDefects,
  getDefectStats,
  getDefectStatsByLot,
} from "../controllers/qcDefectController.js";

const router = express.Router();

// ============================================
// STATISTICS
// ============================================
router.get("/stats", getDefectStats);
router.get("/stats/lot/:lotId", getDefectStatsByLot);

// ============================================
// FILTERS
// ============================================
router.get("/lot/:lotId", getDefectsByLot);
router.get("/severity/:severity", getDefectsBySeverity);
router.get("/type/:defectType", getDefectsByType);

// ============================================
// CRUD
// ============================================
router.get("/", listDefects);
router.get("/:id", getDefect);
router.post("/", createDefect);
router.put("/:id", updateDefect);
router.delete("/:id", deleteDefect);

// ============================================
// BULK
// ============================================
router.post("/bulk/:lotId", bulkCreateDefects);
router.delete("/bulk", bulkDeleteDefects);

export default router;
