import React, { useState } from 'react';
import axios from 'axios';
import "./Styles.css"; 

const DeliveryScheduler = ({ deliveries, setDeliveries, orders, setOrders, drivers, refreshAllData }) => {
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    address: '',
    scheduled_time: '',
    driver_id: '',
    lat: 17.3850,
    lng: 78.4867,
    total_amount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');

  const generateOrderId = () => {
    const count = orders.length + 1;
    return `ORD-${String(count).padStart(3, '0')}`;
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    // Validation
    if (!formData.order_id || !formData.customer_name || !formData.address || !formData.scheduled_time) {
      setError('❌ Please fill all required fields: Order ID, Customer Name, Address, and Scheduled Time');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (formData.total_amount && parseFloat(formData.total_amount) <= 0) {
      setError('❌ Amount must be greater than 0');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check for duplicate delivery
    const existingDelivery = deliveries.find(d => d.order_id === formData.order_id);
    if (existingDelivery) {
      setError('❌ Delivery already exists for this order');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSubmitting(true);
    
    try {
      // Auto-create order if doesn't exist
      const existingOrder = orders.find(o => o.order_id === formData.order_id);
      
      if (!existingOrder && formData.total_amount) {
        try {
          await axios.post('/api/orders/create', {
            order_id: formData.order_id,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            total_amount: parseFloat(formData.total_amount),
            status: 'pending'
          });
          console.log('✅ Order created successfully');
        } catch (orderError) {
          console.error('Order creation error:', orderError.response?.data);
          // Continue even if order exists
        }
      }

      // Get driver name if driver_id selected
      const selectedDriver = drivers.find(d => d.driver_id === formData.driver_id);
      
      // Prepare delivery data (without id - database will auto-generate)
      const deliveryData = {
        order_id: formData.order_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || '',
        address: formData.address,
        scheduled_time: formData.scheduled_time,
        driver_id: formData.driver_id || '',
        driver_name: selectedDriver ? selectedDriver.name : '',
        lat: formData.lat || 17.3850,
        lng: formData.lng || 78.4867
      };
      
      console.log('📦 Sending delivery data:', deliveryData);
      
      // Schedule delivery
      const res = await axios.post('/api/delivery/schedule', deliveryData);
      
      console.log('✅ Delivery created:', res.data);
      
      setDeliveries(prev => [res.data, ...prev]);
      setSuccessMsg(`✅ Delivery #${res.data.order_id} scheduled successfully!`);
      
      // Generate new order ID for next entry
      const nextOrderId = generateOrderId();
      
      setFormData({
        order_id: nextOrderId,
        customer_name: '',
        customer_phone: '',
        address: '',
        scheduled_time: '',
        driver_id: '',
        lat: 17.3850,
        lng: 78.4867,
        total_amount: ''
      });
      
      setTimeout(() => setSuccessMsg(''), 5000);
      
      if (refreshAllData) {
        await refreshAllData();
      }
      
    } catch (error) {
      console.error('❌ Schedule error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to schedule delivery';
      
      setSuccessMsg(`❌ ${errorMessage}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await axios.put(`/api/delivery/${deliveryId}/status`, { 
        status: newStatus 
      });
      
      if (refreshAllData) {
        await refreshAllData();
      }
    } catch (error) {
      console.error('Status update failed:', error);
      alert('Failed to update delivery status');
    }
  };

  const activeDeliveries = deliveries.filter(d => 
    d.status === 'pending' || d.status === 'in_transit'
  );
  const displayDeliveries = showAll ? deliveries : activeDeliveries;

  return (
    <section className="delivery-scheduler">
      <h2>🚚 Delivery Scheduler</h2>
      
      <div className="scheduler-grid">
        <div className="form-section">
          <h3>📝 Schedule New Delivery</h3>
          
          {error && (
            <div className="error-msg" style={{
              padding: '10px',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '5px',
              marginBottom: '15px',
              fontWeight: 'bold'
            }}>
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}
              style={{
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '15px',
                fontWeight: 'bold',
                background: successMsg.includes('✅') ? '#d4edda' : '#f8d7da',
                color: successMsg.includes('✅') ? '#155724' : '#721c24',
                border: `1px solid ${successMsg.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
              }}
            >
              {successMsg}
            </div>
          )}
          
          <form className="delivery-form" onSubmit={handleSchedule}>
            <div className="form-group">
              <label>Order ID *</label>
              <input 
                placeholder="ORD-001" 
                value={formData.order_id}
                onChange={(e) => setFormData({...formData, order_id: e.target.value})}
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div className="form-group">
              <label>Customer Name *</label>
              <input 
                placeholder="Customer Name" 
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input 
                placeholder="Phone Number" 
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div className="form-group">
              <label>Full Address *</label>
              <textarea 
                placeholder="Delivery Address" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                rows="2"
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
              />
            </div>
            
            <div className="form-group">
              <label>Order Amount (₹) - Optional</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                placeholder="Creates order if new" 
                value={formData.total_amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setFormData({...formData, total_amount: val});
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Scheduled Time *</label>
                <input 
                  type="datetime-local" 
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div className="form-group">
                <label>Assign Driver</label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Driver</option>
                  {drivers.filter(d => d.status === 'available').map(driver => (
                    <option key={driver.driver_id} value={driver.driver_id}>
                      {driver.name} ({driver.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="schedule-btn" 
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: submitting ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '15px'
              }}
            >
              {submitting ? '⏳ Scheduling...' : '📦 Schedule Delivery'}
            </button>
          </form>
        </div>

        <div className="delivery-list-section">
          <div className="deliveries-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div className="deliveries-count">
              Active: <strong>{activeDeliveries.length}</strong> / Total: {deliveries.length}
            </div>
            <button 
              className="toggle-btn"
              onClick={() => setShowAll(!showAll)}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showAll ? '📋 Show Active' : '📋 Show All'}
            </button>
          </div>
          
          <h3>📋 Delivery List</h3>
          
          <div className="deliveries-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {displayDeliveries.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                {showAll ? 'No deliveries yet. Use the form to schedule deliveries.' : 'No active deliveries'}
              </div>
            ) : (
              displayDeliveries.map(delivery => (
                <div 
                  key={delivery.id} 
                  className={`delivery-item ${delivery.status}`}
                  style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #e0e0e0',
                    borderLeft: `4px solid ${
                      delivery.status === 'pending' ? '#ffc107' :
                      delivery.status === 'in_transit' ? '#007bff' :
                      delivery.status === 'delivered' ? '#28a745' :
                      delivery.status === 'cancelled' ? '#dc3545' : '#6f42c1'
                    }`
                  }}
                >
                  <div className="delivery-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div className="order-id" style={{ fontWeight: 'bold', color: '#667eea' }}>
                      #{delivery.order_id}
                    </div>
                    <span className={`delivery-status status-${delivery.status}`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: 
                          delivery.status === 'pending' ? '#fff3cd' :
                          delivery.status === 'in_transit' ? '#cce5ff' :
                          delivery.status === 'delivered' ? '#d4edda' :
                          delivery.status === 'cancelled' ? '#f8d7da' : '#e8daef',
                        color:
                          delivery.status === 'pending' ? '#856404' :
                          delivery.status === 'in_transit' ? '#004085' :
                          delivery.status === 'delivered' ? '#155724' :
                          delivery.status === 'cancelled' ? '#721c24' : '#6f42c1'
                      }}
                    >
                      {(delivery.status || '').replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="delivery-details" style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                    <div>👤 {delivery.customer_name}</div>
                    <div>🕐 {new Date(delivery.scheduled_time).toLocaleString()}</div>
                    {delivery.driver_name && (
                      <div>🚛 {delivery.driver_name}</div>
                    )}
                  </div>
                  
                  <div className="delivery-address" style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                    📍 {delivery.address}
                  </div>
                  
                  {/* Status Update Buttons */}
                  <div className="delivery-actions" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {delivery.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                        style={{
                          padding: '5px 10px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🚀 Start Delivery
                      </button>
                    )}
                    
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        style={{
                          padding: '5px 10px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✅ Mark Delivered
                      </button>
                    )}
                    
                    {(delivery.status === 'pending' || delivery.status === 'in_transit') && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'cancelled')}
                        style={{
                          padding: '5px 10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    )}
                  </div>
                  
                  {/* Linked Order Info */}
                  {orders.find(o => o.order_id === delivery.order_id) && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      💰 Order: ₹{orders.find(o => o.order_id === delivery.order_id).total_amount}
                      <span style={{ marginLeft: '10px' }}>
                        Status: {orders.find(o => o.order_id === delivery.order_id).status}
                      </span>
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