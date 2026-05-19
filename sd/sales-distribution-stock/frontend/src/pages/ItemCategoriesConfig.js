// frontend/src/pages/ItemCategoriesConfig.js
import React, { useEffect, useState } from "react";
import {
  getItemCategories,
  getDeletedItemCategories,
  createItemCategory,
  updateItemCategory,
  softDeleteItemCategory,
  restoreItemCategory,
} from "../services/itemCategoryService";

const initialForm = {
  salesDocumentType: "",
  itemCategoryGroup: "",
  itemUsage: "",
  itemCategoryHighLevelItem: "",
  defaultItemCategory: "",
  manualItemCategory: "",
};

const ItemCategoriesConfig = () => {
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getItemCategories(),
        getDeletedItemCategories(),
      ]);
      setItems(activeRes.data);
      setDeletedItems(deletedRes.data);
    } catch (err) {
      console.error("Error loading item categories configs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const alphaNumericFields = [
    "salesDocumentType",
    "itemCategoryGroup",
    "itemUsage",
    "itemCategoryHighLevelItem",
    "defaultItemCategory",
    "manualItemCategory",
  ];

  // no special characters except - / ( ) .
  const validateAlphaNumeric = (value) => {
    // return /^[a-zA-Z0-9\s\-\/().]*$/.test(value);
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // no special characters
    if (alphaNumericFields.includes(name) && !validateAlphaNumeric(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = {
      salesDocumentType: "Sales Document Type",
      itemCategoryGroup: "Item Category Group",
      defaultItemCategory: "Default Item Category",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.trim()) {
        alert(`${label} is required`);
        return;
      }
    }

    // valid category group
    const validGroups = ["HIGH", "MID", "LOW"];

    if (
      !validGroups.includes(formData.itemCategoryGroup.trim().toUpperCase())
    ) {
      alert("Item Category Group must be HIGH, MID or LOW");
      return;
    }

    const payload = { ...formData };

    try {
      if (editingId) {
        await updateItemCategory(editingId, payload);
      } else {
        await createItemCategory(payload);
      }
      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving item categories config", err);

      if (err.response?.data?.errors) {
        const backendErrors = Object.values(err.response.data.errors).join(
          "\n",
        );

        alert(backendErrors);
      } else {
        alert("Failed to save item categories config");
      }
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      salesDocumentType: row.salesDocumentType || "",
      itemCategoryGroup: row.itemCategoryGroup || "",
      itemUsage: row.itemUsage || "",
      itemCategoryHighLevelItem: row.itemCategoryHighLevelItem || "",
      defaultItemCategory: row.defaultItemCategory || "",
      manualItemCategory: row.manualItemCategory || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this configuration to recycle bin?")) return;
    try {
      await softDeleteItemCategory(id);
      loadData();
    } catch (err) {
      console.error("Error deleting item categories config", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreItemCategory(id);
      loadData();
    } catch (err) {
      console.error("Error restoring item categories config", err);
    }
  };

  const currentList = showDeleted ? deletedItems : items;

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

        .form-field input,
        .form-field select{
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
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

      <h2>Item Category Determination Config</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row-3">
          <div className="form-field">
            <label>Sales Document Type</label>
            <input
              name="salesDocumentType"
              value={formData.salesDocumentType}
              onChange={handleChange}
              placeholder="sales-doc-type (e.g. OR)"
              maxLength={10}
              required
            />
          </div>
          <div className="form-field">
            <label>Item Category Group</label>
            <select
              name="itemCategoryGroup"
              value={formData.itemCategoryGroup}
              onChange={handleChange}
              required
            >
              <option value="">Select Group</option>
              <option value="HIGH">HIGH</option>
              <option value="MID">MID</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <div className="form-field">
            <label>Item Usage</label>
            <input
              name="itemUsage"
              value={formData.itemUsage}
              onChange={handleChange}
              placeholder="item usage"
              maxLength={10}
       
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label>High-Level ItemCat</label>
            <input
              name="itemCategoryHighLevelItem"
              value={formData.itemCategoryHighLevelItem}
              onChange={handleChange}
              placeholder="itemcat-hgl-vitm"
              maxLength={10}
          
            />
          </div>
          <div className="form-field">
            <label>Default Item Category</label>
            <input
              name="defaultItemCategory"
              value={formData.defaultItemCategory}
              onChange={handleChange}
              placeholder="default itemcategory"
              maxLength={4}
              required
            />
          </div>
          <div className="form-field">
            <label>Manual Item Category</label>
            <input
              name="manualItemCategory"
              value={formData.manualItemCategory}
              onChange={handleChange}
              placeholder="manualitemcat"
              maxLength={4}
        
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Config" : "Create Config"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Configurations"}</h3>
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
              <th>Sales DocType</th>
              <th>ItemCat Group</th>
              <th>Item Usage</th>
              <th>HighLev ItemCat</th>
              <th>Default ItemCat</th>
              <th>Manual ItemCat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((row) => (
              <tr key={row.id}>
                <td>{row.salesDocumentType}</td>
                <td>{row.itemCategoryGroup}</td>
                <td>{row.itemUsage}</td>
                <td>{row.itemCategoryHighLevelItem}</td>
                <td>{row.defaultItemCategory}</td>
                <td>{row.manualItemCategory}</td>
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

export default ItemCategoriesConfig;
