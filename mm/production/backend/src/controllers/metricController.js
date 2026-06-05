const db = require('../config/db');

exports.daily = async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log('=== METRICS CALCULATION ===');
    console.log('Date:', date);
    
    // Get work orders for the date
    const [workOrders] = await db.query(
      'SELECT * FROM work_orders WHERE plan_date = ?',
      [date]
    );
    
    console.log('Total work orders found:', workOrders.length);
    workOrders.forEach((wo, i) => {
      console.log(`  WO #${i+1}: ID=${wo.id}, Status="${wo.status}", Planned=${wo.planned_qty}, Actual=${wo.actual_qty}, Wastage=${wo.wastage_qty}`);
    });
    
    // Separate active and cancelled orders
    const activeOrders = workOrders.filter(wo => 
      wo.status !== 'cancelled' && wo.status !== 'Cancelled'
    );
    const cancelledOrders = workOrders.filter(wo => 
      wo.status === 'cancelled' || wo.status === 'Cancelled'
    );
    
    console.log('Active orders:', activeOrders.length);
    console.log('Cancelled orders:', cancelledOrders.length);
    
    // Calculate metrics from ACTIVE orders only
    let totalPlanned = 0;
    let totalActual = 0;
    let totalWastage = 0;
    
    activeOrders.forEach(wo => {
      totalPlanned += parseFloat(wo.planned_qty || 0);
      totalActual += parseFloat(wo.actual_qty || 0);
      totalWastage += parseFloat(wo.wastage_qty || 0);
    });
    
    console.log('Active totals - Planned:', totalPlanned, 'Actual:', totalActual, 'Wastage:', totalWastage);
    
    // Calculate yield percentage (from active orders only)
    const yieldPercent = totalPlanned > 0 
      ? parseFloat(((totalActual / totalPlanned) * 100).toFixed(2))
      : null;
    
    // Calculate efficiency (from active orders only)
    const efficiencyPercent = totalPlanned > 0
      ? parseFloat((((totalActual - totalWastage) / totalPlanned) * 100).toFixed(2))
      : null;
    
    console.log('Yield:', yieldPercent !== null ? yieldPercent + '%' : 'N/A');
    console.log('Efficiency:', efficiencyPercent !== null ? efficiencyPercent + '%' : 'N/A');
    
    // Get production plan summary (exclude cancelled)
    const [planSummary] = await db.query(
      `SELECT COUNT(*) as total_lines, SUM(planned_qty) as total_planned_qty 
       FROM production_plan 
       WHERE plan_date = ? AND status != 'cancelled'`,
      [date]
    );
    
    // Get capacity summary
    const [capacitySummary] = await db.query(
      `SELECT COUNT(*) as total_lines, SUM(available_hours) as total_hours 
       FROM capacity_plan 
       WHERE plan_date = ?`,
      [date]
    );
    
    // Get MRP requirements count
    const [mrpSummary] = await db.query(
      `SELECT COUNT(*) as count 
       FROM mrp_requirements 
       WHERE need_date = ?`,
      [date]
    );
    
    // Count by status (case-insensitive)
    const countByStatus = (statusList) => {
      return workOrders.filter(wo => 
        statusList.includes(wo.status?.toLowerCase())
      ).length;
    };
    
    const result = {
      date: date,
      
      // Production quantities (from active orders only)
      total_planned: totalPlanned,
      total_actual: totalActual,
      total_wastage: totalWastage,
      
      // KPI percentages
      yield_percent: yieldPercent,
      efficiency_percent: efficiencyPercent,
      
      // Work order counts
      work_orders_count: workOrders.length,
      open_orders: countByStatus(['open']),
      in_progress_orders: countByStatus(['in_progress', 'in progress']),
      completed_orders: countByStatus(['completed']),
      cancelled_orders: cancelledOrders.length,
      
      // Plan & Capacity
      plan_lines: planSummary[0]?.total_lines || 0,
      plan_total_qty: planSummary[0]?.total_planned_qty || 0,
      capacity_lines: capacitySummary[0]?.total_lines || 0,
      capacity_total_hours: capacitySummary[0]?.total_hours || 0,
      
      // MRP
      mrp_requirements: mrpSummary[0]?.count || 0,
      
      // Info message
      excluded_cancelled: cancelledOrders.length > 0 
        ? `${cancelledOrders.length} cancelled order(s) excluded from KPI calculations`
        : null
    };
    
    console.log('=== METRICS RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('======================\n');
    
    res.json(result);
    
  } catch (err) {
    console.error('GET /metrics/daily Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};