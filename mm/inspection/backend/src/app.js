const express = require("express");
const cors = require("cors");

const lotRoutes = require("./routes/lotRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const masterInspectionRoutes = require("./routes/masterInspectionRoutes");

const inspectionMethodRoutes = require("./routes/inspectionMethodRoutes");
const samplingProcedureRoutes = require("./routes/samplingProcedureRoutes");
const inspectionPlanRoutes = require("./routes/inspectionPlanRoutes");
// app.js or index.js in inspection backend
const resultRecordingUsageDecisionRoutes = require("./routes/resultRecordingUsageDecisionRoutes");
const inspectionLotRoutes = require("./routes/inspectionLotRoutes");
const inProcessInspectionRoutes = require("./routes/inProcessInspectionRoutes");
const finalInspectionRoutes = require("./routes/finalInspectionRoutes");
const defectRoutes = require("./routes/defectRoutes");
const qualityNotificationRoutes = require("./routes/qualityNotificationRoutes");
const integrationRoutes = require("./routes/integration.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", lotRoutes);
app.use("/api", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", masterInspectionRoutes);
app.use("/api", inspectionMethodRoutes);
app.use("/api", samplingProcedureRoutes);
app.use("/api", inspectionPlanRoutes);
app.use("/api", resultRecordingUsageDecisionRoutes);
app.use("/api", inspectionLotRoutes);
app.use("/api", inProcessInspectionRoutes);
app.use("/api", finalInspectionRoutes);
app.use("/api", defectRoutes);
app.use("/api", qualityNotificationRoutes);
app.use("/api/integration", integrationRoutes);

module.exports = app;
