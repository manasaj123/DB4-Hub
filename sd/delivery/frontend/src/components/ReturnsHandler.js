import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Styles.css"; 

const ReturnsHandler = ({ orders, setOrders, deliveries, setDeliveries, refreshAllData }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Order creation form state
  const [orderForm, setOrderForm] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    total_amount: '',
    status: 'pending'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/orders');
      setOrders(res.data || []);
    } catch (error) {
      console.error('Orders fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create order handler
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.order_id || !orderForm.customer_name || !orderForm.total_amount) {
      setSuccessMsg('❌ Please fill in Order ID, Customer Name, and Total Amount');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post('/api/orders/create', orderForm);
      setSuccessMsg(`✅ Order #${res.data.order_id} created successfully!`);
      
      // Reset form
      setOrderForm({
        order_id: '',
        customer_name: '',
        customer_phone: '',
        total_amount: '',
        status: 'pending'
      });
      
      setShowCreateForm(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchOrders();
      if (refreshAllData) refreshAllData();
    } catch (error) {
      setSuccessMsg(`❌ ${error.response?.data?.error || 'Failed to create order'}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (orderId) => {
    const cancelReason = prompt('Enter cancel reason:');
    if (!cancelReason) return;
    
    try {
      await axios.post(`/api/orders/cancel/${orderId}`, { reason: cancelReason });
      setSuccessMsg('✅ Order cancelled successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchOrders();
      if (refreshAllData) refreshAllData();
    } catch (error) {
      alert('Failed to cancel order');
    }
  };

  const handleReturn = async (orderId) => {
    if (!reason.trim() || !creditAmount) {
      alert('Please enter reason and credit amount');
      return;
    }
    try {
      await axios.post(`/api/orders/return/${orderId}`, {
        reason,
        creditAmount: parseFloat(creditAmount),
      });
      setSelectedOrder(null);
      setReason('');
      setCreditAmount('');
      setSuccessMsg('✅ Return processed successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchOrders();
      if (refreshAllData) refreshAllData();
    } catch (error) {
      alert('Failed to process return');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === "all") return true;
    return order.status === activeFilter;
  });

  return (
    <section className="returns-handler">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: 0 }}>↩️ Returns & Cancellations</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 24px',
            background: showCreateForm ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          {showCreateForm ? '✕ Close Form' : '➕ Create New Order'}
        </button>
      </div>

      {successMsg && (
        <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}
          style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center',
            fontWeight: 'bold',
            background: successMsg.includes('✅') ? '#d4edda' : '#f8d7da',
            color: successMsg.includes('✅') ? '#155724' : '#721c24',
            border: `1px solid ${successMsg.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {successMsg}
        </div>
      )}

      {/* ORDER CREATION FORM - Always accessible */}
      {showCreateForm && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>
            📝 Create New Order
          </h3>
          <form onSubmit={handleCreateOrder} style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Order ID *</label>
                <input
                  placeholder="e.g., ORD-007"
                  value={orderForm.order_id}
                  onChange={(e) => setOrderForm({...orderForm, order_id: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Customer Name *</label>
                <input
                  placeholder="e.g., John Doe"
                  value={orderForm.customer_name}
                  onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Phone</label>
                <input
                  placeholder="Phone number"
                  value={orderForm.customer_phone}
                  onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g., 1500"
                  value={orderForm.total_amount}
                  onChange={(e) => setOrderForm({...orderForm, total_amount: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'white', marginBottom: '5px', display: 'block' }}>Status</label>
                <select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({...orderForm, status: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: 'none',
                    fontSize: '14px'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={creating}
              style={{
                padding: '14px',
                background: creating ? '#6c757d' : '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '10px',
                transition: 'all 0.3s ease'
              }}
            >
              {creating ? '⏳ Creating Order...' : '✅ Create Order Now'}
            </button>
          </form>
        </div>
      )}

      {/* STATS BAR */}
      <div className="stats-bar">
        <div 
          className={`stat-item ${activeFilter === "pending" ? "active" : ""}`}
          onClick={() => setActiveFilter("pending")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-number">
            {orders.filter(o => o.status === 'pending').length}
          </span>
          <span className="stat-label">Pending</span>
        </div>

        <div 
          className={`stat-item ${activeFilter === "delivered" ? "active" : ""}`}
          onClick={() => setActiveFilter("delivered")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-number">
            {orders.filter(o => o.status === 'delivered').length}
          </span>
          <span className="stat-label">Delivered</span>
        </div>

        <div 
          className={`stat-item ${activeFilter === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveFilter("cancelled")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-number">
            {orders.filter(o => o.status === 'cancelled').length}
          </span>
          <span className="stat-label">Cancelled</span>
        </div>

        <div 
          className={`stat-item ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-number">{orders.length}</span>
          <span className="stat-label">All</span>
        </div>
      </div>

      {/* ORDER LIST */}
      <div className="order-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div className="loading">🔄 Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '30px' }}>
            <h3>📭 No Orders Found</h3>
            <p>Click the <strong>"➕ Create New Order"</strong> button above to add orders.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id || order.order_id} 
              className="order-item"
              style={{
                background: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #e0e0e0',
                borderLeft: `4px solid ${
                  order.status === 'delivered' ? '#28a745' : 
                  order.status === 'pending' ? '#ffc107' : 
                  order.status === 'cancelled' ? '#dc3545' : '#6c757d'
                }`
              }}
            >
              <div className="order-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>#{order.order_id || order.id}</strong>
                  <span style={{ marginLeft: '15px', color: '#666' }}>
                    👤 {order.customer_name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                    ₹{order.total_amount || 0}
                  </span>
                  <span className={`order-status status-${order.status}`}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: 
                        order.status === 'delivered' ? '#d4edda' : 
                        order.status === 'pending' ? '#fff3cd' : 
                        order.status === 'cancelled' ? '#f8d7da' : '#e2e3e5',
                      color: 
                        order.status === 'delivered' ? '#155724' : 
                        order.status === 'pending' ? '#856404' : 
                        order.status === 'cancelled' ? '#721c24' : '#383d41'
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="actions" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.order_id || order.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Cancel Order
                  </button>
                )}

                {order.status === 'delivered' && (
                  <>
                    <button
                      onClick={() => handleCancel(order.order_id || order.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel Order
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order.order_id || order.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ↩️ Process Return
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* RETURN MODAL */}
      {selectedOrder && (
        <>
          <div 
            className="modal-overlay" 
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
          <div className="modal" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            zIndex: 1000,
            minWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0 }}>💰 Process Return for #{selectedOrder}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Return Reason *</label>
              <input
                placeholder="e.g., Damaged product"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: '1px solid #ddd',
                  marginBottom: '15px'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Credit Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g., 1500"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setReason('');
                  setCreditAmount('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReturn(selectedOrder)}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💳 Issue Credit Note
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ReturnsHandler;