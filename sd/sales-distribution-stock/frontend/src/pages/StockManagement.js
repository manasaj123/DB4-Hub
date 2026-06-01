import React, { useEffect, useState } from "react";
import { getMaterials } from "../services/materialService";
import { addStock, getStock } from "../services/stockService";

const initialForm = {
  materialId: "",
  plant: "",
  warehouse: "",
  storageLocation: "",
  quantity: "",
};

const StockManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [stockRecords, setStockRecords] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const loadMaterials = async () => {
    try {
      const res = await getMaterials();
      setMaterials(res.data);
    } catch (err) {
      console.error("Error loading materials", err);
    }
  };

  const loadStock = async () => {
    try {
      const res = await getStock();
      setStockRecords(res.data);
    } catch (err) {
      console.error("Error loading stock", err);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadStock();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedMaterial = materials.find(
    (m) => m.id === Number(formData.materialId),
  );

  const validateForm = () => {
    const { materialId, plant, quantity } = formData;
    if (!materialId) {
      alert("Please select a material");
      return false;
    }
    if (!plant.trim()) {
      alert("Plant is required");
      return false;
    }
    if (!quantity || Number(quantity) <= 0) {
      alert("Quantity must be a positive number");
      return false;
    }
    // Optional additional checks...
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await addStock({
        materialId: Number(formData.materialId),
        plant: formData.plant.toUpperCase().trim(),
        warehouse: formData.warehouse.trim() || null,
        storageLocation: formData.storageLocation.trim() || null,
        quantity: Number(formData.quantity),
      });
      alert("Stock added successfully");
      setFormData(initialForm);
      loadStock();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add stock");
    }
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container { max-width: 1100px; margin: auto; padding: 20px; font-family: Segoe UI, sans-serif; }
        h2 { margin-bottom: 16px; }
        .form-card { background: #fff; padding: 16px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; margin-bottom: 12px; }
        .form-field { display: flex; flex-direction: column; }
        .form-field label { font-size: 14px; margin-bottom: 4px; }
        .form-field input, .form-field select { height: 34px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; }
        .form-actions { margin-top: 12px; display: flex; gap: 8px; }
        .form-actions button { padding: 7px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; background: #2563eb; color: white; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .data-table th { background: #e0f2fe; padding: 8px; border: 1px solid #ddd; font-size: 13px; }
        .data-table td { padding: 6px; border: 1px solid #ddd; font-size: 13px; }
        .data-table tr:nth-child(even) { background: #f9fafb; }
      `}</style>

      <h2>Stock Management (Plant / Warehouse Level)</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row-3">
          <div className="form-field">
            <label>Material</label>
            <select
              name="materialId"
              value={formData.materialId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Material --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.materialCode} - {m.description}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Plant</label>
            <input
              name="plant"
              value={formData.plant}
              onChange={handleChange}
              placeholder="e.g. PL01"
              required
              maxLength={10}
            />
          </div>
          <div className="form-field">
            <label>Warehouse</label>
            <input
              name="warehouse"
              value={formData.warehouse}
              onChange={handleChange}
              placeholder="e.g. WH01"
            />
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-field">
            <label>Storage Location</label>
            <input
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleChange}
              placeholder="e.g. RackA"
            />
          </div>
          <div className="form-field">
            <label>
              Quantity
              {selectedMaterial && ` (${selectedMaterial.baseUom})`}
            </label>

            <input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              step="any"
              required
            />
          </div>
          <div className="form-field" /> {/* empty for alignment */}
        </div>
        <div className="form-actions">
          <button type="submit">Add Stock</button>
        </div>
      </form>

      <h3>Current Stock Overview</h3>
      {stockRecords.length === 0 ? (
        <p>No stock records.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Plant</th>
              <th>Warehouse</th>
              <th>Storage Loc.</th>
              <th>Available Qty</th>
              <th>Reserved Qty</th>
            </tr>
          </thead>
          <tbody>
            {stockRecords.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.Material?.materialCode} - {s.Material?.description}
                </td>
                <td>{s.plant}</td>
                <td>{s.warehouse || "-"}</td>
                <td>{s.storageLocation || "-"}</td>
                <td>{s.availableQty}</td>
                <td>{s.reservedQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockManagement;
