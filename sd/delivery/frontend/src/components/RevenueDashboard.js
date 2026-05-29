import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Styles.css";  

const RevenueDashboard = ({ orders = [], deliveries = [] }) => {
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    monthlyRevenue: [],
    totalOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    totalDeliveries: 0,
    activeDeliveries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, [orders]); // Refetch when orders change

  useEffect(() => {
    // Calculate real-time stats from orders prop
    if (orders.length > 0) {
      calculateLocalStats();
    }
  }, [orders, deliveries]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/revenue/summary');
      setStats(prev => ({
        ...prev,
        totalRevenue: res.data.totalRevenue || 0,
        monthlyRevenue: res.data.monthlyRevenue || [],
        totalOrders: res.data.totalOrders || 0,
        avgOrderValue: res.data.totalRevenue > 0
          ? (res.data.totalRevenue / (res.data.totalOrders || 1)).toFixed(0)
          : 0,
      }));
    } catch (error) {
      console.error('Revenue fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStats = () => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const returnedOrders = orders.filter(o => o.status === 'returned');
    
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const activeDeliveries = deliveries.filter(d => d.status === 'pending').length;

    setStats(prev => ({
      ...prev,
      totalRevenue: totalRevenue || prev.totalRevenue,
      totalOrders: deliveredOrders.length || prev.totalOrders,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      returnedOrders: returnedOrders.length,
      totalDeliveries: deliveries.length,
      activeDeliveries: activeDeliveries,
      avgOrderValue: deliveredOrders.length > 0 
        ? (totalRevenue / deliveredOrders.length).toFixed(0) 
        : prev.avgOrderValue
    }));
  };

  // Calculate monthly revenue from orders
  const getMonthlyRevenueFromOrders = () => {
    const monthlyData = {};
    
    orders
      .filter(o => o.status === 'delivered' && o.created_at)
      .forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += parseFloat(order.total_amount) || 0;
      });

    return Object.entries(monthlyData)
      .map(([month, total]) => ({ _id: month, total }))
      .sort((a, b) => b._id.localeCompare(a._id));
  };

  const displayMonthlyRevenue = stats.monthlyRevenue.length > 0 
    ? stats.monthlyRevenue 
    : getMonthlyRevenueFromOrders();

  return (
    <section className="revenue-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>💰 Revenue Dashboard</h2>
        <button 
          className="refresh-btn" 
          onClick={fetchRevenue}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
          🔄 Loading revenue data...
        </div>
      ) : (
        <>
          {/* Revenue Stats */}
          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h3>Total Revenue</h3>
              <div className="stat-number total-revenue">
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <small style={{ color: 'rgba(255,255,255,0.8)' }}>
                From {stats.totalOrders} delivered orders
              </small>
            </div>
            
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <h3>Orders Summary</h3>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                <div>✅ Delivered: <strong>{stats.totalOrders}</strong></div>
                <div>⏳ Pending: <strong>{stats.pendingOrders}</strong></div>
                <div>❌ Cancelled: <strong>{stats.cancelledOrders}</strong></div>
                <div>↩️ Returned: <strong>{stats.returnedOrders}</strong></div>
              </div>
            </div>
            
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <h3>Avg Order Value</h3>
              <div className="stat-number avg-value">
                ₹{parseInt(stats.avgOrderValue).toLocaleString()}
              </div>
              <small style={{ color: 'rgba(255,255,255,0.8)' }}>
                Per delivered order
              </small>
            </div>
            
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <h3>Deliveries</h3>
              <div className="stat-number growth-rate">
                {stats.activeDeliveries}
              </div>
              <small style={{ color: 'rgba(255,255,255,0.8)' }}>
                Active / {stats.totalDeliveries} Total
              </small>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="chart-section" style={{ marginTop: '30px' }}>
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 className="chart-title">📈 Monthly Revenue Trend</h4>
            </div>
            
            {displayMonthlyRevenue.length > 0 ? (
              <div className="monthly-chart">
                {displayMonthlyRevenue.slice(0, 12).map((item, index) => {
                  const maxRevenue = Math.max(...displayMonthlyRevenue.map(m => m.total), 1000);
                  const percentage = (item.total / maxRevenue) * 100;
                  
                  return (
                    <div key={item._id || index} style={{ marginBottom: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>
                          {item._id || 'Current'}
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                          ₹{parseFloat(item.total).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ 
                        background: '#f0f0f0', 
                        borderRadius: '10px', 
                        height: '30px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '10px',
                            transition: 'width 1s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '10px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            minWidth: percentage > 10 ? 'auto' : '50px'
                          }}
                        >
                          {percentage > 10 && `${Math.round(percentage)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '10px' }}>
                <h3>📊 No Monthly Data Available</h3>
                <p>Create orders with "delivered" status to see monthly revenue trends.</p>
                <p style={{ color: '#007bff' }}>
                  Tip: Use the <strong>Returns & Cancellations</strong> section to create orders.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {orders.length > 0 && (
            <div style={{ 
              marginTop: '30px', 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                  {orders.length}
                </div>
                <div style={{ color: '#666' }}>Total Orders</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  ₹{orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}
                </div>
                <div style={{ color: '#666' }}>Total Order Value</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <div style={{ color: '#666' }}>Delivered</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                  {deliveries.length}
                </div>
                <div style={{ color: '#666' }}>Total Deliveries</div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RevenueDashboard;