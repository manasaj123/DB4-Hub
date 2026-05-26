// frontend/src/pages/CustomerAccountGroup.js
import React, { useEffect, useState } from "react";
import {
  getCustomerGroups,
  getDeletedCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  softDeleteCustomerGroup,
  restoreCustomerGroup,
} from "../services/customerGroupService";

const initialForm = {
  accountGroup: "",
  name: "",
  fieldStatusGeneral: "",
  fieldStatusCompanyCode: "",
  fieldStatusSales: "",
};

const CustomerAccountGroup = () => {
  const [groups, setGroups] = useState([]);
  const [deletedGroups, setDeletedGroups] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getCustomerGroups(),
        getDeletedCustomerGroups(),
      ]);
      setGroups(activeRes.data);
      setDeletedGroups(deletedRes.data);
    } catch (err) {
      console.error("Error loading customer groups", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // const handleChange = e => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({ ...prev, [name]: value }));
  // };

  // const handleSubmit = async e => {
  //   e.preventDefault();
  //   if (!formData.accountGroup || formData.accountGroup.length !== 4) {
  //     alert('Account Group must be 4 characters');
  //     return;
  //   }
  //   try {
  //     if (editingId) {
  //       await updateCustomerGroup(editingId, formData);
  //     } else {
  //       await createCustomerGroup(formData);
  //     }
  //     setFormData(initialForm);
  //     setEditingId(null);
  //     loadData();
  //   } catch (err) {
  //     console.error('Error saving customer group', err);
  //   }
  // };

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Account group validation
    if (name === "accountGroup") {
      const upperValue = value.toUpperCase();

      // Only A-Z and numbers
      const accountGroupRegex = /^[A-Z0-9]*$/;

      if (!accountGroupRegex.test(upperValue)) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: upperValue,
      }));

      return;
    }

    // Name field only letters and spaces
    if (name === "name") {
      const lettersOnly = /^[A-Za-z\s]*$/;

      if (!lettersOnly.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizeStatus = (v) => {
    const map = {
      required: "Required",
      optional: "Optional",
      hidden: "Hidden",
    };

    return map[(v || "").trim().toLowerCase()] || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedData = {
      ...formData,
      fieldStatusGeneral: normalizeStatus(formData.fieldStatusGeneral),
      fieldStatusCompanyCode: normalizeStatus(formData.fieldStatusCompanyCode),
      fieldStatusSales: normalizeStatus(formData.fieldStatusSales),
    };

    const validStatuses = ["Required", "Optional", "Hidden"];

    // Account Group validation
    const accountGroupRegex = /^[A-Z0-9]{4}$/;

    if (!accountGroupRegex.test(formData.accountGroup)) {
      alert(
        "Account Group must be exactly 4 characters and contain only letters and numbers",
      );
      return;
    }

    // Name validation
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!nameRegex.test(formData.name)) {
      alert("Name should contain only letters");
      return;
    }

    // Field Status validation
    // const validStatuses = ["Required", "Optional", "Hidden"];

    if (!validStatuses.includes(normalizedData.fieldStatusGeneral)) {
      alert("General Data must be Required, Optional, or Hidden");
      return;
    }

    if (!validStatuses.includes(normalizedData.fieldStatusCompanyCode)) {
      alert("Company Code Data must be Required, Optional, or Hidden");
      return;
    }

    if (!validStatuses.includes(normalizedData.fieldStatusSales)) {
      alert("Sales Data must be Required, Optional, or Hidden");
      return;
    }

    try {
      if (editingId) {
        await updateCustomerGroup(editingId, normalizedData);
      } else {
        await createCustomerGroup(normalizedData);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Error saving customer group", err);
      }
    }
  };

  const handleEdit = (group) => {
    setEditingId(group.id);
    setFormData({
      accountGroup: group.accountGroup || "",
      name: group.name || "",
      fieldStatusGeneral: group.fieldStatusGeneral || "Optional",
      fieldStatusCompanyCode: group.fieldStatusCompanyCode || "Optional",
      fieldStatusSales: group.fieldStatusSales || "Optional",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this customer account group to recycle bin?"))
      return;
    await softDeleteCustomerGroup(id);
    loadData();
  };

  const handleRestore = async (id) => {
    await restoreCustomerGroup(id);
    loadData();
  };

  const currentList = showDeleted ? deletedGroups : groups;

  return (
    <div className="page-container cag-page">
      <style>{`
        .cag-page {
          max-width: 1000px;
          margin: auto;
          font-family: 'Segoe UI', sans-serif;
          padding: 20px;
        }

        h2 {
          margin-bottom: 20px;
          color: #1f2937;
        }

        /* FORM */
        .form-card {
          background: white;
          padding: 10px;
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 5px;
        }

        .form-row {
          display: flex;
          flex-direction: column;
        }

        .form-row label {
          font-size: 14px;
          margin-bottom: 6px;
          color: #374151;
        }

        .form-row input {
          width: 100%;
          height: 36px;
          padding: 6px 10px;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          font-size: 14px;
        }

        h4 {
          margin-top: 10px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          color: #111827;
        }

        /* BUTTONS */
        .form-actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        button {
          padding: 6px 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        button[type="submit"] {
          background: #2563eb;
          color: white;
        }

        button[type="submit"]:hover {
          background: #1d4ed8;
        }

        .form-actions button[type="button"] {
          background: #9ca3af;
          color: white;
        }

        .form-actions button[type="button"]:hover {
          background: #6b7280;
        }

        /* HEADER */
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
        }

        .list-header button {
          background: #f97316;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
        }

        .list-header button:hover {
          background: #ea580c;
        }

        /* TABLE */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 1px solid #e5e7eb;
        }

        .data-table th {
          background: #eef2ff;
          padding: 8px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .data-table td {
          padding: 8px;
          border: 1px solid #e5e7eb;
          font-size: 13px;
        }

        .data-table tr:nth-child(even) {
          background: #f9fafb;
        }

        /* TABLE BUTTONS */
        .data-table button {
          margin-right: 6px;
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 4px;
        }

        .data-table button:nth-child(1) {
          background: #3b82f6;
          color: white;
        }

        .data-table button:nth-child(2) {
          background: #ee6a05;
          color: white;
        }

        .data-table button:nth-child(1):hover {
          background: #2563eb;
        }

        .data-table button:nth-child(2):hover {
          background: #f87102;
        }
      `}</style>

      <h2>Customer Account Groups</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-row">
            <label>Customer Account Group (4-digit)</label>
            <input
              name="accountGroup"
              maxLength={4}
              value={formData.accountGroup}
              onChange={handleChange}
              required
              disabled={!!editingId}
            />
          </div>

          <div className="form-row">
            <label>Name (General Data)</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <h4 style={{ gridColumn: "1 / -1" }}>Field Status</h4>

          <div className="form-row">
            <label>General Data</label>
            <input
              name="fieldStatusGeneral"
              value={formData.fieldStatusGeneral}
              onChange={handleChange}
              placeholder="Required / Optional / Hidden"
            />
          </div>

          <div className="form-row">
            <label>Company Code Data</label>
            <input
              type="text"
              name="fieldStatusCompanyCode"
              value={formData.fieldStatusCompanyCode}
              onChange={handleChange}
              placeholder="Required / Optional / Hidden"
            />
          </div>

          <div className="form-row">
            <label>Sales Data</label>
            <input
              type="text"
              name="fieldStatusSales"
              value={formData.fieldStatusSales}
              onChange={handleChange}
              placeholder="Required / Optional / Hidden"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Account Group" : "Create Account Group"}
          </button>

          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Account Groups"}</h3>
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
              <th>Account Group</th>
              <th>Name</th>
              <th>General Data</th>
              <th>Company Code Data</th>
              <th>Sales Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((g) => (
              <tr key={g.id}>
                <td>{g.accountGroup}</td>
                <td>{g.name}</td>
                <td>{g.fieldStatusGeneral}</td>
                <td>{g.fieldStatusCompanyCode}</td>
                <td>{g.fieldStatusSales}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(g)}>Edit</button>
                      <button onClick={() => handleSoftDelete(g.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(g.id)}>Restore</button>
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

export default CustomerAccountGroup;
