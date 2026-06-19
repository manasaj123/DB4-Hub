// backend/src/routes/qcDashboardRoutes.js
import express from "express";
import { getSummary } from "../controllers/qcDashboardController.js";

const router = express.Router();

router.get("/summary", getSummary);

export default router;
