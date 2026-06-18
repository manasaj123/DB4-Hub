// frontend/src/pages/Customers.js
import React, { useEffect, useState } from "react";
import {
  getCustomers,
  getDeletedCustomers,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  restoreCustomer,
} from "../services/customerService";

const initialForm = {
  customerCode: "",
  name: "",
  accountGroup: "",
  city: "",
  country: "",
  creditGroup: "",
  riskCategory: "",
  email: "",
  phone: "",
  address: "",
  gstNumber: "",
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getCustomers(),
        getDeletedCustomers(),
      ]);
      setCustomers(activeRes.data);
      setDeletedCustomers(deletedRes.data);
    } catch (err) {
      console.error("Error loading customers", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('========== FORM SUBMIT DEBUG ==========');
  console.log('📋 Full form data:', formData);
  console.log('📧 Email value:', `"${formData.email}"`);
  console.log('📱 Phone value:', `"${formData.phone}"`);
  console.log('🏠 Address value:', `"${formData.address}"`);
  console.log('📄 GST value:', `"${formData.gstNumber}"`);
  
  if (!formData.email) console.warn('⚠️ Email is empty or null');
  if (!formData.phone) console.warn('⚠️ Phone is empty or null');
  if (!formData.address) console.warn('⚠️ Address is empty or null');
  if (!formData.gstNumber) console.warn('⚠️ GST Number is empty or null');
  
  console.log('🔍 Data types:');
  console.log('  email type:', typeof formData.email);
  console.log('  phone type:', typeof formData.phone);
  console.log('  address type:', typeof formData.address);
  console.log('  gstNumber type:', typeof formData.gstNumber);
  console.log('=========================================');

  try {
    let response;
    if (editingId) {
      console.log('✏️ Updating customer ID:', editingId);
      response = await updateCustomer(editingId, formData);
    } else {
      console.log('➕ Creating new customer');
      response = await createCustomer(formData);
    }
    
    console.log('✅ Server response:', response.data);
    console.log('📧 Email saved:', response.data.email);
    console.log('📱 Phone saved:', response.data.phone);
    console.log('🏠 Address saved:', response.data.address);
    console.log('📄 GST saved:', response.data.gstNumber);
    console.log('=========================================');

    setFormData(initialForm);
    setEditingId(null);
    setErrors({});
    loadData();
  } catch (err) {
    console.error('❌ Error:', err);
    console.error('❌ Error response:', err.response?.data);
    if (err.response?.data?.errors) {
      setErrors(err.response.data.errors);
    } else {
      console.error("Error saving customer", err);
    }
  }
};

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      customerCode: c.customerCode || "",
      name: c.name || "",
      accountGroup: c.accountGroup || "",
      city: c.city || "",
      country: c.country || "",
      creditGroup: c.creditGroup || "",
      riskCategory: c.riskCategory || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      gstNumber: c.gstNumber || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this customer to recycle bin?")) return;
    await softDeleteCustomer(id);
    loadData();
  };

  const handleRestore = async (id) => {
    await restoreCustomer(id);
    loadData();
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const currentList = showDeleted ? deletedCustomers : customers;

  return (
    <div className="page-container">
      <style>{`
        .page-container{
          max-width:1200px;
          margin:auto;
          padding:20px;
          font-family:Segoe UI;
        }

        .form-card{
          background:white;
          padding:20px;
          border-radius:6px;
          box-shadow:0 2px 6px rgba(0,0,0,0.1);
          margin-bottom:20px;
        }

        .form-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:15px;
        }

        .form-row{
          display:flex;
          flex-direction:column;
        }

        .form-row label{
          font-size:14px;
          margin-bottom:4px;
          font-weight:500;
        }

        .form-row input, .form-row select, .form-row textarea{
          padding:8px 10px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
          width:100%;
          box-sizing:border-box;
        }

        .form-row textarea {
          height:70px;
          resize:vertical;
        }

        .form-row input:focus, .form-row select:focus, .form-row textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-row input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .full-width {
          grid-column: span 4;
        }

        .form-actions{
          margin-top:20px;
          display:flex;
          gap:10px;
        }

        .btn{
          padding:4px 4px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          color:white;
          font-size:11px;
          transition: all 0.2s;
          white-space:nowrap;
          display:inline-flex;
          align-items:center;
          gap:2px;
        }

        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-submit{
          background:#2563eb;
          padding:8px 20px;
          font-size:13px;
        }

        .btn-cancel{
          background:#6b7280;
          padding:8px 20px;
          font-size:13px;
        }

        /* ===== ACTION BUTTONS ===== */
        .btn-view {
          background: #5de082;
          padding: 2px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(11, 228, 69, 0.68);
          magin-right: 4px;

        }

        .btn-view:hover {
          background: #049528;
          box-shadow: 0 4px 8px rgba(11, 228, 69, 0.4);
        }

        .btn-edit {
          background: #3b82f6;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .btn-edit:hover {
          background: #2563eb;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        }

        .btn-delete {
          background: #f71010;
          padding: 6px 6px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }

        .btn-delete:hover {
          background: #dc2626;
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
        }

        .btn-restore {
          background: #22c55e;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
        }

        .btn-restore:hover {
          background: #16a34a;
          box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
        }

        .list-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin:20px 0;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table{
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        }

        .data-table th{
          background:#e0f2fe;
          padding:5px;
          border:1px solid #ddd;
          text-align:left;
          font-weight:600;
          white-space:nowrap;
        }

        .data-table td{
          padding:8px;
          border:1px solid #ddd;
          max-width:150px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .data-table tr:nth-child(even){
          background:#f9fafb;
        }

        .data-table tr:hover {
          background:#f3f4f6;
        }

        .small-text {
          font-size:12px;
          color:#666;
        }

        .error-text {
          color:#dc2626;
          font-size:12px;
          margin-top:4px;
        }

        .action-buttons {
          display:flex;
          gap:6px;
          flex-wrap:nowrap;
          align-items:center;
        }

        .action-buttons .btn {
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 600;
          min-width: 55px;
          justify-content: center;
          border-radius: 6px;
          letter-spacing: 0.3px;
          transition: all 0.25s ease;
        }

        .loading-text {
          text-align:center;
          padding:20px;
          color:#6b7280;
        }

        .no-records {
          text-align:center;
          padding:20px;
          color:#6b7280;
          font-style:italic;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-close-btn:hover {
          color: #ef4444;
        }

        .modal-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .modal-field {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-field.full-width {
          grid-column: span 2;
        }

        .modal-field label {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
        }

        .modal-field .value {
          font-size: 14px;
          color: #1f2937;
          margin-top: 2px;
          word-break: break-word;
        }

        .modal-field .value.null-value {
          color: #9ca3af;
          font-style: italic;
        }

        .modal-footer {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
      `}</style>

      <h2>Customers</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Row 1 - 4 columns */}
          <div className="form-row">
            <label>Customer Code *</label>
            <input
              name="customerCode"
              value={formData.customerCode}
              onChange={handleChange}
              disabled={!!editingId}
              placeholder="Enter customer code"
            />
            {errors.customerCode && (
              <small className="error-text">{errors.customerCode}</small>
            )}
          </div>

          <div className="form-row">
            <label>Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter customer name"
            />
            {errors.name && (
              <small className="error-text">{errors.name}</small>
            )}
          </div>

          <div className="form-row">
            <label>Account Group *</label>
            <input
              name="accountGroup"
              value={formData.accountGroup}
              onChange={handleChange}
              placeholder="Enter account group (max 4 chars)"
              maxLength="4"
            />
            {errors.accountGroup && (
              <small className="error-text">{errors.accountGroup}</small>
            )}
          </div>

          <div className="form-row">
            <label>City *</label>
            <input 
              name="city" 
              value={formData.city} 
              onChange={handleChange}
              placeholder="Enter city" 
            />
            {errors.city && (
              <small className="error-text">{errors.city}</small>
            )}
          </div>

          {/* Row 2 - 4 columns */}
          <div className="form-row">
            <label>Country *</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter country (max 3 chars)"
            />
            {errors.country && (
              <small className="error-text">{errors.country}</small>
            )}
          </div>

          <div className="form-row">
            <label>Credit Group</label>
            <input
              name="creditGroup"
              value={formData.creditGroup}
              onChange={handleChange}
              placeholder="Enter credit group"
            />
            {errors.creditGroup && (
              <small className="error-text">{errors.creditGroup}</small>
            )}
          </div>

          <div className="form-row">
            <label>Risk Category *</label>
            <select
              name="riskCategory"
              value={formData.riskCategory}
              onChange={handleChange}
            >
              <option value="">Select Risk Category</option>
              <option value="A">A - Low Risk</option>
              <option value="B">B - Medium Risk</option>
              <option value="C">C - High Risk</option>
            </select>
            {errors.riskCategory && (
              <small className="error-text">{errors.riskCategory}</small>
            )}
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
            {errors.email && (
              <small className="error-text">{errors.email}</small>
            )}
          </div>

          {/* Row 3 - Phone, GST Number, Address */}
          <div className="form-row">
            <label>Phone</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <small className="error-text">{errors.phone}</small>
            )}
          </div>

          <div className="form-row">
            <label>GST Number</label>
            <input
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST number (15 chars)"
            />
            {errors.gstNumber && (
              <small className="error-text">{errors.gstNumber}</small>
            )}
          </div>

          <div className="form-row full-width">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full address"
            />
            {errors.address && (
              <small className="error-text">{errors.address}</small>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-submit">
            {editingId ? "Update Customer" : "Create Customer"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Customers"}</h3>

        <button
          className="btn btn-submit"
          onClick={() => setShowDeleted((v) => !v)}
        >
          {showDeleted ? "Show Active" : "Show Recycle Bin"}
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : currentList.length === 0 ? (
        <p className="no-records">No records found</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>City</th>
                <th>Country</th>
                <th>Credit</th>
                <th>Risk</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GST</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentList.map((c) => (
                <tr key={c.id}>
                  <td>{c.customerCode}</td>
                  <td>{c.name}</td>
                  <td>{c.city}</td>
                  <td>{c.country}</td>
                  <td>{c.creditGroup || '-'}</td>
                  <td>{c.riskCategory}</td>
                  <td className="small-text">{c.email || '-'}</td>
                  <td className="small-text">{c.phone || '-'}</td>
                  <td className="small-text">{c.gstNumber || '-'}</td>
                  <td className="small-text" title={c.address || ''}>
                    {c.address ? (c.address.length > 30 ? c.address.substring(0, 30) + '...' : c.address) : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!showDeleted && (
                        <>
                          <button
                            className="btn btn-view"
                            onClick={() => handleView(c)}
                          >
                             View
                          </button>
                          <button
                            className="btn btn-edit"
                            onClick={() => handleEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => handleSoftDelete(c.id)}
                          >
                             Delete
                          </button>
                        </>
                      )}

                      {showDeleted && (
                        <>
                          <button
                            className="btn btn-view"
                            onClick={() => handleView(c)}
                          >
                            👁 View
                          </button>
                          <button
                            className="btn btn-restore"
                            onClick={() => handleRestore(c.id)}
                          >
                            ↩ Restore
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Details</h3>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label>Customer Code</label>
                <div className="value"><strong>{selectedCustomer.customerCode}</strong></div>
              </div>

              <div className="modal-field">
                <label>Name</label>
                <div className="value">{selectedCustomer.name}</div>
              </div>

              <div className="modal-field">
                <label>Account Group</label>
                <div className="value">{selectedCustomer.accountGroup || '-'}</div>
              </div>

              <div className="modal-field">
                <label>Risk Category</label>
                <div className="value">{selectedCustomer.riskCategory || '-'}</div>
              </div>

              <div className="modal-field">
                <label>City</label>
                <div className="value">{selectedCustomer.city || '-'}</div>
              </div>

              <div className="modal-field">
                <label>Country</label>
                <div className="value">{selectedCustomer.country || '-'}</div>
              </div>

              <div className="modal-field">
                <label>Credit Group</label>
                <div className="value">{selectedCustomer.creditGroup || '-'}</div>
              </div>

              <div className="modal-field">
                <label>Status</label>
                <div className="value">
                  {selectedCustomer.isDeleted ? '🗑️ Deleted' : '✅ Active'}
                </div>
              </div>

              <div className="modal-field">
                <label>Email</label>
                <div className={selectedCustomer.email ? 'value' : 'value null-value'}>
                  {selectedCustomer.email || 'Not provided'}
                </div>
              </div>

              <div className="modal-field">
                <label>Phone</label>
                <div className={selectedCustomer.phone ? 'value' : 'value null-value'}>
                  {selectedCustomer.phone || 'Not provided'}
                </div>
              </div>

              <div className="modal-field">
                <label>GST Number</label>
                <div className={selectedCustomer.gstNumber ? 'value' : 'value null-value'}>
                  {selectedCustomer.gstNumber || 'Not provided'}
                </div>
              </div>

              <div className="modal-field full-width">
                <label>Address</label>
                <div className={selectedCustomer.address ? 'value' : 'value null-value'}>
                  {selectedCustomer.address || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;