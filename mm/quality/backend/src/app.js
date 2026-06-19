import express from "express";
import cors from "cors";
import qcLotRoutes from "./routes/qcLotRoutes.js";
import qcMasterRoutes from "./routes/qcMasterRoutes.js";
import capaRoutes from "./routes/capaRoutes.js";
import qcSummaryRoutes from "./routes/qcSummaryRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";

// 🆕 NEW ROUTES
import qcResultRoutes from "./routes/qcResultRoutes.js";
import qcDefectRoutes from "./routes/qcDefectRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Existing routes
app.use("/api/qc/lots", qcLotRoutes);
app.use("/api/qc/master", qcMasterRoutes);
app.use("/api/qc/capa", capaRoutes);
app.use("/api/qc", qcSummaryRoutes);
app.use("/api/integration", integrationRoutes);

// 🆕 NEW routes
app.use("/api/qc/results", qcResultRoutes);
app.use("/api/qc/defects", qcDefectRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

export default app;
