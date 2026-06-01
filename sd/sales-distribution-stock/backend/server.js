// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // load .env FIRST

// Debug: check env values are loaded
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

const db = require('./models'); // uses process.env in models/index.js

const app = express();

// CORS must be before routes
app.use(
  cors({
    origin: ['http://localhost:3012', 'http://localhost:3013'],
    credentials: false, // set true only if you use cookies/auth headers that require it
  })
);

app.use(express.json());

// routes
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/material-sales', require('./routes/materialsalesRoutes'));
app.use('/api/customer-groups', require('./routes/customerGroupRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/sales-orders', require('./routes/salesOrderRoutes'));
app.use('/api/sales-documents', require('./routes/salesDocumentRoutes'));
app.use('/api/item-categories-config', require('./routes/itemCategoriesRoutes'));
app.use('/api/schedule-lines', require('./routes/scheduleLineRoutes'));
app.use('/api/conditions', require('./routes/conditionRoutes'));
app.use('/api/agreements', require('./routes/agreementRoutes'));
app.use('/api/quotas', require('./routes/quotaRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/pickings', require('./routes/pickingRoutes'));
app.use('/api/billings', require('./routes/billingRoutes'));
app.use('/api/credits', require('./routes/creditRoutes'));
app.use('/api/pricing', require('./routes/pricingRoutes'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/pgi', require('./routes/pgi'));
app.use('/api/quotations', require('./routes/quotationRoutes'));

// sync DB then start
const PORT = process.env.PORT || 5011;

db.sequelize
  .sync()
  .then(() => {
    console.log('DB sync successful');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB sync error:', err);
  });
