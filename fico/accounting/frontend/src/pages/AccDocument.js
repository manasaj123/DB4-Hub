// frontend/src/pages/AccDocument.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const AccDocument = () => {
  // Get current date for defaults
  const today = new Date();
  const currentYear = today.getFullYear();
  const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  const [form, setForm] = useState({
    documentNumber: '',
    companyCode: 'DB4',
    fiscalYear: currentYear.toString(),
    documentDate: formattedToday,
    postingDate: formattedToday,
    period: (today.getMonth() + 1).toString(),
    reference: '',
    crossCompNumber: '',
    currency: 'INR',
    text: '',
    ledgerGroup: '',
  });

  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const loadDocs = async () => {
    try {
      const res = await api.get('/acc-documents');
      setDocs(res.data || []);
    } catch (err) {
      console.error('Acc document list error', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadDocs().catch(console.error);
  }, []);

  // Validation rules - updated to reject empty/whitespace for optional fields
  const validationRules = {
    companyCode: {
      pattern: /^[A-Za-z0-9]+$/,
      message: 'Only letters and numbers allowed (no special characters)',
      minLength: 1,
      maxLength: 10,
      required: true
    },
    fiscalYear: {
      pattern: /^\d{4}$/,
      message: 'Must be a 4-digit year (e.g., 2025)',
      required: true,
      min: 2000,
      max: 2099
    },
    documentDate: {
      required: true,
      message: 'Document Date is required'
    },
    postingDate: {
      required: true,
      message: 'Posting Date is required'
    },
    period: {
      pattern: /^(|[1-9]|1[0-2])$/,
      message: 'Must be between 1 and 12',
      required: false
    },
    reference: {
      pattern: /^[A-Za-z0-9\s\-_.]+$/,
      message: 'Only letters, numbers, spaces, hyphens, underscores, and dots allowed',
      minLength: 1,
      maxLength: 50,
      required: false,
      rejectWhitespaceOnly: true,
      whitespaceMessage: 'Reference cannot be empty or whitespace only. Enter a valid reference or leave the field empty.'
    },
    crossCompNumber: {
      pattern: /^[A-Za-z0-9\-_.]+$/,
      message: 'Only letters, numbers, hyphens, underscores, and dots allowed',
      minLength: 1,
      maxLength: 20,
      required: false,
      rejectWhitespaceOnly: true,
      whitespaceMessage: 'Cross-Comp Number cannot be empty or whitespace only. Enter a valid number or leave the field empty.'
    },
    currency: {
      pattern: /^[A-Z]{2,3}$/,
      message: 'Must be 2-3 uppercase letters (e.g., INR, USD, EUR)',
      minLength: 2,
      maxLength: 3,
      required: true
    },
    text: {
      maxLength: 255,
      required: false,
      rejectWhitespaceOnly: true,
      whitespaceMessage: 'Text cannot be whitespace only. Enter valid text or leave the field empty.'
    },
    ledgerGroup: {
      pattern: /^[A-Za-z0-9]+$/,
      message: 'Only letters and numbers allowed',
      minLength: 1,
      maxLength: 10,
      required: false,
      rejectWhitespaceOnly: true,
      whitespaceMessage: 'Partner BArea cannot be empty or whitespace only. Enter a valid value or leave the field empty.'
    }
  };

  // Validate a single field
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    const stringValue = typeof value === 'string' ? value : value.toString();
    const trimmedValue = stringValue.trim();

    // Check required
    if (rules.required && !trimmedValue) {
      return rules.message || 'This field is required';
    }

    // If not required and completely empty (no characters at all), it's valid
    if (!rules.required && stringValue === '') {
      return '';
    }

    // If field has whitespace-only and rejectWhitespaceOnly is true
    if (rules.rejectWhitespaceOnly && stringValue !== '' && trimmedValue === '') {
      return rules.whitespaceMessage || 'Field cannot be whitespace only';
    }

    // If not required and empty after trim, it's valid (user left it empty)
    if (!rules.required && !trimmedValue) {
      return '';
    }

    // Check pattern (only if value is not empty)
    if (trimmedValue && rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message;
    }

    // Check length
    if (trimmedValue && rules.minLength && trimmedValue.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (trimmedValue && rules.maxLength && trimmedValue.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }

    // Special validation for fiscal year
    if (name === 'fiscalYear' && trimmedValue) {
      const year = parseInt(trimmedValue);
      if (isNaN(year) || year < 2000 || year > 2099) {
        return 'Must be a valid year between 2000 and 2099';
      }
    }

    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Auto-convert currency to uppercase
    if (name === 'currency') {
      processedValue = value.toUpperCase();
    }
    
    setForm((prev) => ({ ...prev, [name]: processedValue }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Real-time validation
    const errorMsg = validateField(name, processedValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
    
    // Auto-update fiscal year based on document date
    if (name === 'documentDate' && value) {
      const docYear = new Date(value).getFullYear();
      if (!isNaN(docYear)) {
        setForm(prev => ({ ...prev, fiscalYear: docYear.toString() }));
        setFieldErrors(prev => ({ ...prev, fiscalYear: '' }));
      }
    }
    
    // Auto-calculate period from posting date
    if (name === 'postingDate' && value) {
      const postingDate = new Date(value);
      const period = (postingDate.getMonth() + 1).toString();
      setForm(prev => ({ ...prev, period: period }));
      setFieldErrors(prev => ({ ...prev, period: '' }));
    }
    
    // Clear general error when user makes changes
    setError('');
  };

  // Handle blur event to validate on leaving field
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Trim the value on blur for optional fields
    if (['reference', 'crossCompNumber', 'text', 'ledgerGroup'].includes(name)) {
      const trimmedValue = value.trim();
      if (value !== trimmedValue) {
        setForm(prev => ({ ...prev, [name]: trimmedValue }));
        const errorMsg = validateField(name, trimmedValue);
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMsg
        }));
      }
    }
  };

  // Validate all fields with cross-field validation
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Mark all fields as touched on submit
    const allTouched = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    setTouchedFields(allTouched);

    // Validate individual fields
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, form[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    // Cross-field validation for dates
    if (form.documentDate && form.postingDate) {
      const docDate = new Date(form.documentDate);
      const postDate = new Date(form.postingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Posting date should not be before document date
      if (postDate < docDate) {
        errors.postingDate = 'Posting date cannot be before document date';
        isValid = false;
      }
      
      // Document date should not be in the future
      if (docDate > today) {
        errors.documentDate = 'Document date cannot be in the future';
        isValid = false;
      }
    }

    // Validate fiscal year matches document date year
    if (form.documentDate && form.fiscalYear) {
      const docYear = new Date(form.documentDate).getFullYear();
      const fiscalYear = parseInt(form.fiscalYear);
      
      if (!isNaN(docYear) && !isNaN(fiscalYear) && docYear !== fiscalYear) {
        errors.fiscalYear = `Fiscal year (${fiscalYear}) should match document date year (${docYear})`;
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

    // Validate all fields
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      // Prepare payload - only include optional fields if they have actual content
      const payload = {
        companyCode: form.companyCode.trim(),
        fiscalYear: Number(form.fiscalYear),
        documentDate: form.documentDate,
        postingDate: form.postingDate,
        period: Number(form.period) || (new Date(form.postingDate).getMonth() + 1),
        currency: form.currency.trim().toUpperCase(),
      };

      // Only add optional fields if they have actual content (not just whitespace)
      if (form.reference && form.reference.trim()) {
        payload.reference = form.reference.trim();
      }
      
      if (form.crossCompNumber && form.crossCompNumber.trim()) {
        payload.crossCompNumber = form.crossCompNumber.trim();
      }
      
      if (form.text && form.text.trim()) {
        payload.text = form.text.trim();
      }
      
      if (form.ledgerGroup && form.ledgerGroup.trim()) {
        payload.ledgerGroup = form.ledgerGroup.trim();
      }

      console.log('Submitting payload:', payload); // For debugging

      const res = await api.post('/acc-documents', payload);
      const docNo = res.data.documentNumber;

      setSuccess(`Document posted successfully! (Doc No: ${docNo})`);
      
      // Reset form but keep company code and currency
      setForm(prev => ({
        ...prev,
        documentNumber: docNo,
        reference: '',
        crossCompNumber: '',
        text: '',
        ledgerGroup: '',
      }));
      
      setFieldErrors({});
      setTouchedFields({});
      await loadDocs();
    } catch (err) {
      console.error('Acc document save error', err.response?.data || err.message);
      
      if (err.response?.status === 400) {
        const errors = err.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          setError(errors.join('\n'));
        } else {
          setError(err.response?.data?.message || 'Validation failed');
        }
      } else if (err.response?.status === 409) {
        setError('Duplicate document number. Please try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to post document');
      }
    }
  };

  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
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

  // Should show error - only if field is touched or form was submitted
  const shouldShowError = (fieldName) => {
    return touchedFields[fieldName] && fieldErrors[fieldName];
  };

  return (
    <div>
      <style>{`
        .card {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1rem;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem 1rem;
        }
        .form-grid-2 label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #374151;
        }
        .form-grid-2 .required::after {
          content: " *";
          color: #ef4444;
        }
        .form-grid-2 input,
        .form-grid-2 select,
        .form-grid-2 textarea {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
        }
        .form-grid-2 input:focus,
        .form-grid-2 select:focus,
        .form-grid-2 textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-grid-2 input.error-input {
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        .form-grid-2 input.readonly-input {
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
        .optional-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 0.7rem;
          font-style: italic;
          margin-left: 4px;
        }
        .btn-primary {
          margin-top: 0.75rem;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          border: none;
          background-color: #2563eb;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background-color 0.15s ease;
        }
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        .error-text {
          color: #b91c1c;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          padding: 0.75rem;
          background: #fee2e2;
          border-radius: 6px;
          border-left: 4px solid #ef4444;
          white-space: pre-line;
        }
        .success-text {
          color: #166534;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
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
          padding: 0.625rem 0.75rem;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
          text-align: left;
          white-space: nowrap;
        }
        .table td {
          padding: 0.625rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        .table tbody tr:hover {
          background: #f9fafb;
        }
        .no-data {
          text-align: center;
          color: #6b7280;
          padding: 2rem;
          font-style: italic;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          margin-top: 0;
        }
        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2>Accounting Document Header</h2>

      <div className="grid-2">
        <div className="card">
          <h3>Create Document</h3>
          {error && <div className="error-text">⚠️ {error}</div>}
          {success && <div className="success-text">✅ {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div>
                <label>Document Number</label>
                <input
                  name="documentNumber"
                  value={form.documentNumber}
                  readOnly
                  placeholder="Auto-generated"
                  className="readonly-input"
                />
                <div className="helper-text">Generated automatically by system</div>
              </div>

              <div>
                <label className="required">Company Code</label>
                <input
                  name="companyCode"
                  value={form.companyCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={shouldShowError('companyCode') ? 'error-input' : ''}
                  placeholder="Enter company code"
                  maxLength={10}
                />
                <div className="helper-text">Only letters and numbers</div>
                {shouldShowError('companyCode') && <div className="field-error">{fieldErrors.companyCode}</div>}
              </div>

              <div>
                <label className="required">Fiscal Year</label>
                <input
                  type="number"
                  name="fiscalYear"
                  value={form.fiscalYear}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={shouldShowError('fiscalYear') ? 'error-input' : ''}
                  placeholder="YYYY"
                  min="2000"
                  max="2099"
                />
                <div className="helper-text">Auto-set from document date</div>
                {shouldShowError('fiscalYear') && <div className="field-error">{fieldErrors.fiscalYear}</div>}
              </div>

              <div>
                <label className="required">Document Date</label>
                <input
                  type="date"
                  name="documentDate"
                  value={form.documentDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={shouldShowError('documentDate') ? 'error-input' : ''}
                  max={formattedToday}
                />
                <div className="helper-text">Cannot be in the future</div>
                {shouldShowError('documentDate') && <div className="field-error">{fieldErrors.documentDate}</div>}
              </div>

              <div>
                <label className="required">Posting Date</label>
                <input
                  type="date"
                  name="postingDate"
                  value={form.postingDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={shouldShowError('postingDate') ? 'error-input' : ''}
                />
                <div className="helper-text">Must be on or after document date</div>
                {shouldShowError('postingDate') && <div className="field-error">{fieldErrors.postingDate}</div>}
              </div>

              <div>
                <label>Period</label>
                <input
                  type="number"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="1-12"
                  min="1"
                  max="12"
                  className={shouldShowError('period') ? 'error-input' : ''}
                />
                <div className="helper-text">Auto-calculated from posting date</div>
                {shouldShowError('period') && <div className="field-error">{fieldErrors.period}</div>}
              </div>

              <div>
                <label>
                  Reference
                  <span className="optional-label">(optional)</span>
                </label>
                <input
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={shouldShowError('reference') ? 'error-input' : ''}
                  placeholder="Enter reference or leave empty"
                  maxLength={50}
                />
                <div className="helper-text">Letters, numbers, spaces, hyphens, underscores, dots</div>
                {shouldShowError('reference') && <div className="field-error">{fieldErrors.reference}</div>}
              </div>

              <div>
                <label>
                  Cross-Comp Number
                  <span className="optional-label">(optional)</span>
                </label>
                <input
                  name="crossCompNumber"
                  value={form.crossCompNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={shouldShowError('crossCompNumber') ? 'error-input' : ''}
                  placeholder="Enter number or leave empty"
                  maxLength={20}
                />
                <div className="helper-text">Letters, numbers, hyphens, underscores, dots</div>
                {shouldShowError('crossCompNumber') && <div className="field-error">{fieldErrors.crossCompNumber}</div>}
              </div>

              <div>
                <label className="required">Currency</label>
                <input
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={shouldShowError('currency') ? 'error-input' : ''}
                  placeholder="INR, USD, EUR"
                  maxLength={3}
                  style={{ textTransform: 'uppercase' }}
                />
                <div className="helper-text">2-3 uppercase letters (e.g., INR)</div>
                {shouldShowError('currency') && <div className="field-error">{fieldErrors.currency}</div>}
              </div>

              <div>
                <label>
                  Partner BArea
                  <span className="optional-label">(optional)</span>
                </label>
                <input
                  name="ledgerGroup"
                  value={form.ledgerGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={shouldShowError('ledgerGroup') ? 'error-input' : ''}
                  placeholder="Enter value or leave empty"
                  maxLength={10}
                />
                <div className="helper-text">Only letters and numbers</div>
                {shouldShowError('ledgerGroup') && <div className="field-error">{fieldErrors.ledgerGroup}</div>}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label>
                  Text
                  <span className="optional-label">(optional)</span>
                </label>
                <textarea
                  name="text"
                  rows={2}
                  value={form.text}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={shouldShowError('text') ? 'error-input' : ''}
                  placeholder="Enter document text or leave empty"
                  maxLength={255}
                />
                <div className="helper-text">{form.text.length}/255 characters</div>
                {shouldShowError('text') && <div className="field-error">{fieldErrors.text}</div>}
              </div>
            </div>

            <button className="btn-primary" type="submit">
              Save Header
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Recent Documents ({docs.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Doc No</th>
                  <th>Company</th>
                  <th>Year</th>
                  <th>Doc Date</th>
                  <th>Post Date</th>
                  <th>Period</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '600' }}>{d.documentNumber}</td>
                    <td>{d.companyCode}</td>
                    <td>{d.fiscalYear}</td>
                    <td>{formatDate(d.documentDate)}</td>
                    <td>{formatDate(d.postingDate)}</td>
                    <td>{d.period}</td>
                    <td>{d.currency}</td>
                  </tr>
                ))}
                {docs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-data">No documents yet. Create your first document.</td>
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

export default AccDocument;