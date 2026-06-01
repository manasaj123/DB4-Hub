import React, { useEffect, useState } from "react";
import {
  getQuotations,
  getDeletedQuotations,
  createQuotation,
  updateQuotation,
  softDeleteQuotation,
  restoreQuotation,
  getCustomers,
  getMaterials,
  getInquiries,
  convertQuotationToOrder,
} from "../services/quotationService";

const initialForm = {
  quotationType: "QT",
  salesOrg: "",
  distributionChannel: "",
  division: "",
  salesOffice: "",
  salesGroup: "",
  soldToPartyId: "",
  shipToPartyId: "",
  purchaseOrderNumber: "",
  validFrom: "",
  validTo: "",
  referenceInquiryId: "",
};

const initialItem = {
  materialId: "",
  quantity: "",
  uom: "",
};

const Quotation = () => {
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [deletedQuotations, setDeletedQuotations] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(initialItem);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, matRes, inqRes, activeRes, deletedRes] = await Promise.all([
        getCustomers(),
        getMaterials(),
        getInquiries(),
        getQuotations(),
        getDeletedQuotations(),
      ]);
      setCustomers(custRes.data);
      setMaterials(matRes.data);
      setInquiries(inqRes.data.filter(i => !i.isDeleted));
      setQuotations(activeRes.data);
      setDeletedQuotations(deletedRes.data);
    } catch (err) {
      console.error("Error loading quotation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: name === "uom" ? value.toUpperCase() : value,
    }));
  };

  const addItem = () => {
    if (!itemForm.materialId || !itemForm.quantity || !itemForm.uom) {
      alert("Fill all item fields");
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
    // Basic validation
    if (!formData.soldToPartyId || !formData.shipToPartyId) {
      alert("Select Sold-To and Ship-To parties");
      return;
    }
    if (formData.soldToPartyId === formData.shipToPartyId) {
      alert("Sold-To and Ship-To cannot be same");
      return;
    }
    if (items.length === 0) {
      alert("Add at least one item");
      return;
    }

    const payload = {
      ...formData,
      itemsJson: JSON.stringify(items),
      soldToPartyId: Number(formData.soldToPartyId),
      shipToPartyId: Number(formData.shipToPartyId),
      referenceInquiryId: formData.referenceInquiryId ? Number(formData.referenceInquiryId) : null,
    };

    try {
      if (editingId) {
        await updateQuotation(editingId, payload);
      } else {
        await createQuotation(payload);
      }
      setFormData(initialForm);
      setItems([]);
      setItemForm(initialItem);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error("Error saving quotation", err);
      alert(err.response?.data?.message || "Failed to save quotation");
    }
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      quotationType: q.quotationType || "QT",
      salesOrg: q.salesOrg || "",
      distributionChannel: q.distributionChannel || "",
      division: q.division || "",
      salesOffice: q.salesOffice || "",
      salesGroup: q.salesGroup || "",
      soldToPartyId: q.soldToPartyId || "",
      shipToPartyId: q.shipToPartyId || "",
      purchaseOrderNumber: q.purchaseOrderNumber || "",
      validFrom: q.validFrom || "",
      validTo: q.validTo || "",
      referenceInquiryId: q.referenceInquiryId || "",
    });
    try {
      setItems(q.itemsJson ? JSON.parse(q.itemsJson) : []);
    } catch {
      setItems([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
    setItems([]);
    setItemForm(initialItem);
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move to recycle bin?")) return;
    try {
      await softDeleteQuotation(id);
      loadData();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreQuotation(id);
      loadData();
    } catch (err) {
      console.error("Restore error", err);
    }
  };

  const handleConvertToOrder = async (quotationId) => {
    if (!window.confirm("Create sales order from this quotation?")) return;
    try {
      const res = await convertQuotationToOrder(quotationId);
      alert(`Sales Order ${res.data.id} created`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Conversion failed");
    }
  };

  const currentList = showDeleted ? deletedQuotations : quotations;

  const displayCustomerName = (id) => {
    const c = customers.find((x) => x.id === Number(id));
    return c ? `${c.customerCode} - ${c.name}` : id;
  };

  const displayItemsSummary = (q) => {
    try {
      const arr = JSON.parse(q.itemsJson || "[]");
      return arr.map(it => {
        const m = materials.find(mm => mm.id === Number(it.materialId));
        return `${m?.materialCode || it.materialId} (${it.quantity} ${it.uom})`;
      }).join(", ");
    } catch { return ""; }
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container { max-width:1100px; margin:auto; padding:20px; font-family:Segoe UI, sans-serif; }
        h2 { margin-bottom:16px; }
        h4 { margin-top:16px; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
        .form-card { background:white; padding:16px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:20px; }
        .form-section-grid { display:grid; grid-template-columns: 150px 1fr 150px 1fr; column-gap:6px; row-gap:5px; align-items:center; }
        .form-label { text-align:right; padding-right:8px; font-size:14px; white-space:nowrap; }
        .form-field input, .form-field select { width:100%; height:34px; padding:4px 8px; border:1px solid #cbd5e1; border-radius:4px; font-size:14px; }
        .items-form-row { display:grid; grid-template-columns: 2fr 1fr 1fr auto; gap:8px; align-items:center; margin-bottom:12px; }
        .form-actions { margin-top:12px; display:flex; gap:8px; }
        .btn { padding:7px 14px; border:none; border-radius:4px; cursor:pointer; font-size:13px; }
        .btn-primary { background:#2563eb; color:white; }
        .btn-secondary { background:#6b7280; color:white; }
        .btn-warning { background:#f59e0b; color:white; }
        .btn-success { background:#22c55e; color:white; }
        .btn-small { padding:4px 10px; font-size:12px; }
        .list-header { display:flex; justify-content:space-between; align-items:center; margin:16px 0; }
        .data-table { width:100%; border-collapse:collapse; }
        .data-table th { background:#e0f2fe; padding:8px; border:1px solid #ddd; font-size:13px; }
        .data-table td { padding:6px; border:1px solid #ddd; font-size:13px; }
        .data-table tr:nth-child(even) { background:#f9fafb; }
      `}</style>

      <h2>Quotations</h2>

      <form className="form-card" onSubmit={handleSubmit}>
        <h4>Header</h4>
        <div className="form-section-grid">
          <div className="form-label">Quotation Type</div>
          <div className="form-field">
            <input name="quotationType" value={formData.quotationType} onChange={handleChange} required maxLength={4} />
          </div>
          <div className="form-label">Purchase Order No.</div>
          <div className="form-field">
            <input name="purchaseOrderNumber" value={formData.purchaseOrderNumber} onChange={handleChange} maxLength={30} />
          </div>
        </div>

        <h4>Organizational Data</h4>
        <div className="form-section-grid">
          <div className="form-label">Sales Organization</div>
          <div className="form-field"><input name="salesOrg" value={formData.salesOrg} onChange={handleChange} required maxLength={10} /></div>
          <div className="form-label">Distribution Channel</div>
          <div className="form-field"><input name="distributionChannel" value={formData.distributionChannel} onChange={handleChange} required maxLength={10} /></div>
          <div className="form-label">Division</div>
          <div className="form-field"><input name="division" value={formData.division} onChange={handleChange} required maxLength={10} /></div>
          <div className="form-label">Sales Office</div>
          <div className="form-field"><input name="salesOffice" value={formData.salesOffice} onChange={handleChange} maxLength={10} /></div>
          <div className="form-label">Sales Group</div>
          <div className="form-field"><input name="salesGroup" value={formData.salesGroup} onChange={handleChange} maxLength={10} /></div>
        </div>

        <h4>Validity</h4>
        <div className="form-section-grid">
          <div className="form-label">Valid From</div>
          <div className="form-field"><input type="date" name="validFrom" value={formData.validFrom} onChange={handleChange} /></div>
          <div className="form-label">Valid To</div>
          <div className="form-field"><input type="date" name="validTo" value={formData.validTo} onChange={handleChange} /></div>
        </div>

        <h4>Partner Functions</h4>
        <div className="form-section-grid">
          <div className="form-label">Sold-To Party</div>
          <div className="form-field">
            <select name="soldToPartyId" value={formData.soldToPartyId} onChange={handleChange} required>
              <option value="">Select Sold-To</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customerCode} - {c.name}</option>)}
            </select>
          </div>
          <div className="form-label">Ship-To Party</div>
          <div className="form-field">
            <select name="shipToPartyId" value={formData.shipToPartyId} onChange={handleChange} required>
              <option value="">Select Ship-To</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customerCode} - {c.name}</option>)}
            </select>
          </div>
        </div>

        <h4>Reference</h4>
        <div className="form-section-grid">
          <div className="form-label">Reference Inquiry</div>
          <div className="form-field">
            <select name="referenceInquiryId" value={formData.referenceInquiryId} onChange={handleChange}>
              <option value="">None</option>
              {inquiries.map(inq => (
                <option key={inq.id} value={inq.id}>{inq.id} - {displayCustomerName(inq.soldToPartyId)}</option>
              ))}
            </select>
          </div>
          <div></div><div></div>
        </div>

        <h4>Items</h4>
        <div className="items-form-row">
          <select name="materialId" value={itemForm.materialId} onChange={handleItemChange}>
            <option value="">Material</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.materialCode} - {m.description}</option>)}
          </select>
          <input type="number" name="quantity" min="0.001" step="0.001" placeholder="Qty" value={itemForm.quantity} onChange={handleItemChange} />
          <select name="uom" value={itemForm.uom} onChange={handleItemChange}>
            <option value="">UoM</option>
            <option value="KG">KG</option><option value="LITERS">LITERS</option><option value="PACKETS">PACKETS</option><option value="PIECES">PIECES</option><option value="NOS">NOS</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={addItem}>Add Item</button>
        </div>

        {items.length > 0 && (
          <table className="data-table">
            <thead><tr><th>Material</th><th>Quantity</th><th>UoM</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((it, idx) => {
                const m = materials.find(mm => mm.id === Number(it.materialId));
                return (
                  <tr key={idx}>
                    <td>{m ? `${m.materialCode} - ${m.description}` : it.materialId}</td>
                    <td>{it.quantity}</td>
                    <td>{it.uom}</td>
                    <td><button type="button" className="btn btn-warning btn-small" onClick={() => removeItem(idx)}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? "Update Quotation" : "Create Quotation"}</button>
          {editingId && <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>}
        </div>
      </form>

      <div className="list-header">
        <h3>{showDeleted ? "Recycle Bin" : "Active Quotations"}</h3>
        <button className="btn btn-secondary" onClick={() => setShowDeleted(v => !v)}>{showDeleted ? "Show Active" : "Show Recycle Bin"}</button>
      </div>

      {loading ? <p>Loading...</p> : currentList.length === 0 ? <p>No records.</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th><th>Sales Org</th><th>Customer</th><th>Items</th><th>Valid</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map(q => (
              <tr key={q.id}>
                <td>{q.quotationType}</td>
                <td>{q.salesOrg}</td>
                <td>{displayCustomerName(q.soldToPartyId)}</td>
                <td>{displayItemsSummary(q)}</td>
                <td>{q.validFrom} ~ {q.validTo}</td>
                <td>
                  {!showDeleted && (
                    <>
                      <button className="btn btn-primary btn-small" onClick={() => handleEdit(q)}>Edit</button>
                      <button className="btn btn-warning btn-small" onClick={() => handleSoftDelete(q.id)}>Delete</button>
                      <button className="btn btn-success btn-small" onClick={() => handleConvertToOrder(q.id)}>Create Sales Order</button>
                    </>
                  )}
                  {showDeleted && (
                    <button className="btn btn-success btn-small" onClick={() => handleRestore(q.id)}>Restore</button>
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

export default Quotation;