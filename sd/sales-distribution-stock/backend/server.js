// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Clear require cache for models
Object.keys(require.cache).forEach(key => {
  if (key.includes('models') || key.includes('Customer')) {
    console.log('Clearing cache for:', key);
    delete require.cache[key];
  }
});

dotenv.config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

const db = require("./models");

// Debug: Check model fields on startup
console.log("=== MODEL FIELDS ON STARTUP ===");
console.log("Customer fields:", Object.keys(db.Customer.rawAttributes));
console.log("Has email?", "email" in db.Customer.rawAttributes);
console.log("Has phone?", "phone" in db.Customer.rawAttributes);
console.log("Has address?", "address" in db.Customer.rawAttributes);
console.log("Has gstNumber?", "gstNumber" in db.Customer.rawAttributes);
console.log("================================");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3012", "http://localhost:3013"],
    credentials: false,
  }),
);

app.use(express.json());

// routes
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/material-sales", require("./routes/materialsalesRoutes"));
app.use("/api/customer-groups", require("./routes/customerGroupRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/sales-orders", require("./routes/salesOrderRoutes"));
app.use("/api/sales-documents", require("./routes/salesDocumentRoutes"));
app.use(
  "/api/item-categories-config",
  require("./routes/itemCategoriesRoutes"),
);
app.use("/api/schedule-lines", require("./routes/scheduleLineRoutes"));
app.use("/api/conditions", require("./routes/conditionRoutes"));
app.use("/api/agreements", require("./routes/agreementRoutes"));
app.use("/api/quotas", require("./routes/quotaRoutes"));
app.use("/api/shipping", require("./routes/shippingRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/deliveries", require("./routes/deliveryRoutes"));
app.use("/api/pickings", require("./routes/pickingRoutes"));
app.use("/api/billings", require("./routes/billingRoutes"));
app.use("/api/credits", require("./routes/creditRoutes"));
app.use("/api/pricing", require("./routes/pricingRoutes"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/pgi", require("./routes/pgi"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/integration", require("./routes/integrationRoutes"));

const PORT = process.env.PORT || 5011;

// CHANGE: Remove { alter: true } 
db.sequelize
  .sync()  // Just sync without any options
  .then(() => {
    console.log("DB sync successful");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB sync error:", err);
  });