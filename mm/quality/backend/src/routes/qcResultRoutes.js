// backend/src/routes/qcResultRoutes.js
import express from "express";
import {
  listResults,
  getResult,
  createResult,
  updateResult,
  deleteResult,
  getResultsByLot,
  getResultsByParameter,
  getResultsByStatus,
  bulkCreateResults,
  getPassRate,
  getResultStats,
} from "../controllers/qcResultController.js";

const router = express.Router();

// ============================================
// STATISTICS
// ============================================
router.get("/stats", getResultStats);
router.get("/pass-rate/:lotId", getPassRate);

// ============================================
// FILTERS
// ============================================
router.get("/lot/:lotId", getResultsByLot);
router.get("/parameter/:parameterId", getResultsByParameter);
router.get("/status/:passFail", getResultsByStatus);

// ============================================
// CRUD
// ============================================
router.get("/", listResults);
router.get("/:id", getResult);
router.post("/", createResult);
router.put("/:id", updateResult);
router.delete("/:id", deleteResult);

// ============================================
// BULK
// ============================================
router.post("/bulk", bulkCreateResults);

export default router;
