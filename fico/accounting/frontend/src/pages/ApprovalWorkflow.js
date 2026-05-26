// frontend/src/pages/ApprovalWorkflow.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/Common.css';

const ApprovalWorkflow = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const res = await api.get('/approval-workflow/pending');
      setPendingApprovals(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading pending approvals:', err);
      setError('Failed to load pending approvals');
    }
  };

  const openApprovalModal = (doc) => {
    setSelectedDoc(doc);
    setRemarks('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/approval-workflow/${selectedDoc.id}/decision`, {
        decision: 'APPROVE',
        remarks
      });
      setSuccess('Document approved successfully!');
      setShowModal(false);
      loadPendingApprovals();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/approval-workflow/${selectedDoc.id}/decision`, {
        decision: 'REJECT',
        remarks
      });
      setSuccess('Document rejected successfully!');
      setShowModal(false);
      loadPendingApprovals();
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const getDocTypeIcon = (type) => {
    const icons = {
      'INVOICE': '📄',
      'PAYMENT': '💰',
      'JOURNAL': '📊',
      'CREDIT_MEMO': '🔄'
    };
    return icons[type] || '📋';
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div>
      <h2>Approval Workflow</h2>
      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}
      
      <div className="card full-width">
        <div className="table-header">
          <h3>Pending Approvals ({pendingApprovals.length})</h3>
          <button className="btn-secondary" onClick={loadPendingApprovals}>
            🔄 Refresh
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Document</th>
                <th>Party/Account</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map(doc => (
                <tr key={doc.id}>
                  <td>{getDocTypeIcon(doc.documentType)} {doc.documentType}</td>
                  <td><strong>{doc.documentNumber}</strong></td>
                  <td>{doc.partyName || doc.accountName || '-'}</td>
                  <td className="amount-right">₹{formatCurrency(doc.amount || doc.totalAmount)}</td>
                  <td>{formatDate(doc.date || doc.createdAt)}</td>
                  <td>{doc.createdByName || 'Unknown'}</td>
                  <td>
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => openApprovalModal(doc)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {pendingApprovals.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    <div className="empty-state">
                      <p>🎉 No pending approvals</p>
                      <p className="text-muted">All documents have been reviewed</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {getDocTypeIcon(selectedDoc.documentType)} 
                {selectedDoc.documentType} - {selectedDoc.documentNumber}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="document-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Document Type</label>
                    <p>{selectedDoc.documentType}</p>
                  </div>
                  <div className="detail-item">
                    <label>Document Number</label>
                    <p><strong>{selectedDoc.documentNumber}</strong></p>
                  </div>
                  <div className="detail-item">
                    <label>Party/Account</label>
                    <p>{selectedDoc.partyName || selectedDoc.accountName || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Amount</label>
                    <p className="amount-highlight">₹{formatCurrency(selectedDoc.amount || selectedDoc.totalAmount)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Date</label>
                    <p>{formatDate(selectedDoc.date || selectedDoc.createdAt)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Created By</label>
                    <p>{selectedDoc.createdByName || 'Unknown'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <p>
                      <span className="status-badge status-pending">📋 Pending</span>
                    </p>
                  </div>
                  {(selectedDoc.narration || selectedDoc.description) && (
                    <div className="detail-item full-width">
                      <label>Narration/Description</label>
                      <p>{selectedDoc.narration || selectedDoc.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Approval Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  placeholder="Enter remarks for approval/rejection..."
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(false)} 
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleReject} 
                disabled={loading}
              >
                {loading ? 'Processing...' : '❌ Reject'}
              </button>
              <button 
                className="btn-primary" 
                onClick={handleApprove} 
                disabled={loading}
              >
                {loading ? 'Processing...' : '✅ Approve & Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;