const db = require('../config/db');

exports.getRequirements = async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log('GET /mrp - Date:', date);
    
    const [rows] = await db.query(
      `SELECT m.*, 
              p.code as product_code, 
              p.name as product_name, 
              m2.code as material_code, 
              m2.name as material_name 
       FROM mrp_requirements m 
       LEFT JOIN products p ON m.product_id = p.id 
       LEFT JOIN products m2 ON m.material_id = m2.id 
       WHERE m.need_date = ? 
       ORDER BY m.id`,
      [date]
    );
    
    console.log('GET /mrp - Rows found:', rows.length);
    res.json(rows);
    
  } catch (err) {
    console.error('GET /mrp Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

exports.run = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { date } = req.body;
    
    console.log('========================================');
    console.log('MRP RUN STARTED');
    console.log('Date:', date);
    console.log('========================================');
    
    await connection.beginTransaction();
    
    // 1. Get production plan for the specific date
    const [planRows] = await connection.query(
      'SELECT * FROM production_plan WHERE plan_date = ? AND status != ?',
      [date, 'cancelled']
    );
    
    console.log('📋 Production Plan Lines Found:', planRows.length);
    
    if (planRows.length === 0) {
      await connection.commit();
      console.log('❌ No production plan found for date:', date);
      console.log('========================================');
      return res.json({ 
        message: 'No production plan found for this date',
        inserted: 0,
        planLines: 0,
        rawCount: 0
      });
    }
    
    // Log each plan line
    planRows.forEach((plan, index) => {
      console.log(`  Plan Line ${index + 1}: product_id=${plan.product_id}, qty=${plan.planned_qty}, grade_pack_id=${plan.grade_pack_id}`);
    });
    
    // 2. Delete existing MRP requirements ONLY for this date
    const [deleteResult] = await connection.query(
      'DELETE FROM mrp_requirements WHERE need_date = ?', 
      [date]
    );
    console.log('🗑️ Deleted old MRP records:', deleteResult.affectedRows);
    
    // 3. Calculate raw requirements from BOM
    const rawRequirements = [];
    
    for (const plan of planRows) {
      console.log(`\n🔍 Processing Product ID: ${plan.product_id}`);
      
      // Get BOM for this product
      let [bomRows] = await connection.query(
        'SELECT b.*, m.code as material_code, m.name as material_name FROM bom b JOIN products m ON b.material_id = m.id WHERE b.product_id = ?',
        [plan.product_id]
      );
      
      console.log(`  BOM entries found: ${bomRows.length}`);
      
      // If no BOM found and grade_pack_id exists, try with grade_pack_id
      if ((!bomRows || bomRows.length === 0) && plan.grade_pack_id) {
        try {
          console.log(`  Trying BOM with grade_pack_id=${plan.grade_pack_id}...`);
          [bomRows] = await connection.query(
            'SELECT b.*, m.code as material_code, m.name as material_name FROM bom b JOIN products m ON b.material_id = m.id WHERE b.product_id = ? AND b.grade_pack_id = ?',
            [plan.product_id, plan.grade_pack_id]
          );
          console.log(`  BOM with grade_pack_id found: ${bomRows.length}`);
        } catch (e) {
          console.log(`  ⚠️ grade_pack_id query failed: ${e.message}`);
        }
      }
      
      if (!bomRows || bomRows.length === 0) {
        console.log(`  ❌ No BOM defined for product_id=${plan.product_id} - SKIPPING`);
        continue;
      }
      
      // 4. Calculate material requirements for each BOM line
      for (const bom of bomRows) {
        const requiredQty = parseFloat(plan.planned_qty) * parseFloat(bom.qty_per_unit || 1);
        
        console.log(`  ✅ Material: ${bom.material_code || bom.material_id} (ID:${bom.material_id}) = ${requiredQty} (${plan.planned_qty} × ${bom.qty_per_unit})`);
        
        rawRequirements.push({
          product_id: plan.product_id,
          material_id: bom.material_id,
          material_code: bom.material_code,
          material_name: bom.material_name,
          required_qty: requiredQty,
          status: 'open'
        });
      }
    }
    
    console.log(`\n📦 Total Raw Requirements: ${rawRequirements.length}`);
    
    // 5. Aggregate duplicate product-material combinations
    const aggregatedMap = new Map();
    
    for (const req of rawRequirements) {
      const key = `${req.product_id}-${req.material_id}`;
      
      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key);
        const oldQty = existing.required_qty;
        existing.required_qty = parseFloat(existing.required_qty) + parseFloat(req.required_qty);
        console.log(`  🔄 Aggregated: ${key} - ${oldQty} + ${req.required_qty} = ${existing.required_qty}`);
      } else {
        aggregatedMap.set(key, { ...req });
        console.log(`  ➕ New: ${key} = ${req.required_qty}`);
      }
    }
    
    const aggregatedRequirements = Array.from(aggregatedMap.values());
    
    console.log(`\n✅ After Aggregation: ${aggregatedRequirements.length} unique requirements (from ${rawRequirements.length} raw)`);
    
    // 6. Insert aggregated requirements
    let insertedCount = 0;
    
    for (const req of aggregatedRequirements) {
      try {
        // Try inserting without grade_pack_id first
        await connection.query(
          'INSERT INTO mrp_requirements (need_date, product_id, material_id, required_qty, status) VALUES (?, ?, ?, ?, ?)',
          [date, req.product_id, req.material_id, req.required_qty.toFixed(2), req.status]
        );
        insertedCount++;
        console.log(`  💾 Inserted: product=${req.product_id}, material=${req.material_id}, qty=${req.required_qty.toFixed(2)}`);
        
      } catch (insertErr) {
        // If grade_pack_id is required, try with it set to null
        if (insertErr.message.includes('grade_pack_id')) {
          try {
            await connection.query(
              'INSERT INTO mrp_requirements (need_date, product_id, grade_pack_id, material_id, required_qty, status) VALUES (?, ?, ?, ?, ?, ?)',
              [date, req.product_id, null, req.material_id, req.required_qty.toFixed(2), req.status]
            );
            insertedCount++;
            console.log(`  💾 Inserted (with null grade_pack_id): product=${req.product_id}, material=${req.material_id}`);
          } catch (err2) {
            console.error(`  ❌ Insert failed: ${err2.message}`);
            throw err2;
          }
        } else {
          console.error(`  ❌ Insert error: ${insertErr.message}`);
          throw insertErr;
        }
      }
    }
    
    await connection.commit();
    
    const result = {
      message: insertedCount > 0 
        ? `Generated ${insertedCount} material requirements from ${planRows.length} production plan lines`
        : 'No BOM found for products in production plan',
      inserted: insertedCount,
      planLines: planRows.length,
      rawCount: rawRequirements.length,
      aggregated: rawRequirements.length > insertedCount
    };
    
    console.log('========================================');
    console.log('MRP RUN COMPLETED');
    console.log('Result:', JSON.stringify(result));
    console.log('========================================\n');
    
    res.json(result);
    
  } catch (err) {
    await connection.rollback();
    console.error('========================================');
    console.error('❌ MRP RUN FAILED');
    console.error('Error:', err.message);
    console.error('SQL:', err.sql);
    console.error('========================================\n');
    res.status(500).json({ error: 'Server error: ' + err.message });
  } finally {
    connection.release();
  }
};