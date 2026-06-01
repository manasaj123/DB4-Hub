import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Styles.css"; 

const DriverManagement = ({ drivers, setDrivers, refreshAllData }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    driver_id: '',
    name: '',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'Bike'
  });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/drivers');
      setDrivers(res.data || []);
    } catch (error) {
      console.error('Fetch drivers failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    
    if (!formData.driver_id || !formData.name) {
      setSuccessMsg('❌ Driver ID and Name are required');
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    try {
      const res = await axios.post('/api/drivers', formData);
      setSuccessMsg('✅ Driver added successfully!');
      setFormData({
        driver_id: '',
        name: '',
        phone: '',
        vehicle_number: '',
        vehicle_type: 'Bike'
      });
      setShowForm(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchDrivers();
      if (refreshAllData) refreshAllData();
    } catch (error) {
      setSuccessMsg(`❌ ${error.response?.data?.error || 'Failed to add driver'}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      await axios.put(`/api/drivers/${driverId}/status`, { status: newStatus });
      fetchDrivers();
      if (refreshAllData) refreshAllData();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  return (
    <section className="driver-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>👨‍✈️ Driver Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            background: showForm ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? '✕ Close' : '➕ Add Driver'}
        </button>
      </div>

      {successMsg && (
        <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}>
          {successMsg}
        </div>
      )}

      {showForm && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: 'white', marginTop: 0 }}>📝 Add New Driver</h3>
          <form onSubmit={handleAddDriver}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                placeholder="Driver ID * (e.g., DRV-004)"
                value={formData.driver_id}
                onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                required
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <input
                placeholder="Driver Name *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <input
                placeholder="Vehicle Number"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              />
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                style={{ padding: '12px', borderRadius: '6px', border: 'none' }}
              >
                <option value="Bike">Bike</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Car">Car</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✅ Add Driver
            </button>
          </form>
        </div>
      )}

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{drivers.length}</div>
          <div>Total Drivers</div>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {drivers.filter(d => d.status === 'available').length}
          </div>
          <div>Available</div>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {drivers.filter(d => d.status === 'busy').length}
          </div>
          <div>Busy</div>
        </div>
      </div>

      {/* Drivers List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {loading ? (
          <div>🔄 Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', gridColumn: '1/-1' }}>
            <h3>📭 No Drivers Found</h3>
            <p>Add drivers using the button above</p>
          </div>
        ) : (
          drivers.map(driver => (
            <div
              key={driver.id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                borderLeft: `4px solid ${
                  driver.status === 'available' ? '#28a745' :
                  driver.status === 'busy' ? '#ffc107' : '#6c757d'
                }`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{driver.name}</h3>
                  <small style={{ color: '#666' }}>{driver.driver_id}</small>
                </div>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background:
                    driver.status === 'available' ? '#d4edda' :
                    driver.status === 'busy' ? '#fff3cd' : '#e2e3e5',
                  color:
                    driver.status === 'available' ? '#155724' :
                    driver.status === 'busy' ? '#856404' : '#383d41'
                }}>
                  {driver.status}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                {driver.phone && <div>📱 {driver.phone}</div>}
                {driver.vehicle_number && <div>🚛 {driver.vehicle_number}</div>}
                {driver.vehicle_type && <div>🚗 {driver.vehicle_type}</div>}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleStatusUpdate(driver.driver_id, 'available')}
                  style={{
                    padding: '8px 16px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Set Available
                </button>
                <button
                  onClick={() => handleStatusUpdate(driver.driver_id, 'busy')}
                  style={{
                    padding: '8px 16px',
                    background: '#ffc107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Set Busy
                </button>
                <button
                  onClick={() => handleStatusUpdate(driver.driver_id, 'offline')}
                  style={{
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Offline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default DriverManagement;