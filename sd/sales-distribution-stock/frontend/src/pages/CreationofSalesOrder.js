// frontend/src/pages/SalesOrders.js
import React, { useEffect, useState } from "react";
import {
  getSalesOrders,
  getDeletedSalesOrders,
  createSalesOrder,
  updateSalesOrder,
  softDeleteSalesOrder,
  restoreSalesOrder,
  getCustomers,
  getInquiries,
  getQuotations,
  getMaterials,
} from "../services/salesOrderService";

const initialForm = {
  orderType: "",
  salesOrg: "",
  distributionChannel: "",
  division: "",
  salesOffice: "",
  salesGroup: "",
  soldToPartyId: "",
  shipToPartyId: "",
};

const initialItem = {
  materialId: "",
  quantity: "",
  uom: "",
};

const SalesOrders = () => {
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [orders, setOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(initialItem);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const [custRes, inqRes, quoRes, matRes, activeRes, deletedRes] =
        await Promise.all([
          getCustomers(),
          getInquiries(),
          getQuotations(),
          getMaterials(),
          getSalesOrders(),
          getDeletedSalesOrders(),
        ]);

      setCustomers(custRes.data);
      setInquiries(inqRes.data);
      setQuotations(quoRes.data);
      setMaterials(matRes.data);

      setOrders(activeRes.data);
      setDeletedOrders(deletedRes.data);
    } catch (err) {
      console.error("Error loading sales orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [errors, setErrors] = useState({});

  // =========================
  // VALIDATIONS
  // =========================

  // Allows:
  // letters
  // numbers
  // space
  // - / ( )
  // const validateAlphaNumeric = (value) => {
  //   return /^[a-zA-Z0-9\s\-\/().]*$/.test(value);
  // };

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  const validateMaxLength = (value, max) => {
    return value.length <= max;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // fields needing validation
    const validatedFields = [
      "orderType",
      "salesOrg",
      "distributionChannel",
      "division",
      "salesOffice",
      "salesGroup",
    ];

    if (validatedFields.includes(name)) {
      if (!validateAlphaNumeric(value)) {
        return;
      }

      // orderType => max 4
      if (name === "orderType" && !validateMaxLength(value, 4)) {
        return;
      }

      // all others => max 10
      if (
        [
          "salesOrg",
          "distributionChannel",
          "division",
          "salesOffice",
          "salesGroup",
        ].includes(name) &&
        !validateMaxLength(value, 10)
      ) {
        return;
      }
    }

    const updatedValue = validatedFields.includes(name)
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

    // uom validation
    if (name === "uom") {
      if (!validateAlphaNumeric(value)) {
        return;
      }

      if (!validateMaxLength(value, 10)) {
        return;
      }
    }

    setItemForm((prev) => ({
      ...prev,
      [name]: name === "uom" ? value.toUpperCase() : value,
    }));
  };

  // =========================
  // ITEM FUNCTIONS
  // =========================

  const addItem = () => {
    if (!itemForm.materialId || !itemForm.quantity || !itemForm.uom) {
      alert("Fill Material, Quantity and UoM");
      return;
    }

    setItems((prev) => [...prev, { ...itemForm }]);

    setItemForm(initialItem);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    if (!formData.orderType.trim()) {
      alert("Order Type is required");
      return;
    }

    if (!formData.salesOrg.trim()) {
      alert("Sales Organization is required");
      return;
    }

    if (!formData.distributionChannel.trim()) {
      alert("Distribution Channel is required");
      return;
    }

    if (!formData.division.trim()) {
      alert("Division is required");
      return;
    }

    if (!formData.salesOffice.trim()) {
      alert("Sales Office is required");
      return;
    }

    if (!formData.salesGroup.trim()) {
      alert("Sales Group is required");
      return;
    }

    if (!formData.soldToPartyId || !formData.shipToPartyId) {
      alert("Select Sold-To and Ship-To parties");
      return;
    }

    if (formData.soldToPartyId === formData.shipToPartyId) {
      alert("Sold-To Party and Ship-To Party cannot be same");
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
        await updateSalesOrder(editingId, payload);
      } else {
        await createSalesOrder(payload);
      }

      setFormData(initialForm);
      setItems([]);
      setItemForm(initialItem);
      setEditingId(null);

      loadData();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Error saving sales order", err);
      }
    }
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (order) => {
    setEditingId(order.id);

    setFormData({
      orderType: order.orderType || "",
      salesOrg: order.salesOrg || "",
      distributionChannel: order.distributionChannel || "",
      division: order.division || "",
      salesOffice: order.salesOffice || "",
      salesGroup: order.salesGroup || "",
      soldToPartyId: order.soldToPartyId || "",
      shipToPartyId: order.shipToPartyId || "",
    });

    let parsedItems = [];

    try {
      parsedItems = order.itemsJson ? JSON.parse(order.itemsJson) : [];
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

  // =========================
  // DELETE / RESTORE
  // =========================

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this sales order to recycle bin?")) {
      return;
    }

    try {
      await softDeleteSalesOrder(id);
      loadData();
    } catch (err) {
      console.error("Error deleting sales order", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreSalesOrder(id);
      loadData();
    } catch (err) {
      console.error("Error restoring sales order", err);
    }
  };

  // =========================
  // HELPERS
  // =========================

  const currentList = showDeleted ? deletedOrders : orders;

  const displayCustomerName = (id) => {
    const c = customers.find((x) => x.id === id);

    return c ? `${c.customerCode} - ${c.name}` : id;
  };

  const displayInquiryRef = (id) => {
    const i = inquiries.find((x) => x.id === id);

    return i ? `INQ-${i.id}` : id;
  };

  const displayQuotationRef = (id) => {
    const q = quotations.find((x) => x.id === id);

    return q ? `QT-${q.id}` : id;
  };

  const displayItemsSummary = (order) => {
    try {
      const arr = order.itemsJson ? JSON.parse(order.itemsJson) : [];

      if (!Array.isArray(arr) || arr.length === 0) {
        return "";
      }

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

        .form-card{
          background:white;
          padding:16px;
          border-radius:6px;
          box-shadow:0 2px 6px rgba(0,0,0,0.1);
          margin-bottom:20px;
        }

        .form-grid-2{
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:6px 10px;
          margin-bottom:8px;
        }

        .form-row{
          display:flex;
          flex-direction:column;
          margin-bottom:8px;
        }

        .form-row label{
          font-size:14px;
          margin-bottom:4px;
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
        }

        .items-form-row{
          display:flex;
          align-items:center;
          gap:8px;
          margin:8px 0 12px;
        }

        .items-form-row select,
        .items-form-row input{
          height:32px;
          width:200px;
          padding:3px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:13px;
        }

        .items-form-row button{
          padding:6px 12px;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:13px;
          background:#16a34a;
          color:white;
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
          margin-top:8px;
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
          .form-grid-2{
            grid-template-columns:1fr;
          }

          .items-form-row{
            flex-direction:column;
            align-items:stretch;
          }
        }
      `}</style>

      <h2>Creation of Sales Order</h2>

      <form className="form-card" onSubmit={handleSubmit}>

        {/* Common Error Display */}
        {/* {Object.keys(errors).length > 0 && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#b91c1c",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "14px",
              fontSize: "13px",
            }}
          >
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {Object.values(errors).map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )} */}

        {/* <div className="form-grid-2"></div> */}

        <div className="form-grid-2">
          <div className="form-row">
            <label>Order Type</label>
            <input
              name="orderType"
              value={formData.orderType}
              onChange={handleChange}
              required
              maxLength={4}
            />
          </div>

          <div className="form-row">
            <label>Sales Organization</label>
            <input
              name="salesOrg"
              value={formData.salesOrg}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Distribution Channel</label>
            <input
              name="distributionChannel"
              value={formData.distributionChannel}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Division</label>
            <input
              name="division"
              value={formData.division}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Sales Office</label>
            <input
              name="salesOffice"
              value={formData.salesOffice}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Sales Group</label>
            <input
              name="salesGroup"
              value={formData.salesGroup}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Sold-To Party</label>

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

          <div className="form-row">
            <label>Ship-To Party</label>

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

          <button type="button" onClick={addItem}>
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
                      <button type="button" onClick={() => removeItem(idx)}>
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
          <button type="submit">
            {editingId ? "Update Sales Order" : "Create Sales Order"}
          </button>

          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Sales Orders"}</h3>

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
              <th>Order Type</th>
              <th>Sales Org</th>
              <th>Dist. Channel</th>
              <th>Division</th>
              <th>Sold-To</th>
              <th>Ship-To</th>
              <th>Sales Office</th>
              <th>Sales Group</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentList.map((order) => (
              <tr key={order.id}>
                <td>{order.orderType}</td>
                <td>{order.salesOrg}</td>
                <td>{order.distributionChannel}</td>
                <td>{order.division}</td>
                <td>{displayCustomerName(order.soldToPartyId)}</td>
                <td>{displayCustomerName(order.shipToPartyId)}</td>
                <td>{order.salesOffice}</td>
                <td>{order.salesGroup}</td>
                <td>{displayItemsSummary(order)}</td>

                <td>
                  {!showDeleted && (
                    <>
                      <button type="button" onClick={() => handleEdit(order)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSoftDelete(order.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {showDeleted && (
                    <button
                      type="button"
                      onClick={() => handleRestore(order.id)}
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

export default SalesOrders;
