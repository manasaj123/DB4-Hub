import React, { useEffect, useState } from "react";
import giApi from "../api/giApi";
import poApi from "../api/poApi";

const titleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "12px",
  color: "#111827",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  padding: "16px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  marginBottom: "16px",
};

const formRowStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "8px",
  flexWrap: "wrap",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "12px",
  color: "#4b5563",
  flex: 1,
  minWidth: "160px",
};

const inputStyle = {
  padding: "6px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
};

const inputErrorStyle = {
  padding: "6px 8px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "2px solid #dc2626",
  backgroundColor: "#fef2f2",
};

const errorTextStyle = {
  color: "#dc2626",
  fontSize: "11px",
  marginTop: "4px",
};

const buttonStyle = {
  marginTop: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6b7280",
  marginLeft: "8px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  marginTop: "12px",
};

const thStyle = {
  backgroundColor: "#e5e7eb",
  padding: "6px",
  textAlign: "left",
  borderBottom: "1px solid #d1d5db",
};

const tdStyle = {
  padding: "6px",
  borderBottom: "1px solid #f3f4f6",
};

const smallBtn = {
  padding: "4px 8px",
  fontSize: "12px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  marginRight: "4px",
};

// Modal styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "600px",
  maxHeight: "80vh",
  overflowY: "auto",
};

const modalCloseBtnStyle = {
  marginTop: "15px",
  padding: "8px 12px",
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const stockTypeOptions = [
  { value: "UNRESTRICTED", label: "Unrestricted" },
  { value: "QUALITY", label: "Quality" },
  { value: "BLOCKED", label: "Blocked" },
];

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Convert date to local YYYY-MM-DD without timezone offset
const toLocalDateString = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format number to 2 decimal places
const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return "0";
  return num.toString();
};

