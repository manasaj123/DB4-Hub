import express from "express";
import {
  createGI,
  getGIs,
  getGIById,
  updateGI,
  deleteGI,
  getPOsForIssue,
  getAvailableBatches,
} from "../controllers/giController.js";

const router = express.Router();
router.get("/", getGIs);
router.post("/", createGI);
router.get("/pos-for-issue", getPOsForIssue);
router.get("/available-batches", getAvailableBatches);
router.get("/:id", getGIById);
router.delete("/:id", deleteGI);

export default router;
