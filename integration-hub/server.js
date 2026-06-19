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

  // Save or update mapping - include material_code
  await db.query(
    `INSERT INTO material_mapping (common_key, name, mm_creation_id, material_code) 
   VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE 
     mm_creation_id = VALUES(mm_creation_id),
     material_code = VALUES(material_code)`,
    [common_key, material.name, material.id, material.material_number],
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
// API: SYNC VENDOR/FARMER FROM MM CREATION
// ============================================
// ============================================
// API: SYNC VENDOR/FARMER FROM MM CREATION
// ============================================
// ============================================
// API: SYNC VENDOR/FARMER FROM MM CREATION
// ============================================
app.post("/api/vendor/sync", async (req, res) => {
  const { source, vendor } = req.body;

  console.log(
    `🏢 Syncing ${vendor.type || "FARMER"} "${vendor.name}" from ${source || "mm_creation"}`,
  );

  try {
    const common_key = vendor.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    // Save or update mapping
    await db.query(
      `INSERT INTO vendor_mapping (common_key, name, type, mm_creation_id, contact, gst_no, address, bank_details, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         mm_creation_id = VALUES(mm_creation_id),
         name = VALUES(name),
         type = VALUES(type),
         contact = VALUES(contact),
         gst_no = VALUES(gst_no),
         address = VALUES(address),
         bank_details = VALUES(bank_details),
         rating = VALUES(rating)`,
      [
        common_key,
        vendor.name,
        vendor.type,
        vendor.id,
        vendor.contact,
        vendor.gst_no,
        vendor.address,
        vendor.bank_details,
        vendor.rating || 0,
      ],
    );

    // Sync to MM CORE (Port 5001)
    try {
      // ✅ CRITICAL: Send type to MM Core
      const payload = {
        name: vendor.name,
        address: vendor.address,
        contact: vendor.contact,
        bank_account: vendor.bank_details,
        type: vendor.type,
      };

      console.log(`   Sending to MM Core:`, payload);

      const response = await axios.post(
        "http://localhost:5001/api/integration/vendor",
        payload,
      );

      await db.query(
        `UPDATE vendor_mapping SET mm_core_id = ? WHERE common_key = ?`,
        [response.data.id, common_key],
      );

      console.log(
        `   ✅ Synced to MM Core (ID: ${response.data.id}, Type: ${vendor.type || "FARMER"})`,
      );
    } catch (err) {
      console.log(`   ❌ MM Core failed: ${err.message}`);
      if (err.response) {
        console.log(`   Response:`, err.response.data);
      }
    }

    res.json({ success: true, common_key });
  } catch (error) {
    console.error("❌ Vendor sync failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API: SYNC CUSTOMER FROM SD DISTRIBUTION
// ============================================
app.post("/api/customer/sync", async (req, res) => {
  const { source, customer } = req.body;

  console.log(`👤 Syncing customer "${customer.name}" from ${source}`);

  try {
    const common_key = customer.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    // Save or update mapping
    await db.query(
      `INSERT INTO customer_mapping (common_key, name, sd_distribution_id, email, phone, customer_code, gst_number, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         sd_distribution_id = VALUES(sd_distribution_id),
         name = VALUES(name),
         email = VALUES(email),
         phone = VALUES(phone),
         customer_code = VALUES(customer_code),
         gst_number = VALUES(gst_number),
         address = VALUES(address)`,
      [
        common_key,
        customer.name,
        customer.id,
        customer.email,
        customer.phone,
        customer.customer_code,
        customer.gst_number,
        customer.address,
      ],
    );

    // 1. Sync to MM CORE (Port 5001)
    try {
      const payload = {
        name: customer.name,
        address: customer.address,
        contact: customer.phone,
        email: customer.email,
        gst_number: customer.gst_number,
        customer_code: customer.customer_code,
      };

      const response = await axios.post(
        "http://localhost:5001/api/integration/customer",
        payload,
      );

      await db.query(
        `UPDATE customer_mapping SET mm_core_id = ? WHERE common_key = ?`,
        [response.data.id, common_key],
      );

      console.log(`   ✅ Synced to MM Core (ID: ${response.data.id})`);
    } catch (err) {
      console.log(`   ❌ MM Core failed: ${err.message}`);
    }

    // 2. Sync to SALES FLOW (Port 5007)
    try {
      const defaultPassword = `Welcome@${customer.customer_code || "123"}`;

      const response = await axios.post(
        "http://localhost:5007/api/integration/user",
        {
          name: customer.name,
          email:
            customer.email ||
            `${customer.name.toLowerCase().replace(/ /g, ".")}@company.com`,
          password: defaultPassword,
          role: "viewer", // Default role for customers
        },
      );

      await db.query(
        `UPDATE customer_mapping SET sales_flow_user_id = ? WHERE common_key = ?`,
        [response.data.id, common_key],
      );

      console.log(`   ✅ Synced to Sales Flow (User ID: ${response.data.id})`);
    } catch (err) {
      console.log(`   ❌ Sales Flow failed: ${err.message}`);
    }

    res.json({ success: true, common_key });
  } catch (error) {
    console.error("Customer sync failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API: STOCK SYNC (FIXED VERSION)
// ============================================
app.post("/api/stock/sync", async (req, res) => {
  const { material_code, quantity, module } = req.body;

  console.log(`📊 Stock sync: ${material_code} → ${quantity} (from ${module})`);

  try {
    // Get material mapping - using rows[0] approach
    const [rows] = await db.query(
      "SELECT * FROM material_mapping WHERE material_code = ?",
      [material_code],
    );

    const mapping = rows[0];

    console.log(`   🔍 Mapping found:`, mapping);

    if (!mapping) {
      console.log(`   ❌ Material not found: ${material_code}`);
      return res.status(404).json({ error: "Material not found in mapping" });
    }

    console.log(`   🔍 mm_core_id: ${mapping.mm_core_id}`);
    console.log(`   🔍 sd_distribution_id: ${mapping.sd_distribution_id}`);
    console.log(`   🔍 warehouse_id: ${mapping.warehouse_id}`);

    const results = {};

    // 1. Sync to MM CORE (Port 5001)
    if (mapping.mm_core_id) {
      try {
        await axios.post("http://localhost:5001/api/integration/stock", {
          material_id: mapping.mm_core_id,
          quantity: quantity,
        });
        results.mm_core = "✅";
        console.log(`   ✅ MM Core (ID: ${mapping.mm_core_id})`);
      } catch (err) {
        results.mm_core = "❌";
        console.log(`   ❌ MM Core: ${err.message}`);
      }
    }

    // 2. Sync to SD DISTRIBUTION (Port 5011)
    if (mapping.sd_distribution_id) {
      try {
        await axios.post("http://localhost:5011/api/integration/stock", {
          material_id: mapping.sd_distribution_id,
          quantity: quantity,
        });
        results.sd_distribution = "✅";
        console.log(
          `   ✅ SD Distribution (ID: ${mapping.sd_distribution_id})`,
        );
      } catch (err) {
        results.sd_distribution = "❌";
        console.log(`   ❌ SD Distribution: ${err.message}`);
      }
    }

    // 3. Sync to WAREHOUSE (Port 5005)
    if (mapping.warehouse_id) {
      try {
        await axios.post("http://localhost:5005/api/integration/stock", {
          item_id: mapping.warehouse_id,
          quantity: quantity,
        });
        results.warehouse = "✅";
        console.log(`   ✅ Warehouse (ID: ${mapping.warehouse_id})`);
      } catch (err) {
        results.warehouse = "❌";
        console.log(`   ❌ Warehouse: ${err.message}`);
      }
    }

    console.log(`\n📊 Stock Sync Results:`, results);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Stock sync failed:", error);
    res.status(500).json({ error: error.message });
  }
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
  console.log("\n📋 API Endpoints:");
  console.log("   POST /api/material/sync");
  console.log("   POST /api/vendor/sync");
  console.log("   POST /api/customer/sync");
  console.log("   POST /api/stock/sync");
  console.log("   GET  /health");
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
