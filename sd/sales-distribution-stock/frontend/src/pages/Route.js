// frontend/src/pages/Route.js
import React, { useEffect, useState } from "react";
import {
  getRoutes,
  getDeletedRoutes,
  createRoute,
  updateRoute,
  softDeleteRoute,
  restoreRoute,
} from "../services/routeService";

const initialForm = {
  routeCode: "",
  description: "",
};

const initialStage = {
  stageName: "",
  fromLocation: "",
  toLocation: "",
  transitTime: "",
  legSequence: "",
};

const RoutePage = () => {
  const [routes, setRoutes] = useState([]);
  const [deletedRoutes, setDeletedRoutes] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [stages, setStages] = useState([]);
  const [stageForm, setStageForm] = useState(initialStage);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getRoutes(),
        getDeletedRoutes(),
      ]);
      setRoutes(activeRes.data);
      setDeletedRoutes(deletedRes.data);
    } catch (err) {
      console.error("Error loading routes", err);
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

  const validateNumberOnly = (value) => {
    return /^\d*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["routeCode", "description"].includes(name)) {
      if (!validateAlphaNumeric(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: typeof value === "string" ? value.toUpperCase() : value,
    }));
  };

  const handleStageChange = (e) => {
    const { name, value } = e.target;

    if (["stageName", "fromLocation", "toLocation"].includes(name)) {
      if (!validateAlphaNumeric(value)) {
        return;
      }
    }

    if (["transitTime", "legSequence"].includes(name)) {
      if (!validateNumberOnly(value)) {
        return;
      }
    }

    setStageForm((prev) => ({
      ...prev,
      [name]: typeof value === "string" ? value.toUpperCase() : value,
    }));
  };

  const addStage = () => {
    if (
      !stageForm.stageName ||
      !stageForm.fromLocation ||
      !stageForm.toLocation
    ) {
      alert("Enter stage name, from and to locations");
      return;
    }

    if (Number(stageForm.transitTime) < 0) {
      alert("Negative transit time not allowed");
      return;
    }

    setStages((prev) => [...prev, { ...stageForm }]);
    setStageForm(initialStage);
  };

  const removeStage = (index) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeCode) {
      alert("Enter route code");
      return;
    }
    if (stages.length === 0) {
      alert("Add at least one stage");
      return;
    }

    if (!formData.routeCode.trim()) {
      alert("Enter Route Code");
      return;
    }

    if (!formData.description.trim()) {
      alert("Enter Description");
      return;
    }
    const payload = {
      ...formData,
      stagesJson: JSON.stringify(stages),
    };
    try {
      if (editingId) {
        await updateRoute(editingId, payload);
      } else {
        await createRoute(payload);
      }
      setFormData(initialForm);
      setStages([]);
      setStageForm(initialStage);
      setEditingId(null);
      loadData();
    } catch (err) {
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

  const handleEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      routeCode: r.routeCode || "",
      description: r.description || "",
    });
    let parsedStages = [];
    try {
      parsedStages = r.stagesJson ? JSON.parse(r.stagesJson) : [];
    } catch {
      parsedStages = [];
    }
    setStages(parsedStages);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
    setStages([]);
    setStageForm(initialStage);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this route to recycle bin?")) return;
    try {
      await softDeleteRoute(id);
      loadData();
    } catch (err) {
      console.error("Error deleting route", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreRoute(id);
      loadData();
    } catch (err) {
      console.error("Error restoring route", err);
    }
  };

  const currentList = showDeleted ? deletedRoutes : routes;

  const displayStagesSummary = (r) => {
    try {
      const arr = r.stagesJson ? JSON.parse(r.stagesJson) : [];
      if (!Array.isArray(arr) || arr.length === 0) return "";
      return arr
        .map((s, idx) => {
          const seq = s.legSequence || idx + 1;
          return `${seq}. ${s.fromLocation} → ${s.toLocation} (${s.stageName})`;
        })
        .join(" | ");
    } catch {
      return "";
    }
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

        /* same label/input model as Pricing */
        .form-row{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:8px;
        }

        .form-row label{
          width:180px;
          font-size:14px;
        }

        .form-row input{
          flex:1;
          height:32px;
          padding:3px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:13px;
        }

        .items-form-row{
          display:flex;
          align-items:center;
          gap:8px;
          margin:8px 0 12px;
        }

        .items-form-row input{
          height:32px;
          padding:3px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:13px;
        }

        .items-form-row button{
          padding:6px 12px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:13px;
          background:#16a34a;
          color:white;
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
          .items-form-row{
            flex-direction:column;
            align-items:stretch;
          }
        }
      `}</style>

      <h2>Route Determination</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Route Code</label>
          <input
            name="routeCode"
            value={formData.routeCode}
            onChange={handleChange}
            required
            maxLength={10}
            disabled={!!editingId}
          />
        </div>
        <div className="form-row">
          <label>Description</label>
          <input
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={100}
          />
        </div>

        <h4>Stages</h4>
        <div className="items-form-row">
          <input
            name="stageName"
            placeholder="Stage Name"
            value={stageForm.stageName}
            onChange={handleStageChange}
          />
          <input
            name="fromLocation"
            placeholder="From"
            value={stageForm.fromLocation}
            onChange={handleStageChange}
          />
          <input
            name="toLocation"
            placeholder="To"
            value={stageForm.toLocation}
            onChange={handleStageChange}
          />
          <input
            name="transitTime"
            placeholder="Transit Time (hrs)"
            value={stageForm.transitTime}
            maxLength={5}
            onChange={handleStageChange}
          />
          <input
            name="legSequence"
            placeholder="Sequence"
            value={stageForm.legSequence}
            onChange={handleStageChange}
            maxLength={5}
          />
          <button type="button" onClick={addStage}>
            Add Stage
          </button>
        </div>

        {stages.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Seq</th>
                <th>Stage Name</th>
                <th>From</th>
                <th>To</th>
                <th>Transit Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s, idx) => (
                <tr key={idx}>
                  <td>{s.legSequence || idx + 1}</td>
                  <td>{s.stageName}</td>
                  <td>{s.fromLocation}</td>
                  <td>{s.toLocation}</td>
                  <td>{s.transitTime}</td>
                  <td>
                    <button type="button" onClick={() => removeStage(idx)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Route" : "Create Route"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Routes"}</h3>
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
              <th>Route Code</th>
              <th>Description</th>
              <th>Stages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((r) => (
              <tr key={r.id}>
                <td>{r.routeCode}</td>
                <td>{r.description}</td>
                <td>{displayStagesSummary(r)}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(r)}>Edit</button>
                      <button onClick={() => handleSoftDelete(r.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(r.id)}>Restore</button>
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

export default RoutePage;
