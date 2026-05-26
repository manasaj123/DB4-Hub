// frontend/src/pages/ParkedInvoices.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/Common.css';

const ParkedInvoices = () => {
  const [parkedInvoices, setParkedInvoices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadParkedInvoices();
  }, []);

  const loadParkedInvoices = async () => {
    try {
      const res = await api.get('/parked-invoices');
      const onlyParked = (res.data || []).filter(inv => inv.status === 'PARKED');
      setParkedInvoices(onlyParked);
      setError('');
    } catch (err) {
      try {
        const res = await api.get('/invoices?status=PARKED');
        const onlyParked = (res.data || []).filter(inv => inv.status === 'PARKED');
        setParkedInvoices(onlyParked);
      } catch (err2) {
        setError('Failed to load parked invoices');
      }
    }
  };

  // Send invoice to Approval Workflow
  const sendToWorkflow = async (invoice) => {
    if (!window.confirm(`Send ${invoice.invoiceNumber} to Approval Workflow?`)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/approval-workflow/submit', {
        documentType: 'INVOICE',
        documentId: invoice.id,
        amount: invoice.totalAmount
      });
      
      setSuccess(`${invoice.invoiceNumber} sent to Approval Workflow!`);
      loadParkedInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send to workflow');
    } finally {
      setLoading(false);
    }
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
      <h2>📄 Parked Invoices ({parkedInvoices.length})</h2>
      <p className="page-description">Send parked invoices to Approval Workflow for review</p>
      
      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}

      <div className="card full-width">
        <div className="table-header">
          <h3>Parked Invoices</h3>
          <button className="btn-secondary" onClick={loadParkedInvoices}>🔄 Refresh</button>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Party</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parkedInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.invoiceNumber}</strong></td>
                  <td>{invoice.partyName}</td>
                  <td className="amount-right">₹{formatCurrency(invoice.totalAmount)}</td>
                  <td>{formatDate(invoice.date)}</td>
                  <td>{invoice.User?.name || invoice.createdByName || 'Unknown'}</td>
                  <td>
                    <span className="status-badge status-parked">⏳ Parked</span>
                  </td>
                  <td>
                    <button 
                      className="btn-warning btn-small"
                      onClick={() => sendToWorkflow(invoice)}
                      disabled={loading}
                    >
                      📤 Send to Approval
                    </button>
                  </td>
                </tr>
              ))}
              {parkedInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    <div className="empty-state">
                      <p>🎉 No parked invoices</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParkedInvoices;