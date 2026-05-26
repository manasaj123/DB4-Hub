// frontend/src/pages/CustomerCreditMemo.js
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api';

const CustomerCreditMemo = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preType = params.get('type');
  const prePartyId = params.get('partyId');
  const preInvoice = params.get('invoice');

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  const [form, setForm] = useState({
    creditMemoNumber: '',
    type: preType || 'AR',
    partyId: prePartyId || '',
    partyName: '',
    referenceInvoice: preInvoice || '',
    amount: '',
    taxAmount: '',
    totalAmount: '',
    date: formattedToday,
    reason: '',
    status: 'DRAFT',
  });

  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [creditMemos, setCreditMemos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    loadParties();
    loadCreditMemos();
  }, []);

  useEffect(() => {
    if (prePartyId && preType && parties.length > 0) {
      const party = parties.find(p => String(p.id) === String(prePartyId));
      if (party) {
        loadInvoices(party.name, preType).then(() => {
          if (preInvoice) {
            handleInvoicePrefill(preInvoice);
          }
        });
      }
    }
  }, [prePartyId, preType, preInvoice, parties]);

  // ========== DATA LOADING ==========
  
  const loadParties = async () => {
    try {
      // Use same endpoint as DownPayments.js which works
      const res = await api.get('/invoices/parties');
      // Map { partyName, type } to { id, name, type }
      const mappedParties = (res.data || []).map((p, idx) => ({
        id: p.id || idx + 1,
        name: p.partyName,
        type: p.type
      }));
      setParties(mappedParties);
      
      // Set partyName if prePartyId exists
      if (prePartyId) {
        const party = mappedParties.find(p => String(p.id) === String(prePartyId));
        if (party) {
          setForm(prev => ({ ...prev, partyName: party.name }));
        }
      }
    } catch (err) {
      console.error('Failed to load parties:', err);
      setParties([]);
    }
  };

  const loadInvoices = async (partyName, type) => {
    if (!partyName) return;
    try {
      const encodedName = encodeURIComponent(partyName);
      const res = await api.get(`/invoices/party/${encodedName}?type=${type}`);
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    }
  };

  const handleInvoicePrefill = async (invoiceNumber) => {
    if (!invoiceNumber) return;
    try {
      const res = await api.get(`/invoices/by-number/${invoiceNumber}`);
      const inv = res.data;
      setForm((prev) => ({
        ...prev,
        referenceInvoice: invoiceNumber,
        amount: inv.baseAmount || inv.totalAmount || '',
        taxAmount: inv.gstAmount || '',
        totalAmount: inv.totalAmount || '',
      }));
    } catch (err) {
      console.error('Failed to load invoice details:', err);
      setError('Failed to load invoice details');
    }
  };

  const loadCreditMemos = async () => {
    try {
      const res = await api.get('/credit-memos');
      setCreditMemos(res.data || []);
    } catch (err) {
      console.error('Failed to load credit memos:', err);
    }
  };

  // ========== FILTERING ==========
  
  const getFilteredParties = () => {
    return parties.filter(party => party.type === form.type);
  };

  // ========== VALIDATION ==========
  
  const validateField = (name, value) => {
    switch (name) {
      case 'type':
        if (!value) return 'Type is required';
        return '';
      case 'partyId':
        if (!value) return 'Party is required';
        return '';
      case 'amount':
        if (!value && value !== 0) return 'Credit amount is required';
        if (Number(value) <= 0) return 'Must be a positive number';
        return '';
      case 'totalAmount':
        if (!value && value !== 0) return 'Total amount is required';
        if (Number(value) <= 0) return 'Must be a positive number';
        return '';
      case 'date':
        if (!value) return 'Date is required';
        const sd = new Date(value);
        const cd = new Date();
        sd.setHours(0,0,0,0);
        cd.setHours(0,0,0,0);
        if (sd.getTime() !== cd.getTime()) return 'Only today\'s date is allowed';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      
      if (name === 'type') {
        newForm.partyId = '';
        newForm.partyName = '';
        newForm.referenceInvoice = '';
        setFieldErrors(prev => ({ ...prev, partyId: '' }));
        setInvoices([]);
      }
      
      if (name === 'partyId' && value) {
        const party = parties.find(p => String(p.id) === String(value));
        if (party) {
          newForm.partyName = party.name;
          loadInvoices(party.name, newForm.type);
        }
      }
      
      if (name === 'amount' || name === 'taxAmount') {
        const a = name === 'amount' ? Number(value)||0 : Number(newForm.amount)||0;
        const t = name === 'taxAmount' ? Number(value)||0 : Number(newForm.taxAmount)||0;
        newForm.totalAmount = (a + t).toFixed(2);
      }
      
      return newForm;
    });
    
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    
    if (name === 'referenceInvoice' && value) {
      handleInvoicePrefill(value);
    }
    
    setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    const allTouched = {};
    ['type','partyId','amount','totalAmount','date','status'].forEach(k => allTouched[k]=true);
    setTouchedFields(allTouched);
    
    ['type','partyId','amount','totalAmount','date','status'].forEach(f => {
      const err = validateField(f, form[f]);
      if (err) { errors[f] = err; isValid = false; }
    });
    
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
      const selectedParty = parties.find(p => String(p.id) === String(form.partyId));
      if (!selectedParty) { setError('Invalid party'); return; }

      const payload = {
        type: form.type,
        partyId: form.partyId,
        partyName: selectedParty.name,
        referenceInvoice: form.referenceInvoice || null,
        amount: Number(form.amount),
        taxAmount: Number(form.taxAmount || 0),
        totalAmount: Number(form.totalAmount),
        date: form.date,
        reason: form.reason?.trim() || '',
        status: form.status,
      };

      const res = await api.post('/credit-memos', payload);
      setSuccess(`Credit memo ${res.data.creditMemoNumber} created!`);
      
      setForm({
        creditMemoNumber: res.data.creditMemoNumber || '',
        type: 'AR', partyId: '', partyName: '',
        referenceInvoice: '', amount: '', taxAmount: '',
        totalAmount: '', date: formattedToday, reason: '', status: 'DRAFT',
      });
      
      setInvoices([]);
      setFieldErrors({});
      setTouchedFields({});
      loadCreditMemos();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create credit memo');
    }
  };

  const shouldShowError = (fn) => touchedFields[fn] && fieldErrors[fn];
  const totalAmount = creditMemos.reduce((s, cm) => s + Number(cm.totalAmount||0), 0);
  const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-IN',{year:'numeric',month:'2-digit',day:'2-digit'}) : '';

  return (
    <div>
      <style>{`
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
        .card{background:#fff;border-radius:8px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e5e7eb}
        .form-group{margin-bottom:1rem}
        .form-group label{display:block;font-size:.875rem;font-weight:600;color:#374151;margin-bottom:.375rem}
        .required-star{color:#ef4444;font-weight:700}
        .form-group input,.form-group select,.form-group textarea{width:100%;padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem;box-sizing:border-box}
        .form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
        .error-input{border-color:#ef4444!important;background-color:#fef2f2!important}
        .readonly-input{background-color:#f3f4f6;color:#6b7280}
        .form-group-inline{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
        .form-group-inline input{width:100%;padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem;box-sizing:border-box}
        .field-error{color:#ef4444;font-size:.75rem;margin-top:.25rem;font-weight:500}
        .helper-text{font-size:.7rem;color:#6b7280;margin-top:.125rem}
        .date-indicator{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.7rem;font-weight:600;background:#dcfce7;color:#166534;margin-left:8px}
        .btn-primary{width:100%;padding:.625rem 1.25rem;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;font-size:.9rem;margin-top:.5rem}
        .btn-primary:hover{background:#1d4ed8}
        .error-text{color:#b91c1c;margin-bottom:1rem;padding:.75rem;background:#fee2e2;border-radius:6px;border-left:4px solid #ef4444}
        .success-text{color:#166534;margin-bottom:1rem;padding:.75rem;background:#dcfce7;border-radius:6px;border-left:4px solid #10b981}
        .table{width:100%;border-collapse:collapse;font-size:.875rem}
        .table th{background:#f9fafb;padding:.75rem;border-bottom:2px solid #e5e7eb;font-weight:600;text-align:left}
        .table td{padding:.75rem;border-bottom:1px solid #e5e7eb}
        .table tbody tr:hover{background:#f9fafb}
        .table-total{background:#f0f9ff;font-weight:600}
        .table-total td{border-top:2px solid #2563eb}
        .no-data{text-align:center;color:#6b7280;padding:2rem;font-style:italic}
        .status-DRAFT{background:#fef3c7;color:#92400e}
        .status-POSTED{background:#dbeafe;color:#1e40af}
        .status-CANCELLED{background:#fee2e2;color:#991b1b}
        .status-badge{padding:2px 8px;border-radius:12px;font-size:.75rem;font-weight:500}
        .type-AR{background:#dbeafe;color:#1e40af}
        .type-AP{background:#fef3c7;color:#92400e}
        .type-badge{padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:500}
        .invoice-link{color:#2563eb;text-decoration:none;font-weight:500}
        .invoice-link:hover{text-decoration:underline}
        h2{font-size:1.5rem;font-weight:700;color:#1f2937;margin-bottom:1.25rem}
        h3{font-size:1.125rem;font-weight:600;color:#1f2937;margin-bottom:1.25rem;margin-top:0}
        @media(max-width:768px){.grid-2{grid-template-columns:1fr}.form-group-inline{grid-template-columns:1fr}}
      `}</style>

      <h2>Customer & Vendor Credit Memo</h2>
      
      <div className="grid-2">
        <div className="card">
          <h3>Create Credit Memo</h3>
          {error && <div className="error-text">⚠️ {error}</div>}
          {success && <div className="success-text">✅ {success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Credit Memo No.</label>
              <input name="creditMemoNumber" value={form.creditMemoNumber} readOnly placeholder="Auto-generated (DB4-CM-001)" className="readonly-input" />
              <div className="helper-text">Auto-generated by system</div>
            </div>

            <div className="form-group">
              <label>Type <span className="required-star">*</span></label>
              <select name="type" value={form.type} onChange={handleChange} onBlur={handleBlur} required className={shouldShowError('type')?'error-input':''}>
                <option value="AR">Customer Credit (AR)</option>
                <option value="AP">Vendor Credit (AP)</option>
              </select>
              {shouldShowError('type')&&<div className="field-error">{fieldErrors.type}</div>}
            </div>

            <div className="form-group">
              <label>Party Name <span className="required-star">*</span></label>
              <select name="partyId" value={form.partyId} onChange={handleChange} onBlur={handleBlur} required className={shouldShowError('partyId')?'error-input':''}>
                <option value="">Select Party</option>
                {getFilteredParties().map((party) => (
                  <option key={party.id} value={party.id}>{party.name} ({party.type})</option>
                ))}
              </select>
              {!shouldShowError('partyId') && <div className="helper-text">Only {form.type==='AR'?'Customer (AR)':'Vendor (AP)'} parties shown</div>}
              {shouldShowError('partyId')&&<div className="field-error">{fieldErrors.partyId}</div>}
            </div>

            <div className="form-group">
              <label>Reference Invoice</label>
              <select name="referenceInvoice" value={form.referenceInvoice} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Select Invoice (optional)</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} - ₹{Number(inv.totalAmount).toLocaleString('en-IN')}</option>
                ))}
              </select>
              <div className="helper-text">Select invoice to auto-fill amounts</div>
            </div>

            <div className="form-group">
              <label>Credit Amount <span className="required-star">*</span></label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} onBlur={handleBlur} required placeholder="Enter credit amount" min="0.01" step="0.01" className={shouldShowError('amount')?'error-input':''} />
              {shouldShowError('amount')&&<div className="field-error">{fieldErrors.amount}</div>}
            </div>

            <div className="form-group-inline">
              <div>
                <label>Tax Amount</label>
                <input type="number" name="taxAmount" value={form.taxAmount} onChange={handleChange} onBlur={handleBlur} placeholder="Tax amount" min="0" step="0.01" />
              </div>
              <div>
                <label>Total Amount <span className="required-star">*</span></label>
                <input type="number" name="totalAmount" value={form.totalAmount} onChange={handleChange} onBlur={handleBlur} required placeholder="Total" min="0.01" step="0.01" className={shouldShowError('totalAmount')?'error-input':''} />
                <div className="helper-text">Auto: Amount + Tax</div>
                {shouldShowError('totalAmount')&&<div className="field-error">{fieldErrors.totalAmount}</div>}
              </div>
            </div>

            <div className="form-group">
              <label>Date <span className="required-star">*</span> <span className="date-indicator">TODAY ONLY</span></label>
              <input type="date" name="date" value={form.date} onChange={handleChange} onBlur={handleBlur} required min={formattedToday} max={formattedToday} className={shouldShowError('date')?'error-input':''} />
              {shouldShowError('date')&&<div className="field-error">{fieldErrors.date}</div>}
            </div>

            <div className="form-group">
              <label>Reason</label>
              <textarea name="reason" value={form.reason} onChange={handleChange} onBlur={handleBlur} rows={2} placeholder="Enter reason (optional)" maxLength={255} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} onBlur={handleBlur}>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button className="btn-primary" type="submit">Save & Post</button>
          </form>
        </div>

        <div className="card">
          <h3>Credit Memos Summary</h3>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr><th>Number</th><th>Type</th><th>Party</th><th>Invoice</th><th>Total</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {creditMemos.map((cm) => (
                  <tr key={cm.id}>
                    <td style={{fontWeight:'600'}}>{cm.creditMemoNumber}</td>
                    <td><span className={`type-badge type-${cm.type}`}>{cm.type}</span></td>
                    <td>{cm.partyName}</td>
                    <td>{cm.referenceInvoice ? <Link to={`/invoices?invoice=${encodeURIComponent(cm.referenceInvoice)}`} className="invoice-link">{cm.referenceInvoice}</Link> : <span style={{color:'#9ca3af'}}>-</span>}</td>
                    <td style={{fontWeight:'500'}}>₹{Number(cm.totalAmount).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td>{formatDate(cm.date)}</td>
                    <td><span className={`status-badge status-${cm.status}`}>{cm.status}</span></td>
                  </tr>
                ))}
                {creditMemos.length===0 && <tr><td colSpan="7" className="no-data">No credit memos yet.</td></tr>}
                {creditMemos.length>0 && (
                  <tr className="table-total">
                    <td colSpan="4"><strong>Total</strong></td>
                    <td><strong>₹{totalAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></td>
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

export default CustomerCreditMemo;