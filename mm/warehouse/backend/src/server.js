const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/warehouse', require('./routes/warehouse.routes'));
app.use('/api/item', require('./routes/item.routes'));
app.use('/api/grn', require('./routes/grn.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/pickpack', require('./routes/pickpack.routes'));
app.use('/api/transfer', require('./routes/transfer.routes'));
app.use('/api/report', require('./routes/report.routes'));
app.use('/api/dispatch', require('./routes/dispatch.routes')); 
app.use('/api/cycle-counts', require('./routes/cyclecount.routes'));

// 🆕 ADD INTEGRATION ROUTE (NEW)
app.use('/api/integration', require('./routes/integration.routes'));


app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`✅ WM Backend: http://localhost:${PORT}`));
