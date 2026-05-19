// frontend/src/pages/SalesDocumentConfig.js
import React, { useEffect, useState } from "react";
import {
  getSalesDocuments,
  getDeletedSalesDocuments,
  createSalesDocument,
  updateSalesDocument,
  softDeleteSalesDocument,
  restoreSalesDocument,
} from "../services/salesDocumentService";

const initialForm = {
  documentType: "",
  description: "",
  referenceMandatory: false,
  checkDivision: false,
  probability: 100,
  checkCreditLimit: false,
  creditGroup: "",
  screenSequence: "",
  incompletionProcedure: "",
  transactionGroup: "",
  docPricingProcedure: "",
  deliveryType: "",
  deliveryBlock: "",
  shippingConditions: "",
  shipCostInfoProfile: "",
  delvBillingType: "",
  orderRelBillingType: "",
  intercompanyBillingType: "",
};

const SalesDocumentConfig = () => {
  const [docs, setDocs] = useState([]);
  const [deletedDocs, setDeletedDocs] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        getSalesDocuments(),
        getDeletedSalesDocuments(),
      ]);
      setDocs(activeRes.data);
      setDeletedDocs(deletedRes.data);
    } catch (err) {
      console.error("Error loading sales document config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // const alphaNumericFields = [
  //   "documentType",
  //   "creditGroup",
  //   "transactionGroup",
  //   "deliveryType",
  //   "screenSequence",
  // ];

  const alphaNumericFields = [
    "documentType",
    "creditGroup",
    "transactionGroup",
    "deliveryType",
    "screenSequence",
    "incompletionProcedure",
    "docPricingProcedure",
    "deliveryBlock",
    "shippingConditions",
    "shipCostInfoProfile",
    "delvBillingType",
    "orderRelBillingType",
    "intercompanyBillingType",
  ];

  const validateAlphaNumeric = (value) => {
    return /^[a-zA-Z0-9\s]*$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // Allow only letters, numbers and spaces
    if (alphaNumericFields.includes(name) && !validateAlphaNumeric(value)) {
      return;
    }

    const val = name === "probability" ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      documentType: "Document Type",
      description: "Description",
      transactionGroup: "Transaction Group",
      docPricingProcedure: "Document Pricing Procedure",
      deliveryType: "Delivery Type",
      screenSequence: "Screen Sequence",
      creditGroup: "Credit Group",
      shippingConditions: "Shipping Conditions",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]?.toString().trim()) {
        alert(`${label} is required`);
        return;
      }
    }

    const deliveryType = formData.deliveryType.trim().toUpperCase();

    if (!["LF", "NL"].includes(deliveryType)) {
      alert("Invalid Delivery Type (LF or NL only)");
      return;
    }

    const billingFields = [
      formData.delvBillingType,
      formData.orderRelBillingType,
      formData.intercompanyBillingType,
    ];

    const hasBilling = billingFields.some((field) => field?.trim());

    if (!hasBilling) {
      alert("At least one Billing Type is required");
      return;
    }

    if (formData.creditGroup && formData.creditGroup.length > 10) {
      alert("Credit Group must be 10 characters or less");
      return;
    }

    if (!formData.docPricingProcedure?.trim()) {
      alert("Pricing Procedure is required");
      return;
    }

    const payload = {
      ...formData,
      deliveryType,
    };

    try {
      if (editingId) {
        await updateSalesDocument(editingId, payload);
      } else {
        await createSalesDocument(payload);
      }

      setFormData(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving sales document config", err);

      if (err.response?.data?.errors) {
        const backendErrors = Object.values(err.response.data.errors).join(
          "\n",
        );

        alert(backendErrors);
      } else {
        alert("Failed to save sales document config");
      }
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      documentType: row.documentType || "",
      description: row.description || "",
      referenceMandatory: !!row.referenceMandatory,
      checkDivision: !!row.checkDivision,
      probability: row.probability ?? 100,
      checkCreditLimit: !!row.checkCreditLimit,
      creditGroup: row.creditGroup || "",
      screenSequence: row.screenSequence || "",
      incompletionProcedure: row.incompletionProcedure || "",
      transactionGroup: row.transactionGroup || "",
      docPricingProcedure: row.docPricingProcedure || "",
      deliveryType: row.deliveryType || "",
      deliveryBlock: row.deliveryBlock || "",
      shippingConditions: row.shippingConditions || "",
      shipCostInfoProfile: row.shipCostInfoProfile || "",
      delvBillingType: row.delvBillingType || "",
      orderRelBillingType: row.orderRelBillingType || "",
      intercompanyBillingType: row.intercompanyBillingType || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move this sales document config to recycle bin?"))
      return;
    try {
      await softDeleteSalesDocument(id);
      loadData();
    } catch (err) {
      console.error("Error deleting sales document config", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreSalesDocument(id);
      loadData();
    } catch (err) {
      console.error("Error restoring sales document config", err);
    }
  };

  const currentList = showDeleted ? deletedDocs : docs;

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

        .form-row{
          display:flex;
          flex-direction:column;
          margin-bottom:8px;
        }

        .form-row-inline{
          display:flex;
          align-items:center;
          gap:8px;
          margin-bottom:8px;
          flex-wrap:wrap;
        }

        .form-row label{
          font-size:14px;
          margin-bottom:4px;
          align-self:flex-start;
        }

        .form-row input,
        .form-row select{
          height:34px;
          padding:4px 8px;
          border:1px solid #cbd5e1;
          border-radius:4px;
          font-size:14px;
          align-self:flex-start;
        }

        .form-row input[type="checkbox"]{
          height:auto;
        }

        .form-row input:disabled{
          background:#f3f4f6;
        }

        .form-actions{
          margin-top:16px;
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
          padding:4px 15px;
          font-size:12px;
          
        }
          .actions-cell{
  display:flex;
  align-items:center;
  gap:6px;
  white-space:nowrap;      /* keep buttons on one line */
}

/* tighten buttons a bit so they fit easily */
.data-table .btn-small{
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

        /* 2-column layout for sections */
        .sd-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:16px;
        }

        .sd-section{
          border:1px solid #e5e7eb;
          border-radius:6px;
          padding:12px;
          background:#fafafa;
        }

        .sd-section h4{
          margin-top:0;
          margin-bottom:8px;
          border-bottom:1px solid #e5e7eb;
          padding-bottom:4px;
          font-size:15px;
        }

        @media (max-width: 900px){
          .sd-grid{
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2>Defining a Sales Document</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="sd-grid">
          {/* LEFT COLUMN */}
          <div>
            <div className="sd-section">
              <h4>Basic Data</h4>
              <div className="form-row">
                <label>Document Type</label>
                <input
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  required
                  disabled={!!editingId}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>
            </div>

            <div className="sd-section">
              <h4>Control Data</h4>
              <div className="form-row-inline">
                <label>
                  <input
                    type="checkbox"
                    name="referenceMandatory"
                    checked={formData.referenceMandatory}
                    onChange={handleChange}
                  />{" "}
                  Reference Mandatory
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="checkDivision"
                    checked={formData.checkDivision}
                    onChange={handleChange}
                  />{" "}
                  Check Division
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="checkCreditLimit"
                    checked={formData.checkCreditLimit}
                    onChange={handleChange}
                  />{" "}
                  Check Credit Limit
                </label>
              </div>
              <div className="form-row">
                <label>Probability (%)</label>
                <input
                  type="number"
                  name="probability"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label>Credit Group</label>
                <input
                  name="creditGroup"
                  value={formData.creditGroup}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Screen Sequence</label>
                <input
                  name="screenSequence"
                  value={formData.screenSequence}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
              <div className="form-row">
                <label>Incompletion Procedure</label>
                <input
                  name="incompletionProcedure"
                  value={formData.incompletionProcedure}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
              <div className="form-row">
                <label>Transaction Group</label>
                <input
                  name="transactionGroup"
                  value={formData.transactionGroup}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
              <div className="form-row">
                <label>Document Pricing Procedure</label>
                <input
                  name="docPricingProcedure"
                  value={formData.docPricingProcedure}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className="sd-section">
              <h4>Shipping</h4>
              <div className="form-row">
                <label>Delivery Type</label>
                <input
                  name="deliveryType"
                  value={formData.deliveryType}
                  onChange={handleChange}
                  placeholder="LF / NL"
                />
              </div>
              <div className="form-row">
                <label>Delivery Block</label>
                <input
                  name="deliveryBlock"
                  value={formData.deliveryBlock}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Shipping Conditions</label>
                <input
                  name="shippingConditions"
                  value={formData.shippingConditions}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Shipment Cost Info Profile</label>
                <input
                  name="shipCostInfoProfile"
                  value={formData.shipCostInfoProfile}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="sd-section">
              <h4>Billing Types</h4>
              <div className="form-row">
                <label>Delivery-Related Billing Type</label>
                <input
                  name="delvBillingType"
                  value={formData.delvBillingType}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Order-Related Billing Type</label>
                <input
                  name="orderRelBillingType"
                  value={formData.orderRelBillingType}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
              <div className="form-row">
                <label>Intercompany Billing Type</label>
                <input
                  name="intercompanyBillingType"
                  value={formData.intercompanyBillingType}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId
              ? "Update Sales Document Type"
              : "Create Sales Document Type"}
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
        <h3>{showDeleted ? "Recycle Bin" : "Active Sales Document Types"}</h3>
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
              <th>Document Type</th>
              <th>Description</th>
              <th>Probability</th>
              <th>Credit Group</th>
              <th>Delivery Type</th>
              <th>Delv Billing Type</th>
              <th>Order Rel. Billing Type</th>
              <th>Intercompany Billing Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((row) => (
              <tr key={row.id}>
                <td>{row.documentType}</td>
                <td>{row.description}</td>
                <td>{row.probability}</td>
                <td>{row.creditGroup}</td>
                <td>{row.deliveryType}</td>
                <td>{row.delvBillingType}</td>
                <td>{row.orderRelBillingType}</td>
                <td>{row.intercompanyBillingType}</td>
                <td className="actions-cell">
                  {!showDeleted && (
                    <>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-warning btn-small"
                        onClick={() => handleSoftDelete(row.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {showDeleted && (
                    <button
                      className="btn btn-success btn-small"
                      onClick={() => handleRestore(row.id)}
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

export default SalesDocumentConfig;
