// frontend/src/pages/DownPayments.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const DownPayments = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  const [form, setForm] = useState({
    downPaymentNumber: '',
    partyName: '',
    type: 'AR',
    amount: '',
    paymentDate: formattedToday, // Default to today's date
    reference: '',
    status: 'POSTED'
  });

  const [parties, setParties] = useState([]);
  const [downPayments, setDownPayments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    loadParties();
    loadDownPayments();
  }, []);

  const loadParties = async () => {
    try {
      const res = await api.get('/invoices/parties');
      setParties(res.data); // each row: { partyName, type }
    } catch (err) {
      console.error('Failed to load parties:', err);
    }
  };

  const loadDownPayments = async () => {
    try {
      const res = await api.get('/down-payments');
      setDownPayments(res.data);
    } catch (err) {
      console.error('Failed to load down payments:', err);
    }
  };

  // Get filtered parties based on selected type
  const getFilteredParties = () => {
    return parties.filter(party => party.type === form.type);
  };

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'type':
        if (!value) {
          return 'Type is required';
        }
        if (!['AR', 'AP'].includes(value)) {
          return 'Type must be either AR (Customer Advance) or AP (Vendor Advance)';
        }
        return '';

      case 'partyName':
        if (!value) {
          return 'Party is required';
        }
        // Check if selected party type matches the transaction type
        const selectedParty = parties.find(p => p.partyName === value);
        if (selectedParty && selectedParty.type !== form.type) {
          return `Party "${value}" is type ${selectedParty.type}, but you selected ${form.type}. Party type must match transaction type.`;
        }
        return '';

      case 'amount':
        if (!value && value !== 0) {
          return 'Amount is required';
        }
        const amountNum = Number(value);
        if (isNaN(amountNum)) {
          return 'Amount must be a valid number';
        }
        if (amountNum === 0) {
          return 'Amount cannot be zero';
        }
        if (amountNum < 0) {
          return 'Amount cannot be negative. Use positive values for advances.';
        }
        return '';

      case 'paymentDate':
        if (!value) {
          return 'Payment date is required';
        }
        
        const selectedDate = new Date(value);
        const currentDate = new Date();
        
        // Reset time components for accurate date comparison
        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Check if date is not today
        if (selectedDate.getTime() !== currentDate.getTime()) {
          if (selectedDate < currentDate) {
            return 'Payment date cannot be in the past. Only today\'s date is allowed.';
          } else {
            return 'Payment date cannot be in the future. Only today\'s date is allowed.';
          }
        }
        return '';

      case 'reference':
        if (value && value.trim().length > 50) {
          return 'Reference must be 50 characters or less';
        }
        if (value && !/^[A-Za-z0-9\s\-_.]*$/.test(value.trim())) {
          return 'Reference can only contain letters, numbers, spaces, hyphens, underscores, and dots';
        }
        return '';

      case 'status':
        if (!value) {
          return 'Status is required';
        }
        if (!['POSTED', 'CLEARED', 'CANCELLED'].includes(value)) {
          return 'Invalid status';
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      
      // If type changes, clear party selection if it doesn't match
      if (name === 'type') {
        newForm.partyName = '';
        // Clear party error when type changes
        setFieldErrors(prev => ({ ...prev, partyName: '' }));
      }
      
      return newForm;
    });
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate the changed field
    const errorMsg = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
    
    // If party changed, validate party against type
    if (name === 'partyName' && value) {
      const partyError = validateField('partyName', value);
      setFieldErrors(prev => ({
        ...prev,
        partyName: partyError
      }));
    }
    
    // Clear general error
    setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Trim reference on blur
    if (name === 'reference' && value) {
      const trimmed = value.trim();
      if (trimmed !== value) {
        setForm(prev => ({ ...prev, reference: trimmed }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(form).forEach(key => {
      if (key !== 'downPaymentNumber') { // Skip read-only field
        allTouched[key] = true;
      }
    });
    setTouchedFields(allTouched);

    // Validate each field
    Object.keys(form).forEach(fieldName => {
      if (fieldName !== 'downPaymentNumber') {
        const error = validateField(fieldName, form[fieldName]);
        if (error) {
          errors[fieldName] = error;
          isValid = false;
        }
      }
    });

    // Additional cross-validation: Party must match type
    if (form.partyName && form.type) {
      const selectedParty = parties.find(p => p.partyName === form.partyName);
      if (selectedParty && selectedParty.type !== form.type) {
        errors.partyName = `Cannot create ${form.type} down payment for ${selectedParty.type} party "${form.partyName}". Please change type or select a ${form.type} party.`;
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      const payload = {
        type: form.type,
        partyName: form.partyName,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        reference: form.reference ? form.reference.trim() : '',
        status: form.status
      };

      const res = await api.post('/down-payments', payload);

      setSuccess(`Down payment ${res.data.downPaymentNumber} created successfully!`);
      
      setForm({
        downPaymentNumber: res.data.downPaymentNumber || '',
        partyName: '',
        type: 'AR',
        amount: '',
        paymentDate: formattedToday, // Reset to today's date
        reference: '',
        status: 'POSTED'
      });
      
      setFieldErrors({});
      setTouchedFields({});
      loadDownPayments();
    } catch (err) {
      console.error('Down payment save error:', err.response?.data || err.message);
      
      if (err.response?.status === 400) {
        const errors = err.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          setError(errors.join('\n'));
        } else {
          setError(err.response?.data?.message || 'Validation failed');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to create down payment');
      }
    }
  };

  // Check if field should show error
  const shouldShowError = (fieldName) => {
    return touchedFields[fieldName] && fieldErrors[fieldName];
  };

  const totalAdvances = downPayments.reduce(
    (sum, dp) => sum + Number(dp.amount || 0),
    0
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div>
      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .card {
          background: #ffffff;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.375rem;
        }
        .required-star {
          color: #ef4444;
          font-weight: bold;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-group input.error-input,
        .form-group select.error-input {
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        .form-group input.readonly-input {
          background-color: #f3f4f6;
          color: #6b7280;
        }
        .field-error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }
        .helper-text {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 0.125rem;
        }
        .btn-primary {
          width: 100%;
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          border: none;
          background-color: #2563eb;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background-color 0.15s ease;
          margin-top: 0.5rem;
        }
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        .btn-primary:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        .error-text {
          color: #b91c1c;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          padding: 0.75rem;
          background: #fee2e2;
          border-radius: 6px;
          border-left: 4px solid #ef4444;
          white-space: pre-line;
        }
        .success-text {
          color: #166534;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          padding: 0.75rem;
          background: #dcfce7;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .table th {
          background: #f9fafb;
          padding: 0.75rem;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
          text-align: left;
          white-space: nowrap;
        }
        .table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        .table tbody tr:hover {
          background: #f9fafb;
        }
        .table-total {
          background: #f0f9ff;
          font-weight: 600;
        }
        .table-total td {
          border-top: 2px solid #2563eb;
        }
        .no-data {
          text-align: center;
          color: #6b7280;
          padding: 2rem;
          font-style: italic;
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status-POSTED {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-CLEARED {
          background: #dcfce7;
          color: #166534;
        }
        .status-CANCELLED {
          background: #fee2e2;
          color: #991b1b;
        }
        .amount-positive {
          color: #059669;
          font-weight: 600;
        }
        .amount-negative {
          color: #dc2626;
          font-weight: 600;
        }
        .date-indicator {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          background: #dcfce7;
          color: #166534;
          margin-left: 8px;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1.25rem;
        }
        h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.25rem;
          margin-top: 0;
        }
        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2>Down Payments (Customer/Vendor Advances)</h2>
      
      <div className="grid-2">
        <div className="card">
          <h3>Create Down Payment</h3>
          {error && <div className="error-text">⚠️ {error}</div>}
          {success && <div className="success-text">✅ {success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Down Payment No.</label>
              <input
                name="downPaymentNumber"
                value={form.downPaymentNumber}
                readOnly
                placeholder="Will be generated (DB4-DP-001)"
                className="readonly-input"
              />
              <div className="helper-text">Auto-generated by system</div>
            </div>

            <div className="form-group">
              <label>
                Type <span className="required-star">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={shouldShowError('type') ? 'error-input' : ''}
              >
                <option value="AR">Customer Advance (AR)</option>
                <option value="AP">Vendor Advance (AP)</option>
              </select>
              {shouldShowError('type') && <div className="field-error">{fieldErrors.type}</div>}
            </div>

            <div className="form-group">
              <label>
                Party <span className="required-star">*</span>
              </label>
              <select
                name="partyName"
                value={form.partyName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={shouldShowError('partyName') ? 'error-input' : ''}
              >
                <option value="">Select Party</option>
                {getFilteredParties().map((p, idx) => (
                  <option key={idx} value={p.partyName}>
                    {p.partyName} ({p.type})
                  </option>
                ))}
              </select>
              {!shouldShowError('partyName') && (
                <div className="helper-text">
                  Only {form.type === 'AR' ? 'Customer (AR)' : 'Vendor (AP)'} parties shown
                </div>
              )}
              {shouldShowError('partyName') && <div className="field-error">{fieldErrors.partyName}</div>}
            </div>

            <div className="form-group">
              <label>
                Amount <span className="required-star">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                className={shouldShowError('amount') ? 'error-input' : ''}
              />
              <div className="helper-text">Must be a positive number</div>
              {shouldShowError('amount') && <div className="field-error">{fieldErrors.amount}</div>}
            </div>

            <div className="form-group">
              <label>
                Payment Date <span className="required-star">*</span>
                <span className="date-indicator">TODAY ONLY</span>
              </label>
              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                min={formattedToday}
                max={formattedToday}
                className={shouldShowError('paymentDate') ? 'error-input' : ''}
              />
              <div className="helper-text">
                Only today's date ({new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}) is allowed
              </div>
              {shouldShowError('paymentDate') && <div className="field-error">{fieldErrors.paymentDate}</div>}
            </div>

            <div className="form-group">
              <label>Reference</label>
              <input
                name="reference"
                value={form.reference}
                onChange={handleChange}
                onBlur={handleBlur}
                className={shouldShowError('reference') ? 'error-input' : ''}
                placeholder="Enter reference (optional)"
                maxLength={50}
              />
              {shouldShowError('reference') && <div className="field-error">{fieldErrors.reference}</div>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                onBlur={handleBlur}
                className={shouldShowError('status') ? 'error-input' : ''}
              >
                <option value="POSTED">Posted</option>
                <option value="CLEARED">Cleared</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {shouldShowError('status') && <div className="field-error">{fieldErrors.status}</div>}
            </div>

            <button className="btn-primary" type="submit">
              Save & Post
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Down Payments Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {downPayments.map((dp) => (
                  <tr key={dp.id}>
                    <td style={{ fontWeight: '600' }}>{dp.downPaymentNumber}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: dp.type === 'AR' ? '#dbeafe' : '#fef3c7',
                        color: dp.type === 'AR' ? '#1e40af' : '#92400e'
                      }}>
                        {dp.type}
                      </span>
                    </td>
                    <td>{dp.partyName}</td>
                    <td className={Number(dp.amount) >= 0 ? 'amount-positive' : 'amount-negative'}>
                      ₹{Number(dp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      {formatDate(dp.paymentDate)}
                      {dp.paymentDate === formattedToday && (
                        <span className="date-indicator" style={{ marginLeft: '4px', fontSize: '0.65rem' }}>Today</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${dp.status}`}>
                        {dp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {downPayments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No down payments yet.</td>
                  </tr>
                )}
                {downPayments.length > 0 && (
                  <tr className="table-total">
                    <td colSpan="3">
                      <strong>Total Advances</strong>
                    </td>
                    <td>
                      <strong className={totalAdvances >= 0 ? 'amount-positive' : 'amount-negative'}>
                        ₹{totalAdvances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownPayments;