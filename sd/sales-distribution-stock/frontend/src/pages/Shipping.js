// frontend/src/pages/Shipping.js
import React, { useEffect, useState } from "react";
import {
  getShippingConfigs,
  getDeletedShippingConfigs,
  createShippingConfig,
  updateShippingConfig,
  softDeleteShippingConfig,
  restoreShippingConfig,
} from "../services/shippingService";

const initialForm = {
  shippingPoint: "",
  description: "",
  defaultRoute: "",
  planningRelevant: true,
};

const Shipping = () => {
  const [shippingList, setShippingList] = useState([]);
  const [deletedShippingList, setDeletedShippingList] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getShippingConfigs(),
        getDeletedShippingConfigs(),
      ]);
      setShippingList(activeRes.data);
      setDeletedShippingList(deletedRes.data);
    } catch (err) {
      console.error("Error loading shipping data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateAlphaNumeric = (value) => {
    return /^[A-Za-z0-9\s-]*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // prevent special characters
    if (["shippingPoint", "description", "defaultRoute"].includes(name)) {
      if (!validateAlphaNumeric(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : typeof value === "string"
            ? value.toUpperCase()
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shippingPoint.trim()) {
      alert("Enter Shipping Point");
      return;
    }

    if (!formData.defaultRoute.trim()) {
      alert("Enter Default Route");
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        await updateShippingConfig(editingId, payload);
      } else {
        await createShippingConfig(payload);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving shipping config", err);

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;

        const firstError = Object.values(errors)[0];

        alert(firstError);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Something went wrong");
      }
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      shippingPoint: s.shippingPoint || "",
      description: s.description || "",
      defaultRoute: s.defaultRoute || "",
      planningRelevant: !!s.planningRelevant,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this shipping point to recycle bin?")) return;
    try {
      await softDeleteShippingConfig(id);
      loadData();
    } catch (err) {
      console.error("Error deleting shipping config", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreShippingConfig(id);
      loadData();
    } catch (err) {
      console.error("Error restoring shipping config", err);
    }
  };

  const currentList = showDeleted ? deletedShippingList : shippingList;

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

        .form-field input[type="text"],
        .form-field input[type="number"]{
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
        }

        .form-field input:disabled{
          background:#f3f4f6;
        }

        /* inline checkbox */
        .form-field-inline{
          flex-direction:row;
          align-items:center;
          gap:8px;
        }

        .form-field-inline label{
          margin-bottom:0;
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

      <h2>Shipping Point Configuration</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row-3">
          <div className="form-field">
            <label>Shipping Point</label>
            <input
              name="shippingPoint"
              value={formData.shippingPoint}
              onChange={handleChange}
              required
              disabled={!!editingId}
              type="text"
              maxLength={10}
            />
          </div>
          <div className="form-field">
            <label>Description</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              type="text"
              maxLength={100}
            />
          </div>
          <div className="form-field">
            <label>Default Route</label>
            <input
              name="defaultRoute"
              value={formData.defaultRoute}
              onChange={handleChange}
              type="text"
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field form-field-inline">
            <label htmlFor="planningRelevant">Planning Relevant</label>
            <input
              id="planningRelevant"
              type="checkbox"
              name="planningRelevant"
              checked={formData.planningRelevant}
              onChange={handleChange}
            />
          </div>
          <div className="form-field" />
          <div className="form-field" />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Shipping Point" : "Create Shipping Point"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Shipping Points"}</h3>
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
              <th>Shipping Point</th>
              <th>Description</th>
              <th>Default Route</th>
              <th>Planning Relevant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((s) => (
              <tr key={s.id}>
                <td>{s.shippingPoint}</td>
                <td>{s.description}</td>
                <td>{s.defaultRoute}</td>
                <td>{s.planningRelevant ? "Yes" : "No"}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(s)}>Edit</button>
                      <button onClick={() => handleSoftDelete(s.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(s.id)}>Restore</button>
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

export default Shipping;
