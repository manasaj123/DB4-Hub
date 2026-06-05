import React, { useEffect, useState } from "react";
import productApi from "../api/productApi";

function BOMPage() {
  const [bomList, setBomList] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Form fields
  const [productId, setProductId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [qtyPerUnit, setQtyPerUnit] = useState("");
  const [uom, setUom] = useState("KG");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editProductId, setEditProductId] = useState("");
  const [editMaterialId, setEditMaterialId] = useState("");
  const [editQtyPerUnit, setEditQtyPerUnit] = useState("");
  const [editUom, setEditUom] = useState("KG");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bomData, productData] = await Promise.all([
        fetch('http://localhost:4000/api/bom').then(r => r.json()),
        productApi.list()
      ]);
      
      setBomList(bomData || []);
      setProducts(productData || []);
      
      // Materials = products that are raw_material or packaging type
      const matList = (productData || []).filter(p => 
        p.type === 'raw_material' || p.type === 'packaging'
      );
      setMaterials(matList);
      
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setError("");
    setMessage("");

    if (!productId) {
      setError("Please select a product");
      return;
    }
    if (!materialId) {
      setError("Please select a material");
      return;
    }
    if (!qtyPerUnit || parseFloat(qtyPerUnit) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (productId === materialId) {
      setError("Product and Material cannot be the same");
      return;
    }

    // Check duplicate
    const exists = bomList.find(
      b => b.product_id === parseInt(productId) && b.material_id === parseInt(materialId)
    );
    if (exists) {
      setError("This BOM entry already exists!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(productId),
          material_id: parseInt(materialId),
          qty_per_unit: parseFloat(qtyPerUnit),
          uom: uom
        })
      });

      if (res.ok) {
        setMessage("BOM entry added successfully!");
        setProductId("");
        setMaterialId("");
        setQtyPerUnit("");
        setUom("KG");
        await loadAllData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add BOM");
      }
    } catch (err) {
      setError("Failed to add BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bom) => {
    setEditingId(bom.id);
    setEditProductId(bom.product_id);
    setEditMaterialId(bom.material_id);
    setEditQtyPerUnit(bom.qty_per_unit);
    setEditUom(bom.uom || 'KG');
    setError("");
    setMessage("");
  };

  const handleUpdate = async () => {
    setError("");
    setMessage("");

    if (!editQtyPerUnit || parseFloat(editQtyPerUnit) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/bom/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(editProductId),
          material_id: parseInt(editMaterialId),
          qty_per_unit: parseFloat(editQtyPerUnit),
          uom: editUom
        })
      });

      if (res.ok) {
        setMessage("BOM updated successfully!");
        setEditingId(null);
        await loadAllData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update BOM");
      }
    } catch (err) {
      setError("Failed to update BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this BOM entry?")) return;

    setLoading(true);
    try {
      await fetch(`http://localhost:4000/api/bom/${id}`, { method: 'DELETE' });
      setMessage("BOM deleted successfully!");
      await loadAllData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete BOM");
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id) => {
    const p = products.find(pr => pr.id === id);
    return p ? `${p.code} - ${p.name}` : `ID: ${id}`;
  };

  const getMaterialName = (id) => {
    const m = materials.find(ma => ma.id === id);
    return m ? `${m.code} - ${m.name}` : `ID: ${id}`;
  };

  const getTypeBadge = (type) => {
    const styles = {
      finished: { bg: '#d4edda', color: '#155724', label: '🏭 Finished' },
      raw_material: { bg: '#fff3cd', color: '#856404', label: '📦 Raw Material' },
      packaging: { bg: '#d1ecf1', color: '#0c5460', label: '📋 Packaging' }
    };
    const s = styles[type] || styles.finished;
    return (
      <span style={{
        backgroundColor: s.bg, color: s.color, padding: '2px 8px',
        borderRadius: '10px', fontSize: '10px', fontWeight: 'bold'
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <style>{`
        .bom-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .bom-table th, .bom-table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
        .bom-table th { background-color: #f4f6f8; font-weight: 600; }
        .bom-table tr:nth-child(even) { background-color: #fafafa; }
        .bom-table tr:hover { background-color: #f1f1f1; }
        select, input { padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
        select:focus, input:focus { border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.25); outline: none; }
        button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-danger { background-color: #dc3545; color: white; }
        .btn-secondary { background-color: #6c757d; color: white; }
        .message { padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 13px; }
        .message-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .message-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .form-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 15px; }
        .field-group { display: flex; flex-direction: column; }
        .field-group label { font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #555; }
        .info-box { background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
      `}</style>

      <h2>🔧 BOM – Bill of Materials</h2>
      <p style={{ color: "#666", marginTop: "-10px", marginBottom: "20px", fontSize: "13px", padding: "10px", background: "#f8f9fa", borderRadius: "8px" }}>
        Define which raw materials are needed to produce each finished product
      </p>

      {error && <div className="message message-error">❌ {error}</div>}
      {message && <div className="message message-success">✅ {message}</div>}

      <div className="info-box">
        <strong>💡 What is BOM?</strong>
        <br />
        BOM tells the system: "To make <strong>1 unit</strong> of <strong>Product X</strong>, 
        you need <strong>Y amount</strong> of <strong>Material Z</strong>"
        <br /><br />
        <strong>Example:</strong> To make 1 Rice Pack (P001), you need 1 KG of Raw Rice (RM1)
      </div>

      {/* Add/Edit Form */}
      <h3>{editingId ? '✏️ Edit BOM Entry' : 'Add BOM Entry'}</h3>
      <div className="form-row">
        <div className="field-group">
          <label>Finished Product *</label>
          <select 
            value={editingId ? editProductId : productId}
            onChange={(e) => editingId ? setEditProductId(e.target.value) : setProductId(e.target.value)}
            disabled={editingId !== null}
            style={{ minWidth: "200px" }}
          >
            <option value="">Select Product</option>
            {products.filter(p => p.type === 'finished').map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Raw Material *</label>
          <select 
            value={editingId ? editMaterialId : materialId}
            onChange={(e) => editingId ? setEditMaterialId(e.target.value) : setMaterialId(e.target.value)}
            disabled={editingId !== null}
            style={{ minWidth: "200px" }}
          >
            <option value="">Select Material</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Qty Per Unit *</label>
          <input 
            type="number" 
            step="0.5"
            placeholder="e.g., 1.5"
            value={editingId ? editQtyPerUnit : qtyPerUnit}
            onChange={(e) => editingId ? setEditQtyPerUnit(e.target.value) : setQtyPerUnit(e.target.value)}
            style={{ width: "120px" }}
          />
        </div>

        <div className="field-group">
          <label>UOM</label>
          <select 
            value={editingId ? editUom : uom}
            onChange={(e) => editingId ? setEditUom(e.target.value) : setUom(e.target.value)}
            style={{ width: "100px" }}
          >
            <option value="KG">KG</option>
            <option value="LTR">LTR</option>
            <option value="PC">PC</option>
            <option value="GM">GM</option>
            <option value="ML">ML</option>
          </select>
        </div>

        <div className="field-group">
          <label>&nbsp;</label>
          {editingId ? (
            <div style={{ display: "flex", gap: "5px" }}>
              <button className="btn-success" onClick={handleUpdate} disabled={loading}>💾 Update</button>
              <button className="btn-secondary" onClick={() => { setEditingId(null); setError(""); }} disabled={loading}>Cancel</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "➕ Add BOM"}
            </button>
          )}
        </div>
      </div>

      {/* BOM Table */}
      <h3>Current BOM Entries ({bomList.length})</h3>
      {bomList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#666", background: "#f8f9fa", borderRadius: "8px" }}>
          📋 No BOM entries found. Add your first BOM entry above.
        </div>
      ) : (
        <table className="bom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Finished Product</th>
              <th>Raw Material</th>
              <th style={{ textAlign: "center" }}>Qty Per Unit</th>
              <th style={{ textAlign: "center" }}>UOM</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bomList.map((bom, index) => (
              <tr key={bom.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{getProductName(bom.product_id)}</strong>
                </td>
                <td>{getMaterialName(bom.material_id)}</td>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {parseFloat(bom.qty_per_unit).toFixed(2)}
                </td>
                <td style={{ textAlign: "center" }}>{bom.uom || 'KG'}</td>
                <td style={{ textAlign: "center" }}>
                  <button 
                    onClick={() => handleEdit(bom)}
                    style={{ backgroundColor: '#02a525', color: '#333', padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(bom.id)}
                    style={{ backgroundColor: '#f40505', color: 'white', padding: '5px 10px', fontSize: '12px' }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BOMPage;