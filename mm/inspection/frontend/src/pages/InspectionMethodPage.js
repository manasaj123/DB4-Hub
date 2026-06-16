// src/pages/InspectionMethodPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/qc/Sidebar";
import Header from "../components/qc/Header";
import "./Pagestyles.css";

const BASE_URL = "http://localhost:5003/api";

// helper to build inspection method number from DB id
const formatInspectionMethodNo = id =>
  id ? `IM-${String(id).padStart(4, "0")}` : "";

export default function InspectionMethodPage() {
  const [items, setItems] = useState([]);
  const [binItems, setBinItems] = useState([]);
  const [masterInspections, setMasterInspections] = useState([]);
  const [form, setForm] = useState({
    masterInspectionId: "",
    inspectionName: "",
    status: "NOT_RELEASED"
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [viewingItem, setViewingItem] = useState(null); // State for view modal

  const loadData = async () => {
    try {
      const [activeRes, binRes, masterRes] = await Promise.all([
        axios.get(`${BASE_URL}/inspection-methods`),
        axios.get(`${BASE_URL}/inspection-methods/recycle-bin`),
        axios.get(`${BASE_URL}/master-inspections`)
      ]);

      setItems(activeRes.data || []);
      setBinItems(binRes.data || []);
      setMasterInspections(masterRes.data || []);
    } catch (err) {
      console.error("loadData error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Master inspection required
    if (!form.masterInspectionId) {
      newErrors.masterInspectionId = "Master Inspection is required";
    }

    // Method name: letters, numbers, spaces, and - _ / ( )
    const methodNameRegex = /^[A-Za-z0-9\s\-_/()]+$/;

    if (!form.inspectionName.trim()) {
      newErrors.inspectionName = "Inspection Method Name is required";
    } else if (!methodNameRegex.test(form.inspectionName.trim())) {
      newErrors.inspectionName =
        "Method name can contain letters, numbers, spaces, and - _ / ( )";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const payload = {
      masterInspectionId: form.masterInspectionId,
      inspectionName: form.inspectionName,
      status: form.status
    };

    if (editingId) {
      await axios.put(
        `${BASE_URL}/inspection-methods/${editingId}`,
        payload
      );
    } else {
      await axios.post(`${BASE_URL}/inspection-methods`, payload);
    }

    setForm({
      masterInspectionId: "",
      inspectionName: "",
      status: "NOT_RELEASED"
    });
    setEditingId(null);
    await loadData();
  };

  const handleEdit = item => {
    setEditingId(item.id);
    setForm({
      masterInspectionId:
        item.masterInspectionId || item.master_inspection_id || "",
      inspectionName: item.inspectionName || item.inspection_name || "",
      status: item.status
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
    await axios.delete(`${BASE_URL}/inspection-methods/${id}`);
    await loadData();
  };

  const handleRestore = async id => {
    await axios.post(`${BASE_URL}/inspection-methods/${id}/restore`);
    await loadData();
  };

  const handleHardDelete = async id => {
    await axios.delete(
      `${BASE_URL}/inspection-methods/${id}/hard-delete`
    );
    await loadData();
  };

  const list = showRecycleBin ? binItems : items;

  // helper to show master inspection name for a method row
  const getMasterInspectionName = miId => {
    const mi = masterInspections.find(m => m.id === miId);
    return mi ? mi.inspectionName : "";
  };

  // helper to get master inspection details for view modal
  const getMasterInspectionDetails = (miId) => {
    return masterInspections.find(m => m.id === miId);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'RELEASED':
        return 'status-released';
      case 'NOT_RELEASED':
        return 'status-not-released';
      case 'PROCESS':
        return 'status-process';
      default:
        return '';
    }
  };

  // Get status display text with proper formatting
  const getStatusDisplay = (status) => {
    if (!status) return 'N/A';
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="qc-master-page">
      <Sidebar />

      <div className="qc-master-content">
        <Header title="Inspection Method" />

        <div className="qc-master-body">
          {/* FORM CARD */}
          <div className="qc-master-form-card">
            <h3>
              {editingId
                ? "Edit Inspection Method"
                : "Create Inspection Method"}
            </h3>
            <form onSubmit={handleSubmit} className="qc-form">
              <div className="form-row">
                <label>Master Inspection Name</label>
                <select
                  name="masterInspectionId"
                  value={form.masterInspectionId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select...</option>
                  {masterInspections.map(mi => (
                    <option key={mi.id} value={mi.id}>
                      {mi.inspectionName}
                    </option>
                  ))}
                </select>
                {errors.masterInspectionId && (
                  <span className="error-text">
                    {errors.masterInspectionId}
                  </span>
                )}
              </div>

              <div className="form-row">
                <label>Inspection Method Name</label>
                <input
                  name="inspectionName"
                  value={form.inspectionName}
                  onChange={handleChange}
                  required
                />
                {errors.inspectionName && (
                  <span className="error-text">
                    {errors.inspectionName}
                  </span>
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
                  <option value="NOT_RELEASED">NOT_RELEASED</option>
                  <option value="PROCESS">PROCESS</option>
                </select>
              </div>

              <div className="form-row-full">
                <button type="submit">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>

          {/* LIST + RECYCLE BIN */}
          <div className="qc-master-list">
            <div className="qc-master-list-header">
              <h3>
                {showRecycleBin
                  ? "Inspection Method - Recycle Bin"
                  : "Inspection Method List"}
              </h3>

              <button onClick={() => setShowRecycleBin(v => !v)}>
                {showRecycleBin ? "Show Active" : "Show Recycle Bin"}
              </button>
            </div>

            <table className="qc-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Method No</th>
                  <th>Master Inspection Name</th>
                  <th>Inspection Method Name</th>
                  {!showRecycleBin && <th>Status</th>}
                  {showRecycleBin && <th>Deleted At</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.id}>
                    <td className="col-id">{item.id}</td>
                    <td>{formatInspectionMethodNo(item.id)}</td>
                    <td>
                      {getMasterInspectionName(
                        item.masterInspectionId ||
                          item.master_inspection_id
                      )}
                    </td>
                    <td>
                      {item.inspection_name || item.inspectionName}
                    </td>

                    {!showRecycleBin && <td>{item.status}</td>}
                    {showRecycleBin && (
                      <td>
                        {item.deleted_at || item.deletedAt || "-"}
                      </td>
                    )}

                    <td>
                      <button
                        className="action-view"
                        onClick={() => handleView(item)}
                        style={{
                          backgroundColor: "#05b743",
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
                              backgroundColor: "#076aff",
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
                    <td
                      colSpan={showRecycleBin ? 6 : 6}
                      style={{ textAlign: "center" }}
                    >
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
              <h2>Inspection Method Details</h2>
              <button className="modal-close" onClick={handleCloseView}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>ID:</strong> {viewingItem.id}
              </div>
              <div className="detail-row">
                <strong>Method No:</strong> {formatInspectionMethodNo(viewingItem.id)}
              </div>
              <div className="detail-row">
                <strong>Master Inspection:</strong>{" "}
                {getMasterInspectionName(
                  viewingItem.masterInspectionId || viewingItem.master_inspection_id
                )}
              </div>
              <div className="detail-row">
                <strong>Inspection Method Name:</strong>{" "}
                {viewingItem.inspection_name || viewingItem.inspectionName}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${getStatusBadgeClass(viewingItem.status)}`}>
                  {getStatusDisplay(viewingItem.status)}
                </span>
              </div>
              
              {/* Show additional master inspection details if available */}
              {(() => {
                const masterDetails = getMasterInspectionDetails(
                  viewingItem.masterInspectionId || viewingItem.master_inspection_id
                );
                if (masterDetails) {
                  return (
                    <div className="detail-section">
                      <h4>Associated Master Inspection Details</h4>
                      <div className="spec-grid">
                        <div className="spec-item">
                          <strong>Inspection Code:</strong> {masterDetails.inspectionName}
                        </div>
                        <div className="spec-item">
                          <strong>Plant:</strong> {masterDetails.plant || "N/A"}
                        </div>
                        <div className="spec-item">
                          <strong>Valid From:</strong> {masterDetails.validFrom || "N/A"}
                        </div>
                        <div className="spec-item">
                          <strong>Valid To:</strong> {masterDetails.validTo || "No expiry"}
                        </div>
                        {masterDetails.lowerSpecLimit && (
                          <div className="spec-item">
                            <strong>LSL:</strong> {masterDetails.lowerSpecLimit}
                          </div>
                        )}
                        {masterDetails.targetValue && (
                          <div className="spec-item">
                            <strong>Target:</strong> {masterDetails.targetValue}
                          </div>
                        )}
                        {masterDetails.upperSpecLimit && (
                          <div className="spec-item">
                            <strong>USL:</strong> {masterDetails.upperSpecLimit}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
          max-width: 700px;
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
          border-left: 4px solid #2196f3;
          padding-left: 12px;
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
          border-bottom: 1px solid #e0e0e0;
        }

        .spec-item:last-child {
          border-bottom: none;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-left: 8px;
        }

        .status-released {
          background-color: #d4edda;
          color: #155724;
        }

        .status-not-released {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-process {
          background-color: #cce5ff;
          color: #004085;
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
          padding: 8px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .modal-btn-close:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
}