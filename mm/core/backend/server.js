import express from "express";
import cors from "cors";

import customerRoutes from "./routes/customerRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import integrationRoutes from "./routes/integration.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/integration", integrationRoutes);

app.listen(5001, () => {
  console.log("Backend running on port 5001");
});
