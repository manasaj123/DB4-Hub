// frontend/src/pages/GLAccounts.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const initialForm = {
  glCode: '',
  name: '',
  companyCode: '',
  accountType: 'ASSET',
  accountCurrency: 'INR',
  taxCategory: '',
  reconciliationType: 'NONE',
  altAccountNumber: '',
  toleranceGroup: '',
  fieldStatusGroup: '',
  planningLevel: '',
  isBlockedForPosting: false,
};

const GLAccounts = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const load = async () => {
    try {
      const res = await api.get('/gl-accounts');
      setRows(res.data || []);
    } catch (err) {
      console.error('GLAccounts load error', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load GL accounts');
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  // Validation patterns
  const validationRules = {
    glCode: {
      pattern: /^[A-Za-z0-9]+$/,
      message: 'G/L Code: Only letters and numbers allowed (no special characters or spaces)',
      minLength: 1,
      maxLength: 20,
      required: true
    },
    name: {
      pattern: /^[A-Za-z0-9\s\-_.]+$/,
      message: 'Name: Only letters, numbers, spaces, hyphens, underscores and dots allowed',
      minLength: 1,
      maxLength: 100,
      required: true
    },
    companyCode: {
      pattern: /^[A-Za-z0-9]+$/,
      message: 'Company Code: Only letters and numbers allowed (no special characters)',
      minLength: 1,
      maxLength: 10,
      required: true
    },
    accountCurrency: {
      pattern: /^[A-Z]{2,3}$/,
      message: 'Currency: Must be 2-3 uppercase letters (e.g., INR, USD, EUR)',
      minLength: 2,
      maxLength: 3,
      required: true
    },
    taxCategory: {
      pattern: /^[A-Za-z0-9]*$/,
      message: 'Tax Category: Only letters and numbers allowed',
      maxLength: 10,
      required: false
    },
    altAccountNumber: {
      pattern: /^[A-Za-z0-9]*$/,
      message: 'Alt. Account No.: Only letters and numbers allowed',
      maxLength: 20,
      required: false
    },
    toleranceGroup: {
      pattern: /^[A-Za-z0-9]*$/,
      message: 'Tolerance Group: Only letters and numbers allowed',
      maxLength: 10,
      required: false
    },
    fieldStatusGroup: {
      pattern: /^[A-Za-z0-9]*$/,
      message: 'Field Status Group: Only letters and numbers allowed',
      maxLength: 10,
      required: false
    },
    planningLevel: {
      pattern: /^[A-Za-z0-9]*$/,
      message: 'Planning Level: Only letters and numbers allowed',
      maxLength: 10,
      required: false
    }
  };

  // Validate a single field
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    const trimmedValue = value.trim();

    // Check required
    if (rules.required && !trimmedValue) {
      return `${name}: This field is required`;
    }

    // If not required and empty, it's valid
    if (!rules.required && !trimmedValue) {
      return '';
    }

    // Check pattern (only if value is not empty)
    if (trimmedValue && rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message;
    }

    // Check length
    if (trimmedValue && rules.minLength && trimmedValue.length < rules.minLength) {
      return `${name}: Must be at least ${rules.minLength} characters`;
    }
    if (trimmedValue && rules.maxLength && trimmedValue.length > rules.maxLength) {
      return `${name}: Must be no more than ${rules.maxLength} characters`;
    }

    // Check uniqueness for glCode
    if (name === 'glCode' && trimmedValue) {
      if (!editingId) {
        const isDuplicate = rows.some(
          (row) => row.glCode.toLowerCase() === trimmedValue.toLowerCase()
        );
        if (isDuplicate) {
          return `G/L Code '${trimmedValue}' already exists`;
        }
      } else {
        const isDuplicate = rows.some(
          (row) => 
            row.glCode.toLowerCase() === trimmedValue.toLowerCase() && 
            row.id !== editingId
        );
        if (isDuplicate) {
          return `G/L Code '${trimmedValue}' already exists in another account`;
        }
      }
    }

    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, form[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Real-time validation
    const errorMsg = validateField(name, newValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
    
    // Clear general error when user makes changes
    setError('');
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      glCode: row.glCode || '',
      name: row.name || '',
      companyCode: row.companyCode || '',
      accountType: row.accountType || 'INCOME',
      accountCurrency: row.accountCurrency || 'INR',
      taxCategory: row.taxCategory || '',
      reconciliationType: row.reconciliationType || 'NONE',
      altAccountNumber: row.altAccountNumber || '',
      toleranceGroup: row.toleranceGroup || '',
      fieldStatusGroup: row.fieldStatusGroup || '',
      planningLevel: row.planningLevel || '',
      isBlockedForPosting: !!row.isBlockedForPosting,
    });
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate all fields
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    // Prepare payload with trimmed values
    const payload = {};
    Object.keys(form).forEach(key => {
      if (typeof form[key] === 'string') {
        payload[key] = form[key].trim();
      } else {
        payload[key] = form[key];
      }
    });
    
    try {
      if (editingId) {
        await api.put(`/gl-accounts/${editingId}`, payload);
        setSuccess('G/L account updated successfully');
      } else {
        await api.post('/gl-accounts', payload);
        setSuccess('G/L account created successfully');
      }
      setForm(initialForm);
      setEditingId(null);
      setFieldErrors({});
      await load();
    } catch (err) {
      console.error('GLAccounts save error', err.response?.data || err.message);
      
      // Handle specific error messages from backend
      if (err.response?.status === 409) {
        setFieldErrors(prev => ({
          ...prev,
          glCode: err.response.data.message
        }));
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Validation failed');
      } else {
        setError(err.response?.data?.message || 'Save failed');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this G/L account? This action cannot be undone.')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/gl-accounts/${id}`);
      setSuccess('G/L account deleted successfully');
      await load();
    } catch (err) {
      console.error('GLAccounts delete error', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="gl-page">
      {/* internal CSS */}
      <style>{`
        .gl-page {
          padding: 16px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #f5f5f7;
          max-width: 1400px;
          margin: 0 auto;
        }
        .gl-title {
          margin-bottom: 12px;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .gl-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }
        .gl-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px 20px;
        }
        .gl-form-grid label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }
        .gl-form-grid .required::after {
          content: " *";
          color: #ef4444;
        }
        .gl-form-grid input,
        .gl-form-grid select {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
          background-color: #ffffff;
        }
        .gl-form-grid input:focus,
        .gl-form-grid select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .gl-form-grid input.error-input {
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        .gl-form-grid input.error-input:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .gl-field-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
        }
        .gl-checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 24px;
        }
        .gl-checkbox-group input[type="checkbox"] {
          width: auto;
          cursor: pointer;
        }
        .gl-checkbox-group label {
          cursor: pointer;
          margin-bottom: 0;
        }
        .gl-form-actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 8px;
        }
        .gl-form-actions button {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .gl-form-actions button[type="submit"] {
          background: #2563eb;
          color: #fff;
        }
        .gl-form-actions button[type="submit"]:hover {
          background: #1d4ed8;
        }
        .gl-form-actions button[type="button"] {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .gl-form-actions button[type="button"]:hover {
          background: #e5e7eb;
        }
        .gl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .gl-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
        }
        .gl-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        .gl-table tbody tr:hover {
          background: #f9fafb;
        }
        .gl-table button {
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          margin-right: 6px;
          transition: all 0.15s ease;
        }
        .gl-table .edit-btn {
          background: #2563eb;
          color: #fff;
        }
        .gl-table .edit-btn:hover {
          background: #1d4ed8;
        }
        .gl-table .delete-btn {
          background: #ef4444;
          color: #fff;
        }
        .gl-table .delete-btn:hover {
          background: #dc2626;
        }
        .gl-error {
          margin-bottom: 16px;
          padding: 12px 16px;
          font-size: 14px;
          color: #991b1b;
          background: #fee2e2;
          border-radius: 6px;
          border-left: 4px solid #ef4444;
        }
        .gl-success {
          margin-bottom: 16px;
          padding: 12px 16px;
          font-size: 14px;
          color: #166534;
          background: #dcfce7;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        }
        .gl-no-data {
          text-align: center;
          color: #6b7280;
          padding: 32px;
          font-style: italic;
        }
        .gl-helper-text {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
          font-weight: normal;
        }
      `}</style>

      <h2 className="gl-title">G/L Accounts</h2>

      {error && <div className="gl-error">⚠️ {error}</div>}
      {success && <div className="gl-success">✅ {success}</div>}

      <div className="gl-card">
        <form onSubmit={handleSubmit} className="gl-form-grid">
          <div>
            <label className="required">G/L Code</label>
            <input
              name="glCode"
              value={form.glCode}
              onChange={handleChange}
              required
              className={fieldErrors.glCode ? 'error-input' : ''}
              placeholder="Enter G/L Code (letters & numbers only)"
              maxLength={20}
            />
            <div className="gl-helper-text">Only letters and numbers, no special characters</div>
            {fieldErrors.glCode && <div className="gl-field-error">{fieldErrors.glCode}</div>}
          </div>
          
          <div>
            <label className="required">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={fieldErrors.name ? 'error-input' : ''}
              placeholder="Enter account name"
              maxLength={100}
            />
            {fieldErrors.name && <div className="gl-field-error">{fieldErrors.name}</div>}
          </div>
          
          <div>
            <label className="required">Company Code</label>
            <input
              name="companyCode"
              value={form.companyCode}
              onChange={handleChange}
              required
              className={fieldErrors.companyCode ? 'error-input' : ''}
              placeholder="Enter company code"
              maxLength={10}
            />
            <div className="gl-helper-text">Only letters and numbers, no special characters</div>
            {fieldErrors.companyCode && <div className="gl-field-error">{fieldErrors.companyCode}</div>}
          </div>
          
          <div>
            <label className="required">Account Type</label>
            <select
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
              required
            >
              
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          
          <div>
            <label className="required">Currency</label>
            <input
              name="accountCurrency"
              value={form.accountCurrency}
              onChange={handleChange}
              required
              className={fieldErrors.accountCurrency ? 'error-input' : ''}
              placeholder="e.g., INR, USD, EUR"
              maxLength={3}
              style={{ textTransform: 'uppercase' }}
            />
            <div className="gl-helper-text">2-3 uppercase letters (e.g., INR, USD)</div>
            {fieldErrors.accountCurrency && <div className="gl-field-error">{fieldErrors.accountCurrency}</div>}
          </div>
          
          <div>
            <label>Tax Category</label>
            <input
              name="taxCategory"
              value={form.taxCategory}
              onChange={handleChange}
              className={fieldErrors.taxCategory ? 'error-input' : ''}
              placeholder="Enter tax category"
              maxLength={10}
            />
            <div className="gl-helper-text">Optional: letters and numbers only</div>
            {fieldErrors.taxCategory && <div className="gl-field-error">{fieldErrors.taxCategory}</div>}
          </div>
          
          <div>
            <label>Reconciliation Type</label>
            <select
              name="reconciliationType"
              value={form.reconciliationType}
              onChange={handleChange}
            >
              <option value="NONE">None</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>
          
          <div>
            <label>Alt. Account No.</label>
            <input
              name="altAccountNumber"
              value={form.altAccountNumber}
              onChange={handleChange}
              className={fieldErrors.altAccountNumber ? 'error-input' : ''}
              placeholder="Enter alt. account number"
              maxLength={20}
            />
            <div className="gl-helper-text">Optional: letters and numbers only</div>
            {fieldErrors.altAccountNumber && <div className="gl-field-error">{fieldErrors.altAccountNumber}</div>}
          </div>
          
          <div>
            <label>Tolerance Group</label>
            <input
              name="toleranceGroup"
              value={form.toleranceGroup}
              onChange={handleChange}
              className={fieldErrors.toleranceGroup ? 'error-input' : ''}
              placeholder="Enter tolerance group"
              maxLength={10}
            />
            {fieldErrors.toleranceGroup && <div className="gl-field-error">{fieldErrors.toleranceGroup}</div>}
          </div>
          
          <div>
            <label>Field Status Group</label>
            <input
              name="fieldStatusGroup"
              value={form.fieldStatusGroup}
              onChange={handleChange}
              className={fieldErrors.fieldStatusGroup ? 'error-input' : ''}
              placeholder="Enter field status group"
              maxLength={10}
            />
            {fieldErrors.fieldStatusGroup && <div className="gl-field-error">{fieldErrors.fieldStatusGroup}</div>}
          </div>
          
          <div>
            <label>Planning Level</label>
            <input
              name="planningLevel"
              value={form.planningLevel}
              onChange={handleChange}
              className={fieldErrors.planningLevel ? 'error-input' : ''}
              placeholder="Enter planning level"
              maxLength={10}
            />
            {fieldErrors.planningLevel && <div className="gl-field-error">{fieldErrors.planningLevel}</div>}
          </div>
          
          <div className="gl-checkbox-group">
            <input
              type="checkbox"
              name="isBlockedForPosting"
              id="isBlockedForPosting"
              checked={form.isBlockedForPosting}
              onChange={handleChange}
            />
            <label htmlFor="isBlockedForPosting">Block for posting</label>
          </div>
          
          <div className="gl-form-actions">
            <button type="submit">
              {editingId ? '✓ Update Account' : '+ Create Account'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel}>
                ✕ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="gl-card">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          Account List ({rows.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="gl-table">
            <thead>
              <tr>
                <th>G/L Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Company</th>
                <th>Currency</th>
                <th>Recon Type</th>
                <th>Blocked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.glCode}</td>
                  <td>{r.name}</td>
                  <td>{r.accountType}</td>
                  <td>{r.companyCode}</td>
                  <td>{r.accountCurrency}</td>
                  <td>{r.reconciliationType}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: r.isBlockedForPosting ? '#fee2e2' : '#dcfce7',
                      color: r.isBlockedForPosting ? '#991b1b' : '#166534'
                    }}>
                      {r.isBlockedForPosting ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button className="edit-btn" type="button" onClick={() => handleEdit(r)}>
                      Edit
                    </button>
                    <button className="delete-btn" type="button" onClick={() => handleDelete(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="gl-no-data">
                    No G/L accounts found. Create your first account above.
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

export default GLAccounts;