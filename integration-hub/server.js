const express = require("express");
const mysql = require("mysql2/promise");
const axios = require("axios");
const app = express();
app.use(express.json());

let db;

// Helper function to generate unique code for all modules
function getUniqueCode(material) {
  // PRIORITY 1: Use material_number from MM Creation (BEST - already unique)
  if (material.material_number) {
    return material.material_number.toUpperCase();
  }
  // FALLBACK: Generate from name + ID (only if material_number missing)
  return `${material.name.substring(0, 8)}_${material.id}`
    .toUpperCase()
    .replace(/\s/g, "");
}

async function initDB() {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Anson.0983",
    database: "integration_hub",
  });
  console.log("✅ Integration Hub DB connected");
}

// ============================================
// SYNC MATERIAL TO ALL MODULES
// ============================================
app.post("/api/material/sync", async (req, res) => {
  const { source, material } = req.body;

  console.log(`\n📦 Syncing material "${material.name}"...`);
  console.log(
    `   Material Number: ${material.material_number || "Not provided"}`,
  );

  const common_key = material.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Save or update mapping
  await db.query(
    `INSERT INTO material_mapping (common_key, name, mm_creation_id) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE mm_creation_id = ?`,
    [common_key, material.name, material.id, material.id],
  );

  const results = {};
  const uniqueCode = getUniqueCode(material);
  console.log(`   Using unique code: ${uniqueCode}`);

  // ==========================================
  // 1. Sync to MM CORE (Port 5001)
  // ==========================================
  try {
    const response = await axios.post(
      "http://localhost:5001/api/integration/material",
      {
        name: material.name,
        unit: material.uom,
        shelf_life: material.shelf_life_days,
      },
    );
    await db.query(
      `UPDATE material_mapping SET mm_core_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.mm_core = "✅";
    console.log(`   ✅ MM Core (ID: ${response.data.id})`);
  } catch (err) {
    results.mm_core = "❌";
    console.log(`   ❌ MM Core failed: ${err.message}`);
  }

  // ==========================================
  // 2. Sync to WAREHOUSE (Port 5005)
  // ==========================================
  try {
    const response = await axios.post(
      "http://localhost:5005/api/integration/item",
      {
        sku: uniqueCode,
        name: material.name,
        unit: material.uom,
      },
    );
    await db.query(
      `UPDATE material_mapping SET warehouse_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.warehouse = "✅";
    console.log(
      `   ✅ Warehouse (ID: ${response.data.id}, SKU: ${uniqueCode})`,
    );
  } catch (err) {
    results.warehouse = "❌";
    console.log(`   ❌ Warehouse failed: ${err.message}`);
  }

  // ==========================================
  // 3. Sync to SD DISTRIBUTION (Port 5011)
  // ==========================================
  try {
    const response = await axios.post(
      "http://localhost:5011/api/integration/material",
      {
        materialCode: uniqueCode,
        description: material.name,
        baseUom: material.uom,
        materialType: material.material_type || "RAW",
      },
    );
    await db.query(
      `UPDATE material_mapping SET sd_distribution_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.sd_distribution = "✅";
    console.log(
      `   ✅ SD Distribution (ID: ${response.data.id}, Code: ${uniqueCode})`,
    );
  } catch (err) {
    results.sd_distribution = "❌";
    console.log(`   ❌ SD Distribution failed: ${err.message}`);
  }

  // ==========================================
  // 4. Sync to PRODUCTION (Port 4000)
  // ==========================================
  try {
    const response = await axios.post(
      "http://localhost:4000/api/integration/product",
      {
        code: uniqueCode,
        name: material.name,
        type: "raw_material",
      },
    );
    await db.query(
      `UPDATE material_mapping SET production_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.production = "✅";
    console.log(
      `   ✅ Production (ID: ${response.data.id}, Code: ${uniqueCode})`,
    );
  } catch (err) {
    results.production = "❌";
    console.log(`   ❌ Production failed: ${err.message}`);
  }

  // ==========================================
  // 5. Sync to QUALITY (Port 5004)
  // ==========================================
  try {
    const response = await axios.post(
      "http://localhost:5004/api/integration/material",
      {
        material_name: material.name,
        material_code: uniqueCode,
      },
    );
    await db.query(
      `UPDATE material_mapping SET quality_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.quality = "✅";
    console.log(`   ✅ Quality (ID: ${response.data.id}, Code: ${uniqueCode})`);
  } catch (err) {
    results.quality = "❌";
    console.log(`   ❌ Quality failed: ${err.message}`);
  }

  // 6. Sync to INSPECTION (Port 5003)
  try {
    const inspectionCode = getUniqueCode(material);

    console.log(
      `   🔗 Calling Inspection at http://localhost:5003/api/integration/material`,
    );
    const response = await axios.post(
      "http://localhost:5003/api/integration/material",
      {
        material_code: inspectionCode,
        material_name: material.name,
      },
    );
    await db.query(
      `UPDATE material_mapping SET inspection_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.inspection = "✅";
    console.log(
      `   ✅ Inspection (ID: ${response.data.id}, Code: ${inspectionCode})`,
    );
  } catch (err) {
    results.inspection = "❌";
    console.log(`   ❌ Inspection failed: ${err.message}`);
  }

  // 7. Sync to SALES FLOW (Port 5007)
  try {
    const salesCode = getUniqueCode(material);

    console.log(
      `   🔗 Calling Sales Flow at http://localhost:5007/api/integration/product`,
    );
    const response = await axios.post(
      "http://localhost:5007/api/integration/product",
      {
        name: material.name,
        code: salesCode,
        uom: material.uom,
        price: 0,
      },
    );
    await db.query(
      `UPDATE material_mapping SET sales_flow_product_id = ? WHERE common_key = ?`,
      [response.data.id, common_key],
    );
    results.sales_flow = "✅";
    console.log(
      `   ✅ Sales Flow (ID: ${response.data.id}, Code: ${salesCode})`,
    );
  } catch (err) {
    results.sales_flow = "❌";
    console.log(`   ❌ Sales Flow failed: ${err.message}`);
  }

  console.log(`\n📊 Sync Results:`, results);
  res.json({ success: true, results, unique_code: uniqueCode });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

// ============================================
// WEBHOOK: Sales Order Created (from SD Distribution)
// ============================================
app.post("/webhook/sales-order-created", async (req, res) => {
  const {
    order_id,
    order_number,
    customer_name,
    material_code,
    quantity,
    uom,
  } = req.body;

  console.log(
    `📋 Sales Order Webhook: ${order_number} for ${customer_name} (Material: ${material_code})`,
  );

  try {
    await db.query(
      `INSERT INTO document_mapping (document_type, source_module, source_document_id, source_document_number, customer_name, material_code, order_id, quantity, uom)
             VALUES ('SALES_ORDER', 'sd_distribution', ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        order_number,
        customer_name,
        material_code,
        order_id,
        quantity || 0,
        uom || "KG",
      ],
    );
    console.log(`   ✅ Sales Order ${order_number} recorded`);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBHOOK: Delivery Created (from SD Delivery)
// ============================================
app.post("/webhook/delivery-created", async (req, res) => {
  const {
    delivery_id,
    delivery_number,
    order_id,
    customer_name,
    driver_name,
    status,
  } = req.body;

  console.log(
    `🚚 Delivery Webhook: ${delivery_number} for Order: ${order_id}, Driver: ${driver_name || "Not assigned"}`,
  );

  try {
    // Link delivery to existing sales order
    const [result] = await db.query(
      `SELECT id FROM document_mapping WHERE source_document_id = ? AND document_type = 'SALES_ORDER'`,
      [order_id],
    );

    if (result.length > 0) {
      await db.query(
        `UPDATE document_mapping 
                 SET target_module = 'sd_delivery', target_document_id = ?, target_document_number = ?, status = ?
                 WHERE source_document_id = ? AND document_type = 'SALES_ORDER'`,
        [delivery_id, delivery_number, status || "PENDING", order_id],
      );
      console.log(
        `   ✅ Delivery ${delivery_number} linked to existing Sales Order ${order_id}`,
      );
    } else {
      // Insert as standalone delivery
      await db.query(
        `INSERT INTO document_mapping (document_type, source_module, source_document_id, source_document_number, target_module, target_document_id, target_document_number, customer_name, order_id, status)
                 VALUES ('DELIVERY', 'sd_delivery', ?, ?, 'sd_delivery', ?, ?, ?, ?, ?)`,
        [
          delivery_id,
          delivery_number,
          delivery_id,
          delivery_number,
          customer_name,
          order_id,
          status || "PENDING",
        ],
      );
      console.log(`   ✅ Delivery ${delivery_number} recorded as standalone`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBHOOK: Order Returned (from SD Delivery)
// ============================================
app.post("/webhook/order-returned", async (req, res) => {
  const { order_id, return_reason, credit_amount } = req.body;

  console.log(
    `↩️ Return Webhook: Order ${order_id}, Credit: ₹${credit_amount || 0}`,
  );

  try {
    await db.query(
      `UPDATE document_mapping 
             SET return_reason = ?, credit_amount = ?, return_status = 'RETURNED'
             WHERE source_document_id = ? AND document_type = 'SALES_ORDER'`,
      [return_reason || null, credit_amount || 0, order_id],
    );

    console.log(`   ✅ Return recorded for Order ${order_id}`);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 INTEGRATION HUB RUNNING");
  console.log(`📡 Port: ${PORT}`);
  console.log("=".repeat(50));
  console.log("\n📋 Syncing to:");
  console.log("   ✅ MM Core (Port 5001)");
  console.log("   ✅ Warehouse (Port 5005)");
  console.log("   ✅ SD Distribution (Port 5011)");
  console.log("   ✅ Production (Port 4000)");
  console.log("   ✅ Quality (Port 5004)");
  console.log("   ✅ Inspection (Port 5003)");
  console.log("   ✅ Sales Flow (Port 5007)");
  console.log("\n📋 Webhooks:");
  console.log("   POST /webhook/sales-order-created");
  console.log("   POST /webhook/delivery-created");
  console.log("   POST /webhook/order-returned");
  console.log("\n💡 Using unique codes from material_number when available");
});

initDB();
