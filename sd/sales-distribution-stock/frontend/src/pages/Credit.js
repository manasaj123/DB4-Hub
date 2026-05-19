// frontend/src/pages/Credit.js
import React, { useEffect, useState } from "react";
import {
  getCredits,
  getDeletedCredits,
  createCredit,
  updateCredit,
  softDeleteCredit,
  restoreCredit,
  getCustomers,
} from "../services/creditService";

const initialForm = {
  customerId: "",
  creditLimit: "",
  currency: "INR",
  riskCategory: "",
  creditGroup: "",
};

const Credit = () => {
  const [credits, setCredits] = useState([]);
  const [deletedCredits, setDeletedCredits] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [credRes, delCredRes, custRes] = await Promise.all([
        getCredits(),
        getDeletedCredits(),
        getCustomers(),
      ]);
      setCredits(credRes.data);
      setDeletedCredits(delCredRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error("Error loading credit data", err);
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
    if (!formData.customerId) {
      alert("Select customer");
      return;
    }
    if (!formData.creditLimit) {
      alert("Enter credit limit");
      return;
    }

    if (Number(formData.creditLimit) <= 0) {
      alert("Credit limit must be greater than 0");
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.currency)) {
      alert("Currency: no special characters allowed");
      return;
    }

    if (
      formData.riskCategory &&
      !["A", "B", "C"].includes(formData.riskCategory.toUpperCase())
    ) {
      alert("Risk category must be A (Low), B (Medium), or C (High)");
      return;
    }

    if (formData.creditGroup && !/^[a-zA-Z0-9]+$/.test(formData.creditGroup)) {
      alert("Credit group: no special characters allowed");
      return;
    }

    const payload = {
      ...formData,
      customerId: Number(formData.customerId),
      creditLimit: Number(formData.creditLimit),
    };

    try {
      if (editingId) {
        await updateCredit(editingId, payload);
      } else {
        await createCredit(payload);
      }
      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving credit", err);

      alert(err.response?.data?.message || "Error saving credit");
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      customerId: c.customerId || "",
      creditLimit: c.creditLimit || "",
      currency: c.currency || "INR",
      riskCategory: c.riskCategory || "",
      creditGroup: c.creditGroup || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this credit record to recycle bin?")) return;
    try {
      await softDeleteCredit(id);
      loadData();
    } catch (err) {
      console.error("Error deleting credit", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreCredit(id);
      loadData();
    } catch (err) {
      console.error("Error restoring credit", err);
    }
  };

  const currentList = showDeleted ? deletedCredits : credits;

  const displayCustomer = (id) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.customerCode} - ${c.name}` : id;
  };

  return (
    <div className="page-container">
      <style>{`

.page-container{
max-width:1100px;
margin:auto;
font-family:Segoe UI;
}

/* FORM */

.form-card{
background:white;
padding:25px;
border-radius:6px;
border:1px solid #e5e7eb;
box-shadow:0 2px 6px rgba(0,0,0,0.08);
margin-bottom:25px;
}

/* HEADINGS */

.form-card h4{
margin-top:20px;
margin-bottom:12px;
font-size:16px;
border-bottom:2px solid #e5e7eb;
padding-bottom:6px;
color:#1f2937;
}

/* FORM ROW */

.form-row{
display:flex;
flex-direction:column;
margin-bottom:14px;
}

.form-row label{
font-size:13px;
margin-bottom:4px;
color:#374151;
align-self:flex-start;
}

/* INPUT + SELECT */

.form-row input,
.form-row select{
height:36px;
padding:6px 10px;
border:1px solid #3b82f6;
border-radius:4px;
font-size:14px;
width:100%;
box-sizing:border-box;
align-self:flex-start;
}

/* BUTTONS */

.form-actions{
margin-top:20px;
display:flex;
gap:10px;
}

button{
padding:7px 16px;
border:none;
border-radius:4px;
cursor:pointer;
font-size:14px;
}

/* CREATE BUTTON */

button[type="submit"]{
background:#2563eb;
color:white;
}

button[type="submit"]:hover{
background:#1d4ed8;
}

/* CANCEL BUTTON */

.form-actions button[type="button"]{
background:#9ca3af;
color:white;
}

.form-actions button[type="button"]:hover{
background:#6b7280;
}

/* HEADER */

.list-header{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:15px;
}

.list-header button{
background:#f97316;
color:white;
padding:6px 14px;
}

.list-header button:hover{
background:#ea580c;
}

/* TABLE */

.data-table{
width:100%;
border-collapse:collapse;
background:white;
}

.data-table th{
background:#eef2ff;
padding:8px;
border:1px solid #e5e7eb;
font-size:14px;
}

.data-table td{
padding:8px;
border:1px solid #e5e7eb;
font-size:13px;
}

.data-table tr:nth-child(even){
background:#f9fafb;
}

/* TABLE BUTTONS */

.data-table button{
margin-right:6px;
padding:4px 10px;
font-size:12px;
}

.data-table button:nth-child(1){
background:#3b82f6;
color:white;
}

.data-table button:nth-child(2){
background:#ef4444;
color:white;
}

.data-table button:nth-child(1):hover{
background:#2563eb;
}

.data-table button:nth-child(2):hover{
background:#dc2626;
}

`}</style>

      <h2>Credit Management</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h4>Customer</h4>
        <div className="form-row">
          <label>Customer</label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerCode} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <h4>Credit Data</h4>
        <div className="form-row">
          <label>Credit Limit</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="creditLimit"
            value={formData.creditLimit}
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
        <div className="form-row">
          <label>Risk Category</label>
          <input
            name="riskCategory"
            value={formData.riskCategory}
            onChange={handleChange}
            placeholder="e.g. A, B, C"
          />
        </div>
        <div className="form-row">
          <label>Credit Group</label>
          <input
            name="creditGroup"
            value={formData.creditGroup}
            onChange={handleChange}
            placeholder="e.g. 001, 002"
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Credit" : "Create Credit"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Credit Records"}</h3>
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
              <th>Customer</th>
              <th>Credit Limit</th>
              <th>Currency</th>
              <th>Risk Category</th>
              <th>Credit Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((c) => (
              <tr key={c.id}>
                <td>{displayCustomer(c.customerId)}</td>
                <td>{c.creditLimit}</td>
                <td>{c.currency}</td>
                <td>{c.riskCategory}</td>
                <td>{c.creditGroup}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button type="button" onClick={() => handleEdit(c)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSoftDelete(c.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button type="button" onClick={() => handleRestore(c.id)}>
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

export default Credit;
