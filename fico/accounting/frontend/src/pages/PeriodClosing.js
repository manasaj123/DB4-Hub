// frontend/src/pages/PeriodClosing.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/Common.css';

const PeriodClosing = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const res = await api.get('/period-closing');
      setPeriods(res.data || []);
    } catch (err) {
      setError('Failed to load periods');
    }
  };

  // Format period for display: "2026-04" -> "April 2026"
  const formatPeriod = (periodStr) => {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Get status of selected period
  const getSelectedPeriodStatus = () => {
    const period = periods.find(p => p.period === selectedPeriod);
    return period ? period.status : 'OPEN';
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) {
      setError('Please select a period first');
      return;
    }

    // Confirm before closing
    if (!window.confirm(`Are you sure you want to close ${formatPeriod(selectedPeriod)}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/period-closing/close', {
        period: selectedPeriod
      });
      
      setSuccess(`${formatPeriod(selectedPeriod)} closed successfully!`);
      loadPeriods(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close period');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPeriod = async () => {
    if (!selectedPeriod) {
      setError('Please select a period first');
      return;
    }

    if (!window.confirm(`Are you sure you want to reopen ${formatPeriod(selectedPeriod)}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/period-closing/open', {
        period: selectedPeriod
      });
      
      setSuccess(`${formatPeriod(selectedPeriod)} reopened successfully!`);
      loadPeriods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen period');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusStyle = (status) => {
    switch (status) {
      case 'OPEN': return { background: '#e8f5e8', color: '#2e7d32' };
      case 'CLOSED': return { background: '#fbe9e7', color: '#d32f2f' };
      case 'LOCKED': return { background: '#fff3e0', color: '#e65100' };
      default: return { background: '#f5f5f5', color: '#666' };
    }
  };

  return (
    <div>
      <h2>Period Closing</h2>
      <p className="page-description">
        Close accounting periods to prevent further changes. 
        Once closed, no new transactions can be posted in that period.
      </p>

      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}

      <div className="grid-2">
        {/* Left Panel - Actions */}
        <div className="card">
          <h3>Period Actions</h3>

          <div className="form-group">
            <label>Select Period to Manage</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setError('');
                setSuccess('');
              }}
            >
              <option value="">-- Select Period --</option>
              {periods.map(period => (
                <option key={period.period} value={period.period}>
                  {formatPeriod(period.period)} - {period.status}
                </option>
              ))}
            </select>
          </div>

          {selectedPeriod && (
            <div className="selected-period-info">
              <p>
                <strong>Selected:</strong> {formatPeriod(selectedPeriod)}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span style={{
                  ...getStatusStyle(getSelectedPeriodStatus()),
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  {getSelectedPeriodStatus()}
                </span>
              </p>
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn-danger"
              onClick={handleClosePeriod}
              disabled={
                !selectedPeriod || 
                getSelectedPeriodStatus() !== 'OPEN' ||
                loading
              }
              title="Prevent new transactions in this period"
            >
              {loading ? 'Processing...' : '🔒 Close Period'}
            </button>

            <button
              className="btn-secondary"
              onClick={handleOpenPeriod}
              disabled={
                !selectedPeriod || 
                getSelectedPeriodStatus() !== 'CLOSED' ||
                loading
              }
              title="Allow transactions again in this period"
            >
              {loading ? 'Processing...' : '🔓 Reopen Period'}
            </button>
          </div>

          <div className="help-text">
            <h4>What happens when you close a period?</h4>
            <ul>
              <li>✅ No new invoices or payments can be posted</li>
              <li>✅ Existing transactions cannot be modified</li>
              <li>✅ Financial reports for this period are final</li>
              <li>⚠️ You can reopen if adjustments are needed</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Period List */}
        <div className="card">
          <h3>All Periods Status</h3>
          
          {periods.length === 0 ? (
            <div className="empty-state">
              <p>No periods found.</p>
              <p className="text-muted">
                Periods are automatically created when you post transactions.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Closed By</th>
                  <th>Closed Date</th>
                </tr>
              </thead>
              <tbody>
                {periods
                  .sort((a, b) => b.period.localeCompare(a.period)) // Newest first
                  .map(period => (
                    <tr 
                      key={period.period}
                      className={period.period === selectedPeriod ? 'selected-row' : ''}
                      onClick={() => {
                        setSelectedPeriod(period.period);
                        setError('');
                        setSuccess('');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <strong>{formatPeriod(period.period)}</strong>
                      </td>
                      <td>
                        <span style={{
                          ...getStatusStyle(period.status),
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          {period.status === 'OPEN' ? '🔓' : period.status === 'CLOSED' ? '🔒' : '🔐'} {period.status}
                        </span>
                      </td>
                      <td>{period.closedByName || '-'}</td>
                      <td>
                        {period.closedDate 
                          ? new Date(period.closedDate).toLocaleDateString('en-IN')
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodClosing;