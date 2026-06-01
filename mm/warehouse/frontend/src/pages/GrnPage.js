import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { itemApi } from "../api/itemApi"; // ✅ import the existing item api helper
import Table from "../components/common/Table";
import "../pages/style.css";

const GrnPage = () => {
  const [grns, setGrns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [allItems, setAllItems] = useState([]); // items for dropdown
  const [items, setItems] = useState([{ item_id: "", qty_received: "" }]);
  const [formData, setFormData] = useState({
    grn_no: "",
    warehouse_id: "",
    received_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGrns();
    loadWarehouses();
    loadItems();
  }, []);

  // ✅ Load items using existing itemApi
  const loadItems = async () => {
    try {
      const response = await itemApi.getAll();
      setAllItems(response.data || []);
    } catch (error) {
      console.error("Load items failed:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await axiosClient.get("/warehouse");
      setWarehouses(response.data || []);
      if (response.data && response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          warehouse_id: response.data[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("Load warehouses failed:", error);
    }
  };

  const loadGrns = async () => {
    try {
      const response = await axiosClient.get("/grn/pending");
      setGrns(response.data || []);
    } catch (error) {
      console.error("Load GRNs failed:", error);
    }
  };

  // ✅ Item row management
  const addItem = () => {
    setItems([...items, { item_id: "", qty_received: "" }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.grn_no && !/^[A-Z0-9\-]+$/i.test(formData.grn_no)) {
      alert("❌ GRN No can only contain letters, numbers, and dashes");
      setLoading(false);
      return;
    }
    if (!formData.warehouse_id) {
      alert("❌ Please select a warehouse");
      setLoading(false);
      return;
    }

    // Filter out empty rows
    const validItems = items.filter(
      (i) =>
        i.item_id &&
        parseInt(i.item_id) > 0 &&
        i.qty_received &&
        parseInt(i.qty_received) > 0,
    );
    if (validItems.length === 0) {
      alert("❌ Add at least one valid item");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        grn_no: formData.grn_no.trim().toUpperCase() || `GRN${Date.now()}`,
        warehouse_id: parseInt(formData.warehouse_id, 10),
        received_date: formData.received_date,
        items: validItems.map((i) => {
          const selItem = allItems.find((it) => it.id == i.item_id);
          let expiryDate = null;
          if (selItem?.expiry_days > 0) {
            const d = new Date(formData.received_date);
            d.setDate(d.getDate() + selItem.expiry_days);
            expiryDate = d.toISOString().split("T")[0]; // yyyy-mm-dd
          }
          return {
            item_id: parseInt(i.item_id),
            qty_received: parseInt(i.qty_received),
            expiry_date: expiryDate,
          };
        }),
      };

      console.log("📤 Sending GRN:", payload);
      await axiosClient.post("/grn", payload);
      alert(`✅ GRN ${payload.grn_no} created!`);
      await loadGrns();

      // Reset form
      setFormData({
        grn_no: "",
        warehouse_id: formData.warehouse_id,
        received_date: new Date().toISOString().split("T")[0],
      });
      setItems([{ item_id: "", qty_received: "" }]);
    } catch (error) {
      console.error(
        "❌ Create GRN error:",
        error.response?.data || error.message,
      );
      alert(`❌ Failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePutAway = async (grnId) => {
    if (!window.confirm("Move this GRN to inventory?")) return;
    try {
      await axiosClient.put(`/grn/${grnId}/putaway`);
      alert("✅ GRN put-away completed!");
      await loadGrns();
    } catch (error) {
      console.error("Put-away error:", error.response?.data || error.message);
      alert(
        `❌ Put-away failed: ${error.response?.data?.error || error.message}`,
      );
    }
  };

  const grnColumns = [
    { key: "grn_no", label: "GRN No" },
    {
      key: "received_date",
      label: "Date",
      render: (row) => new Date(row.received_date).toLocaleDateString("en-IN"),
    },
    { key: "total_items", label: "Items" },
    {
      key: "warehouse_id",
      label: "Warehouse",
      render: (row) => {
        const warehouse = warehouses.find((w) => w.id === row.warehouse_id);
        return warehouse ? warehouse.name : `WH ${row.warehouse_id}`;
      },
    },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        row.status === "pending" ? (
          <button
            className="btn btn-success"
            onClick={() => handlePutAway(row.id)}
          >
            📦 Put Away
          </button>
        ) : (
          <span style={{ color: "#27ae60", fontWeight: "bold" }}>
            ✅ Completed
          </span>
        ),
    },
  ];

  const totalPendingItems = grns.reduce(
    (sum, grn) => sum + (Number(grn.total_items) || 0),
    0,
  );

  return (
    <div>
      <div className="page-header">
        <h1>📥 Goods Receipt Note (GRN)</h1>
        <span
          style={{ color: "#27ae60", fontSize: "1.2em", fontWeight: "bold" }}
        >
          📦 Pending: {totalPendingItems} items
        </span>
      </div>

      <div className="metrics-grid">
        <div className="card">
          <h3>Total Warehouses</h3>
          <p className="metric-value">{warehouses.length}</p>
        </div>
        <div className="card">
          <h3>Pending GRNs</h3>
          <p className="metric-value">{grns.length}</p>
        </div>
        <div className="card">
          <h3>Pending Items</h3>
          <p className="metric-value">{totalPendingItems}</p>
        </div>
      </div>

      <div className="card">
        <h3>➕ Create New GRN</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              GRN No{" "}
              <small style={{ color: "#7f8c8d" }}>
                (auto-generated if blank)
              </small>
            </label>
            <input
              value={formData.grn_no}
              onChange={(e) =>
                setFormData({ ...formData, grn_no: e.target.value })
              }
              placeholder="GRN-001 or leave blank"
              pattern="[A-Za-z0-9\-]*"
              title="Only letters, numbers, and dashes allowed"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label>Warehouse *</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Received Date *</label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) =>
                  setFormData({ ...formData, received_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* ✅ Dynamic item rows (with unit & expiry) */}
          <div
            className="card"
            style={{ marginTop: "1rem", background: "#f8f9fa" }}
          >
            <h4>📋 Items Received</h4>
            {items.map((item, index) => {
              // get full item details from the loaded list
              const selectedItem = allItems.find((it) => it.id == item.item_id);
              const unit = selectedItem?.unit || "";
              const expiryDays = selectedItem?.expiry_days || 0;
              const receivedDate = formData.received_date;

              // calculate expiry date
              let expiryDisplay = null;
              if (expiryDays > 0 && receivedDate) {
                const expDate = new Date(receivedDate);
                expDate.setDate(expDate.getDate() + expiryDays);
                expiryDisplay = expDate.toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              }

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <div className="form-group" style={{ flex: 3 }}>
                    <label>Item *</label>
                    <select
                      value={item.item_id}
                      onChange={(e) =>
                        updateItem(index, "item_id", e.target.value)
                      }
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {allItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name || it.sku || `Item #${it.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Qty *</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        value={item.qty_received}
                        onChange={(e) =>
                          updateItem(index, "qty_received", e.target.value)
                        }
                        placeholder="Qty"
                        required
                        style={{ flex: 1 }}
                      />
                      {unit && (
                        <span
                          style={{
                            color: "#7f8c8d",
                            fontWeight: "bold",
                            minWidth: "40px",
                          }}
                        >
                          {unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Show expiry date if the item has a shelf life */}
                  {expiryDays > 0 && (
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Expiry</label>
                      <div
                        style={{
                          padding: "0.5rem",
                          background: "#fff3cd",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          color: "#856404",
                        }}
                      >
                        {expiryDisplay}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ alignSelf: "flex-end", marginBottom: "0.5rem" }}
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    ❌
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addItem}
              style={{ marginTop: "0.5rem" }}
            >
              + Add Item
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", marginTop: "1.5rem" }}
          >
            {loading ? "⏳ Creating GRN..." : "➕ Create GRN"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>📋 Pending GRNs ({grns.length})</h3>
        {grns.length > 0 ? (
          <Table columns={grnColumns} data={grns} />
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#7f8c8d",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              }}
            >
              No Pending GRNs
            </div>
            <small>Create a new GRN using the form above 👆</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrnPage;
