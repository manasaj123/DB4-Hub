import React, { useEffect, useState } from "react";
import materialApi from "../api/materialApi";
import MaterialForm from "../components/materials/MaterialForm";
import MaterialList from "../components/materials/MaterialList";

const titleStyle = {
  fontSize: "28px",
  fontWeight: "800",
  marginBottom: "24px",
  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #10b981 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text"
};

const cardStyle = {
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
  marginBottom: "18px",
  border: "1px solid rgba(255,255,255,0.2)"
};

const pageContainer = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "10px"
};

export default function MaterialPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewMaterial, setViewMaterial] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await materialApi.getAll();
      setMaterials(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (form) => {
    try {
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, form);
      } else {
        await materialApi.create(form);
      }
      setEditingMaterial(null);
      await loadData();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save material");
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
  };
  const handleView = (material) => {
  setViewMaterial(material);
};
const closeView = () => {
  setViewMaterial(null);
};

  // src/pages/MaterialPage.js

const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this material?")) {
    try {
      // ✅ must be remove, not deleteMaterial
      await materialApi.remove(id);
      await loadData();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete material");
    }
  }
};


  const handleCancelEdit = () => {
    setEditingMaterial(null);
  };
  

  return (
    <div style={pageContainer}>
      <div style={titleStyle}>Materials Management</div>

      <div style={cardStyle}>
        <MaterialForm
          onSave={handleSave}
          editingMaterial={editingMaterial}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <div style={cardStyle}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6b7280",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              borderRadius: "12px"
            }}
          >
            Loading materials...
          </div>
        ) : (
          <MaterialList
  data={materials}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>
        )}
        {viewMaterial && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        width: "500px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <h2>Material Details</h2>

      <p><b>Material Number:</b> {viewMaterial.material_number}</p>
      <p><b>Name:</b> {viewMaterial.name}</p>
      <p><b>Quantity:</b> {viewMaterial.qty}</p>
      <p><b>UOM:</b> {viewMaterial.uom}</p>
      <p><b>Material Type:</b> {viewMaterial.material_type}</p>
      <p><b>Material Group:</b> {viewMaterial.material_group}</p>
      <p><b>Warehouse:</b> {viewMaterial.warehouse_number}</p>
      <p><b>Storage Location:</b> {viewMaterial.storage_location}</p>
      <p><b>Storage Type:</b> {viewMaterial.storage_type}</p>
      <p><b>Sales Org:</b> {viewMaterial.sales_org}</p>
      <p><b>Distribution Channel:</b> {viewMaterial.distribution_channel}</p>
      <p><b>Gross Weight:</b> {viewMaterial.gross_weight}</p>
      <p><b>Net Weight:</b> {viewMaterial.net_weight}</p>
      <p><b>Shelf Life:</b> {viewMaterial.shelf_life_days} days</p>
      <p><b>Valuation Method:</b> {viewMaterial.valuation_method}</p>
      <p><b>Issue Type:</b> {viewMaterial.issue_type}</p>

      <button
        onClick={closeView}
        style={{
          marginTop: "15px",
          padding: "8px 16px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
