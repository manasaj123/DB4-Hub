import React, { useEffect, useState } from "react";
import productApi from "../api/productApi";

function ProductMasterPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("finished");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("finished");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await productApi.list();
      setRows(data || []);
    } catch (err) {
      setError("Failed to load products.");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateCode = (value) => /^[a-zA-Z0-9]+$/.test(value);
  const validateName = (value) => /^[a-zA-Z\s]+$/.test(value);

  const validateForm = (codeVal, nameVal) => {
    if (!codeVal.trim() || !nameVal.trim()) {
      setError("Both Code and Name are required.");
      return false;
    }
    if (!validateCode(codeVal.trim())) {
      setError("Code must contain only letters and numbers (no special characters).");
      return false;
    }
    if (!validateName(nameVal.trim())) {
      setError("Name must contain only letters and spaces.");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    setError("");
    setSuccessMsg("");

    if (!validateForm(code, name)) return;

    const duplicate = rows.find(
      (r) => r.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (duplicate) {
      setError(`Product with code "${code.trim()}" already exists!`);
      return;
    }

    setLoading(true);
    try {
      await productApi.create({ 
        code: code.trim(), 
        name: name.trim(),
        type: type
      });
      
      setSuccessMsg(`Product "${code.trim()}" added successfully!`);
      setCode("");
      setName("");
      setType("finished");
      await load();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product.");
      console.error("Create error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditCode(row.code);
    setEditName(row.name);
    setEditType(row.type || "finished");
    setError("");
    setSuccessMsg("");
  };

  const handleUpdate = async () => {
    setError("");
    setSuccessMsg("");

    if (!validateForm(editCode, editName)) return;

    const duplicate = rows.find(
      (r) => r.id !== editingId && r.code.toLowerCase() === editCode.trim().toLowerCase()
    );
    if (duplicate) {
      setError(`Product with code "${editCode.trim()}" already exists!`);
      return;
    }

    setLoading(true);
    try {
      await productApi.update(editingId, {
        code: editCode.trim(),
        name: editName.trim(),
        type: editType
      });
      
      setSuccessMsg("Product updated successfully!");
      setEditingId(null);
      setEditCode("");
      setEditName("");
      setEditType("finished");
      await load();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product.");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    setError("");
    setSuccessMsg("");
    setLoading(true);
    
    try {
      await productApi.delete(id);
      setSuccessMsg("Product deleted successfully!");
      await load();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to delete product.");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode("");
    setEditName("");
    setEditType("finished");
    setError("");
  };

  const handleCodeChange = (value, isEdit = false) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '');
    if (isEdit) setEditCode(sanitized);
    else setCode(sanitized);
    setError("");
  };

  const handleNameChange = (value, isEdit = false) => {
    const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
    if (isEdit) setEditName(sanitized);
    else setName(sanitized);
    setError("");
  };

  const filteredRows = filterType === "all" 
    ? rows 
    : rows.filter(r => r.type === filterType);

  const getTypeBadge = (type) => {
    const styles = {
      finished: { bg: '#d4edda', color: '#155724', label: '🏭 Finished Product' },
      raw_material: { bg: '#fff3cd', color: '#856404', label: '📦 Raw Material' }
    };
    const s = styles[type] || styles.finished;
    return (
      <span style={{
        backgroundColor: s.bg, color: s.color, padding: '3px 10px',
        borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="pp-container">
      <style>{`
        .pp-container { padding: 20px; font-family: Arial, sans-serif; }
        h2 { margin-bottom: 5px; color: #333; }
        .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
        .form-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-end; flex-wrap: wrap; }
        .field-group { display: flex; flex-direction: column; }
        .field-group label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #555; }
        input, select { padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-size: 13px; }
        input:focus, select:focus { border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.25); }
        button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-warning { background-color: #0755ff; color: #333; }
        .btn-danger { background-color: #dc3545; color: white; }
        .btn-secondary { background-color: #6c757d; color: white; }
        .btn-outline { background: white; border: 1px solid #007bff; color: #007bff; }
        .btn-outline:hover { background: #0059ff; color: white; }
        .btn-outline.active { background: #0051ff; color: white; }
        .pp-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .pp-table th, .pp-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
        .pp-table th { background-color: #f4f6f8; }
        .pp-table tr:nth-child(even) { background-color: #fafafa; }
        .pp-table tr:hover { background-color: #f1f1f1; }
        .message { padding: 10px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; }
        .message-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .message-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .stats { background-color: #e7f3ff; padding: 10px 15px; border-radius: 4px; margin-bottom: 16px; color: #004085; display: flex; gap: 20px; }
        .filter-bar { display: flex; gap: 8px; margin-bottom: 15px; }
      `}</style>

      <h2>📦 Product Master</h2>
      <p className="subtitle">Manage Finished Products and Raw Materials</p>

      {error && <div className="message message-error">❌ {error}</div>}
      {successMsg && <div className="message message-success">✅ {successMsg}</div>}

      {/* Stats */}
      <div className="stats">
        <span>🏭 <strong>Finished Products:</strong> {rows.filter(r => r.type === 'finished').length}</span>
        <span>📦 <strong>Raw Materials:</strong> {rows.filter(r => r.type === 'raw_material').length}</span>
        <span>📊 <strong>Total:</strong> {rows.length}</span>
      </div>

      {/* Create Form */}
      <h3 style={{ marginBottom: "10px" }}>
        {editingId ? '✏️ Edit Product' : ' Add New Product'}
      </h3>
      <div className="form-row">
        <div className="field-group">
          <label>Type *</label>
          <select 
            value={editingId ? editType : type} 
            onChange={(e) => editingId ? setEditType(e.target.value) : setType(e.target.value)}
          >
            <option value="finished">🏭 Finished Product (Sell)</option>
            <option value="raw_material">📦 Raw Material (Buy)</option>
          </select>
        </div>
        <div className="field-group">
          <label>Code *</label>
          <input
            placeholder="e.g., P001 or RM1"
            value={editingId ? editCode : code}
            onChange={(e) => handleCodeChange(e.target.value, editingId !== null)}
          />
        </div>
        <div className="field-group">
          <label>Name *</label>
          <input
            placeholder="e.g., Rice or Raw Rice"
            value={editingId ? editName : name}
            onChange={(e) => handleNameChange(e.target.value, editingId !== null)}
          />
        </div>
        <div className="field-group">
          <label>&nbsp;</label>
          {editingId ? (
            <div style={{ display: "flex", gap: "5px" }}>
              <button className="btn-success" onClick={handleUpdate} disabled={loading}>💾 Save</button>
              <button className="btn-secondary" onClick={handleCancelEdit} disabled={loading}>❌ Cancel</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? "Adding..." : "➕ Add Product"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-bar">
        <button className={`btn-outline ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
          📊 All ({rows.length})
        </button>
        <button className={`btn-outline ${filterType === 'finished' ? 'active' : ''}`} onClick={() => setFilterType('finished')}>
          🏭 Finished Products ({rows.filter(r => r.type === 'finished').length})
        </button>
        <button className={`btn-outline ${filterType === 'raw_material' ? 'active' : ''}`} onClick={() => setFilterType('raw_material')}>
          📦 Raw Materials ({rows.filter(r => r.type === 'raw_material').length})
        </button>
      </div>

      {/* Products Table */}
      <table className="pp-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                No products found. Add your first product!
              </td>
            </tr>
          ) : (
            filteredRows.map((r, index) => (
              <tr key={r.id}>
                <td>{index + 1}</td>
                <td><strong>{r.code}</strong></td>
                <td>{r.name}</td>
                <td>{getTypeBadge(r.type || 'finished')}</td>
                <td>
                  <button className="btn-warning" onClick={() => handleEdit(r)} disabled={loading || editingId !== null}
                    style={{ padding: "5px 10px", fontSize: "12px", marginRight: "5px" }}>
                    ✏️ Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(r.id)} disabled={loading || editingId !== null}
                    style={{ padding: "5px 10px", fontSize: "12px" }}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductMasterPage;