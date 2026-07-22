import express from "express";
import {
  createGRN,
  getGRNs,
  getGRNById,
  updateGRN,
  deleteGRN,
  getLocations
} from "../controllers/grnController.js";

const router = express.Router();

router.get("/", getGRNs);
router.get("/:id", getGRNById);
router.get("/locations", getLocations);
router.post("/", createGRN);
router.put("/:id", updateGRN);
router.delete("/:id", deleteGRN);

export default router;
