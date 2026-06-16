const express = require('express');
const cors = require('cors');
require('dotenv').config();

const forecastRoutes = require('./routes/forecastRoutes');
const planRoutes = require('./routes/planRoutes');
const capacityRoutes = require('./routes/capacityRoutes');
const batchRoutes = require('./routes/batchRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const mrpRoutes = require('./routes/mrpRoutes');
const metricRoutes = require('./routes/metricRoutes');
const productRoutes = require('./routes/productRoutes');
const gradePackRoutes = require('./routes/gradePackRoutes');
const bomRoutes = require('./routes/bom');
const integrationRoutes = require('./routes/integration.routes');


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/forecast', forecastRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/mrp', mrpRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/products', productRoutes);
app.use('/api/grade-packs', gradePackRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/integration', integrationRoutes);


const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`PP backend running on port ${port}`);
});
