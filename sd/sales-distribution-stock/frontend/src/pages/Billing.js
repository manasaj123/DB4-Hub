// frontend/src/pages/Billing.js
import React, { useEffect, useState } from "react";
import {
  getBillings,
  getDeletedBillings,
  createBilling,
  updateBilling,
  softDeleteBilling,
  restoreBilling,
  getDeliveries,
} from "../services/billingService";

const initialForm = {
  billingType: "",
  billingDate: "",
  referenceDeliveryId: "",
  documentNumber: "",
  totalAmount: "",
  currency: "INR",
};

const Billing = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [billings, setBillings] = useState([]);
  const [deletedBillings, setDeletedBillings] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, activeRes, deletedRes] = await Promise.all([
        getDeliveries(),
        getBillings(),
        getDeletedBillings(),
      ]);
      setDeliveries(delRes.data);
      setBillings(activeRes.data);
      setDeletedBillings(deletedRes.data);
    } catch (err) {
      console.error("Error loading billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.billingType) {
      alert("Enter billing type");
      return;
    }

    if (!formData.referenceDeliveryId) {
      alert("Select reference delivery");
      return;
    }

    if (!formData.documentNumber) {
      alert("Enter billing document number");
      return;
    }

    if (!formData.totalAmount) {
      alert("Enter total amount");
      return;
    }

    // ADD HERE
    if (!formData.currency) {
      alert("Currency required");
      return;
    }

    // special character validation
    if (!/^[a-zA-Z0-9]+$/.test(formData.billingType)) {
      alert("Billing type: no special characters allowed");
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.documentNumber)) {
      alert("Document number: no special characters allowed");
      return;
    }

    // amount validation
    if (Number(formData.totalAmount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    const payload = {
      ...formData,
      billingType: formData.billingType.toUpperCase(),
      documentNumber: formData.documentNumber.toUpperCase(),
      totalAmount: Number(formData.totalAmount),
    };

    try {
      if (editingId) {
        await updateBilling(editingId, payload);
      } else {
        await createBilling(payload);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving billing", err);

      alert(err.response?.data?.message || "Error saving billing");
    }
  };
  const handleEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      billingType: b.billingType || "",
      billingDate: b.billingDate || "",
      referenceDeliveryId: b.referenceDeliveryId || "",
      documentNumber: b.documentNumber || "",
      totalAmount: b.totalAmount || "",
      currency: b.currency || "INR",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this billing document to recycle bin?")) return;
    try {
      await softDeleteBilling(id);
      loadData();
    } catch (err) {
      console.error("Error deleting billing", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreBilling(id);
      loadData();
    } catch (err) {
      console.error("Error restoring billing", err);
    }
  };

  const currentList = showDeleted ? deletedBillings : billings;

  const displayDeliveryRef = (id) => {
    const d = deliveries.find((x) => x.id === id);
    return d ? `DEL-${d.id}` : id;
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container{
          max-width:1100px;
          margin:auto;
          padding:20px;
          font-family:Segoe UI, sans-serif;
        }

        h2{
          margin-bottom:16px;
        }

        .form-card{
          background:white;
          padding:16px;
          border-radius:6px;
          box-shadow:0 2px 6px rgba(0,0,0,0.1);
          margin-bottom:20px;
        }

        h4{
          margin:10px 0 6px;
          font-size:14px;
        }

        /* Pricing-style form rows */
        .form-row{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:8px;
        }

        .form-row label{
          width:200px;
          font-size:14px;
        }

        .form-row input,
        .form-row select{
          flex:1;
          height:32px;
          padding:3px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:13px;
        }

        .form-actions{
          margin-top:14px;
          display:flex;
          gap:8px;
        }

        .form-actions button{
          padding:7px 14px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:13px;
          background:#2563eb;
          color:white;
        }

        .form-actions button[type="button"]{
          background:#6b7280;
        }

        .list-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin:16px 0;
        }

        .list-header button{
          padding:7px 14px;
          border:none;
          border-radius:4px;
          background:#6b7280;
          color:white;
          cursor:pointer;
          font-size:13px;
        }

        .data-table{
          width:100%;
          border-collapse:collapse;
          margin-top:8px;
        }

        .data-table th{
          background:#e0f2fe;
          padding:6px;
          border:1px solid #ddd;
          font-size:12px;
        }

        .data-table td{
          padding:5px;
          border:1px solid #ddd;
          font-size:12px;
        }

        .data-table tr:nth-child(even){
          background:#f9fafb;
        }

        .data-table button{
          padding:3px 8px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:11px;
          background:#2563eb;
          color:white;
          margin-right:4px;
        }

        .data-table button:nth-child(2){
          background:#f59e0b;
        }

        @media (max-width: 900px){
          .form-row{
            flex-direction:column;
            align-items:flex-start;
          }
          .form-row label{
            width:auto;
          }
        }
      `}</style>

      <h2>Billing</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h4>Header</h4>
        <div className="form-row">
          <label>Billing Type</label>
          <input
            name="billingType"
            value={formData.billingType}
            onChange={handleChange}
            placeholder="e.g. F2"
            required
          />
        </div>
        <div className="form-row">
          <label>Billing Date</label>
          <input
            type="date"
            name="billingDate"
            value={formData.billingDate}
            onChange={handleChange}
            required
          />
        </div>

        <h4>Reference</h4>
        <div className="form-row">
          <label>Reference Delivery</label>
          <select
            name="referenceDeliveryId"
            value={formData.referenceDeliveryId}
            onChange={handleChange}
            required
          >
            <option value="">Select Delivery</option>
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                DEL-{d.id}
              </option>
            ))}
          </select>
        </div>

        <h4>Amounts</h4>
        <div className="form-row">
          <label>Billing Document Number</label>
          <input
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label>Total Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label>Currency</label>
          <input
            name="currency"
            value={formData.currency}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Billing" : "Create Billing"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Billing Documents"}</h3>
        <button onClick={() => setShowDeleted((v) => !v)}>
          {showDeleted ? "Show Active" : "Show Recycle Bin"}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : currentList.length === 0 ? (
        <p>No records.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Billing Type</th>
              <th>Billing Date</th>
              <th>Delivery</th>
              <th>Document No.</th>
              <th>Total Amount</th>
              <th>Currency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((b) => (
              <tr key={b.id}>
                <td>{b.billingType}</td>
                <td>{b.billingDate}</td>
                <td>{displayDeliveryRef(b.referenceDeliveryId)}</td>
                <td>{b.documentNumber}</td>
                <td>{b.totalAmount}</td>
                <td>{b.currency}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button type="button" onClick={() => handleEdit(b)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSoftDelete(b.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button type="button" onClick={() => handleRestore(b.id)}>
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Billing;
