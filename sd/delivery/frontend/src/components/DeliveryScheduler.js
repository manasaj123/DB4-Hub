import React, { useState } from 'react';
import axios from 'axios';
import "./Styles.css"; 

const DeliveryScheduler = ({ deliveries, setDeliveries, orders, setOrders, refreshAllData }) => {
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    address: '',
    scheduled_time: '',
    driver_id: '',
    driver_name: '',
    lat: 17.3850,
    lng: 78.4867,
    total_amount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    
    try {
      // Check if order exists, if not create it
      const existingOrder = orders.find(o => o.order_id === formData.order_id);
      
      if (!existingOrder && formData.total_amount) {
        // Create order first
        try {
          await axios.post('/api/orders/create', {
            order_id: formData.order_id,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            total_amount: formData.total_amount,
            status: 'pending'
          });
          console.log('✅ Order created for delivery');
        } catch (orderError) {
          // Order might already exist, continue with delivery
          console.log('Order creation skipped:', orderError.response?.data?.error);
        }
      }

      // Schedule delivery
      const res = await axios.post('/api/delivery/schedule', formData);
      
      setDeliveries(prev => [res.data, ...prev]);
      setSuccessMsg(`✅ Delivery #${res.data.order_id} scheduled!`);
      
      // Reset form
      setFormData({
        order_id: '', customer_name: '', customer_phone: '',
        address: '', scheduled_time: '', driver_id: '', driver_name: '', 
        lat: 17.3850, lng: 78.4867, total_amount: ''
      });
      
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Refresh all data
      if (refreshAllData) refreshAllData();
      
    } catch (error) {
      setSuccessMsg(`❌ ${error.response?.data?.error || 'Failed to schedule'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const displayDeliveries = showAll ? deliveries : pendingDeliveries;

  return (
    <section className="delivery-scheduler">
      <h2>🚚 Delivery Scheduler</h2>
      
      <div className="scheduler-grid">
        <div className="form-section">
          <h3>📝 New Delivery</h3>
          
          {successMsg && (
            <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}>
              {successMsg}
            </div>
          )}
          
          <form className="delivery-form" onSubmit={handleSchedule}>
            <input 
              placeholder="Order ID *" 
              value={formData.order_id}
              onChange={(e) => setFormData({...formData, order_id: e.target.value})}
              required 
            />
            <input 
              placeholder="Customer Name *" 
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              required
            />
            <input 
              placeholder="Phone" 
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
            />
            <input 
              placeholder="Full Address *" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
            <input 
              type="number"
              placeholder="Order Amount (₹) - Creates order if new" 
              value={formData.total_amount}
              onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
            />
            <div className="time-row">
              <input 
                type="datetime-local" 
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                required 
              />
              <input 
                placeholder="Driver ID" 
                value={formData.driver_id}
                onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
              />
            </div>
            <button type="submit" className="schedule-btn" disabled={submitting}>
              {submitting ? '⏳ Scheduling...' : '📦 Schedule Delivery'}
            </button>
          </form>
        </div>

        <div className="delivery-list-section">
          <div className="deliveries-header">
            <div className="deliveries-count">
              Active: <strong>{pendingDeliveries.length}</strong> / Total: {deliveries.length}
            </div>
            <button 
              className="toggle-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? '📋 Show Active' : '📋 Show All'}
            </button>
          </div>
          <h3>📋 Live List</h3>
          <div className="deliveries-list">
            {displayDeliveries.length === 0 ? (
              <div className="empty-state">
                {showAll ? 'No deliveries yet. Use the form to add deliveries.' : 'No active deliveries'}
              </div>
            ) : (
              displayDeliveries.map(delivery => (
                <div key={delivery.id} className={`delivery-item ${delivery.status || 'pending'}`}>
                  <div className="delivery-header">
                    <div className="order-id">#{delivery.order_id}</div>
                    <span className={`delivery-status status-${delivery.status || 'pending'}`}>
                      {delivery.status || 'pending'}
                    </span>
                  </div>
                  <div className="delivery-details">
                    <span>👤 {delivery.customer_name}</span>
                    <span>🕐 {new Date(delivery.scheduled_time).toLocaleString()}</span>
                  </div>
                  <div className="delivery-address">
                    📍 {delivery.address}
                  </div>
                  {/* Show linked order info */}
                  {orders.find(o => o.order_id === delivery.order_id) && (
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                      💰 Order Value: ₹{orders.find(o => o.order_id === delivery.order_id).total_amount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliveryScheduler;