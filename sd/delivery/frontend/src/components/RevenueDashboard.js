import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Styles.css"; 

const RevenueDashboard = ({ orders = [], deliveries = [], complaints = [] }) => {
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    returnedAmount: 0,
    netRevenue: 0,
    monthlyRevenue: [],
    totalOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    totalDeliveries: 0,
    activeDeliveries: 0,
    successRate: 0,
    complaintRatio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, [orders, deliveries, complaints]);

  const calculateStats = () => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const returnedOrders = orders.filter(o => o.status === 'returned');
    
    // Revenue = Delivered - Returned
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const returnedAmount = returnedOrders.reduce((sum, o) => sum + (parseFloat(o.credit_note_amount) || 0), 0);
    const netRevenue = deliveredRevenue - returnedAmount;
    
    const activeDeliveries = deliveries.filter(d => 
      d.status === 'pending' || d.status === 'in_transit'
    ).length;
    
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    const totalAttempts = deliveries.length;
    const successRate = totalAttempts > 0 ? ((completedDeliveries / totalAttempts) * 100).toFixed(1) : 0;
    
    const complaintRatio = deliveredOrders.length > 0 
      ? ((complaints.length / deliveredOrders.length) * 100).toFixed(1) 
      : 0;

    setStats({
      totalRevenue: deliveredRevenue,
      returnedAmount: returnedAmount,
      netRevenue: netRevenue,
      totalOrders: deliveredOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      returnedOrders: returnedOrders.length,
      totalDeliveries: totalAttempts,
      activeDeliveries: activeDeliveries,
      completedDeliveries: completedDeliveries,
      successRate: successRate,
      complaintRatio: complaintRatio,
      avgOrderValue: deliveredOrders.length > 0 
        ? (deliveredRevenue / deliveredOrders.length).toFixed(0) 
        : 0
    });
    
    setLoading(false);
  };

  const getMonthlyData = () => {
    const monthlyData = {};
    
    // Revenue from delivered orders
    orders
      .filter(o => o.status === 'delivered' && o.created_at)
      .forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, returned: 0 };
        }
        monthlyData[month].revenue += parseFloat(order.total_amount) || 0;
      });

    // Subtract returns
    orders
      .filter(o => o.status === 'returned' && o.updated_at)
      .forEach(order => {
        const month = new Date(order.updated_at).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, returned: 0 };
        }
        monthlyData[month].returned += parseFloat(order.credit_note_amount) || 0;
      });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ 
        month, 
        revenue: data.revenue,
        netRevenue: data.revenue - data.returned 
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  };

  const monthlyData = getMonthlyData();
  const maxRevenue = Math.max(...monthlyData.map(m => m.netRevenue), 1000);

  return (
    <section className="revenue-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>💰 Revenue Dashboard</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>🔄 Calculating revenue...</div>
      ) : (
        <>
          {/* Revenue Stats */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Net Revenue</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
                ₹{stats.netRevenue.toLocaleString()}
              </div>
              <small>After returns & credits</small>
            </div>
            
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Delivery Success Rate</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
                {stats.successRate}%
              </div>
              <small>{stats.completedDeliveries} completed out of {stats.totalDeliveries}</small>
            </div>
            
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Avg Order Value</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
                ₹{parseInt(stats.avgOrderValue).toLocaleString()}
              </div>
              <small>Per delivered order</small>
            </div>
            
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Complaint Ratio</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
                {stats.complaintRatio}%
              </div>
              <small>{complaints.length} complaints / {stats.totalOrders} orders</small>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              background: '#d4edda',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#155724' }}>
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ color: '#155724' }}>Total Revenue (Delivered)</div>
            </div>
            <div style={{
              padding: '20px',
              background: '#f8d7da',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#721c24' }}>
                -₹{stats.returnedAmount.toLocaleString()}
              </div>
              <div style={{ color: '#721c24' }}>Returns & Credits</div>
            </div>
            <div style={{
              padding: '20px',
              background: '#d1ecf1',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c5460' }}>
                ₹{stats.netRevenue.toLocaleString()}
              </div>
              <div style={{ color: '#0c5460' }}>Net Revenue</div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0 }}>📈 Monthly Revenue Trend</h3>
            
            {monthlyData.length > 0 ? (
              <div>
                {monthlyData.slice(0, 12).map((item) => {
                  const percentage = (item.netRevenue / maxRevenue) * 100;
                  
                  return (
                    <div key={item.month} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.month}</span>
                        <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                          ₹{item.netRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ 
                        background: '#f0f0f0', 
                        borderRadius: '10px', 
                        height: '30px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
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
                          fontWeight: 'bold'
                        }}>
                          {percentage > 15 && `${Math.round(percentage)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h3>📊 No Data Available</h3>
                <p>Deliver orders to see revenue trends</p>
              </div>
            )}
          </div>

          {/* Quick Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {orders.length}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Total Orders</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {stats.totalOrders}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Delivered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {stats.pendingOrders}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {stats.cancelledOrders + stats.returnedOrders}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Cancelled/Returned</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                {stats.activeDeliveries}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Active Deliveries</div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default RevenueDashboard;