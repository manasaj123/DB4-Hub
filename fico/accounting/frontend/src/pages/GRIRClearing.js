import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/Common.css";

const GRIRClearing = () => {
  const [form, setForm] = useState({
    poNumber: "",
    invoiceId: "",
    invoiceNumber: "",
    vendorName: "",
    amount: "",
    clearedAmount: "",
    status: "PENDING",
    narration: "", // Added narration
  });

  const [invoiceList, setInvoiceList] = useState([]);
  const [grirEntries, setGrirEntries] = useState([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(""); // For showing balance message
  const [remainingBalance, setRemainingBalance] = useState(null); // Show remaining balance

  useEffect(() => {
    loadGrirEntries();
    loadInvoices();
  }, []);

  const loadGrirEntries = async () => {
    try {
      const res = await api.get("/grir-clearing");
      setGrirEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await api.get("/invoices", {
        params: { status: "POSTED" },
      });
      setInvoiceList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleInvoiceSelect = (e) => {
    const invoiceId = e.target.value;
    const invoice = invoiceList.find((inv) => inv.id === Number(invoiceId));

    if (!invoice) {
      setForm((prev) => ({
        ...prev,
        invoiceId: "",
        invoiceNumber: "",
        vendorName: "",
        amount: "",
        clearedAmount: "",
      }));
      setRemainingBalance(null);
      return;
    }

    // Invoice outstanding = totalAmount - already cleared
    const outstanding =
      Number(invoice.totalAmount) - Number(invoice.clearedAmount || 0);
    setRemainingBalance(outstanding);

    // Show message
    setSuccessMessage(
      `Invoice selected. Outstanding balance: ₹${outstanding.toFixed(2)}`,
    );

    // Fill form fields from invoice
    setForm((prev) => ({
      ...prev,
      invoiceId: invoice.id, // store invoiceId
      invoiceNumber: invoice.invoiceNumber || "",
      vendorName: invoice.partyName || invoice.vendorName || "",
      poNumber: invoice.poNumber || prev.poNumber, // if invoice has a poNumber
      amount: invoice.totalAmount, // or use PO amount?
      clearedAmount: outstanding, // default to full outstanding
      narration: prev.narration,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.poNumber.trim()) {
      errors.poNumber = "PO Number is required";
    }

    if (!form.invoiceId) {
      errors.invoiceId = "Please select an invoice";
    }

    if (!form.vendorName.trim()) {
      errors.vendorName = "Customer/Vendor Name is required";
    }

    if (!form.amount || Number(form.amount) <= 0) {
      errors.amount = "PO Amount must be greater than 0";
    }

    if (!form.clearedAmount || Number(form.clearedAmount) < 0) {
      errors.clearedAmount = "Cleared Amount must be 0 or greater";
    }

    if (Number(form.clearedAmount) > Number(form.amount)) {
      errors.clearedAmount = "Cleared Amount cannot exceed PO Amount";
    }

    // Check if clearing more than remaining balance
    if (
      remainingBalance !== null &&
      Number(form.clearedAmount) > remainingBalance
    ) {
      errors.clearedAmount = `Cannot clear more than remaining balance of ₹${remainingBalance.toFixed(2)}`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        invoiceId: form.invoiceId,
        poNumber: form.poNumber,
        invoiceNumber: form.invoiceNumber,
        vendorName: form.vendorName,
        amount: Number(form.amount),
        clearedAmount: Number(form.clearedAmount),
        status: form.status,
        narration: form.narration, // Added narration
      };

      const response = await api.post("/grir-clearing", payload);

      // Handle response for additional clearing
      if (response.data.message) {
        setSuccessMessage(
          `Successfully cleared additional ₹${Number(form.clearedAmount).toFixed(2)}. ` +
            `Remaining balance: ₹${response.data.remainingBalance.toFixed(2)}`,
        );
      }

      // Reset form
      setForm({
        invoiceId: "",
        poNumber: "",
        // invoiceId: "",
        invoiceNumber: "",
        vendorName: "",
        amount: "",
        clearedAmount: "",
        status: "PENDING",
        narration: "",
      });
      setValidationErrors({});
      setRemainingBalance(null);

      loadGrirEntries();
    } catch (err) {
      setError(err.response?.data?.message || "GR/IR clearing failed");
    }
  };

  const totalCleared = grirEntries.reduce(
    (sum, entry) => sum + Math.max(0, Number(entry.clearedAmount || 0)),
    0,
  );

  const totalPending = grirEntries.reduce(
    (sum, entry) => sum + Math.max(0, Number(entry.pendingAmount || 0)),
    0,
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "CLEARED":
        return "status-cleared";
      case "PENDING":
        return "status-pending";
      case "PARTIAL":
        return "status-partial";
      case "DISCREPANCY":
        return "status-discrepancy";
      default:
        return "";
    }
  };

  return (
    <div>
      <h2>GR/IR Clearing</h2>
      <div className="grid-2">
        <div className="card">
          <h3>Create GR/IR Entry</h3>
          {error && <div className="error-text">{error}</div>}
          {successMessage && (
            <div className="success-text">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                PO Number <span className="required-star">*</span>
              </label>
              <input
                name="poNumber"
                value={form.poNumber}
                onChange={handleChange}
                required
                placeholder="Enter PO Number (e.g., PO-001)"
                className={validationErrors.poNumber ? "input-error" : ""}
              />
              {validationErrors.poNumber && (
                <span className="error-message">
                  {validationErrors.poNumber}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>
                Invoice <span className="required-star">*</span>
              </label>
              <select
                name="invoiceId"
                value={form.invoiceId}
                onChange={handleInvoiceSelect}
                required
                className={validationErrors.invoiceId ? "input-error" : ""}
              >
                <option value="">Select invoice</option>
                {invoiceList.map((inv) => (
                  // <option key={inv.id} value={inv.id}>
                  //   {inv.invoiceNumber} -{" "}
                  //   {inv.partyName || inv.vendorName || "Unknown"} - ₹
                  //   {Number(inv.totalAmount).toFixed(2)}
                  // </option>

                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} -{" "}
                    {inv.partyName || inv.vendorName || "Unknown"} - Outstanding
                    ₹{(inv.totalAmount - (inv.clearedAmount || 0)).toFixed(2)}
                  </option>
                ))}
              </select>
              {validationErrors.invoiceId && (
                <span className="error-message">
                  {validationErrors.invoiceId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>
                Customer/Vendor Name <span className="required-star">*</span>
              </label>
              <input
                name="vendorName"
                value={form.vendorName}
                onChange={handleChange}
                required
                placeholder="Auto-filled from invoice or enter manually"
                className={validationErrors.vendorName ? "input-error" : ""}
              />
              {validationErrors.vendorName && (
                <span className="error-message">
                  {validationErrors.vendorName}
                </span>
              )}
            </div>

            <input
              type="hidden"
              name="invoiceNumber"
              value={form.invoiceNumber}
            />

            <div className="form-group">
              <label>
                PO Amount <span className="required-star">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className={validationErrors.amount ? "input-error" : ""}
              />
              {validationErrors.amount && (
                <span className="error-message">{validationErrors.amount}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Invoice Amount Cleared <span className="required-star">*</span>
              </label>
              <input
                type="number"
                name="clearedAmount"
                value={form.clearedAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                max={remainingBalance || form.amount || undefined}
                placeholder="0.00"
                className={validationErrors.clearedAmount ? "input-error" : ""}
              />
              {validationErrors.clearedAmount && (
                <span className="error-message">
                  {validationErrors.clearedAmount}
                </span>
              )}
              {remainingBalance !== null ? (
                <small className="helper-text warning">
                  Remaining balance to clear: ₹{remainingBalance.toFixed(2)}
                </small>
              ) : (
                form.amount && (
                  <small className="helper-text">
                    Max: ₹{Number(form.amount).toFixed(2)}
                  </small>
                )
              )}
            </div>

            <div className="form-group">
              <label>Narration</label>
              <textarea
                name="narration"
                value={form.narration}
                onChange={handleChange}
                placeholder="Add any notes or remarks..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="PENDING">Pending</option>
                <option value="CLEARED">Cleared</option>
                <option value="PARTIAL">Partial</option>
                <option value="DISCREPANCY">Discrepancy</option>
              </select>
            </div>

            <button className="btn-primary" type="submit">
              Add GR/IR Entry
            </button>
          </form>
        </div>

        <div className="card">
          <h3>GR/IR Summary</h3>
          <div className="summary-cards">
            <div className="summary-card success">
              <h4>Total Cleared</h4>
              <div className="summary-value">₹{totalCleared.toFixed(2)}</div>
            </div>
            <div className="summary-card warning">
              <h4>Pending Clearance</h4>
              <div className="summary-value">₹{totalPending.toFixed(2)}</div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Ven/Cus</th>
                  <th>PO Amt</th>
                  <th>Cleared</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Narrat</th>
                </tr>
              </thead>
              <tbody>
                {grirEntries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No GR/IR entries found
                    </td>
                  </tr>
                ) : (
                  grirEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.poNumber || "-"}</td>
                      <td>{entry.vendorName || entry.invoiceNumber || "-"}</td>
                      <td>₹{Number(entry.amount || 0).toFixed(2)}</td>
                      <td>₹{Number(entry.clearedAmount || 0).toFixed(2)}</td>
                      <td
                        className={
                          Number(entry.pendingAmount) < 0 ? "text-danger" : ""
                        }
                      >
                        ₹
                        {Math.max(0, Number(entry.pendingAmount || 0)).toFixed(
                          2,
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="text-small">{entry.narration || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GRIRClearing;
