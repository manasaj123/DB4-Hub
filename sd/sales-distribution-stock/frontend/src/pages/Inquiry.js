// frontend/src/pages/Inquiry.js
import React, { useEffect, useState } from "react";
import {
  getInquiries,
  getDeletedInquiries,
  createInquiry,
  updateInquiry,
  softDeleteInquiry,
  restoreInquiry,
  getCustomers,
  getMaterials,
} from "../services/inquiryService";

const initialForm = {
  inquiryType: "IN",
  salesOrg: "",
  distributionChannel: "",
  division: "",
  soldToPartyId: "",
  shipToPartyId: "",
};

const initialItem = {
  materialId: "",
  quantity: "",
  uom: "",
};

const Inquiry = () => {
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [deletedInquiries, setDeletedInquiries] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(initialItem);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, matRes, activeRes, deletedRes] = await Promise.all([
        getCustomers(),
        getMaterials(),
        getInquiries(),
        getDeletedInquiries(),
      ]);
      setCustomers(custRes.data);
      setMaterials(matRes.data);
      setInquiries(activeRes.data);
      setDeletedInquiries(deletedRes.data);
    } catch (err) {
      console.error("Error loading inquiry data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // const alphaNumericFields = [
  //   "inquiryType",
  //   "salesOrg",
  //   "distributionChannel",
  //   "division",
  // ];

  // const validateAlphaNumeric = (value) => {
  //   return /^[a-zA-Z0-9\s\-\/().]*$/.test(value);
  // };

  const validateMax10AlphaNumeric = (value) => {
    return /^[a-zA-Z0-9]{0,10}$/.test(value);
  };

  // const validateUom = (value) => {
  //   return ["KG", "LITERS", "PACKETS", "PIECES", "NOS"].includes(
  //     value.toUpperCase(),
  //   );
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // inquiry type
    if (name === "inquiryType" && !/^[a-zA-Z0-9]{0,4}$/.test(value)) {
      return;
    }

    // sales org / dist channel / division
    if (
      ["salesOrg", "distributionChannel", "division"].includes(name) &&
      !validateMax10AlphaNumeric(value)
    ) {
      return;
    }

    const updatedValue = [
      "inquiryType",
      "salesOrg",
      "distributionChannel",
      "division",
    ].includes(name)
      ? value.toUpperCase()
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    // quantity validation
    if (name === "quantity") {
      if (value && (!/^\d+(\.\d{0,3})?$/.test(value) || Number(value) <= 0)) {
        return;
      }
    }

    setItemForm((prev) => ({
      ...prev,
      [name]: name === "uom" ? value.toUpperCase() : value,
    }));
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

  // const handleItemChange = (e) => {
  //   const { name, value } = e.target;
  //   setItemForm((prev) => ({ ...prev, [name]: value }));
  // };

  const addItem = () => {
    if (!itemForm.materialId) {
      alert("Select material");
      return;
    }

    if (!itemForm.quantity || Number(itemForm.quantity) <= 0) {
      alert("Enter valid quantity");
      return;
    }

    if (!itemForm.uom) {
      alert("Select UoM");
      return;
    }

    setItems((prev) => [...prev, { ...itemForm }]);
    setItemForm(initialItem);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.soldToPartyId || !formData.shipToPartyId) {
      alert("Select Sold-To and Ship-To parties");
      return;
    }

    if (formData.soldToPartyId === formData.shipToPartyId) {
      alert("Sold-To Party and Ship-To Party cannot be the same");
      return;
    }

    if (items.length === 0) {
      alert("Add at least one item");
      return;
    }
    const payload = {
      ...formData,
      itemsJson: JSON.stringify(items),
    };
    try {
      if (editingId) {
        await updateInquiry(editingId, payload);
      } else {
        await createInquiry(payload);
      }
      setFormData(initialForm);
      setItems([]);
      setItemForm(initialItem);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving inquiry", err);

      if (err.response?.data?.errors) {
        const backendErrors = Object.values(err.response.data.errors).join(
          "\n",
        );

        alert(backendErrors);
      } else {
        alert("Failed to save inquiry");
      }
    }
  };

  const handleEdit = (inq) => {
    setEditingId(inq.id);
    setFormData({
      inquiryType: inq.inquiryType || "IN",
      salesOrg: inq.salesOrg || "",
      distributionChannel: inq.distributionChannel || "",
      division: inq.division || "",
      soldToPartyId: inq.soldToPartyId || "",
      shipToPartyId: inq.shipToPartyId || "",
    });
    let parsedItems = [];
    try {
      parsedItems = inq.itemsJson ? JSON.parse(inq.itemsJson) : [];
    } catch {
      parsedItems = [];
    }
    setItems(parsedItems);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
    setItems([]);
    setItemForm(initialItem);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this inquiry to recycle bin?")) return;
    try {
      await softDeleteInquiry(id);
      loadData();
    } catch (err) {
      console.error("Error deleting inquiry", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreInquiry(id);
      loadData();
    } catch (err) {
      console.error("Error restoring inquiry", err);
    }
  };

  const currentList = showDeleted ? deletedInquiries : inquiries;

  const displayCustomerName = (id) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.customerCode} - ${c.name}` : id;
  };

  const displayItemsSummary = (inq) => {
    try {
      const arr = inq.itemsJson ? JSON.parse(inq.itemsJson) : [];
      if (!Array.isArray(arr) || arr.length === 0) return "";
      return arr
        .map((it) => {
          const m = materials.find((mm) => mm.id === Number(it.materialId));
          const matLabel = m ? m.materialCode : it.materialId;
          return `${matLabel} (${it.quantity} ${it.uom})`;
        })
        .join(", ");
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

        h4{
          margin-top:16px;
          margin-bottom:8px;
          border-bottom:1px solid #e5e7eb;
          padding-bottom:4px;
        }

        .form-card{
          background:white;
          padding:16px;
          border-radius:6px;
          box-shadow:0 2px 6px rgba(0,0,0,0.1);
          margin-bottom:20px;
        }

        /* alignment grid for header / org / partner */
        .form-section-grid{
          display:grid;
          grid-template-columns: 100px 1fr 100px 1fr;
          column-gap:6px;
          row-gap:5px;
          align-items:center;
        }

        .form-label{
          text-align:right;
          padding-right:8px;
          font-size:14px;
          white-space:nowrap;
        }

        .form-field input,
        .form-field select{
          width:100%;
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
        }

        .items-form-row{
          display:grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap:8px;
          align-items:center;
          margin-bottom:12px;
        }

        .items-form-row select,
        .items-form-row input{
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

        .btn{
          padding:7px 14px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:13px;
        }

        .btn-primary{
          background:#2563eb;
          color:white;
        }

        .btn-secondary{
          background:#6b7280;
          color:white;
        }

        .btn-warning{
          background:#f59e0b;
          color:white;
        }

        .btn-success{
          background:#22c55e;
          color:white;
        }

        .btn-small{
          padding:4px 10px;
          font-size:12px;
        }

        .list-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin:16px 0;
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
      `}</style>

      <form className="form-card" onSubmit={handleSubmit}>
        {/* Header */}
        <h4>Header</h4>
        <div className="form-section-grid">
          <div className="form-label">Inquiry Type</div>
          <div className="form-field">
            <input
              name="inquiryType"
              value={formData.inquiryType}
              onChange={handleChange}
              required
              maxLength={4}
            />
          </div>
          <div></div>
          <div></div>
        </div>

        {/* Organizational Data */}
        <h4>Organizational Data</h4>
        <div className="form-section-grid">
          <div className="form-label">Sales Organization</div>
          <div className="form-field">
            <input
              name="salesOrg"
              value={formData.salesOrg}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>
          <div className="form-label">Distribution Channel</div>
          <div className="form-field">
            <input
              name="distributionChannel"
              value={formData.distributionChannel}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>
          <div className="form-label">Division</div>
          <div className="form-field">
            <input
              name="division"
              value={formData.division}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>
          <div></div>
          <div></div>
        </div>

        {/* Partner Functions */}
        <h4>Partner Functions</h4>
        <div className="form-section-grid">
          <div className="form-label">Sold-To Party</div>
          <div className="form-field">
            <select
              name="soldToPartyId"
              value={formData.soldToPartyId}
              onChange={handleChange}
              required
            >
              <option value="">Select Sold-To Party</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-label">Ship-To Party</div>
          <div className="form-field">
            <select
              name="shipToPartyId"
              value={formData.shipToPartyId}
              onChange={handleChange}
              required
            >
              <option value="">Select Ship-To Party</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items */}
        <h4>Items</h4>
        <div className="items-form-row">
          <select
            name="materialId"
            value={itemForm.materialId}
            onChange={handleItemChange}
          >
            <option value="">Material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.materialCode} - {m.description}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min="0.001"
            step="0.001"
            placeholder="Qty"
            value={itemForm.quantity}
            onChange={handleItemChange}
          />
          <select name="uom" value={itemForm.uom} onChange={handleItemChange}>
            <option value="">Select UoM</option>
            <option value="KG">KG</option>
            <option value="LITERS">LITERS</option>
            <option value="PACKETS">PACKETS</option>
            <option value="PIECES">PIECES</option>
            <option value="NOS">NOS</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={addItem}>
            Add Item
          </button>
        </div>

        {items.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>UoM</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const m = materials.find(
                  (mm) => mm.id === Number(it.materialId),
                );
                return (
                  <tr key={idx}>
                    <td>
                      {m
                        ? `${m.materialCode} - ${m.description}`
                        : it.materialId}
                    </td>
                    <td>{it.quantity}</td>
                    <td>{it.uom}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-warning btn-small"
                        onClick={() => removeItem(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Inquiry" : "Create Inquiry"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Inquiries"}</h3>
        <button
          className="btn btn-secondary"
          onClick={() => setShowDeleted((v) => !v)}
        >
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
              <th>Inquiry Type</th>
              <th>Sales Org</th>
              <th>Dist. Channel</th>
              <th>Division</th>
              <th>Sold-To</th>
              <th>Ship-To</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((inq) => (
              <tr key={inq.id}>
                <td>{inq.inquiryType}</td>
                <td>{inq.salesOrg}</td>
                <td>{inq.distributionChannel}</td>
                <td>{inq.division}</td>
                <td>{displayCustomerName(inq.soldToPartyId)}</td>
                <td>{displayCustomerName(inq.shipToPartyId)}</td>
                <td>{displayItemsSummary(inq)}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleEdit(inq)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-warning btn-small"
                        onClick={() => handleSoftDelete(inq.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button
                      className="btn btn-success btn-small"
                      onClick={() => handleRestore(inq.id)}
                    >
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

export default Inquiry;
