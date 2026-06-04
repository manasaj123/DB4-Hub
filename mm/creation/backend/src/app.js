import express from "express";
import cors from "cors";
import vendorRoutes from "./routes/vendorRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import prRoutes from "./routes/prRoutes.js";
import poRoutes from "./routes/poRoutes.js";
import grnRoutes from "./routes/grnRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import stockTransferRoutes from "./routes/stockTransferRoutes.js";
import rfqRoutes from "./routes/rfqRoutes.js";

// import grRoutes from "./routes/grRoutes.js";
import giRoutes from "./routes/giRoutes.js";




const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/vendors", vendorRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/po", poRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/stock-transfer", stockTransferRoutes);
app.use("/api/rfq", rfqRoutes);
// app.use("/api/gr", grRoutes);
app.use("/api/gi", giRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
