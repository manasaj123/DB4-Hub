// frontend/src/pages/Agreement.js
import React, { useEffect, useState } from "react";
import {
  getAgreements,
  getDeletedAgreements,
  createAgreement,
  updateAgreement,
  softDeleteAgreement,
  restoreAgreement,
} from "../services/agreementService";

const initialForm = {
  vendorName: "",
  contractType: "",
  purchasingOrg: "",
  purchasingGroup: "",
  plant: "",
  agreementDate: "",
};

const Agreement = () => {
  const [agreements, setAgreements] = useState([]);
  const [deletedAgreements, setDeletedAgreements] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getAgreements(),
        getDeletedAgreements(),
      ]);
      setAgreements(activeRes.data);
      setDeletedAgreements(deletedRes.data);
    } catch (err) {
      console.error("Error loading agreements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9\s\-().]*$/.test(value);
  };

  const validateVendorName = (value) => {
    return /^[a-zA-Z0-9\s\-().]*$/.test(value);
  };
  const validateMaxLength = (value, max) => {
    return value.length <= max;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Vendor Name
    if (name === "vendorName") {
      if (!validateVendorName(value)) {
        return;
      }

      if (!validateMaxLength(value, 150)) {
        return;
      }
    }

    // Contract Type
    if (name === "contractType") {
      if (!validateAlphaNumeric(value)) {
        return;
      }

      if (!validateMaxLength(value, 4)) {
        return;
      }
    }

    // Purchasing fields
    if (["purchasingOrg", "purchasingGroup", "plant"].includes(name)) {
      if (!validateAlphaNumeric(value)) {
        return;
      }

      if (!validateMaxLength(value, 10)) {
        return;
      }
    }

    const updatedValue = name === "vendorName" ? value : value.toUpperCase();

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName) {
      alert("Enter vendor name");
      return;
    }
    if (!formData.contractType) {
      alert("Enter contract type");
      return;
    }
    if (!formData.purchasingOrg) {
      alert("Enter purchasing organization");
      return;
    }
    if (!formData.plant) {
      alert("Enter plant");
      return;
    }
    if (!formData.agreementDate) {
      alert("Select agreement date");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (formData.agreementDate > today) {
      alert("Future date is not allowed");
      return;
    }

    const validContractTypes = ["MK", "WK"];

    if (!validContractTypes.includes(formData.contractType)) {
      alert("Contract Type must be MK or WK");
      return;
    }

    if (!formData.purchasingGroup.trim()) {
      alert("Purchasing Group is required");
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        await updateAgreement(editingId, payload);
      } else {
        await createAgreement(payload);
      }
      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving agreement", err);
    }
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setFormData({
      vendorName: a.vendorName || "",
      contractType: a.contractType || "",
      purchasingOrg: a.purchasingOrg || "",
      purchasingGroup: a.purchasingGroup || "",
      plant: a.plant || "",
      agreementDate: a.agreementDate || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this agreement to recycle bin?")) return;
    try {
      await softDeleteAgreement(id);
      loadData();
    } catch (err) {
      console.error("Error deleting agreement", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreAgreement(id);
      loadData();
    } catch (err) {
      console.error("Error restoring agreement", err);
    }
  };

  const currentList = showDeleted ? deletedAgreements : agreements;

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

        /* 3 fields per row */
        .form-row-3{
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:12px 16px;
          margin-bottom:12px;
        }

        .form-field{
          display:flex;
          flex-direction:column;
        }

        .form-field label{
          font-size:14px;
          margin-bottom:4px;
        }

        .form-field input{
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
        }

        .form-field input:disabled{
          background:#f3f4f6;
        }

        .form-actions{
          margin-top:12px;
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
        }

        .data-table th{
          background:#e0f2fe;
          padding:8px;
          border:1px solid #ddd;
          font-size:13px;
        }

        .data-table td{
          padding:6px;
          border:1px solid #ddd;
          font-size:13px;
        }

        .data-table tr:nth-child(even){
          background:#f9fafb;
        }

        .data-table button{
          padding:4px 10px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:12px;
          background:#2563eb;
          color:white;
          margin-right:6px;
        }

        .data-table button:nth-child(2){
          background:#f59e0b;
        }

        @media (max-width: 900px){
          .form-row-3{
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2>Purchase Agreements</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row-3">
          <div className="form-field">
            <label>Vendor Name</label>
            <input
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              maxLength={150}
              required
            />
          </div>
          <div className="form-field">
            <label>Contract Type</label>
            <input
              name="contractType"
              value={formData.contractType}
              onChange={handleChange}
              placeholder="e.g. MK, WK"
              maxLength={4}
              required
            />
          </div>
          <div className="form-field">
            <label>Purchasing Organization</label>
            <input
              name="purchasingOrg"
              value={formData.purchasingOrg}
              onChange={handleChange}
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label>Purchasing Group</label>
            <input
              name="purchasingGroup"
              value={formData.purchasingGroup}
              onChange={handleChange}
              maxLength={10}
            />
          </div>
          <div className="form-field">
            <label>Plant</label>
            <input
              name="plant"
              value={formData.plant}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>
          <div className="form-field">
            <label>Agreement Date</label>
            <input
              type="date"
              name="agreementDate"
              value={formData.agreementDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Agreement" : "Create Agreement"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Agreements"}</h3>
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
              <th>Vendor Name</th>
              <th>Contract Type</th>
              <th>Purch. Org</th>
              <th>Purch. Group</th>
              <th>Plant</th>
              <th>Agreement Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((a) => (
              <tr key={a.id}>
                <td>{a.vendorName}</td>
                <td>{a.contractType}</td>
                <td>{a.purchasingOrg}</td>
                <td>{a.purchasingGroup}</td>
                <td>{a.plant}</td>
                <td>{a.agreementDate}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(a)}>Edit</button>
                      <button onClick={() => handleSoftDelete(a.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(a.id)}>Restore</button>
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

export default Agreement;
