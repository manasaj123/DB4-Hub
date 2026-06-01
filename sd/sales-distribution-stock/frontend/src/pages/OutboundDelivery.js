// frontend/src/pages/Deliveries.js
import React, { useEffect, useState } from "react";
import {
  getDeliveries,
  getDeletedDeliveries,
  createDelivery,
  updateDelivery,
  softDeleteDelivery,
  restoreDelivery,
  getSalesOrders,
  getCustomers,
} from "../services/deliveryService";

const initialForm = {
  shippingPoint: "",
  salesOrderId: "",
  warehouse: "",
  plant: "",
  deliveryGroup: "",
  postGoodsIssueDate: "",
  status: "OPEN",
};

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [deletedDeliveries, setDeletedDeliveries] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delRes, delDelRes, soRes, custRes] = await Promise.all([
        getDeliveries(),
        getDeletedDeliveries(),
        getSalesOrders(),
        getCustomers(),
      ]);
      setDeliveries(delRes.data);
      setDeletedDeliveries(delDelRes.data);
      setSalesOrders(soRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error("Error loading deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateAlphaNumeric = (value) => {
    if (value === "") return true;

    return /^[A-Za-z0-9\s-]+$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      ["shippingPoint", "warehouse", "plant", "deliveryGroup"].includes(name)
    ) {
      if (!validateAlphaNumeric(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: typeof value === "string" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!formData.shippingPoint) {
    //   alert("Enter shipping point");
    //   return;
    // }
    if (!formData.salesOrderId) {
      alert("Select sales order");
      return;
    }

    // if (!formData.plant.trim()) {
    //   alert("Enter Plant");
    //   return;
    // }

    // if (!formData.warehouse.trim()) {
    //   alert("Enter Warehouse");
    //   return;
    // }

    if (formData.postGoodsIssueDate) {
      const selectedDate = new Date(formData.postGoodsIssueDate);
      const today = new Date();

      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        alert("Past PGI Date not allowed");
        return;
      }
    }

    const payload = {
      ...formData,
      salesOrderId: Number(formData.salesOrderId),
    };

    try {
      if (editingId) {
        await updateDelivery(editingId, payload);
      } else {
        await createDelivery(payload);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving delivery", err);

      alert(err.response?.data?.message || "Error saving delivery");
    }
  };

  const handleEdit = (d) => {
    setEditingId(d.id);
    setFormData({
      shippingPoint: d.shippingPoint || "",
      salesOrderId: d.salesOrderId || "",
      warehouse: d.warehouse || "",
      plant: d.plant || "",
      deliveryGroup: d.deliveryGroup || "",
      postGoodsIssueDate: d.postGoodsIssueDate || "",
      status: d.status || "OPEN",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this delivery to recycle bin?")) return;
    try {
      await softDeleteDelivery(id);
      loadData();
    } catch (err) {
      console.error("Error deleting delivery", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreDelivery(id);
      loadData();
    } catch (err) {
      console.error("Error restoring delivery", err);
    }
  };

  const currentList = showDeleted ? deletedDeliveries : deliveries;

  const displayOrderLabel = (id) => {
    const o = salesOrders.find((x) => x.id === id);
    if (!o) return id;
    const sold = customers.find((c) => c.id === o.soldToPartyId);
    const soldName = sold
      ? `${sold.customerCode} - ${sold.name}`
      : o.soldToPartyId;
    return `SO-${o.id} (${soldName})`;
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

        h4{
          margin:10px 0 6px;
          font-size:14px;
        }

        /* normal vertical form */
        .form-row{
          display:flex;
          flex-direction:column;
          margin-bottom:10px;
        }

        .form-row label{
          font-size:14px;
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
          width:300px;
          align-self:flex-start;
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
      `}</style>

      <h2>Outbound Deliveries</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h4>Header</h4>
        <div className="form-row">
          <label>Shipping Point</label>
          <input
            name="shippingPoint"
            value={formData.shippingPoint}
            onChange={handleChange}
            maxLength={10}
            
          />
        </div>
        <div className="form-row">
          <label>Sales Order</label>
          <select
            name="salesOrderId"
            value={formData.salesOrderId}
            onChange={handleChange}
            required
          >
            <option value="">Select Sales Order</option>
            {salesOrders.map((o) => (
              <option key={o.id} value={o.id}>
                SO-{o.id}
              </option>
            ))}
          </select>
        </div>

        <h4>Organization</h4>
        <div className="form-row">
          <label>Warehouse</label>
          <input
            name="warehouse"
            value={formData.warehouse}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="form-row">
          <label>Plant</label>
          <input name="plant" value={formData.plant} onChange={handleChange} maxLength={10} />
        </div>
        <div className="form-row">
          <label>Delivery Group</label>
          <input
            name="deliveryGroup"
            value={formData.deliveryGroup}
            onChange={handleChange} 
            maxLength={10}
          />
        </div>

        <h4>Post Goods Issue</h4>
        <div className="form-row">
          <label>PGI Date</label>
          <input
            type="date"
            name="postGoodsIssueDate"
            value={formData.postGoodsIssueDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-row">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="OPEN">OPEN</option>
            <option value="PICKED">PICKED</option>
            <option value="PACKED">PACKED</option>
            <option value="PGI_DONE">PGI_DONE</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? "Update Delivery" : "Create Delivery"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Deliveries"}</h3>
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
              <th>Shipping Point</th>
              <th>Sales Order</th>
              <th>Warehouse</th>
              <th>Plant</th>
              <th>Delivery Group</th>
              <th>PGI Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((d) => (
              <tr key={d.id}>
                <td>{d.shippingPoint}</td>
                <td>{displayOrderLabel(d.salesOrderId)}</td>
                <td>{d.warehouse}</td>
                <td>{d.plant}</td>
                <td>{d.deliveryGroup}</td>
                <td>{d.postGoodsIssueDate}</td>
                <td>{d.status}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button type="button" onClick={() => handleEdit(d)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSoftDelete(d.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button type="button" onClick={() => handleRestore(d.id)}>
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

export default Deliveries;
