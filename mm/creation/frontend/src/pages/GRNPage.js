import React, { useEffect, useState } from "react";
import grnApi from "../api/grnApi";
import poApi from "../api/poApi";
import vendorApi from "../api/vendorApi";

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
  border: "1px solid #d1d5db",
  textAlign: "left",
};

const tdStyle = {
  padding: "6px",
  border: "1px solid #e5e7eb",
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
  width: "700px",
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

export default function GRNPage() {
  const [poList, setPoList] = useState([]);
  const [grns, setGrns] = useState([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewGRN, setViewGRN] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [header, setHeader] = useState({
    grn_no: "",
    grn_date: "",
    vendor_id: "",
    po_id: "",
    location_id: 1,
    status: "POSTED",
  });

  const [items, setItems] = useState([]);

  const toInputDate = (value) => {
    if (!value) return "";
    return String(value).split("T")[0];
  };

  const loadPOs = async () => {
    try {
      const res = await poApi.getAll();
      setPoList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await vendorApi.getAll();
      setVendors(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGRNs = async () => {
    try {
      const res = await grnApi.getAll();
      setGrns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPOs();
    loadVendors();
    loadGRNs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setHeader({
      grn_no: "",
      grn_date: "",
      vendor_id: "",
      po_id: "",
      location_id: 1,
      status: "POSTED",
    });
    setItems([]);
    setSelectedPoId("");
  };

  // Validation functions
  const validateNoSpecialChars = (value, fieldName) => {
    if (!value) return "";
    const regex = /^[A-Za-z0-9\s-]+$/;
    if (!regex.test(value)) {
      return `${fieldName} should only contain letters, numbers, spaces and hyphens`;
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

  const validateExpiryDate = (expiryDate, mfgDate, fieldName) => {
    if (!expiryDate) return "";
    if (mfgDate && expiryDate < mfgDate) {
      return "Expiry Date cannot be before Manufacturing Date";
    }
    return "";
  };

  const validateQuantity = (qty, fieldName) => {
    if (!qty && qty !== 0) return "";
    const num = Number(qty);
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (num < 0) return `${fieldName} cannot be negative`;
    return "";
  };

  const handleSelectPO = async (poId) => {
    setSelectedPoId(poId);
    setErrors({});
    if (!poId) {
      setItems([]);
      setHeader((h) => ({ ...h, po_id: "", vendor_id: "" }));
      return;
    }
    const res = await poApi.getById(poId);
    const poHeader = res.data.header;
    const poItems = res.data.items || [];

    setHeader((h) => ({
      ...h,
      po_id: poId,
      vendor_id: poHeader.vendor_id,
    }));

    setItems(
      poItems.map((it) => ({
        po_item_id: it.id,
        material_id: it.material_id,
        received_qty: it.qty,
        accepted_qty: it.qty,
        rejected_qty: 0,
        batch_no: "",
        mfg_date: "",
        expiry_date: "",
        unit_cost: it.price,
      })),
    );
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader((h) => ({ ...h, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemChange = (index, field, value) => {
    let processedValue = value;

    if (field === "batch_no") {
      processedValue = value.replace(/[^A-Za-z0-9\s-]/g, "");
    }

    // Auto-calculate rejected quantity when accepted changes
    if (field === "accepted_qty") {
      const received = Number(items[index]?.received_qty) || 0;
      const accepted = Number(value) || 0;
      const rejected = received - accepted;

      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? {
                ...it,
                accepted_qty: processedValue,
                rejected_qty: rejected >= 0 ? rejected : 0,
              }
            : it,
        ),
      );

      // Clear related errors
      if (errors[`item_${index}_accepted_qty`]) {
        setErrors((prev) => ({ ...prev, [`item_${index}_accepted_qty`]: "" }));
      }
      if (errors[`item_${index}_rejected_qty`]) {
        setErrors((prev) => ({ ...prev, [`item_${index}_rejected_qty`]: "" }));
      }
      return;
    }

    // Auto-calculate accepted quantity when rejected changes
    if (field === "rejected_qty") {
      const received = Number(items[index]?.received_qty) || 0;
      const rejected = Number(value) || 0;
      const accepted = received - rejected;

      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? {
                ...it,
                rejected_qty: processedValue,
                accepted_qty: accepted >= 0 ? accepted : 0,
              }
            : it,
        ),
      );

      // Clear related errors
      if (errors[`item_${index}_accepted_qty`]) {
        setErrors((prev) => ({ ...prev, [`item_${index}_accepted_qty`]: "" }));
      }
      if (errors[`item_${index}_rejected_qty`]) {
        setErrors((prev) => ({ ...prev, [`item_${index}_rejected_qty`]: "" }));
      }
      return;
    }

    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: processedValue } : it,
      ),
    );

    // Clear error for this item field
    if (errors[`item_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate GRN Date
    if (!header.grn_date) {
      newErrors.grn_date = "GRN Date is required";
    } else {
      const pastDateError = validateNotPastDate(header.grn_date, "GRN Date");
      if (pastDateError) newErrors.grn_date = pastDateError;
    }

    // Validate items
    items.forEach((item, idx) => {
      // Validate received quantity
      const receivedQtyError = validateQuantity(
        item.received_qty,
        "Received Qty",
      );
      if (receivedQtyError)
        newErrors[`item_${idx}_received_qty`] = receivedQtyError;

      // Validate accepted quantity
      const acceptedQtyError = validateQuantity(
        item.accepted_qty,
        "Accepted Qty",
      );
      if (acceptedQtyError)
        newErrors[`item_${idx}_accepted_qty`] = acceptedQtyError;

      // Validate rejected quantity
      const rejectedQtyError = validateQuantity(
        item.rejected_qty,
        "Rejected Qty",
      );
      if (rejectedQtyError)
        newErrors[`item_${idx}_rejected_qty`] = rejectedQtyError;

      // Validate that accepted + rejected = received (with tolerance)
      const received = Number(item.received_qty) || 0;
      const accepted = Number(item.accepted_qty) || 0;
      const rejected = Number(item.rejected_qty) || 0;

      if (Math.abs(accepted + rejected - received) > 0.01) {
        newErrors[`item_${idx}_qty_sum`] =
          `Accepted (${accepted}) + Rejected (${rejected}) must equal Received (${received})`;
      }

      // Validate batch number (no special characters)
      if (item.batch_no) {
        const batchError = validateNoSpecialChars(item.batch_no, "Batch No");
        if (batchError) newErrors[`item_${idx}_batch_no`] = batchError;
      }

      // Validate manufacturing date not past
      if (item.mfg_date) {
        const pastDateError = validateNotPastDate(
          item.mfg_date,
          "Manufacturing Date",
        );
        if (pastDateError) newErrors[`item_${idx}_mfg_date`] = pastDateError;
      }

      // Validate expiry date not past and not before mfg date
      if (item.expiry_date) {
        const pastDateError = validateNotPastDate(
          item.expiry_date,
          "Expiry Date",
        );
        if (pastDateError) {
          newErrors[`item_${idx}_expiry_date`] = pastDateError;
        } else {
          const expiryError = validateExpiryDate(
            item.expiry_date,
            item.mfg_date,
            "Expiry Date",
          );
          if (expiryError) newErrors[`item_${idx}_expiry_date`] = expiryError;
        }
      }

      // Validate unit cost
      if (item.unit_cost && Number(item.unit_cost) < 0) {
        newErrors[`item_${idx}_unit_cost`] = "Unit Cost cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the validation errors before submitting");
      return;
    }

    try {
      const payload = {
        header: {
          ...header,
          grn_date: header.grn_date,
        },
        items: items.map((it) => ({
          ...it,
          received_qty: Number(it.received_qty),
          accepted_qty: Number(it.accepted_qty),
          rejected_qty: Number(it.rejected_qty),
          unit_cost: Number(it.unit_cost),
        })),
      };

      if (editingId) {
        await grnApi.update(editingId, payload);
        alert("GRN updated");
      } else {
        const res = await grnApi.create(payload);
        alert(`GRN saved : ${res.data.grn_no}`);
      }

      resetForm();
      loadGRNs();
    } catch (e) {
      console.error(e);
      alert("Error saving GRN");
    }
  };

  const handleEdit = async (grn) => {
    setEditingId(grn.id);
    setErrors({});
    const res = await grnApi.getById(grn.id);
    const { header: h, items: its } = res.data;

    setHeader({
      grn_no: h.grn_no,
      grn_date: toLocalDateString(h.grn_date),
      vendor_id: h.vendor_id,
      po_id: h.po_id,
      location_id: h.location_id,
      status: h.status || "POSTED",
    });
    setSelectedPoId(String(h.po_id || ""));
    setItems(
      (its || []).map((it) => ({
        po_item_id: it.po_item_id,
        material_id: it.material_id,
        received_qty: String(it.received_qty),
        accepted_qty: String(it.accepted_qty),
        rejected_qty: String(it.rejected_qty),
        batch_no: it.batch_no || "",
        mfg_date: toLocalDateString(it.mfg_date),
        expiry_date: toLocalDateString(it.expiry_date),
        unit_cost: String(it.unit_cost || 0),
      })),
    );
  };

  const handleView = async (grn) => {
    try {
      const res = await grnApi.getById(grn.id);
      setViewGRN(res.data);
      setShowViewModal(true);
    } catch (err) {
      console.error("Failed to load GRN details", err);
      alert("Could not load GRN details");
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewGRN(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this GRN?")) return;
    await grnApi.deleteById(id);
    if (editingId === id) resetForm();
    loadGRNs();
  };

  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? inputErrorStyle : inputStyle;
  };

  return (
    <>
      <div>
        <div style={titleStyle}>Goods Receipt (GRN)</div>

        <div style={cardStyle}>
          <form onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={labelStyle}>
                GRN No
                <input
                  style={inputStyle}
                  value={
                    editingId ? header.grn_no : header.grn_no || "Auto Generated"
                  }
                  disabled
                />
              </label>
              <label style={labelStyle}>
                GRN Date *
                <input
                  style={getInputStyle("grn_date")}
                  type="date"
                  name="grn_date"
                  value={header.grn_date}
                  onChange={handleHeaderChange}
                  max={getTodayDate()}
                  required
                />
                {errors.grn_date && (
                  <div style={errorTextStyle}>{errors.grn_date}</div>
                )}
              </label>
              <label style={labelStyle}>
                Location Id
                <input
                  style={inputStyle}
                  type="number"
                  name="location_id"
                  value={header.location_id}
                  onChange={handleHeaderChange}
                  min="1"
                />
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={labelStyle}>
                PO *
                <select
                  style={inputStyle}
                  value={selectedPoId}
                  onChange={(e) => handleSelectPO(e.target.value)}
                  required
                >
                  <option value="">Select PO</option>
                  {poList
                    .filter((po) => po.status !== "COMPLETED")
                    .map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_no} - {po.vendor_name}
                      </option>
                    ))}
                </select>
              </label>
              <label style={labelStyle}>
                Vendor
                <select
                  style={inputStyle}
                  name="vendor_id"
                  value={header.vendor_id}
                  onChange={handleHeaderChange}
                  disabled
                >
                  <option value="">Select</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
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
                  GRN Lines *
                </div>
                {items.map((it, idx) => {
                  const received = Number(it.received_qty) || 0;
                  const accepted = Number(it.accepted_qty) || 0;
                  const rejected = Number(it.rejected_qty) || 0;
                  const isValidSum =
                    Math.abs(accepted + rejected - received) <= 0.01;

                  return (
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
                          Material ID
                          <input
                            style={inputStyle}
                            value={it.material_id}
                            disabled
                          />
                        </label>
                        <label style={labelStyle}>
                          Received Qty *
                          <input
                            style={getInputStyle(`item_${idx}_received_qty`)}
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.received_qty}
                            disabled
                          />
                          {errors[`item_${idx}_received_qty`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_received_qty`]}
                            </div>
                          )}
                        </label>
                        <label style={labelStyle}>
                          Accepted Qty *
                          <input
                            style={getInputStyle(`item_${idx}_accepted_qty`)}
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.accepted_qty}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "accepted_qty",
                                e.target.value,
                              )
                            }
                          />
                          {errors[`item_${idx}_accepted_qty`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_accepted_qty`]}
                            </div>
                          )}
                        </label>
                        <label style={labelStyle}>
                          Rejected Qty
                          <input
                            style={getInputStyle(`item_${idx}_rejected_qty`)}
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.rejected_qty}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "rejected_qty",
                                e.target.value,
                              )
                            }
                          />
                          {errors[`item_${idx}_rejected_qty`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_rejected_qty`]}
                            </div>
                          )}
                        </label>
                      </div>

                      <div style={formRowStyle}>
                        <label style={labelStyle}>
                          Batch No
                          <input
                            style={getInputStyle(`item_${idx}_batch_no`)}
                            value={it.batch_no}
                            onChange={(e) =>
                              handleItemChange(idx, "batch_no", e.target.value)
                            }
                            placeholder="Letters, numbers, spaces and hyphens only"
                          />
                          {errors[`item_${idx}_batch_no`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_batch_no`]}
                            </div>
                          )}
                        </label>
                        <label style={labelStyle}>
                          Mfg Date
                          <input
                            style={getInputStyle(`item_${idx}_mfg_date`)}
                            type="date"
                            value={it.mfg_date}
                            onChange={(e) =>
                              handleItemChange(idx, "mfg_date", e.target.value)
                            }
                            max={getTodayDate()}
                          />
                          {errors[`item_${idx}_mfg_date`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_mfg_date`]}
                            </div>
                          )}
                        </label>
                        <label style={labelStyle}>
                          Expiry Date
                          <input
                            style={getInputStyle(`item_${idx}_expiry_date`)}
                            type="date"
                            value={it.expiry_date}
                            onChange={(e) =>
                              handleItemChange(idx, "expiry_date", e.target.value)
                            }
                            min={it.mfg_date || getTodayDate()}
                          />
                          {errors[`item_${idx}_expiry_date`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_expiry_date`]}
                            </div>
                          )}
                        </label>
                        <label style={labelStyle}>
                          Unit Cost
                          <input
                            style={getInputStyle(`item_${idx}_unit_cost`)}
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unit_cost}
                            onChange={(e) =>
                              handleItemChange(idx, "unit_cost", e.target.value)
                            }
                          />
                          {errors[`item_${idx}_unit_cost`] && (
                            <div style={errorTextStyle}>
                              {errors[`item_${idx}_unit_cost`]}
                            </div>
                          )}
                        </label>
                      </div>

                      {errors[`item_${idx}_qty_sum`] && (
                        <div
                          style={{
                            ...errorTextStyle,
                            marginLeft: "8px",
                            backgroundColor: "#fee2e2",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          ⚠️ {errors[`item_${idx}_qty_sum`]}
                        </div>
                      )}

                      {isValidSum && accepted === received && rejected === 0 && (
                        <div
                          style={{
                            marginLeft: "8px",
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#10b981",
                          }}
                        >
                          ✓ All quantities matched - Full receipt
                        </div>
                      )}

                      {isValidSum && accepted < received && accepted > 0 && (
                        <div
                          style={{
                            marginLeft: "8px",
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#f59e0b",
                          }}
                        >
                          ⚡ Partial receipt - {accepted} accepted, {rejected}{" "}
                          rejected
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            <div>
              <button type="submit" style={buttonStyle} disabled={!items.length}>
                {editingId ? "Update GRN" : "Save GRN"}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={resetForm}
              >
                Cancel / Clear
              </button>
            </div>
          </form>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
            Existing GRNs
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>GRN No</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>PO</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => (
                <tr key={g.id}>
                  <td style={tdStyle}>{g.grn_no}</td>
                  <td style={tdStyle}>{toLocalDateString(g.grn_date)}</td>
                  <td style={tdStyle}>{g.po_no}</td>
                  <td style={tdStyle}>{g.vendor_name}</td>
                  <td style={tdStyle}>{g.location_id}</td>
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
              {grns.length === 0 && (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    No GRNs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && viewGRN && (
        <div style={modalOverlayStyle} onClick={closeViewModal}>
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>GRN Details : {viewGRN.header?.grn_no}</h3>
            
            <div style={{ marginBottom: "15px" }}>
              <p><strong>GRN No:</strong> {viewGRN.header?.grn_no}</p>
              <p><strong>GRN Date:</strong> {toLocalDateString(viewGRN.header?.grn_date)}</p>
              <p><strong>PO:</strong> {viewGRN.header?.po_id}</p>
              <p><strong>Vendor:</strong> {viewGRN.header?.vendor_name}</p>
              <p><strong>Location:</strong> {viewGRN.header?.location_id}</p>
              <p><strong>Status:</strong> {viewGRN.header?.status}</p>
            </div>

            <h4>Items</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Material ID</th>
                  <th style={thStyle}>Received Qty</th>
                  <th style={thStyle}>Accepted Qty</th>
                  <th style={thStyle}>Rejected Qty</th>
                  <th style={thStyle}>Batch No</th>
                  <th style={thStyle}>Mfg Date</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {(viewGRN.items || []).map((item, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{item.material_id}</td>
                    <td style={tdStyle}>{item.received_qty}</td>
                    <td style={tdStyle}>{item.accepted_qty}</td>
                    <td style={tdStyle}>{item.rejected_qty}</td>
                    <td style={tdStyle}>{item.batch_no || "-"}</td>
                    <td style={tdStyle}>{item.mfg_date ? toLocalDateString(item.mfg_date) : "-"}</td>
                    <td style={tdStyle}>{item.expiry_date ? toLocalDateString(item.expiry_date) : "-"}</td>
                    <td style={tdStyle}>{item.unit_cost}</td>
                  </tr>
                ))}
                {(viewGRN.items?.length === 0) && (
                  <tr>
                    <td style={tdStyle} colSpan={8}>No items found</td>
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