import express from "express";
import {
  getRFQs,
  createRFQ,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  getRFQWithQuotes, // 👈 new
  saveVendorQuotes, // 👈 new
} from "../controllers/rfqController.js";

const router = express.Router();

router.get("/", getRFQs);
router.post("/", createRFQ);
router.get("/:id/with-quotes", getRFQWithQuotes); // specific first
router.get("/:id", getRFQById); // generic after
router.put("/:id", updateRFQ);
router.delete("/:id", deleteRFQ);
router.post("/save-quotes", saveVendorQuotes);

export default router;
