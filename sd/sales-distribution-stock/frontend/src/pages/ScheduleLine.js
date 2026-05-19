// frontend/src/pages/ScheduleLine.js
import React, { useEffect, useState } from "react";
import {
  getScheduleLines,
  getDeletedScheduleLines,
  createScheduleLine,
  updateScheduleLine,
  softDeleteScheduleLine,
  restoreScheduleLine,
} from "../services/scheduleLineService";

const initialForm = {
  scheduleLineCategory: "",
  description: "",
  requirementRelevant: "",
  availabilityCheck: "",
  movementType: "",
};

const ScheduleLine = () => {
  const [lines, setLines] = useState([]);
  const [deletedLines, setDeletedLines] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getScheduleLines(),
        getDeletedScheduleLines(),
      ]);
      setLines(activeRes.data);
      setDeletedLines(deletedRes.data);
    } catch (err) {
      console.error("Error loading schedule lines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const alphaNumericFields = [
    "scheduleLineCategory",
    "requirementRelevant",
    "availabilityCheck",
    "deliveryBlock",
    "movementType",
    "orderType",
    "itemCategory",
    "mvtIssValSlt",
    "specIssValSlt",
  ];

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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduleLineCategory) {
      alert("Enter schedule line category");
      return;
    }

    const requiredFields = {
      scheduleLineCategory: "Schedule Line Category",
      description: "Description",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        alert(`${label} is required`);
        return;
      }
    }

    // Y/N validation
    if (
      formData.requirementRelevant &&
      !["Y", "N"].includes(formData.requirementRelevant.trim().toUpperCase())
    ) {
      alert("Requirement Relevant must be Y or N");
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        await updateScheduleLine(editingId, payload);
      } else {
        await createScheduleLine(payload);
      }
      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving schedule line", err);

      if (err.response?.data?.errors) {
        const backendErrors = Object.values(err.response.data.errors).join(
          "\n",
        );

        alert(backendErrors);
      } else {
        alert("Failed to save schedule line");
      }
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      scheduleLineCategory: row.scheduleLineCategory || "",
      description: row.description || "",
      requirementRelevant: row.requirementRelevant || "",
      availabilityCheck: row.availabilityCheck || "",
      movementType: row.movementType || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this schedule line to recycle bin?")) return;
    try {
      await softDeleteScheduleLine(id);
      loadData();
    } catch (err) {
      console.error("Error deleting schedule line", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreScheduleLine(id);
      loadData();
    } catch (err) {
      console.error("Error restoring schedule line", err);
    }
  };

  const currentList = showDeleted ? deletedLines : lines;

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

      <h2>Schedule Line Categories</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row-3">
          <div className="form-field">
            <label>Schedule Line Category</label>
            <input
              name="scheduleLineCategory"
              value={formData.scheduleLineCategory}
              onChange={handleChange}
              required
              disabled={!!editingId}
              maxLength={3}
            />
          </div>
          <div className="form-field">
            <label>Description</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={100}
            />
          </div>
          <div className="form-field">
            <label>Requirement Relevant</label>
            <input
              name="requirementRelevant"
              value={formData.requirementRelevant}
              onChange={handleChange}
              placeholder="Y / N"
              maxLength={1}
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label>Availability Check</label>
            <input
              name="availabilityCheck"
              value={formData.availabilityCheck}
              onChange={handleChange}
              placeholder="e.g. 01, 02"
              maxLength={2}
            />
          </div>
          <div className="form-field">
            <label>Movement Type</label>
            <input
              name="movementType"
              value={formData.movementType}
              onChange={handleChange}
              placeholder="e.g. 601"
              maxLength={4}
            />
          </div>
          <div className="form-field">
            {/* empty to keep 3-per-row alignment */}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Schedule Line" : "Create Schedule Line"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>
          {showDeleted ? "Recycle Bin" : "Active Schedule Line Categories"}
        </h3>
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
              <th>Schedule Line Category</th>
              <th>Description</th>
              <th>Requirement Relevant</th>
              <th>Availability Check</th>
              <th>Movement Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((row) => (
              <tr key={row.id}>
                <td>{row.scheduleLineCategory}</td>
                <td>{row.description}</td>
                <td>{row.requirementRelevant}</td>
                <td>{row.availabilityCheck}</td>
                <td>{row.movementType}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(row)}>Edit</button>
                      <button onClick={() => handleSoftDelete(row.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(row.id)}>
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

export default ScheduleLine;
