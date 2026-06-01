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

  const generateOrderId = () => {
    const count = orders.length + 1;
    return `ORD-${String(count).padStart(3, '0')}`;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!orderForm.order_id || !orderForm.customer_name || !orderForm.total_amount) {
      setSuccessMsg('❌ Please fill all required fields');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    if (parseFloat(orderForm.total_amount) <= 0) {
      setSuccessMsg('❌ Amount must be greater than 0');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post('/api/orders/create', {
        ...orderForm,
        total_amount: parseFloat(orderForm.total_amount)
      });
      setSuccessMsg(`✅ Order #${res.data.order_id} created!`);
      
      setOrderForm({
        order_id: generateOrderId(),
        customer_name: '',
        customer_phone: '',
        total_amount: '',
        status: 'pending'
      });
      
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
      // Cancel order
      await axios.post(`/api/orders/cancel/${orderId}`, { reason: cancelReason });
      
      // Auto-update delivery status
      const linkedDelivery = deliveries.find(d => d.order_id === orderId);
      if (linkedDelivery) {
        await axios.put(`/api/delivery/${linkedDelivery.id}/status`, {
          status: 'cancelled'
        });
      }
      
      setSuccessMsg('✅ Order cancelled successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      
      if (refreshAllData) refreshAllData();
    } catch (error) {
      alert('Failed to cancel order');
    }
  };

  const handleReturn = async (orderId) => {
    if (!reason.trim() || !creditAmount || parseFloat(creditAmount) <= 0) {
      alert('Please enter valid reason and credit amount (greater than 0)');
      return;
    }
    
    try {
      // Process return
      await axios.post(`/api/orders/return/${orderId}`, {
        reason,
        creditAmount: parseFloat(creditAmount),
      });
      
      // Auto-update delivery status
      const linkedDelivery = deliveries.find(d => d.order_id === orderId);
      if (linkedDelivery) {
        await axios.put(`/api/delivery/${linkedDelivery.id}/status`, {
          status: 'return_pickup_pending'
        });
      }
      
      setSelectedOrder(null);
      setReason('');
      setCreditAmount('');
      setSuccessMsg('✅ Return processed! Credit note issued.');
      setTimeout(() => setSuccessMsg(''), 3000);
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
            fontWeight: 'bold'
          }}
        >
          {showCreateForm ? '✕ Close' : '➕ New Order'}
        </button>
      </div>

      {successMsg && (
        <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}>
          {successMsg}
        </div>
      )}

      {showCreateForm && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: 'white', marginTop: 0 }}>📝 Create New Order</h3>
          <form onSubmit={handleCreateOrder}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                placeholder="Order ID *"
                value={orderForm.order_id}
                onChange={(e) => setOrderForm({...orderForm, order_id: e.target.value})}
                required
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <input
                placeholder="Customer Name *"
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                required
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                placeholder="Phone"
                value={orderForm.customer_phone}
                onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount (₹) *"
                value={orderForm.total_amount}
                onChange={(e) => setOrderForm({...orderForm, total_amount: e.target.value})}
                required
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm({...orderForm, status: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              >
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={creating}
              style={{
                width: '100%',
                padding: '14px',
                background: creating ? '#6c757d' : '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {creating ? '⏳ Creating...' : '✅ Create Order'}
            </button>
          </form>
        </div>
      )}

      {/* Stats Bar */}
      <div className="stats-bar" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {[
          { status: 'pending', label: 'Pending', color: '#ffc107' },
          { status: 'delivered', label: 'Delivered', color: '#28a745' },
          { status: 'cancelled', label: 'Cancelled', color: '#dc3545' },
          { status: 'returned', label: 'Returned', color: '#6f42c1' }
        ].map(item => (
          <div
            key={item.status}
            onClick={() => setActiveFilter(item.status)}
            style={{
              padding: '15px',
              background: activeFilter === item.status ? item.color : '#f8f9fa',
              color: activeFilter === item.status ? 'white' : '#333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {orders.filter(o => o.status === item.status).length}
            </div>
            <div style={{ fontSize: '14px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Order List */}
      <div className="order-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {loading ? (
          <div>🔄 Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <h3>📭 No Orders Found</h3>
            <p>Use the "➕ New Order" button to create orders</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const linkedDelivery = deliveries.find(d => d.order_id === order.order_id);
            
            return (
              <div 
                key={order.id || order.order_id} 
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  border: '1px solid #e0e0e0',
                  borderLeft: `4px solid ${
                    order.status === 'delivered' ? '#28a745' : 
                    order.status === 'pending' ? '#ffc107' : 
                    order.status === 'cancelled' ? '#dc3545' : '#6f42c1'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{order.order_id}</strong>
                    <span style={{ marginLeft: '15px' }}>👤 {order.customer_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                      ₹{parseFloat(order.total_amount || 0).toLocaleString()}
                    </span>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: 
                        order.status === 'delivered' ? '#d4edda' : 
                        order.status === 'pending' ? '#fff3cd' : 
                        order.status === 'cancelled' ? '#f8d7da' : '#e8daef',
                      color: 
                        order.status === 'delivered' ? '#155724' : 
                        order.status === 'pending' ? '#856404' : 
                        order.status === 'cancelled' ? '#721c24' : '#6f42c1'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                {linkedDelivery && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    🚚 Delivery: {linkedDelivery.status.replace('_', ' ')}
                    {linkedDelivery.driver_name && ` | Driver: ${linkedDelivery.driver_name}`}
                  </div>
                )}

                {order.return_reason && (
                  <div style={{ marginTop: '5px', fontSize: '13px', color: '#dc3545' }}>
                    Reason: {order.return_reason}
                  </div>
                )}

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  {/* Hide cancel for delivered/returned orders */}
                  {(order.status === 'pending') && (
                    <button
                      onClick={() => handleCancel(order.order_id)}
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
                    <button
                      onClick={() => setSelectedOrder(order.order_id)}
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
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return Modal */}
      {selectedOrder && (
        <>
          <div 
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
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            zIndex: 1000,
            minWidth: '400px'
          }}>
            <h3>💰 Process Return for #{selectedOrder}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>Return Reason *</label>
              <input
                placeholder="e.g., Damaged product"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Credit Amount (₹) *</label>
              <input
                type="number"
                min="0"
                placeholder="Must be greater than 0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
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
                💳 Issue Credit
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ReturnsHandler;