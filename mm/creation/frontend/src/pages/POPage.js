import React, { useEffect, useState, useMemo } from "react";
import poApi from "../api/poApi";
import vendorApi from "../api/vendorApi";
import materialApi from "../api/materialApi";
import prApi from "../api/prApi";
import rfqApi from "../api/rfqApi";

// Helper to normalize date to yyyy-MM-dd for <input type="date"> - FIXED TIMEZONE
const formatDateYMD = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    // Fix timezone issue - use local date
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

// Format amount without decimal places or with 2 decimals
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "0";
  const num = Number(amount);
  if (isNaN(num)) return "0";
  // Remove extra decimals, show only up to 2 decimal places if needed
  return num.toFixed(2).replace(/\.00$/, "");
};

// Format amount with 2 decimal places
const formatAmountWithDecimals = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  const num = Number(amount);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

// Get today's date in YYYY-MM-DD format (local timezone)
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
  minWidth: "150px",
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

const cancelButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6b7280",
  marginLeft: "8px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  borderBottom: "2px solid #e5e7eb",
};

const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #f3f4f6",
};

const summaryLabelStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#374151",
  textAlign: "right",
  padding: "4px 8px",
};

const summaryValueStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#111827",
  padding: "4px 8px",
  textAlign: "right",
};

