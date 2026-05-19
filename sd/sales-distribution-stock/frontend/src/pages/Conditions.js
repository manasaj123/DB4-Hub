// frontend/src/pages/Conditions.js
import React, { useEffect, useState } from "react";
import {
  getConditions,
  getDeletedConditions,
  createCondition,
  updateCondition,
  softDeleteCondition,
  restoreCondition,
  getCustomers,
  getMaterials,
} from "../services/conditionService";

const initialForm = {
  conditionType: "",
  customerId: "",
  materialId: "",
  salesOrg: "",
  distributionChannel: "",
  price: "",
  currency: "INR",
  validFrom: "",
  validTo: "",
};

const Conditions = () => {
  const [conditions, setConditions] = useState([]);
  const [deletedConditions, setDeletedConditions] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [condRes, delCondRes, custRes, matRes] = await Promise.all([
        getConditions(),
        getDeletedConditions(),
        getCustomers(),
        getMaterials(),
      ]);
      setConditions(condRes.data);
      setDeletedConditions(delCondRes.data);
      setCustomers(custRes.data);
      setMaterials(matRes.data);
    } catch (err) {
      console.error("Error loading conditions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [errors, setErrors] = useState({});
  const alphaNumericFields = ["conditionType", "salesOrg"];

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9\s\-\/().]*$/.test(value);
  };

  const validateCurrency = (value) => {
    return /^[A-Z]{0,3}$/.test(value);
  };

  const validateDistributionChannel = (value) => {
    return /^[a-zA-Z0-9]{0,10}$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // clear field error while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // normal text validation
    if (alphaNumericFields.includes(name) && !validateAlphaNumeric(value)) {
      return;
    }

    // currency validation
    if (name === "currency" && !validateCurrency(value.toUpperCase())) {
      return;
    }

    // distribution channel validation
    if (name === "distributionChannel" && !validateDistributionChannel(value)) {
      return;
    }

    // auto uppercase
    const updatedValue = ["currency", "conditionType", "salesOrg"].includes(
      name,
    )
      ? value.toUpperCase()
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const requiredFields = {
      conditionType: "Condition Type",
      customerId: "Customer",
      salesOrg: "Sales Organization",
      distributionChannel: "Distribution Channel",
      price: "Price",
      currency: "Currency",
      validFrom: "Valid From",
      validTo: "Valid To",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.toString().trim()) {
        alert(`${label} is required`);
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFromDate = new Date(formData.validFrom);
    const validToDate = new Date(formData.validTo);

    if (validFromDate < today) {
      alert("Valid From date cannot be in the past");
      return;
    }

    if (
      formData.validFrom &&
      formData.validTo &&
      new Date(formData.validTo) < new Date(formData.validFrom)
    ) {
      alert("Valid To date cannot be earlier than Valid From date");
      return;
    }

    if (!/^[A-Z]{3}$/.test(formData.currency)) {
      alert("Currency must be a 3-letter code like INR or USD");
      return;
    }

    if (!/^[0-9]{2}$/.test(formData.distributionChannel)) {
      alert("Distribution Channel must be 2 digits");
      return;
    }

    if (isNaN(formData.price) || Number(formData.price) <= 0) {
      alert("Price must be a valid positive number");
      return;
    }

    // old validations
    // if (!formData.conditionType) {
    //   alert("Enter condition type (e.g. PR00)");
    //   return;
    // }
    // if (!formData.price) {
    //   alert("Enter price");
    //   return;
    // }
    const payload = {
      ...formData,
      customerId: formData.customerId ? Number(formData.customerId) : null,
      materialId: formData.materialId ? Number(formData.materialId) : null,
      price: Number(formData.price),
    };
    try {
      if (editingId) {
        await updateCondition(editingId, payload);
      } else {
        await createCondition(payload);
      }
      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Error saving condition", err);
      }
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      conditionType: c.conditionType || "",
      customerId: c.customerId || "",
      materialId: c.materialId || "",
      salesOrg: c.salesOrg || "",
      distributionChannel: c.distributionChannel || "",
      price: c.price || "",
      currency: c.currency || "INR",
      validFrom: c.validFrom || "",
      validTo: c.validTo || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this condition record to recycle bin?")) return;
    try {
      await softDeleteCondition(id);
      loadData();
    } catch (err) {
      console.error("Error deleting condition", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreCondition(id);
      loadData();
    } catch (err) {
      console.error("Error restoring condition", err);
    }
  };

  const currentList = showDeleted ? deletedConditions : conditions;

  const displayCustomer = (id) => {
    if (!id) return "";
    const c = customers.find((x) => x.id === id);
    return c ? `${c.customerCode} - ${c.name}` : id;
  };

  const displayMaterial = (id) => {
    if (!id) return "";
    const m = materials.find((x) => x.id === id);
    return m ? `${m.materialCode} - ${m.description}` : id;
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container{
          max-width:1200px;
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
        .form-grid{
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:10px 16px;
        }

        .form-row{
          display:flex;
          flex-direction:column;
          margin-bottom:8px;
        }

        .form-row label{
          font-size:13px;
          margin-bottom:3px;
          align-self:flex-start;
        }

        .form-row input,
        .form-row select{
          height:32px;
          padding:3px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:13px;
          width:100%;
          margin-top:2px;
          align-self:flex-start;
        }

        .form-row input[type="date"]{
          padding:2px 6px;
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
          .form-grid{
            grid-template-columns:1fr;
          }
        }
      `}</style>

      <h2>Pricing Conditions</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-row">
            <label>Condition Type</label>
            <input
              name="conditionType"
              value={formData.conditionType}
              onChange={handleChange}
              placeholder="PR00, K004, etc."
              maxLength={4}
              required
            />
            {errors.conditionType && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.conditionType}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Customer</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              required
            >
              <option value="">None</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Material (optional)</label>
            <select
              name="materialId"
              value={formData.materialId}
              onChange={handleChange}
            >
              <option value="">None</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.materialCode} - {m.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Sales Organization</label>
            <input
              name="salesOrg"
              value={formData.salesOrg}
              onChange={handleChange}
              maxLength={10}
              required
            />
            {errors.salesOrg && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.salesOrg}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Distribution Channel</label>
            <input
              name="distributionChannel"
              value={formData.distributionChannel}
              onChange={handleChange}
              maxLength={10}
              required
            />
            {errors.distributionChannel && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.distributionChannel}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            {errors.price && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.price}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Currency</label>
            <input
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              maxLength={3}
              required
            />
            {errors.currency && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.currency}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Valid From</label>
            <input
              type="date"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Valid To</label>
            <input
              type="date"
              name="validTo"
              value={formData.validTo}
              onChange={handleChange}
              required
            />
            {errors.validTo && (
              <div style={{ color: "red", fontSize: "12px" }}>
                {errors.validTo}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Condition" : "Create Condition"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Conditions"}</h3>
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
              <th>Type</th>
              <th>Customer</th>
              <th>Material</th>
              <th>Sales Org</th>
              <th>Dist. Channel</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Valid From</th>
              <th>Valid To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((c) => (
              <tr key={c.id}>
                <td>{c.conditionType}</td>
                <td>{displayCustomer(c.customerId)}</td>
                <td>{displayMaterial(c.materialId)}</td>
                <td>{c.salesOrg}</td>
                <td>{c.distributionChannel}</td>
                <td>{c.price}</td>
                <td>{c.currency}</td>
                <td>{c.validFrom}</td>
                <td>{c.validTo}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button onClick={() => handleEdit(c)}>Edit</button>
                      <button onClick={() => handleSoftDelete(c.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button onClick={() => handleRestore(c.id)}>Restore</button>
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

export default Conditions;
