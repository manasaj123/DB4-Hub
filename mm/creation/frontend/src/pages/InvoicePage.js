import React, { useEffect, useState } from "react";
import invoiceApi from "../api/invoiceApi";
import vendorApi from "../api/vendorApi";
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

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontWeight: "600",
};

const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #f3f4f6",
};

// Status badge styles
const statusBadgeStyle = (status) => {
  switch (status) {
    case "VERIFIED":
      return { backgroundColor: "#10b981", color: "#fff" };
    case "PENDING":
      return { backgroundColor: "#f59e0b", color: "#fff" };
    case "BLOCKED_MANUAL":
    case "BLOCKED_DUE_TO_VARIANCE":
      return { backgroundColor: "#dc2626", color: "#fff" };
    default:
      return { backgroundColor: "#6b7280", color: "#fff" };
  }
};

export default function InvoicePage() {
  const [vendors, setVendors] = useState([]);
  const [pos, setPOs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  const [header, setHeader] = useState({
    invoice_no: "",
    invoice_date: "",
    vendor_id: "",
    po_id: "",
    total_amount: "",
    invoice_type: "INVOICE",
    gr_based: true,
    payment_blocked: false,
  });

  const [items, setItems] = useState([
    { po_item_id: "", material_id: "", qty: "", price: "", tax_percent: "" },
  ]);

  useEffect(() => {
    const total = items.reduce((sum, it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      return sum + qty * price;
    }, 0);
    setHeader((prev) => ({ ...prev, total_amount: total }));
  }, [items]);

  const loadRefs = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        vendorApi.getAll(),
        poApi.getAll(),
      ]);
      setVendors(vRes.data);
      setPOs(pRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getAll();
      setInvoices(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefs();
    loadInvoices();
  }, []);

  // ----- NEW: Auto‑populate items when PO changes -----
  const loadPOItems = async (poId) => {
    if (!poId) return;
    try {
      const res = await poApi.getById(poId);
      const poItems = res.data.items || [];
      const newItems = poItems.map((item) => ({
        po_item_id: item.id,
        material_id: item.material_id,
        qty: item.qty,
        price: item.price,
        tax_percent: 0,
      }));
      setItems(newItems);
      // Pre‑fill vendor from PO header
      const poHeader = res.data.header;
      if (poHeader.vendor_id) {
        setHeader((prev) => ({ ...prev, vendor_id: poHeader.vendor_id }));
      }
    } catch (err) {
      console.error("Failed to load PO items:", err);
      alert("Could not load PO items");
    }
  };

  // ----- Handlers -----
  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeader((h) => ({ ...h, [name]: type === "checkbox" ? checked : value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { po_item_id: "", material_id: "", qty: "", price: "", tax_percent: "" },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        header: {
          ...header,
          vendor_id: Number(header.vendor_id),
          po_id: header.po_id ? Number(header.po_id) : null,
          total_amount: Number(header.total_amount) || 0,
        },
        items: items
          .filter((it) => it.material_id && it.qty && it.price)
          .map((it) => ({
            ...it,
            po_item_id: it.po_item_id ? Number(it.po_item_id) : null,
            material_id: Number(it.material_id),
            qty: Number(it.qty),
            price: Number(it.price),
            tax_percent: Number(it.tax_percent) || 0,
          })),
      };
      const res = await invoiceApi.create(payload);
      alert(`Invoice saved: ${res.data.invoice_no} (${res.data.status})`);
      // Reset form
      setHeader({
        invoice_no: "",
        invoice_date: "",
        vendor_id: "",
        po_id: "",
        total_amount: "",
        invoice_type: "INVOICE",
        gr_based: true,
        payment_blocked: false,
      });
      setItems([
        {
          po_item_id: "",
          material_id: "",
          qty: "",
          price: "",
          tax_percent: "",
        },
      ]);
      await loadInvoices();
    } catch (e) {
      console.error(e);
      alert("Error saving invoice");
    }
  };

  // ----- Verification Actions (same as before) -----
  const verifyInvoice = async (id) => {
    if (!window.confirm("Approve this invoice? Status will become VERIFIED."))
      return;
    try {
      await invoiceApi.verify(id);
      alert("Invoice verified");
      await loadInvoices();
    } catch (err) {
      console.error(err);
      alert("Failed to verify invoice");
    }
  };

  const togglePaymentBlock = async (id, currentBlocked) => {
    const action = currentBlocked ? "release payment block" : "block payment";
    if (!window.confirm(`Are you sure you want to ${action} for this invoice?`))
      return;
    try {
      await invoiceApi.toggleBlock(id);
      alert(`Payment ${currentBlocked ? "released" : "blocked"}`);
      await loadInvoices();
    } catch (err) {
      console.error(err);
      alert("Failed to update payment block");
    }
  };

  const viewLineItems = async (invoice) => {
    setSelectedInvoice(invoice);
    try {
      const res = await invoiceApi.getLineItems(invoice.id);
      setLineItems(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Could not load line items");
    }
  };

  const statusBadgeStyle = (status) => {
    switch (status) {
      case "VERIFIED":
        return { backgroundColor: "#10b981", color: "#fff" };
      case "PENDING":
        return { backgroundColor: "#f59e0b", color: "#fff" };
      case "BLOCKED_MANUAL":
      case "BLOCKED_DUE_TO_VARIANCE":
        return { backgroundColor: "#dc2626", color: "#fff" };
      default:
        return { backgroundColor: "#6b7280", color: "#fff" };
    }
  };

  return (
    <div>
      <div style={titleStyle}>Vendor Invoices & Verification</div>

      {/* Manual Invoice Entry Form */}
      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          {/* ... header fields (same as before, with PO onChange updated) ... */}
          <div style={formRowStyle}>
            <label style={labelStyle}>
              Invoice No
              <input
                style={inputStyle}
                value={header.invoice_no || "Auto Generated"}
                disabled
              />
            </label>
            <label style={labelStyle}>
              Invoice Date
              <input
                style={inputStyle}
                type="date"
                name="invoice_date"
                value={header.invoice_date}
                onChange={handleHeaderChange}
                required
              />
            </label>
            <label style={labelStyle}>
              Vendor
              <select
                style={inputStyle}
                name="vendor_id"
                value={header.vendor_id}
                onChange={handleHeaderChange}
                required
              >
                <option value="">Select</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type || "Vendor"})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={formRowStyle}>
            <label style={labelStyle}>
              PO (optional)
              <select
                style={inputStyle}
                name="po_id"
                value={header.po_id}
                onChange={(e) => {
                  handleHeaderChange(e);
                  loadPOItems(e.target.value);
                }}
              >
                <option value="">None</option>
                {pos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_no}
                  </option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Total Amount
              <input
                style={inputStyle}
                type="number"
                name="total_amount"
                value={header.total_amount}
                onChange={handleHeaderChange}
              />
            </label>
            <label style={labelStyle}>
              Invoice Type
              <select
                style={inputStyle}
                name="invoice_type"
                value={header.invoice_type}
                onChange={handleHeaderChange}
              >
                <option value="INVOICE">Invoice</option>
                <option value="CREDIT_NOTE">Credit Note</option>
                <option value="DEBIT_NOTE">Debit Note</option>
              </select>
            </label>
          </div>

          <div style={formRowStyle}>
            <label
              style={{
                ...labelStyle,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                name="gr_based"
                checked={header.gr_based}
                onChange={handleHeaderChange}
                style={{ marginRight: "6px" }}
              />
              GR-based Invoice Verification
            </label>
            <label
              style={{
                ...labelStyle,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                name="payment_blocked"
                checked={header.payment_blocked}
                onChange={handleHeaderChange}
                style={{ marginRight: "6px" }}
              />
              Manual Payment Block
            </label>
          </div>

          <div style={{ fontSize: "13px", fontWeight: 500, margin: "8px 0" }}>
            Invoice Lines
          </div>

          {items.map((it, idx) => (
            <div key={idx} style={formRowStyle}>
              <label style={labelStyle}>
                PO Item Id
                <input
                  style={inputStyle}
                  value={it.po_item_id}
                  onChange={(e) =>
                    handleItemChange(idx, "po_item_id", e.target.value)
                  }
                  placeholder="Optional"
                />
              </label>
              <label style={labelStyle}>
                Material Id
                <input
                  style={inputStyle}
                  value={it.material_id}
                  onChange={(e) =>
                    handleItemChange(idx, "material_id", e.target.value)
                  }
                  required={!it.po_item_id}
                />
              </label>
              <label style={labelStyle}>
                Qty
                <input
                  style={inputStyle}
                  type="number"
                  value={it.qty}
                  onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                  required
                />
              </label>
              <label style={labelStyle}>
                Price
                <input
                  style={inputStyle}
                  type="number"
                  value={it.price}
                  onChange={(e) =>
                    handleItemChange(idx, "price", e.target.value)
                  }
                  required
                />
              </label>
              <label style={labelStyle}>
                Tax %
                <input
                  style={inputStyle}
                  type="number"
                  value={it.tax_percent}
                  onChange={(e) =>
                    handleItemChange(idx, "tax_percent", e.target.value)
                  }
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: "#6b7280",
              marginRight: "8px",
            }}
            onClick={addItemRow}
          >
            + Add Line
          </button>
          <button type="submit" style={buttonStyle}>
            Save Invoice
          </button>
        </form>
      </div>

      {/* Existing Invoices Table (verification actions) – same as before */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
          Existing Invoices (Verification)
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : invoices.length === 0 ? (
          <div>No invoices found.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Invoice No</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>PO</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Payment Blocked</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={tdStyle}>{inv.invoice_no}</td>
                  <td style={tdStyle}>{inv.invoice_date}</td>
                  <td style={tdStyle}>{inv.vendor_name}</td>
                  <td style={tdStyle}>{inv.po_no || "-"}</td>
                  <td style={tdStyle}>{inv.total_amount}</td>
                  <td style={tdStyle}>{inv.invoice_type}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...statusBadgeStyle(inv.status),
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        display: "inline-block",
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{inv.payment_blocked ? "Yes" : "No"}</td>
                  <td style={tdStyle}>
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "4px 8px",
                        fontSize: "11px",
                        marginRight: "4px",
                        backgroundColor: "#10b981",
                      }}
                      onClick={() => verifyInvoice(inv.id)}
                      disabled={inv.status === "VERIFIED"}
                    >
                      Approve
                    </button>
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "4px 8px",
                        fontSize: "11px",
                        marginRight: "4px",
                        backgroundColor: "#f59e0b",
                      }}
                      onClick={() =>
                        togglePaymentBlock(inv.id, inv.payment_blocked)
                      }
                    >
                      {inv.payment_blocked ? "Release Block" : "Block Payment"}
                    </button>
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "4px 8px",
                        fontSize: "11px",
                        backgroundColor: "#6b7280",
                      }}
                      onClick={() => viewLineItems(inv)}
                    >
                      View Items
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Line Items */}
      {modalOpen && selectedInvoice && (
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
            zIndex: 1000,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80%",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              Invoice: {selectedInvoice.invoice_no}
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Tax%</th>
                  <th style={thStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>
                      {item.material_name || item.material_id}
                    </td>
                    <td style={tdStyle}>{item.qty}</td>
                    <td style={tdStyle}>{item.price}</td>
                    <td style={tdStyle}>{item.tax_percent}%</td>
                    <td style={tdStyle}>
                      {(item.qty * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button onClick={() => setModalOpen(false)} style={buttonStyle}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