export default function POPage() {
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [prs, setPRs] = useState([]);
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [rfqs, setRFQs] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [selectedRfqVendorId, setSelectedRfqVendorId] = useState("");
  const [rfqVendorsList, setRfqVendorsList] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [viewPO, setViewPO] = useState(null);

  const [header, setHeader] = useState({
    po_no: "",
    po_date: "",
    vendor_id: "",
    payment_terms: "",
    currency: "INR",
    po_type: "STOCK",
    source_type: "DIRECT",
    freight_charges: "0",
  });

  const [items, setItems] = useState([
    { material_id: "", qty: "", price: "", tax_percent: "", delivery_date: "" },
  ]);

  const [selectedPrId, setSelectedPrId] = useState("");
  const [selectedPrDetails, setSelectedPrDetails] = useState(null);

  // Calculate totals using useMemo for performance
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach((item) => {
      if (item.material_id && item.qty && item.price) {
        const itemTotal = Number(item.qty) * Number(item.price);
        subtotal += itemTotal;

        if (item.tax_percent) {
          totalTax += itemTotal * (Number(item.tax_percent) / 100);
        }
      }
    });

    const freight = Number(header.freight_charges) || 0;
    const grandTotal = subtotal + totalTax + freight;

    return {
      subtotal,
      totalTax,
      freight,
      grandTotal,
    };
  }, [items, header.freight_charges]);

  const loadRFQs = async () => {
    try {
      const res = await rfqApi.getAll(); // assuming you have this
      setRFQs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add to useEffect
  useEffect(() => {
    loadRefs();
    loadPOs();
    loadRFQs(); // new
  }, []);

  const loadRefs = async () => {
    try {
      const [vRes, mRes, prRes] = await Promise.all([
        vendorApi.getAll(),
        materialApi.getAll(),
        prApi.getAll(),
      ]);
      setVendors(vRes.data);
      setMaterials(mRes.data);
      setPRs(prRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPOs = async () => {
    try {
      setLoading(true);
      const res = await poApi.getAll();
      setPOs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   loadRefs();
  //   loadPOs();
  // }, []);

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

    if (selectedDate < today) {
      return `${fieldName} cannot be a past date`;
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

  const validatePrice = (price) => {
    if (!price && price !== 0) return "";
    const num = Number(price);
    if (isNaN(num)) return "Price must be a number";
    if (num < 0) return "Price cannot be negative";
    return "";
  };

  const validateTax = (tax) => {
    if (!tax && tax !== 0) return "";
    const num = Number(tax);
    if (isNaN(num)) return "Tax must be a number";
    if (num < 0) return "Tax cannot be negative";
    if (num > 100) return "Tax cannot exceed 100%";
    return "";
  };

  const validateFreight = (freight) => {
    if (!freight && freight !== 0) return "";
    const num = Number(freight);
    if (isNaN(num)) return "Freight must be a number";
    if (num < 0) return "Freight cannot be negative";
    return "";
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Remove special characters from text fields
    if (name === "payment_terms") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }
    if (name === "currency") {
      processedValue = value.replace(/[^A-Za-z]/g, "").toUpperCase();
    }
    if (name === "freight_charges") {
      processedValue = value.replace(/[^0-9.]/g, "");
    }

    setHeader((h) => ({ ...h, [name]: processedValue }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "source_type" && value !== "PR") {
      setSelectedPrId("");
      setSelectedPrDetails(null);

      setSelectedRfqId("");
      setSelectedRfqVendorId("");
      setRfqVendorsList([]);

      setItems([
        {
          material_id: "",
          qty: "",
          price: "",
          tax_percent: "",
          delivery_date: "",
        },
      ]);
    }
  };

  const handleItemChange = (index, field, value) => {
    let processedValue = value;

    if (field === "qty" && value < 0) processedValue = "";
    if (field === "price" && value < 0) processedValue = "";
    if (field === "tax_percent" && value < 0) processedValue = "";

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

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        material_id: "",
        qty: "",
        price: "",
        tax_percent: "",
        delivery_date: "",
      },
    ]);
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedPrId("");
    setSelectedPrDetails(null);
    setSelectedRfqId("");
    setSelectedRfqVendorId("");
    setRfqVendorsList([]);
    setErrors({});
    setHeader({
      po_no: "",
      po_date: "",
      vendor_id: "",
      payment_terms: "",
      currency: "INR",
      po_type: "STOCK",
      source_type: "DIRECT",
      freight_charges: "0",
    });
    setItems([
      {
        material_id: "",
        qty: "",
        price: "",
        tax_percent: "",
        delivery_date: "",
      },
    ]);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate PO Date
    if (!header.po_date) {
      newErrors.po_date = "PO Date is required";
    } else {
      const pastDateError = validateNotPastDate(header.po_date, "PO Date");
      if (pastDateError) newErrors.po_date = pastDateError;
    }

    // Validate Vendor
    if (!header.vendor_id) {
      newErrors.vendor_id = "Vendor is required";
    }

    // Validate Payment Terms
    if (header.payment_terms) {
      const specialCharError = validateNoSpecialChars(
        header.payment_terms,
        "Payment Terms",
      );
      if (specialCharError) newErrors.payment_terms = specialCharError;
    }

    // Validate Currency
    if (!header.currency) {
      newErrors.currency = "Currency is required";
    } else if (header.currency.length !== 3) {
      newErrors.currency = "Currency must be 3 letters (e.g., INR, USD, EUR)";
    }

    // Validate freight charges
    const freightError = validateFreight(header.freight_charges);
    if (freightError) newErrors.freight_charges = freightError;

    // Validate items
    let hasValidItem = false;
    items.forEach((item, idx) => {
      if (item.material_id && item.qty && item.price) {
        hasValidItem = true;

        // Validate quantity
        const qtyError = validateQuantity(item.qty);
        if (qtyError) newErrors[`item_${idx}_qty`] = qtyError;

        // Validate price
        const priceError = validatePrice(item.price);
        if (priceError) newErrors[`item_${idx}_price`] = priceError;

        // Validate tax
        const taxError = validateTax(item.tax_percent);
        if (taxError) newErrors[`item_${idx}_tax`] = taxError;

        // Validate delivery date
        if (item.delivery_date) {
          const pastDateError = validateNotPastDate(
            item.delivery_date,
            "Delivery Date",
          );
          if (pastDateError)
            newErrors[`item_${idx}_delivery_date`] = pastDateError;
        }
      } else if (item.material_id || item.qty || item.price) {
        if (!item.material_id)
          newErrors[`item_${idx}_material`] = "Please select material";
        if (!item.qty) newErrors[`item_${idx}_qty`] = "Quantity is required";
        if (!item.price) newErrors[`item_${idx}_price`] = "Price is required";
      }
    });

    if (!hasValidItem) {
      newErrors.general =
        "At least one item with material, quantity and price is required";
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

    try {
      const payload = {
        header: {
          po_no: header.po_no,
          po_date: header.po_date,
          vendor_id: Number(header.vendor_id),
          payment_terms: header.payment_terms,
          currency: header.currency,
          po_type: header.po_type,
          source_type: header.source_type,
          source_id:
            header.source_type === "PR" && selectedPrId
              ? Number(selectedPrId)
              : header.source_type === "RFQ" && selectedRfqId
                ? Number(selectedRfqId)
                : null,
          freight_charges: Number(header.freight_charges) || 0,
        },
        items: items
          .filter((i) => i.material_id && i.qty && i.price)
          .map((i) => ({
            ...i,
            material_id: Number(i.material_id),
            qty: Number(i.qty),
            price: Number(i.price),
            tax_percent: Number(i.tax_percent) || 0,
            delivery_date: i.delivery_date || null,
          })),
      };

      if (editingId) {
        await poApi.update(editingId, payload);
        alert("PO Updated Successfully");
      } else {
        await poApi.create(payload);
        alert("PO Created Successfully");
      }

      resetForm();
      await loadPOs();
    } catch (e) {
      console.error(e);
      alert("Failed to save PO");
    }
  };

  const applyPRToPO = async (prId) => {
    if (!prId) {
      setSelectedPrDetails(null);
      return;
    }
    try {
      const res = await prApi.getById(prId);
      const { header: prHeader, items: prItems } = res.data;

      setSelectedPrDetails({ header: prHeader, items: prItems });

      setItems(
        (prItems || []).map((it) => ({
          material_id: it.material_id,
          qty: it.qty,
          price: "",
          tax_percent: "",
          delivery_date: it.required_date
            ? toLocalDateString(it.required_date)
            : "",
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const editPO = async (po) => {
    setEditingId(po.id);
    setSelectedPrId("");
    setSelectedPrDetails(null);
    setErrors({});

    try {
      const res = await poApi.getById(po.id);
      const { header: fullHeader, items: fullItems } = res.data;
      setHeader({
        po_no: fullHeader.po_no || "",
        po_date: fullHeader.po_date
          ? toLocalDateString(fullHeader.po_date)
          : "",
        vendor_id: fullHeader.vendor_id || "",
        payment_terms: fullHeader.payment_terms || "",
        currency: fullHeader.currency || "INR",
        po_type: fullHeader.po_type || "STOCK",
        source_type: fullHeader.source_type || "DIRECT",
        freight_charges: fullHeader.freight_charges || "0",
      });
      setItems(
        (fullItems || []).map((it) => ({
          material_id: it.material_id || "",
          qty: it.qty || "",
          price: it.price || "",
          tax_percent: it.tax_percent || "",
          delivery_date: it.delivery_date
            ? toLocalDateString(it.delivery_date)
            : "",
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deletePO = async (id) => {
    if (!window.confirm("Delete this PO?")) return;
    try {
      await poApi.deleteById(id);
      await loadPOs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? inputErrorStyle : inputStyle;
  };

  return (
    <div>
      <div style={titleStyle}>Purchase Orders</div>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={formRowStyle}>
            <label style={labelStyle}>
              PO No
              <input
                style={inputStyle}
                name="po_no"
                value={header.po_no}
                readOnly
                placeholder="Auto"
              />
            </label>
            <label style={labelStyle}>
              PO Date *
              <input
                style={getInputStyle("po_date")}
                type="date"
                name="po_date"
                value={header.po_date}
                onChange={handleHeaderChange}
                max={getTodayDate()}
                required
              />
              {errors.po_date && (
                <div style={errorTextStyle}>{errors.po_date}</div>
              )}
            </label>
            <label style={labelStyle}>
              Vendor *
              <select
                style={getInputStyle("vendor_id")}
                name="vendor_id"
                value={header.vendor_id}
                onChange={handleHeaderChange}
                required
              >
                <option value="">Select</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type})
                  </option>
                ))}
              </select>
              {errors.vendor_id && (
                <div style={errorTextStyle}>{errors.vendor_id}</div>
              )}
            </label>
          </div>

          <div style={formRowStyle}>
            <label style={labelStyle}>
              Payment Terms
              <input
                style={getInputStyle("payment_terms")}
                name="payment_terms"
                value={header.payment_terms}
                onChange={handleHeaderChange}
                placeholder="Letters, numbers and spaces only"
              />
              {errors.payment_terms && (
                <div style={errorTextStyle}>{errors.payment_terms}</div>
              )}
            </label>
            <label style={labelStyle}>
              Currency *
              <input
                style={getInputStyle("currency")}
                name="currency"
                value={header.currency}
                onChange={handleHeaderChange}
                placeholder="3 letters (INR, USD, EUR)"
                maxLength="3"
              />
              {errors.currency && (
                <div style={errorTextStyle}>{errors.currency}</div>
              )}
            </label>

            <label style={labelStyle}>
              PO Type
              <select
                style={inputStyle}
                name="po_type"
                value={header.po_type}
                onChange={handleHeaderChange}
              >
                <option value="SUB_CONTRACT">Sub Contract</option>
                <option value="CONSUMER">Consumer</option>
                <option value="STOCK">Stock Transfer</option>
                <option value="SERVICE">Service</option>
              </select>
            </label>

            <label style={labelStyle}>
              Order Source
              <select
                style={inputStyle}
                name="source_type"
                value={header.source_type}
                onChange={handleHeaderChange}
              >
                <option value="DIRECT">Direct</option>
                <option value="PR">PR</option>
                <option value="RFQ">RFQ</option>
                <option value="QA">QA</option>
              </select>
            </label>
          </div>

          <div style={formRowStyle}>
            <label style={labelStyle}>
              Freight Charges
              <input
                style={getInputStyle("freight_charges")}
                type="text"
                name="freight_charges"
                value={header.freight_charges}
                onChange={handleHeaderChange}
                placeholder="0.00"
              />
              {errors.freight_charges && (
                <div style={errorTextStyle}>{errors.freight_charges}</div>
              )}
            </label>
            <div style={{ ...labelStyle, flex: 2 }}></div>
          </div>

          {header.source_type === "PR" && (
            <>
              <div style={formRowStyle}>
                <label style={labelStyle}>
                  Source PR
                  <select
                    style={inputStyle}
                    value={selectedPrId}
                    onChange={(e) => {
                      const prId = e.target.value;
                      setSelectedPrId(prId);
                      applyPRToPO(prId);
                    }}
                  >
                    <option value="">Select PR</option>
                    {prs.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.req_no} - {pr.requester}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedPrDetails && (
                <div style={{ marginTop: "8px", fontSize: "13px" }}>
                  <div style={{ marginBottom: "4px", fontWeight: 500 }}>
                    Selected PR
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    PR No: {selectedPrDetails.header.req_no} | Date:{" "}
                    {toLocalDateString(selectedPrDetails.header.req_date)} |
                    Requester: {selectedPrDetails.header.requester}
                  </div>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Material</th>
                        <th style={thStyle}>Qty</th>
                        <th style={thStyle}>Required Date</th>
                        <th style={thStyle}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrDetails.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={tdStyle}>{it.material_id}</td>
                          <td style={tdStyle}>{it.qty}</td>
                          <td style={tdStyle}>
                            {toLocalDateString(it.required_date)}
                          </td>
                          <td style={tdStyle}>{it.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {header.source_type === "RFQ" && (
            <>
              <div style={formRowStyle}>
                <label style={labelStyle}>
                  Source RFQ
                  <select
                    style={inputStyle}
                    value={selectedRfqId}
                    onChange={async (e) => {
                      const rfqId = e.target.value;
                      setSelectedRfqId(rfqId);
                      setSelectedRfqVendorId("");
                      setRfqVendorsList([]);
                      if (rfqId) {
                        const res = await rfqApi.getRFQWithQuotes(rfqId);
                        const vendors = res.data.vendors || [];
                        setRfqVendorsList(vendors);
                        // Do NOT load items yet – wait for vendor selection
                      } else {
                        setItems([
                          {
                            material_id: "",
                            qty: "",
                            price: "",
                            tax_percent: "",
                            delivery_date: "",
                          },
                        ]);
                      }
                    }}
                  >
                    <option value="">-- Select RFQ --</option>
                    {rfqs
                      .filter((rfq) => rfq.status !== "Closed")
                      .map((rfq) => (
                        <option key={rfq.id} value={rfq.id}>
                          {rfq.rfq_no} - {rfq.rfq_type}
                        </option>
                      ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Vendor (with quote)
                  <select
                    style={inputStyle}
                    value={selectedRfqVendorId}
                    onChange={async (e) => {
                      const vendorId = e.target.value;
                      setSelectedRfqVendorId(vendorId);
                      if (vendorId && selectedRfqId) {
                        const res =
                          await rfqApi.getRFQWithQuotes(selectedRfqId);
                        const vendorQuotes = res.data.quotes.filter(
                          (q) => q.vendor_id == vendorId,
                        );
                        const newItems = res.data.items.map((item) => {
                          const quote = vendorQuotes.find(
                            (q) => q.rfq_item_id === item.id,
                          );
                          return {
                            material_id: item.material_id,
                            qty: quote ? quote.quoted_qty : item.qty,
                            price: quote ? quote.quoted_price : "",
                            tax_percent: "",
                            delivery_date: "",
                          };
                        });
                        setItems(newItems);
                        // Auto‑fill header fields from RFQ
                        setHeader((prev) => ({
                          ...prev,
                          currency: res.data.header.currency,
                          payment_terms: res.data.header.payment_terms,
                          vendor_id: Number(vendorId),
                        }));
                      }
                    }}
                  >
                    <option value="">-- Select Vendor --</option>
                    {rfqVendorsList.map((v) => (
                      <option key={v.vendor_id} value={v.vendor_id}>
                        {v.vendor_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          <div style={{ fontSize: "13px", fontWeight: 500, margin: "8px 0" }}>
            Items *
          </div>

          {items.map((it, idx) => (
            <div key={idx} style={formRowStyle}>
              <label style={labelStyle}>
                Material *
                <select
                  style={
                    errors[`item_${idx}_material`]
                      ? inputErrorStyle
                      : inputStyle
                  }
                  value={it.material_id}
                  onChange={(e) =>
                    handleItemChange(idx, "material_id", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors[`item_${idx}_material`] && (
                  <div style={errorTextStyle}>
                    {errors[`item_${idx}_material`]}
                  </div>
                )}
              </label>
              <label style={labelStyle}>
                Qty *
                <input
                  style={
                    errors[`item_${idx}_qty`] ? inputErrorStyle : inputStyle
                  }
                  type="number"
                  step="1"
                  min="1"
                  value={it.qty}
                  onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                  placeholder="Quantity"
                />
                {errors[`item_${idx}_qty`] && (
                  <div style={errorTextStyle}>{errors[`item_${idx}_qty`]}</div>
                )}
              </label>
              <label style={labelStyle}>
                Price *
                <input
                  style={
                    errors[`item_${idx}_price`] ? inputErrorStyle : inputStyle
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.price}
                  onChange={(e) =>
                    handleItemChange(idx, "price", e.target.value)
                  }
                  placeholder="Price"
                />
                {errors[`item_${idx}_price`] && (
                  <div style={errorTextStyle}>
                    {errors[`item_${idx}_price`]}
                  </div>
                )}
              </label>
              <label style={labelStyle}>
                Tax %
                <input
                  style={
                    errors[`item_${idx}_tax`] ? inputErrorStyle : inputStyle
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={it.tax_percent}
                  onChange={(e) =>
                    handleItemChange(idx, "tax_percent", e.target.value)
                  }
                  placeholder="0-100"
                />
                {errors[`item_${idx}_tax`] && (
                  <div style={errorTextStyle}>{errors[`item_${idx}_tax`]}</div>
                )}
              </label>
              <label style={labelStyle}>
                Delivery Date
                <input
                  style={
                    errors[`item_${idx}_delivery_date`]
                      ? inputErrorStyle
                      : inputStyle
                  }
                  type="date"
                  value={it.delivery_date}
                  onChange={(e) =>
                    handleItemChange(idx, "delivery_date", e.target.value)
                  }
                  min={getTodayDate()}
                />
                {errors[`item_${idx}_delivery_date`] && (
                  <div style={errorTextStyle}>
                    {errors[`item_${idx}_delivery_date`]}
                  </div>
                )}
              </label>
              <label
                style={{ ...labelStyle, flex: "0 0 auto", minWidth: "80px" }}
              >
                Total
                <input
                  style={{ ...inputStyle, backgroundColor: "#f9fafb" }}
                  type="text"
                  value={
                    it.material_id && it.qty && it.price
                      ? formatAmountWithDecimals(
                          Number(it.qty) * Number(it.price),
                        )
                      : "0.00"
                  }
                  readOnly
                />
              </label>
            </div>
          ))}

          {errors.general && (
            <div style={{ ...errorTextStyle, marginBottom: "8px" }}>
              {errors.general}
            </div>
          )}

          {/* Totals Summary */}
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <table style={{ width: "300px", fontSize: "13px" }}>
                <tbody>
                  <tr>
                    <td style={summaryLabelStyle}>Subtotal:</td>
                    <td style={summaryValueStyle}>
                      {header.currency}{" "}
                      {formatAmountWithDecimals(totals.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style={summaryLabelStyle}>Tax Amount:</td>
                    <td style={summaryValueStyle}>
                      {header.currency}{" "}
                      {formatAmountWithDecimals(totals.totalTax)}
                    </td>
                  </tr>
                  <tr>
                    <td style={summaryLabelStyle}>Freight Charges:</td>
                    <td style={summaryValueStyle}>
                      {header.currency}{" "}
                      {formatAmountWithDecimals(totals.freight)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #374151" }}>
                    <td
                      style={{
                        ...summaryLabelStyle,
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Grand Total:
                    </td>
                    <td
                      style={{
                        ...summaryValueStyle,
                        fontSize: "14px",
                        fontWeight: "700",
                      }}
                    >
                      {header.currency}{" "}
                      {formatAmountWithDecimals(totals.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: "#6b7280",
              marginRight: "8px",
            }}
            onClick={addRow}
          >
            + Add Row
          </button>

          <button type="submit" style={buttonStyle}>
            {editingId ? "Update PO" : "Save PO"}
          </button>

          {editingId && (
            <button
              type="button"
              style={cancelButtonStyle}
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
          Existing POs
        </div>

        {loading ? (
          <div style={{ fontSize: "13px" }}>Loading...</div>
        ) : pos.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#6b7280" }}>
            No POs found.
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>PO No</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>PO Type</th>
                <th style={thStyle}>Source Type</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id}>
                  <td style={tdStyle}>{po.po_no}</td>
                  <td style={tdStyle}>{toLocalDateString(po.po_date)}</td>
                  <td style={tdStyle}>{po.vendor_name}</td>
                  <td style={tdStyle}>{po.status}</td>
                  <td style={tdStyle}>{formatAmount(po.gross_amount)}</td>
                  <td style={tdStyle}>{po.po_type}</td>
                  <td style={tdStyle}>{po.source_type}</td>
                  <td style={tdStyle}>
                    <button
  style={{
    ...buttonStyle,
    padding: "4px 8px",
    marginRight: "4px",
    fontSize: "12px",
    backgroundColor: "#374151",
  }}
  type="button"
  onClick={() => setViewPO(po)}
>
  View
</button>
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "4px 8px",
                        marginRight: "4px",
                        fontSize: "12px",
                      }}
                      type="button"
                      onClick={() => editPO(po)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "4px 8px",
                        fontSize: "12px",
                        backgroundColor: "#dc2626",
                      }}
                      type="button"
                      onClick={() => deletePO(po.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {viewPO && (
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
        borderRadius: "10px",
        minWidth: "500px",
        maxWidth: "700px",
      }}
    >
      <h3>PO Details</h3>

      <p><b>PO No:</b> {viewPO.po_no}</p>
      <p><b>Date:</b> {viewPO.po_date}</p>
      <p><b>Vendor:</b> {viewPO.vendor_name}</p>
      <p><b>Status:</b> {viewPO.status}</p>
      <p><b>Amount:</b> {viewPO.gross_amount}</p>
      <p><b>PO Type:</b> {viewPO.po_type}</p>
      <p><b>Source Type:</b> {viewPO.source_type}</p>

      <button
        onClick={() => setViewPO(null)}
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "8px 15px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}