export default function GoodsissuePage() {
  const [poList, setPoList] = useState([]);
  const [gis, setGIs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPoId, setSelectedPoId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewGI, setViewGI] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [batchesByItem, setBatchesByItem] = useState({});

  const [header, setHeader] = useState({
    gi_no: "",
    doc_date: "",
    posting_date: "",
    po_id: "",
    plant: "",
    status: "POSTED",
    location_id: 1,
  });

  const [items, setItems] = useState([]);

  const toInputDate = (value) => {
    if (!value) return "";
    return String(value).split("T")[0];
  };

  const loadPOs = async () => {
    const res = await giApi.getPOsForIssue();
    setPoList(res.data);
  };

  const loadGIs = async () => {
    const res = await giApi.getAll();
    setGIs(res.data);
  };

  useEffect(() => {
    loadPOs();
    loadGIs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setHeader({
      gi_no: "",
      doc_date: "",
      posting_date: "",
      po_id: "",
      plant: "",
      status: "POSTED",
      location_id: 1,
    });
    setItems([]);
    setSelectedPoId("");
  };

  // Validation functions
  const validateNoSpecialChars = (value, fieldName) => {
    if (!value) return "";
    const regex = /^[A-Za-z0-9\s]+$/;
    if (!regex.test(value)) {
      return `${fieldName} should only contain letters, numbers and spaces (no special characters)`;
    }
    return "";
  };

  const validateNotPastDate = (date, fieldName) => {
    if (!date) return "";
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return `${fieldName} cannot be a past date`;
    }
    return "";
  };

  const validatePostingDate = (postingDate, docDate) => {
    if (!postingDate || !docDate) return "";
    if (postingDate < docDate) {
      return "Posting Date cannot be before Document Date";
    }
    return "";
  };

  const validateQuantity = (qty) => {
    if (!qty && qty !== 0) return "";
    const num = Number(qty);
    if (isNaN(num)) return "Quantity must be a number";
    if (num <= 0) return "Quantity must be greater than 0";
    return "";
  };

  const handleSelectPO = async (poId) => {
    setSelectedPoId(poId);
    setErrors({});
    if (!poId) {
      setItems([]);
      setHeader((h) => ({ ...h, po_id: "", plant: "" }));
      setBatchesByItem({});
      return;
    }
    const res = await poApi.getById(poId);
    const poHeader = res.data.header;
    const poItems = res.data.items || [];

    setHeader((h) => ({
      ...h,
      po_id: poId,
      plant: poHeader.plant || h.plant,
    }));

    const newItems = poItems.map((it) => ({
      po_item_id: it.id,
      material_id: it.material_id,
      material_desc: it.material_name || it.description || "",
      qty: formatNumber(it.qty),
      storage_location: poHeader.storage_location || "",
      stock_type: "UNRESTRICTED",
      unit_cost: it.price || 0,
      batch_id: null,
    }));

    const newBatchesByItem = {};
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      const batchesRes = await giApi.getAvailableBatches(
        item.material_id,
        header.location_id || 1,
      );
      const batches = batchesRes.data || [];
      const selectedBatchId = batches.length > 0 ? batches[0].batch_id : null;

      newItems[i].batch_id = selectedBatchId;
      newBatchesByItem[i] = {
        batches,
        selectedBatchId,
      };
    }

    setItems(newItems);
    setBatchesByItem(newBatchesByItem);
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "plant") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }

    setHeader((h) => ({ ...h, [name]: processedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemChange = (index, field, value) => {
    let processedValue = value;

    if (field === "qty") {
      if (value < 0) processedValue = "";
    }

    if (field === "storage_location") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }

    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: processedValue } : it,
      ),
    );

    if (errors[`item_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!header.doc_date) {
      newErrors.doc_date = "Document Date is required";
    } else {
      const pastDateError = validateNotPastDate(
        header.doc_date,
        "Document Date",
      );
      if (pastDateError) newErrors.doc_date = pastDateError;
    }

    if (!header.posting_date) {
      newErrors.posting_date = "Posting Date is required";
    } else {
      const pastDateError = validateNotPastDate(
        header.posting_date,
        "Posting Date",
      );
      if (pastDateError) newErrors.posting_date = pastDateError;

      const postingDateError = validatePostingDate(
        header.posting_date,
        header.doc_date,
      );
      if (postingDateError) newErrors.posting_date = postingDateError;
    }

    if (!selectedPoId) {
      newErrors.po_id = "PO is required";
    }

    if (header.plant) {
      const specialCharError = validateNoSpecialChars(header.plant, "Plant");
      if (specialCharError) newErrors.plant = specialCharError;
    }

    let hasValidItem = false;
    items.forEach((item, idx) => {
      if (item.material_id && item.qty) {
        hasValidItem = true;

        const qtyError = validateQuantity(item.qty);
        if (qtyError) newErrors[`item_${idx}_qty`] = qtyError;

        if (item.storage_location) {
          const specialCharError = validateNoSpecialChars(
            item.storage_location,
            "Storage Location",
          );
          if (specialCharError)
            newErrors[`item_${idx}_storage_location`] = specialCharError;
        }

        if (!item.batch_id) {
          newErrors[`item_${idx}_batch`] = "Please select a batch";
        }
      }
    });

    if (!hasValidItem) {
      newErrors.general =
        "At least one item with material and quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the validation errors before submitting");
      return;
    }

    const payload = {
      header: {
        ...header,
        doc_date: header.doc_date,
        posting_date: header.posting_date,
      },
      items: items.map((it) => ({
        ...it,
        qty: Number(it.qty),
        unit_cost: Number(it.unit_cost || 0),
      })),
    };

    try {
      if (editingId) {
        await giApi.update(editingId, payload);
        alert("Goods Issue updated");
      } else {
        const res = await giApi.create(payload);
        alert(`Goods Issue saved : ${res.data.gi_no}`);
      }
      resetForm();
      loadGIs();
    } catch (err) {
      console.error(err);
      alert("Error saving Goods Issue");
    }
  };

  const handleEdit = async (gi) => {
    setEditingId(gi.id);
    setErrors({});
    const res = await giApi.getById(gi.id);
    const { header: h, items: its } = res.data;

    setHeader({
      gi_no: h.gi_no,
      doc_date: toLocalDateString(h.doc_date),
      posting_date: toLocalDateString(h.posting_date),
      po_id: h.po_id,
      plant: h.plant || "",
      status: h.status || "POSTED",
      location_id: 1,
    });
    setSelectedPoId(String(h.po_id || ""));

    setItems(
      (its || []).map((it) => ({
        po_item_id: it.po_item_id,
        material_id: it.material_id,
        material_desc: it.material_desc,
        qty: formatNumber(it.qty),
        storage_location: it.storage_location || "",
        stock_type: it.stock_type || "UNRESTRICTED",
        unit_cost: it.unit_cost || 0,
        batch_id: it.batch_id || null,
      })),
    );
  };

  const handleView = async (gi) => {
    try {
      const res = await giApi.getById(gi.id);
      setViewGI(res.data);
      setShowViewModal(true);
    } catch (err) {
      console.error("Failed to load GI details", err);
      alert("Could not load GI details");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewGI(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Goods Issue?")) return;
    await giApi.deleteById(id);
    if (editingId === id) resetForm();
    loadGIs();
  };

  const filteredGIs = gis.filter((g) => {
    const term = search.toLowerCase();
    return (
      g.gi_no?.toLowerCase().includes(term) ||
      g.po_no?.toLowerCase().includes(term) ||
      g.plant?.toLowerCase().includes(term)
    );
  });

  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? inputErrorStyle : inputStyle;
  };

  return (
    <>
      <div>
        <div style={titleStyle}>Goods Issue</div>

        <div style={cardStyle}>
          <form onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={labelStyle}>
                GI No
                <input
                  style={inputStyle}
                  value={
                    editingId ? header.gi_no : header.gi_no || "Auto Generated"
                  }
                  disabled
                />
              </label>
              <label style={labelStyle}>
                Document Date *
                <input
                  style={getInputStyle("doc_date")}
                  type="date"
                  name="doc_date"
                  value={header.doc_date}
                  onChange={handleHeaderChange}
                  max={getTodayDate()}
                  required
                />
                {errors.doc_date && (
                  <div style={errorTextStyle}>{errors.doc_date}</div>
                )}
              </label>
              <label style={labelStyle}>
                Posting Date *
                <input
                  style={getInputStyle("posting_date")}
                  type="date"
                  name="posting_date"
                  value={header.posting_date}
                  onChange={handleHeaderChange}
                  max={getTodayDate()}
                  required
                />
                {errors.posting_date && (
                  <div style={errorTextStyle}>{errors.posting_date}</div>
                )}
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={labelStyle}>
                PO *
                <select
                  style={getInputStyle("po_id")}
                  value={selectedPoId}
                  onChange={(e) => handleSelectPO(e.target.value)}
                  required
                >
                  <option value="">Select PO</option>
                  {poList.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_no} - {po.vendor_name} (Remaining:{" "}
                      {po.total_ordered - po.total_issued})
                    </option>
                  ))}
                </select>
                {errors.po_id && <div style={errorTextStyle}>{errors.po_id}</div>}
              </label>
              <label style={labelStyle}>
                Plant
                <input
                  style={getInputStyle("plant")}
                  name="plant"
                  value={header.plant}
                  onChange={handleHeaderChange}
                  placeholder="Letters, numbers and spaces only"
                />
                {errors.plant && <div style={errorTextStyle}>{errors.plant}</div>}
              </label>
              <label style={labelStyle}>
                Status
                <select
                  style={inputStyle}
                  name="status"
                  value={header.status}
                  onChange={handleHeaderChange}
                >
                  <option value="POSTED">POSTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </label>
            </div>

            {items.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    margin: "8px 0",
                  }}
                >
                  GI Lines *
                </div>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "16px",
                      padding: "8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={formRowStyle}>
                      <label style={labelStyle}>
                        Material
                        <input
                          style={inputStyle}
                          value={it.material_id}
                          disabled
                        />
                      </label>
                      <label style={labelStyle}>
                        Description
                        <input
                          style={inputStyle}
                          value={it.material_desc}
                          disabled
                        />
                      </label>
                      <label style={labelStyle}>
                        Qty *
                        <input
                          style={getInputStyle(`item_${idx}_qty`)}
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={it.qty}
                          onChange={(e) =>
                            handleItemChange(idx, "qty", e.target.value)
                          }
                          placeholder="> 0"
                        />
                        {errors[`item_${idx}_qty`] && (
                          <div style={errorTextStyle}>
                            {errors[`item_${idx}_qty`]}
                          </div>
                        )}
                      </label>
                      <label style={labelStyle}>
                        Batch
                        <select
                          value={batchesByItem[idx]?.selectedBatchId || ""}
                          onChange={(e) => {
                            const batchId = e.target.value;
                            const newBatches = { ...batchesByItem };
                            newBatches[idx] = {
                              ...newBatches[idx],
                              selectedBatchId: batchId,
                            };
                            setBatchesByItem(newBatches);
                            const newItems = [...items];
                            newItems[idx].batch_id = batchId || null;
                            setItems(newItems);
                          }}
                          style={inputStyle}
                        >
                          <option value="">-- Select Batch --</option>
                          {(batchesByItem[idx]?.batches || []).map((batch) => (
                            <option key={batch.batch_id} value={batch.batch_id}>
                              {batch.batch_no} (Exp:{" "}
                              {batch.expiry_date?.substring(0, 10)} | Avail:{" "}
                              {batch.qty})
                            </option>
                          ))}
                        </select>
                        {errors[`item_${idx}_batch`] && (
                          <div style={errorTextStyle}>
                            {errors[`item_${idx}_batch`]}
                          </div>
                        )}
                      </label>
                    </div>

                    <div style={formRowStyle}>
                      <label style={labelStyle}>
                        Storage Location
                        <input
                          style={getInputStyle(`item_${idx}_storage_location`)}
                          value={it.storage_location}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "storage_location",
                              e.target.value,
                            )
                          }
                          placeholder="Letters, numbers and spaces only"
                        />
                        {errors[`item_${idx}_storage_location`] && (
                          <div style={errorTextStyle}>
                            {errors[`item_${idx}_storage_location`]}
                          </div>
                        )}
                      </label>
                      <label style={labelStyle}>
                        Stock Type
                        <select
                          style={inputStyle}
                          value={it.stock_type}
                          onChange={(e) =>
                            handleItemChange(idx, "stock_type", e.target.value)
                          }
                        >
                          {stockTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </>
            )}

            {errors.general && (
              <div style={{ ...errorTextStyle, marginBottom: "8px" }}>
                {errors.general}
              </div>
            )}

            <div>
              <button type="submit" style={buttonStyle} disabled={!items.length}>
                {editingId ? "Update GI" : "Save GI"}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={resetForm}
              >
                New / Clear
              </button>
              {editingId && (
                <button
                  type="button"
                  style={{ ...secondaryButtonStyle, backgroundColor: "#dc2626" }}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
            Existing Goods Issues
          </div>

          <input
            style={{
              ...inputStyle,
              marginBottom: "8px",
              maxWidth: "260px",
            }}
            placeholder="Search by GI No, PO No"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>GI No</th>
                <th style={thStyle}>Doc Date</th>
                <th style={thStyle}>Posting Date</th>
                <th style={thStyle}>PO</th>
                <th style={thStyle}>Plant</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGIs.map((g) => (
                <tr key={g.id}>
                  <td style={tdStyle}>{g.gi_no}</td>
                  <td style={tdStyle}>{toLocalDateString(g.doc_date)}</td>
                  <td style={tdStyle}>{toLocalDateString(g.posting_date)}</td>
                  <td style={tdStyle}>{g.po_no}</td>
                  <td style={tdStyle}>{g.plant || "-"}</td>
                  <td style={tdStyle}>{g.status}</td>
                  <td style={tdStyle}>
                    <button
                      style={{
                        ...smallBtn,
                        backgroundColor: "#2563eb",
                        color: "#fff",
                      }}
                      onClick={() => handleEdit(g)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        ...smallBtn,
                        backgroundColor: "#10b981",
                        color: "#fff",
                      }}
                      onClick={() => handleView(g)}
                    >
                      View
                    </button>
                    <button
                      style={{
                        ...smallBtn,
                        backgroundColor: "#dc2626",
                        color: "#fff",
                      }}
                      onClick={() => handleDelete(g.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGIs.length === 0 && (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    No Goods Issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && viewGI && (
        <div style={modalOverlayStyle} onClick={closeViewModal}>
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Goods Issue Details : {viewGI.header?.gi_no}</h3>
            
            <div style={{ marginBottom: "15px" }}>
              <p><strong>GI No:</strong> {viewGI.header?.gi_no}</p>
              <p><strong>Document Date:</strong> {toLocalDateString(viewGI.header?.doc_date)}</p>
              <p><strong>Posting Date:</strong> {toLocalDateString(viewGI.header?.posting_date)}</p>
              <p><strong>PO:</strong> {viewGI.header?.po_id}</p>
              <p><strong>Plant:</strong> {viewGI.header?.plant || "-"}</p>
              <p><strong>Status:</strong> {viewGI.header?.status}</p>
            </div>

            <h4>Items</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Material ID</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Storage Location</th>
                  <th style={thStyle}>Stock Type</th>
                  <th style={thStyle}>Batch ID</th>
                </tr>
              </thead>
              <tbody>
                {(viewGI.items || []).map((item, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{item.material_id}</td>
                    <td style={tdStyle}>{item.material_desc || "-"}</td>
                    <td style={tdStyle}>{item.qty}</td>
                    <td style={tdStyle}>{item.storage_location || "-"}</td>
                    <td style={tdStyle}>{item.stock_type || "-"}</td>
                    <td style={tdStyle}>{item.batch_id || "-"}</td>
                  </tr>
                ))}
                {(viewGI.items?.length === 0) && (
                  <tr>
                    <td style={tdStyle} colSpan={6}>No items found</td>
                  </tr>
                )}
              </tbody>
            </table>

            <button style={modalCloseBtnStyle} onClick={closeViewModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}