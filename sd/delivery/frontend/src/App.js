import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DeliveryScheduler from "./components/DeliveryScheduler";
import ReturnsHandler from "./components/ReturnsHandler";
import ComplaintManager from "./components/ComplaintManager";
import RevenueDashboard from "./components/RevenueDashboard";
import "./App.css";

export default function App() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDeliveries(),
      fetchOrders(),
      fetchComplaints()
    ]);
  };

  const fetchDeliveries = async () => {
    try {
      const res = await axios.get('/api/delivery');
      setDeliveries(res.data || []);
    } catch (error) {
      console.error('Fetch deliveries failed:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data || []);
    } catch (error) {
      console.error('Fetch orders failed:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/api/complaints');
      setComplaints(res.data || []);
    } catch (error) {
      console.error('Fetch complaints failed:', error);
    }
  };

  // Refresh all data after any change
  const refreshAllData = useCallback(() => {
    fetchAllData();
  }, []);

  return (
    <div className="app-container">
      <h1>📦 Delivery Order Management System</h1>
      
      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="overview-card">
          <h3>📦 Orders</h3>
          <div className="overview-number">{orders.length}</div>
        </div>
        <div className="overview-card">
          <h3>🚚 Deliveries</h3>
          <div className="overview-number">{deliveries.filter(d => d.status === 'pending').length}</div>
          <small>Active / {deliveries.length} Total</small>
        </div>
        <div className="overview-card">
          <h3>📞 Complaints</h3>
          <div className="overview-number">{complaints.filter(c => c.status === 'new').length}</div>
          <small>New / {complaints.length} Total</small>
        </div>
        <div className="overview-card">
          <h3>💰 Revenue</h3>
          <div className="overview-number">
            ₹{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 All
        </button>
        <button 
          className={`nav-tab ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          🚚 Delivery
        </button>
        <button 
          className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders
        </button>
        <button 
          className={`nav-tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          📞 Complaints
        </button>
        <button 
          className={`nav-tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue
        </button>
      </div>

      {/* Conditional Rendering based on active tab */}
      {(activeTab === 'all' || activeTab === 'delivery') && (
        <DeliveryScheduler 
          deliveries={deliveries} 
          setDeliveries={setDeliveries}
          orders={orders}
          setOrders={setOrders}
          refreshAllData={refreshAllData}
        />
      )}
      
      {(activeTab === 'all' || activeTab === 'orders') && (
        <ReturnsHandler 
          orders={orders} 
          setOrders={setOrders}
          deliveries={deliveries}
          setDeliveries={setDeliveries}
          refreshAllData={refreshAllData}
        />
      )}
      
      {(activeTab === 'all' || activeTab === 'complaints') && (
        <ComplaintManager 
          complaints={complaints} 
          setComplaints={setComplaints}
          orders={orders}
          deliveries={deliveries}
          refreshAllData={refreshAllData}
        />
      )}
      
      {(activeTab === 'all' || activeTab === 'revenue') && (
  <RevenueDashboard 
    orders={orders}
    deliveries={deliveries}
  />
)}
    </div>
  );
}