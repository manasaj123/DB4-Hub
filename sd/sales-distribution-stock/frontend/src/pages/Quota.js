// frontend/src/pages/Quota.js

import React, { useEffect, useState } from "react";
import {
  getQuotas,
  getDeletedQuotas,
  createQuota,
  updateQuota,
  softDeleteQuota,
  restoreQuota,
} from "../services/quotaService";

const initialForm = {
  purchasingGroup: "",
  plant: "",
  plantSpecialMaterialStatus: "",
  taxIndicatorForMaterial: "",
  materialFreightGroup: "",
  materialGroup: "",
  validFrom: "",
  validTo: "",
  quotaUsage: "",
};

const Quota = () => {
  const [quotas, setQuotas] = useState([]);
  const [deletedQuotas, setDeletedQuotas] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const [activeRes, deletedRes] = await Promise.all([
        getQuotas(),
        getDeletedQuotas(),
      ]);

      setQuotas(activeRes.data);
      setDeletedQuotas(deletedRes.data);
    } catch (err) {
      console.error("Error loading quotas", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9\s\-]*$/.test(value);
  };

  const validateNumberOnly = (value) => {
    return /^\d*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Text field validation
    if (
      [
        "purchasingGroup",
        "plant",
        "plantSpecialMaterialStatus",
        "taxIndicatorForMaterial",
        "materialFreightGroup",
        "materialGroup",
      ].includes(name)
    ) {
      if (!validateAlphaNumeric(value)) {
        return;
      }
    }

    // Quota usage validation
    if (name === "quotaUsage") {
      if (!validateNumberOnly(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: typeof value === "string" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.purchasingGroup.trim()) {
      alert("Enter Purchasing Group");
      return;
    }

    if (!formData.plant.trim()) {
      alert("Enter Plant");
      return;
    }

    if (!formData.materialGroup.trim()) {
      alert("Material Group is required");
      return;
    }

    if (!formData.validFrom) {
      alert("Select Valid From date");
      return;
    }

    if (!formData.validTo) {
      alert("Select Valid To date");
      return;
    }

    if (formData.validFrom > formData.validTo) {
      alert("Valid To date must be greater than Valid From date");
      return;
    }

    if (!formData.quotaUsage.trim()) {
      alert("Enter Quota Usage");
      return;
    }

    if (Number(formData.quotaUsage) < 0) {
      alert("Negative quota usage is not allowed");
      return;
    }

    try {
      if (editingId) {
        await updateQuota(editingId, formData);
      } else {
        await createQuota(formData);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving quota", err);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);

    setFormData({
      purchasingGroup: q.purchasingGroup || "",
      plant: q.plant || "",
      plantSpecialMaterialStatus: q.plantSpecialMaterialStatus || "",
      taxIndicatorForMaterial: q.taxIndicatorForMaterial || "",
      materialFreightGroup: q.materialFreightGroup || "",
      materialGroup: q.materialGroup || "",
      validFrom: q.validFrom || "",
      validTo: q.validTo || "",
      quotaUsage: q.quotaUsage || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this record to recycle bin?")) return;

    await softDeleteQuota(id);
    loadData();
  };

  const handleRestore = async (id) => {
    await restoreQuota(id);
    loadData();
  };

  const currentList = showDeleted ? deletedQuotas : quotas;

  return (
    <div className="quota-page">
      <style>{`

.quota-page{
max-width:1100px;
margin:auto;
font-family:Segoe UI;
}

/* FORM CARD */

.form-card{
background:white;
padding:25px;
border-radius:6px;
border:1px solid #e5e7eb;
box-shadow:0 2px 6px rgba(0,0,0,0.1);
margin-bottom:25px;
}

/* SECTION HEADINGS */

.form-card h4{
margin-top:20px;
margin-bottom:12px;
font-size:16px;
border-bottom:2px solid #e5e7eb;
padding-bottom:5px;
color:#111827;
}

/* GRID LAYOUT */

.form-grid{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:10px;
}

/* FORM FIELD */

.form-row{
display:flex;
flex-direction:column;
width:300px;
}

.form-row label{
font-size:13px;
margin-bottom:2px;
color:#374151;
padding-right:30px;
}

.form-row input{
height:36px;

border:1px solid #3b82f6;
border-radius:4px;
font-size:14px;
width:300px;

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

button[type="submit"]{
background:#2563eb;
color:white;
}

button[type="submit"]:hover{
background:#1d4ed8;
}

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
}

.data-table td{
padding:8px;
border:1px solid #e5e7eb;
font-size:13px;
}

.data-table tr:nth-child(even){
background:#f9fafb;
}

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

`}</style>

      <h2>Quota Arrangement</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h4>Key</h4>

        <div className="form-grid">
          <div className="form-row">
            <label>Purchasing Group</label>
            <input
              name="purchasingGroup"
              value={formData.purchasingGroup}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Plant</label>
            <input
              name="plant"
              value={formData.plant}
              onChange={handleChange}
              maxLength={10}
            />
          </div>
        </div>

        <h4>Material Attributes</h4>

        <div className="form-grid">
          <div className="form-row">
            <label>Plant Special Material Status</label>
            <input
              name="plantSpecialMaterialStatus"
              value={formData.plantSpecialMaterialStatus}
              onChange={handleChange}
              maxLength={4}
            />
          </div>

          <div className="form-row">
            <label>Tax Indicator</label>
            <input
              name="taxIndicatorForMaterial"
              value={formData.taxIndicatorForMaterial}
              onChange={handleChange}
              maxLength={4}
            />
          </div>

          <div className="form-row">
            <label>Material Freight Group</label>
            <input
              name="materialFreightGroup"
              value={formData.materialFreightGroup}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Material Group</label>
            <input
              name="materialGroup"
              value={formData.materialGroup}
              onChange={handleChange}
            />
          </div>
        </div>

        <h4>Validity & Usage</h4>

        <div className="form-grid">
          <div className="form-row">
            <label>Valid From</label>
            <input
              type="date"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Valid To</label>
            <input
              type="date"
              name="validTo"
              value={formData.validTo}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <label>Quota Usage</label>
            <input
              name="quotaUsage"
              value={formData.quotaUsage}
              onChange={handleChange}
              maxLength={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Quota" : "Create Quota"}
          </button>

          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Quota Records"}</h3>

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
              <th>Purch. Group</th>
              <th>Plant</th>
              <th>Plant Status</th>
              <th>Tax</th>
              <th>Freight</th>
              <th>Material Group</th>
              <th>Valid From</th>
              <th>Valid To</th>
              <th>Usage</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentList.map((q) => (
              <tr key={q.id}>
                <td>{q.purchasingGroup}</td>
                <td>{q.plant}</td>
                <td>{q.plantSpecialMaterialStatus}</td>
                <td>{q.taxIndicatorForMaterial}</td>
                <td>{q.materialFreightGroup}</td>
                <td>{q.materialGroup}</td>
                <td>{q.validFrom}</td>
                <td>{q.validTo}</td>
                <td>{q.quotaUsage}</td>

                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(q)}>Edit</button>
                      <button onClick={() => handleSoftDelete(q.id)}>
                        Delete
                      </button>
                    </>
                  )}

                  {showDeleted && (
                    <button onClick={() => handleRestore(q.id)}>Restore</button>
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

export default Quota;
