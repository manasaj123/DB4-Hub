// frontend/src/pages/PricingConfig.js
import React, { useEffect, useState } from "react";
import {
  getPricingConfigs,
  getDeletedPricingConfigs,
  createPricingConfig,
  updatePricingConfig,
  softDeletePricingConfig,
  restorePricingConfig,
} from "../services/pricingConfigService";

const initialForm = {
  pricingProcedure: "",
  description: "",
};

const PricingConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [deletedConfigs, setDeletedConfigs] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getPricingConfigs(),
        getDeletedPricingConfigs(),
      ]);
      setConfigs(activeRes.data);
      setDeletedConfigs(deletedRes.data);
    } catch (err) {
      console.error("Error loading pricing configs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [errors, setErrors] = useState({});

  const alphaNumericFields = ["pricingProcedure"];
  const alphaNumericSpaceFields = ["description"];

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  const validateAlphaNumericSpace = (value) => {
    return /^[a-zA-Z0-9\s]*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (alphaNumericFields.includes(name) && !validateAlphaNumeric(value)) {
      return;
    }

    if (
      alphaNumericSpaceFields.includes(name) &&
      !validateAlphaNumericSpace(value)
    ) {
      return;
    }

    // auto uppercase for pricing procedure
    const updatedValue =
      name === "pricingProcedure" ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      pricingProcedure: "Pricing Procedure",
      description: "Description",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        alert(`${label} is required`);
        return;
      }
    }

    // length validations based on DB
    if (formData.pricingProcedure.length > 10) {
      alert("Pricing Procedure must be 10 characters or less");
      return;
    }

    if (formData.description.length > 100) {
      alert("Description must be 100 characters or less");
      return;
    }

    const payload = {
      pricingProcedure: formData.pricingProcedure.trim().toUpperCase(),
      description: formData.description.trim(),
    };

    try {
      if (editingId) {
        await updatePricingConfig(editingId, payload);
      } else {
        await createPricingConfig(payload);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Error saving pricing config", err);
      }
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      pricingProcedure: p.pricingProcedure || "",
      description: p.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this pricing config to recycle bin?")) return;
    try {
      await softDeletePricingConfig(id);
      loadData();
    } catch (err) {
      console.error("Error deleting pricing config", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restorePricingConfig(id);
      loadData();
    } catch (err) {
      console.error("Error restoring pricing config", err);
    }
  };

  const currentList = showDeleted ? deletedConfigs : configs;

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

        /* aligned label + input */
        .form-row{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:10px;
        }

        .form-row label{
          width:160px;
          font-size:14px;
        }

        .form-row input{
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
        }

        .form-row input:disabled{
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
      `}</style>

      <h2>Pricing Procedure Configuration</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Pricing Procedure</label>
          <input
            name="pricingProcedure"
            value={formData.pricingProcedure}
            onChange={handleChange}
            required
            disabled={!!editingId}
            maxLength={10}
          />
          {errors.pricingProcedure && (
            <div style={{ color: "red", fontSize: "12px" }}>
              {errors.pricingProcedure}
            </div>
          )}
        </div>
        <div className="form-row">
          <label>Description</label>
          <input
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength={100}
            style={{ width: "350px" }}
          />
          {errors.description && (
            <div style={{ color: "red", fontSize: "12px" }}>
              {errors.description}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId
              ? "Update Pricing Procedure"
              : "Create Pricing Procedure"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Pricing Procedures"}</h3>
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
              <th>Pricing Procedure</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((p) => (
              <tr key={p.id}>
                <td>{p.pricingProcedure}</td>
                <td>{p.description}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(p)}>Edit</button>
                      <button onClick={() => handleSoftDelete(p.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(p.id)}>Restore</button>
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

export default PricingConfig;
