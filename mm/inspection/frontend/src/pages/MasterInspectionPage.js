import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/qc/Sidebar";
import Header from "../components/qc/Header";
import "./Pagestyles.css";

const BASE_URL = "http://localhost:5003/api";

// helper to build inspection number from DB id
const formatInspectionNo = id =>
  id ? `INSP-${String(id).padStart(4, "0")}` : "";

export default function MasterInspectionPage() {
  const [items, setItems] = useState([]);
  const [binItems, setBinItems] = useState([]);
  const [form, setForm] = useState({
    plant: "",
    inspectionName: "",
    validFrom: "",
    validTo: "",
    status: "RELEASED",
    lowerSpecLimit: "",
    targetValue: "",
    upperSpecLimit: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [errors, setErrors] = useState({});
  const [viewingItem, setViewingItem] = useState(null); // State for view modal

  const loadData = async () => {
    const [activeRes, binRes] = await Promise.all([
      axios.get(`${BASE_URL}/master-inspections`),
      axios.get(`${BASE_URL}/master-inspections/recycle-bin`)
    ]);
    setItems(activeRes.data || []);
    setBinItems(binRes.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;

    let newValue = value;

    // Force uppercase & treat as code for Inspection Name: INS-0002 style
    if (name === "inspectionName") {
      newValue = value.toUpperCase();
    }

    setForm(prev => ({ ...prev, [name]: newValue }));
    // Clear field error on change
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Regex rules
    const plantRegex = /^[A-Za-z0-9-_]+$/;      // no spaces, only A-Z 0-9 - _
    const inspectionCodeRegex = /^[A-Z]{3}-\d{3}$/; // INS-0002 (3 letters, -, 3 digits)

    // Inspection Name as code like INS-0002
    if (!form.inspectionName.trim()) {
      newErrors.inspectionName = "Inspection code is required";
    } else if (!inspectionCodeRegex.test(form.inspectionName.trim())) {
      newErrors.inspectionName =
        "Format must be AAA-000 (e.g. INS-002)";
    }

    // Plant checks
    if (!form.plant.trim()) {
      newErrors.plant = "Plant is required";
    } else if (!plantRegex.test(form.plant.trim())) {
      newErrors.plant =
        "Plant can contain only letters, numbers, - and _ (no spaces or other symbols)";
    }

    if (!form.validFrom) {
      newErrors.validFrom = "Valid From is required";
    }

    // Date range check: validTo should be empty or >= validFrom
    if (form.validFrom && form.validTo) {
      const from = new Date(form.validFrom);
      const to = new Date(form.validTo);
      if (to < from) {
        newErrors.validTo = "Valid To cannot be before Valid From";
      }
    }

    // Numeric checks
    // Numeric checks (no negatives)
    const numFields = ["lowerSpecLimit", "upperSpecLimit", "targetValue"];
    numFields.forEach(field => {
      const value = form[field];
      if (value !== "" && isNaN(Number(value))) {
        newErrors[field] = "Must be a number";
      } else if (value !== "" && Number(value) < 0) {
        newErrors[field] = "Cannot be negative";
      }
    });

    // Logical relationship LSL <= Target <= USL (only if all present and numeric)
    const lsl = form.lowerSpecLimit === "" ? null : Number(form.lowerSpecLimit);
    const usl = form.upperSpecLimit === "" ? null : Number(form.upperSpecLimit);
    const tgt = form.targetValue === "" ? null : Number(form.targetValue);

    if (lsl !== null && usl !== null && lsl > usl) {
      newErrors.upperSpecLimit = "USL must be greater than or equal to LSL";
    }

    if (lsl !== null && tgt !== null && tgt < lsl) {
      newErrors.targetValue = "Target must be greater than or equal to LSL";
    }

    if (usl !== null && tgt !== null && tgt > usl) {
      newErrors.targetValue = "Target must be less than or equal to USL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    if (editingId) {
      await axios.put(`${BASE_URL}/master-inspections/${editingId}`, form);
    } else {
      await axios.post(`${BASE_URL}/master-inspections`, form);
    }

    setForm({
      plant: "",
      inspectionName: "",
      validFrom: "",
      validTo: "",
      status: "RELEASED",
      lowerSpecLimit: "",
      targetValue: "",
      upperSpecLimit: ""
    });
    setEditingId(null);
    setErrors({});
    await loadData();
  };

  const handleEdit = item => {
    setEditingId(item.id);
    setForm({
      plant: item.plant || "",
      inspectionName: (item.inspectionName || "").toUpperCase(),
      validFrom: item.validFrom || "",
      validTo: item.validTo || "",
      status: item.status || "RELEASED",
      lowerSpecLimit: item.lowerSpecLimit ?? "",
      targetValue: item.targetValue ?? "",
      upperSpecLimit: item.upperSpecLimit ?? ""
    });
    setErrors({});
  };

  const handleView = (item) => {
    setViewingItem(item);
  };

  const handleCloseView = () => {
    setViewingItem(null);
  };

  const handleSoftDelete = async id => {
    await axios.delete(`${BASE_URL}/master-inspections/${id}`);
    await loadData();
  };

  const handleRestore = async id => {
    await axios.post(`${BASE_URL}/master-inspections/${id}/restore`);
    await loadData();
  };

  const handleHardDelete = async id => {
    await axios.delete(
      `${BASE_URL}/master-inspections/${id}/hard-delete`
    );
    await loadData();
  };

  const list = showRecycleBin ? binItems : items;

  return (
    <div className="qc-master-page">
      <Sidebar />

      <div className="qc-master-content">
        <Header title="Master Inspection" />

        <div className="qc-master-body">
          <div className="qc-master-form-card">
            <h3>
              {editingId
                ? "Edit Master Inspection"
                : "Create Master Inspection"}
            </h3>
            <form onSubmit={handleSubmit} className="qc-form">
              <div className="form-row">
                <label>Inspection Code</label>
                <input
                  name="inspectionName"
                  value={form.inspectionName}
                  onChange={handleChange}
                  placeholder="INS-0002"
                  required
                />
                {errors.inspectionName && (
                  <span className="error-text">
                    {errors.inspectionName}
                  </span>
                )}
              </div>

              <div className="form-row">
                <label>Plant</label>
                <input
                  name="plant"
                  value={form.plant}
                  onChange={handleChange}
                  required
                />
                {errors.plant && (
                  <span className="error-text">{errors.plant}</span>
                )}
              </div>

              <div className="form-row">
                <label>Valid From</label>
                <input
                  type="date"
                  name="validFrom"
                  value={form.validFrom}
                  onChange={handleChange}
                  required
                />
                {errors.validFrom && (
                  <span className="error-text">
                    {errors.validFrom}
                  </span>
                )}
              </div>

              <div className="form-row">
                <label>Valid To</label>
                <input
                  type="date"
                  name="validTo"
                  value={form.validTo}
                  onChange={handleChange}
                />
                {errors.validTo && (
                  <span className="error-text">{errors.validTo}</span>
                )}
              </div>

              <div className="form-row">
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="RELEASED">RELEASED</option>
                  <option value="COMPLAINT">COMPLAINT</option>
                </select>
              </div>

              <div className="form-row">
                <label>Lower Spec Limit</label>
                <input
                  type="number"
                  name="lowerSpecLimit"
                  value={form.lowerSpecLimit}
                  onChange={handleChange}
                />
                {errors.lowerSpecLimit && (
                  <span className="error-text">
                    {errors.lowerSpecLimit}
                  </span>
                )}
              </div>

              <div className="form-row">
                <label>Upper Spec Limit</label>
                <input
                  type="number"
                  name="upperSpecLimit"
                  value={form.upperSpecLimit}
                  onChange={handleChange}
                />
                {errors.upperSpecLimit && (
                  <span className="error-text">
                    {errors.upperSpecLimit}
                  </span>
                )}
              </div>

              <div className="form-row">
                <label>Target Value</label>
                <input
                  type="number"
                  name="targetValue"
                  value={form.targetValue}
                  onChange={handleChange}
                />
                {errors.targetValue && (
                  <span className="error-text">
                    {errors.targetValue}
                  </span>
                )}
              </div>

              <div className="form-row-full">
                <button type="submit">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>

          <div className="qc-master-list">
            <div className="qc-master-list-header">
              <h3>
                {showRecycleBin
                  ? "Recycle Bin"
                  : "Master Inspection List"}
              </h3>
              <button onClick={() => setShowRecycleBin(v => !v)}>
                {showRecycleBin ? "Show Active" : "Show Recycle Bin"}
              </button>
            </div>

            <table className="qc-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Inspection No</th>
                  <th>Plant</th>
                  <th>Inspection Code</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th>Status</th>
                  <th>LSL</th>
                  <th>USL</th>
                  <th>Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.id}>
                    <td className="col-id">{item.id}</td>
                    <td>{formatInspectionNo(item.id)}</td>
                    <td>{item.plant}</td>
                    <td>{(item.inspectionName || "").toUpperCase()}</td>
                    <td>{item.validFrom}</td>
                    <td>{item.validTo}</td>
                    <td>{item.status}</td>
                    <td>{item.lowerSpecLimit}</td>
                    <td>{item.upperSpecLimit}</td>
                    <td>{item.targetValue}</td>
                    <td>
                      <button
                        className="action-view"
                        onClick={() => handleView(item)}
                        style={{
                          backgroundColor: "#08d262",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          marginRight: "5px",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        View
                      </button>
                      {!showRecycleBin && (
                        <>
                          <button
                            className="action-edit"
                            onClick={() => handleEdit(item)}
                            style={{
                              backgroundColor: "#144cf4",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              marginRight: "5px",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="action-delete"
                            onClick={() => handleSoftDelete(item.id)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {showRecycleBin && (
                        <>
                          <button
                            className="action-restore"
                            onClick={() => handleRestore(item.id)}
                            style={{
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              marginRight: "5px",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Restore
                          </button>
                          <button
                            className="action-hard-delete"
                            onClick={() => handleHardDelete(item.id)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Delete Permanently
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center" }}>
                      No records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewingItem && (
        <div className="modal-overlay" onClick={handleCloseView}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inspection Details</h2>
              <button className="modal-close" onClick={handleCloseView}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>ID:</strong> {viewingItem.id}
              </div>
              <div className="detail-row">
                <strong>Inspection No:</strong> {formatInspectionNo(viewingItem.id)}
              </div>
              <div className="detail-row">
                <strong>Inspection Code:</strong> {(viewingItem.inspectionName || "").toUpperCase()}
              </div>
              <div className="detail-row">
                <strong>Plant:</strong> {viewingItem.plant}
              </div>
              <div className="detail-row">
                <strong>Valid From:</strong> {viewingItem.validFrom}
              </div>
              <div className="detail-row">
                <strong>Valid To:</strong> {viewingItem.validTo || "No expiry"}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge status-${viewingItem.status?.toLowerCase()}`}>
                  {viewingItem.status}
                </span>
              </div>
              <div className="detail-section">
                <h4>Specification Limits</h4>
                <div className="spec-grid">
                  <div className="spec-item">
                    <strong>Lower Spec Limit (LSL):</strong> 
                    {viewingItem.lowerSpecLimit !== null && viewingItem.lowerSpecLimit !== "" 
                      ? viewingItem.lowerSpecLimit 
                      : "Not set"}
                  </div>
                  <div className="spec-item">
                    <strong>Target Value:</strong> 
                    {viewingItem.targetValue !== null && viewingItem.targetValue !== "" 
                      ? viewingItem.targetValue 
                      : "Not set"}
                  </div>
                  <div className="spec-item">
                    <strong>Upper Spec Limit (USL):</strong> 
                    {viewingItem.upperSpecLimit !== null && viewingItem.upperSpecLimit !== "" 
                      ? viewingItem.upperSpecLimit 
                      : "Not set"}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-close" onClick={handleCloseView}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add these styles to your CSS file */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-close:hover {
          color: #000;
        }

        .modal-body {
          padding: 20px;
        }

        .detail-row {
          margin-bottom: 12px;
          padding: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-section {
          margin-top: 20px;
        }

        .detail-section h4 {
          margin-bottom: 12px;
          color: #333;
        }

        .spec-grid {
          display: grid;
          gap: 12px;
          background: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
        }

        .spec-item {
          padding: 8px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-left: 8px;
        }

        .status-released {
          background-color: #d4edda;
          color: #155724;
        }

        .status-complaint {
          background-color: #f8d7da;
          color: #721c24;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
        }

        .modal-btn-close {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .modal-btn-close:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
}