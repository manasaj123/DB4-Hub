import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Styles.css";  

const ComplaintManager = ({ complaints, setComplaints, orders, deliveries, refreshAllData }) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    order_id: "",
    subject: "",
    description: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/complaints");
      setComplaints(res.data || []);
    } catch (err) {
      console.error("Fetch complaints failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      await axios.post("/api/complaints", formData);
      setFormData({
        customer_name: "",
        customer_phone: "",
        order_id: "",
        subject: "",
        description: "",
        priority: "medium",
      });
      setSuccessMsg('✅ Complaint registered successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchComplaints();
      if (refreshAllData) refreshAllData();
    } catch (err) {
      setSuccessMsg('❌ Failed to create complaint');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (id) => {
    try {
      await axios.put(`/api/complaints/${id}/escalate`, {
        escalation_level: 2,
        assigned_to: "manager",
      });
      fetchComplaints();
      if (refreshAllData) refreshAllData();
    } catch (err) {
      console.error("Escalation failed", err);
    }
  };

  // Get linked order info
  const getLinkedOrder = (orderId) => {
    return orders?.find(o => o.order_id === orderId);
  };

  // Get linked delivery info
  const getLinkedDelivery = (orderId) => {
    return deliveries?.find(d => d.order_id === orderId);
  };

  // Filter and search complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.order_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <section className="complaint-manager">
      <h2>📞 Complaints Manager</h2>

      <div className="manager-grid">
        <div className="complaint-form-section">
          <h3>📝 New Complaint</h3>
          
          {successMsg && (
            <div className={`success-msg ${successMsg.includes('✅') ? 'success' : 'error'}`}>
              {successMsg}
            </div>
          )}
          
          <form onSubmit={handleSubmitComplaint}>
            <input
              placeholder="Customer Name *"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <input
              placeholder="Phone"
              value={formData.customer_phone}
              onChange={(e) =>
                setFormData({ ...formData, customer_phone: e.target.value })
              }
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <select
              value={formData.order_id}
              onChange={(e) =>
                setFormData({ ...formData, order_id: e.target.value })
              }
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="">Select Order (Optional)</option>
              {orders?.map(order => (
                <option key={order.order_id} value={order.order_id}>
                  #{order.order_id} - {order.customer_name} (₹{order.total_amount})
                </option>
              ))}
            </select>
            <input
              placeholder="Subject *"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows="3"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
            />
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button 
              className="submit-btn" 
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? "⏳ Creating..." : "🚨 Add Complaint"}
            </button>
          </form>
        </div>

        <div className="complaint-list-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>📋 Complaints ({filteredComplaints.length})</h3>
            
            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  width: '150px'
                }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>

          {/* Scrollable List */}
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            paddingRight: '5px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1'
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Loading complaints...</p>
            ) : filteredComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                <p>📭 No complaints found</p>
                {searchTerm && <p>Try different search terms</p>}
              </div>
            ) : (
              filteredComplaints.map((c) => {
                const linkedOrder = getLinkedOrder(c.order_id);
                const linkedDelivery = getLinkedDelivery(c.order_id);
                
                return (
                  <div
                    key={c.id}
                    className={`complaint-item priority-${c.priority || "medium"}`}
                    style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      border: '1px solid #e0e0e0',
                      borderLeft: `4px solid ${c.priority === 'high' ? '#dc3545' : c.priority === 'medium' ? '#ffc107' : '#28a745'}`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{c.subject || 'No Subject'}</strong>
                      <span className={`status-badge status-${c.status}`} style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: c.status === 'new' ? '#007bff' : '#dc3545',
                        color: 'white'
                      }}>
                        {c.status || "new"}
                      </span>
                    </div>
                    
                    <p style={{ margin: '5px 0', color: '#333' }}>
                      👤 <strong>{c.customer_name}</strong>
                      {c.customer_phone && <span style={{ marginLeft: '10px', color: '#666' }}>📱 {c.customer_phone}</span>}
                    </p>
                    
                    {c.order_id && (
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        📦 Order: <strong>#{c.order_id}</strong>
                        {linkedOrder && (
                          <span style={{ marginLeft: '8px', color: '#007bff' }}>
                            (₹{linkedOrder.total_amount} - {linkedOrder.status})
                          </span>
                        )}
                      </p>
                    )}
                    
                    {linkedDelivery && (
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        🚚 Delivery: <strong>{linkedDelivery.status}</strong>
                        <span style={{ marginLeft: '8px', color: '#666' }}>
                          {new Date(linkedDelivery.scheduled_time).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                    
                    <p style={{ margin: '8px 0', color: '#555', fontStyle: 'italic' }}>
                      📝 "{c.description}"
                    </p>
                    
                    {c.status === "new" && (
                      <button
                        className="escalate-btn"
                        onClick={() => handleEscalate(c.id)}
                        style={{
                          marginTop: '8px',
                          padding: '8px 16px',
                          background: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ⬆️ Escalate to Manager
                      </button>
                    )}
                    
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                      ID: {c.id} | Created: {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .complaint-list-section::-webkit-scrollbar {
          width: 8px;
        }
        .complaint-list-section::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .complaint-list-section::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .complaint-list-section::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </section>
  );
};

export default ComplaintManager;