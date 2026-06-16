import React, { useEffect, useState } from "react";
import rfqApi from "../api/rfqApi";
import vendorApi from "../api/vendorApi";
import materialApi from "../api/materialApi";
import prApi from "../api/prApi";

export default function RequestForQuotationPage() {
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "10px auto",
      padding: "16px",
      background: "#f4f6f9",
      borderRadius: "10px",
      fontFamily: "Arial, sans-serif",
    },
    title: {
      textAlign: "center",
      marginBottom: "16px",
    },
    sectionTitle: {
      marginTop: "20px",
      marginBottom: "8px",
      fontSize: "16px",
      fontWeight: "bold",
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "16px",
      marginBottom: "10px",
    },
    formRow2: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "16px",
      marginBottom: "10px",
    },
    formCol: {},
    label: {
      fontWeight: "bold",
      display: "block",
      marginBottom: "4px",
    },
    input: {
      padding: "7px",
      width: "100%",
      borderRadius: "5px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
    },
    inputError: {
      padding: "7px",
      width: "100%",
      borderRadius: "5px",
      border: "2px solid #dc2626",
      boxSizing: "border-box",
      backgroundColor: "#fef2f2",
    },
    errorText: {
      color: "#dc2626",
      fontSize: "11px",
      marginTop: "4px",
    },
    infoText: {
      fontSize: "10px",
      color: "#6b7280",
      marginTop: "2px",
    },
    tableWrapper: {
      marginTop: "10px",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "white",
    },
    th: {
      background: "#2563eb",
      color: "white",
      padding: "8px",
      border: "1px solid #ddd",
      fontSize: "13px",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "6px",
      border: "1px solid #ddd",
      fontSize: "13px",
      verticalAlign: "middle",
    },
    button: {
      padding: "8px 14px",
      marginTop: "15px",
      marginRight: "10px",
      
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      
    },
    addBtn: { background: "#2563eb", color: "white" },
    saveBtn: { background: "#16a34a", color: "white" },
    cancelBtn: { background: "#6b7280", color: "white" },
    editBtn: {
      background: "#0b51f5",
      color: "white",
      padding: "4px 10px",
      marginRight: "4px",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
    },
    deleteBtn: {
      background: "#dc2626",
      color: "white",
      padding: "4px 10px",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
       marginTop: "5px",
    },
    searchBox: {
      padding: "7px",
      width: "260px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      marginBottom: "10px",
    },
    statusBadge: {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "bold",
      display: "inline-block",
    },
    statusDraft: { background: "#9ca3af", color: "white" },
    statusSent: { background: "#3b82f6", color: "white" },
    statusPendingQuote: { background: "#f59e0b", color: "white" },
    statusQuoted: { background: "#10b981", color: "white" },
    statusClosed: { background: "#6b7280", color: "white" },
    statusCancelled: { background: "#ef4444", color: "white" },
    filterBar: {
      display: "flex",
      gap: "10px",
      marginBottom: "15px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    select: {
      padding: "7px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },
    vendorTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "10px",
      marginBottom: "15px",
      background: "white",
    },
    vendorTh: {
      background: "#059669",
      color: "white",
      padding: "8px",
      border: "1px solid #ddd",
      fontSize: "12px",
    },
    addVendorBtn: {
      background: "#059669",
      color: "white",
      padding: "6px 12px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      marginBottom: "10px",
    },
    removeVendorBtn: {
      background: "#dc2626",
      color: "white",
      padding: "4px 8px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "11px",
    },
  };

  // State variables
  const [rfqs, setRFQs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewRFQ, setViewRFQ] = useState(null);
  const [errors, setErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState("");

  // Multi-vendor support - stores selected vendors for current RFQ
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Vendor quotes for each vendor (for the full multi-vendor feature)
  // const [vendorQuotes, setVendorQuotes] = useState([]);

  const [vendorQuotes, setVendorQuotes] = useState({}); // { tempId: { itemIndex: { price, qty } } }

  const [prs, setPRs] = useState([]);

  const [header, setHeader] = useState({
    rfq_type: "",
    rfq_date: "",
    question_deadline: "",
    purchase_org: "",
    delivery_date: "",
    material_group: "",
    plant: "",
    storage_location: "",
    supplying_plant: "",
    reference_pr_id: "",
    status: "Draft",
    quotation_valid_until: "",
    currency: "INR",
    payment_terms: "Net 30",
  });

  const [items, setItems] = useState([{ material_id: "", qty: "" }]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Validate no special characters
  const validateNoSpecialChars = (value, fieldName) => {
    if (!value) return "";
    const regex = /^[A-Za-z0-9\s-]+$/;
    if (!regex.test(value)) {
      return `${fieldName} should only contain letters, numbers, spaces and hyphens`;
    }
    return "";
  };

  // Validate PR format
  const validatePRFormat = (value, fieldName) => {
    if (!value) return "";
    const prRegex = /^(DB4-)?PR-\d{3,4}$/;
    if (!prRegex.test(value)) {
      return `${fieldName} must be in format: PR-001 or DB4-PR-001`;
    }
    return "";
  };

  // Validate date is not in the past
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

  // Validate date is not before RFQ date
  const validateValidUntilDate = (date) => {
    if (!date || !header.rfq_date) return "";
    const validUntil = new Date(date);
    const rfqDate = new Date(header.rfq_date);
    if (validUntil < rfqDate) {
      return "Quotation Validity Date cannot be before RFQ Date";
    }
    return "";
  };

  // Validate quantity
  const validateQuantity = (qty) => {
    if (!qty && qty !== 0) return "";
    const num = Number(qty);
    if (isNaN(num)) return "Quantity must be a number";
    if (num <= 0) return "Quantity must be greater than 0";
    return "";
  };

  // Load data
  const loadRFQs = async () => {
    const res = await rfqApi.getAll();
    setRFQs(res.data);
  };

  const loadMaterials = async () => {
    const res = await materialApi.getAll();
    setMaterials(res.data);
  };

  const loadVendors = async () => {
    const res = await vendorApi.getAll();
    setVendors(res.data);
  };

  const loadPRs = async () => {
    try {
      const res = await prApi.getAll();
      setPRs(res.data);
    } catch (err) {
      console.error("Failed to load PRs:", err);
    }
  };

  useEffect(() => {
    loadRFQs();
    loadMaterials();
    loadVendors();
    loadPRs();
  }, []);

  const loadPRDetails = async (prNo) => {
    if (!prNo) return;

    const selectedPr = prs.find((pr) => pr.req_no === prNo);
    if (!selectedPr) {
      console.warn(`PR ${prNo} not found in loaded list`);
      return;
    }

    try {
      const res = await prApi.getById(selectedPr.id);
      const { header: prHeader, items: prItems } = res.data;

      if (prItems && prItems.length > 0) {
        setItems(
          prItems.map((item) => ({
            material_id: String(item.material_id),
            qty: String(item.qty),
          })),
        );
      } else {
        setItems([{ material_id: "", qty: "" }]);
      }

      setHeader((prev) => ({
        ...prev,
        plant: prHeader.plant || prev.plant,
        purchase_org: prHeader.purchase_org || prev.purchase_org,
        delivery_date: prHeader.delivery_date || prev.delivery_date,
        material_group: prHeader.material_group || prev.material_group,
      }));

      alert(`Loaded ${prItems?.length || 0} items from PR ${prNo}`);
    } catch (err) {
      console.error("Failed to load PR details:", err);
      alert("Could not load PR details");
    }
  };

  // Multi-vendor functions
  const addVendorToRFQ = () => {
    const tempId = Date.now();
    setSelectedVendors([...selectedVendors, { vendor_id: "", id: tempId }]);
    // Initialize empty quotes for each RFQ item
    const initialQuotes = {};
    items.forEach((_, idx) => {
      if (items[idx].material_id) {
        initialQuotes[idx] = { price: "", qty: items[idx].qty };
      }
    });
    setVendorQuotes((prev) => ({ ...prev, [tempId]: initialQuotes }));
  };

  const removeVendorFromRFQ = (tempId) => {
    setSelectedVendors(selectedVendors.filter((v) => v.id !== tempId));
  };

  const updateVendorSelection = (tempId, vendorId) => {
    setSelectedVendors(
      selectedVendors.map((v) =>
        v.id === tempId ? { ...v, vendor_id: vendorId } : v,
      ),
    );
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (
      [
        "rfq_type",
        "purchase_org",
        "material_group",
        "plant",
        "storage_location",
        "supplying_plant",
      ].includes(name)
    ) {
      processedValue = value.replace(/[^A-Za-z0-9\s-]/g, "");
    }

    if (name === "reference_pr_id") {
      processedValue = value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
      // 👇 CRITICAL FIX: load PR items when selection changes
      loadPRDetails(processedValue);
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

    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: processedValue } : it,
      ),
    );

    if (errors[`item_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: "" }));
    }
  };

  const addRow = () => {
    setItems((prev) => [...prev, { material_id: "", qty: "" }]);
  };

  const resetForm = () => {
    setEditingId(null);
    setHeader({
      rfq_type: "",
      rfq_date: "",
      question_deadline: "",
      purchase_org: "",
      delivery_date: "",
      material_group: "",
      plant: "",
      storage_location: "",
      supplying_plant: "",
      reference_pr_id: "",
      status: "Draft",
      quotation_valid_until: "",
      currency: "INR",
      payment_terms: "Net 30",
    });
    setItems([{ material_id: "", qty: "" }]);
    setSelectedVendors([]);
    setErrors({});
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Draft":
        return styles.statusDraft;
      case "Sent":
        return styles.statusSent;
      case "Pending Quote":
        return styles.statusPendingQuote;
      case "Quoted":
        return styles.statusQuoted;
      case "Closed":
        return styles.statusClosed;
      case "Cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusDraft;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!header.rfq_type) {
      newErrors.rfq_type = "RFQ Type is required";
    } else {
      const specialCharError = validateNoSpecialChars(
        header.rfq_type,
        "RFQ Type",
      );
      if (specialCharError) newErrors.rfq_type = specialCharError;
    }

    if (!header.rfq_date) {
      newErrors.rfq_date = "RFQ Date is required";
    } else {
      const pastDateError = validateNotPastDate(header.rfq_date, "RFQ Date");
      if (pastDateError) newErrors.rfq_date = pastDateError;
    }

    if (header.question_deadline) {
      const pastDateError = validateNotPastDate(
        header.question_deadline,
        "Question Deadline",
      );
      if (pastDateError) {
        newErrors.question_deadline = pastDateError;
      } else if (
        header.rfq_date &&
        header.question_deadline < header.rfq_date
      ) {
        newErrors.question_deadline =
          "Question Deadline cannot be before RFQ Date";
      }
    }

    if (header.delivery_date) {
      const pastDateError = validateNotPastDate(
        header.delivery_date,
        "Delivery Date",
      );
      if (pastDateError) {
        newErrors.delivery_date = pastDateError;
      } else if (header.rfq_date && header.delivery_date < header.rfq_date) {
        newErrors.delivery_date = "Delivery Date cannot be before RFQ Date";
      }
    }

    if (header.quotation_valid_until) {
      const validUntilError = validateValidUntilDate(
        header.quotation_valid_until,
      );
      if (validUntilError) newErrors.quotation_valid_until = validUntilError;
    }

    if (header.purchase_org) {
      const specialCharError = validateNoSpecialChars(
        header.purchase_org,
        "Purchase Organization",
      );
      if (specialCharError) newErrors.purchase_org = specialCharError;
    }

    if (header.material_group) {
      const specialCharError = validateNoSpecialChars(
        header.material_group,
        "Material Group",
      );
      if (specialCharError) newErrors.material_group = specialCharError;
    }

    if (header.plant) {
      const specialCharError = validateNoSpecialChars(header.plant, "Plant");
      if (specialCharError) newErrors.plant = specialCharError;
    }

    if (header.reference_pr_id) {
      const prFormatError = validatePRFormat(
        header.reference_pr_id,
        "Reference Purchase Requisition",
      );
      if (prFormatError) newErrors.reference_pr_id = prFormatError;
    }

    if (selectedVendors.length === 0) {
      newErrors.vendors = "At least one vendor is required for RFQ";
    } else {
      const hasValidVendor = selectedVendors.some((v) => v.vendor_id);
      if (!hasValidVendor) {
        newErrors.vendors = "Please select at least one valid vendor";
      }
    }

    let hasValidItem = false;
    items.forEach((item, idx) => {
      if (item.material_id && item.qty) {
        hasValidItem = true;
        const qtyError = validateQuantity(item.qty);
        if (qtyError) newErrors[`item_${idx}_qty`] = qtyError;
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
        reference_pr_id: header.reference_pr_id || null,
        quotation_valid_until: header.quotation_valid_until || null,
      },
      items: items
        .filter((i) => i.material_id && i.qty)
        .map((i) => ({
          material_id: Number(i.material_id),
          qty: Number(i.qty),
        })),
      vendors: selectedVendors
        .filter((v) => v.vendor_id)
        .map((v) => ({
          vendor_id: Number(v.vendor_id),
        })),
    };

    try {
      if (editingId) {
        await rfqApi.update(editingId, payload);
        alert("RFQ Updated");
      } else {
        const res = await rfqApi.create(payload);
        alert(`RFQ Created : ${res.data.rfq_no}`);
      }

      resetForm();
      loadRFQs();
    } catch (err) {
      console.error(err);
      alert("Failed to save RFQ");
    }
  };

  const toInputDate = (value) => {
    if (!value) return "";
    return String(value).split("T")[0];
  };

  const editRFQ = async (rfq) => {
    setEditingId(rfq.id);
    const res = await rfqApi.getRFQWithQuotes(rfq.id);
    const { header: h, items: its, vendors: vendorList, quotes } = res.data;

    // 1. Set header fields
    setHeader({
      rfq_type: h.rfq_type || "",
      rfq_date: toInputDate(h.rfq_date),
      question_deadline: toInputDate(h.question_deadline),
      purchase_org: h.purchase_org || "",
      delivery_date: toInputDate(h.delivery_date),
      material_group: h.material_group || "",
      plant: h.plant || "",
      storage_location: h.storage_location || "",
      supplying_plant: h.supplying_plant || "",
      reference_pr_id: h.reference_pr_id || "",
      status: h.status || "Draft",
      quotation_valid_until: toInputDate(h.quotation_valid_until),
      currency: h.currency || "INR",
      payment_terms: h.payment_terms || "Net 30",
    });

    // 2. Set items – always use the RFQ's own items (its) to preserve rfq_item_id
    setItems(
      (its || []).map((it) => ({
        id: it.id, // ← save rfq_item_id for saving quotes
        material_id: String(it.material_id),
        qty: String(it.qty),
      })),
    );

    // 3. Build selected vendors list (use index as temporary id for UI)
    const selectedVendorsWithId = (vendorList || []).map((v, idx) => ({
      id: idx,
      vendor_id: String(v.vendor_id),
    }));
    setSelectedVendors(selectedVendorsWithId);

    // 4. Populate vendorQuotes from the quotes array
    const quotesByVendor = {};
    vendorList.forEach((vendor, idx) => {
      const vendorId = vendor.vendor_id;
      // Get all quotes for this vendor
      const vendorQuotesArray = quotes.filter((q) => q.vendor_id == vendorId);
      // Map each quote to the correct item index using rfq_item_id
      const quotesMap = {};
      its.forEach((item, itemIdx) => {
        const quote = vendorQuotesArray.find((q) => q.rfq_item_id === item.id);
        if (quote) {
          quotesMap[itemIdx] = {
            price: quote.quoted_price,
            qty: quote.quoted_qty,
          };
        }
      });
      quotesByVendor[idx] = quotesMap;
    });
    setVendorQuotes(quotesByVendor);

    setErrors({});
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const deleteRFQ = async (id) => {
    if (!window.confirm("Delete this RFQ?")) return;
    await rfqApi.deleteById(id);
    if (editingId === id) resetForm();
    loadRFQs();
  };

  const filteredRFQs = rfqs.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.rfq_no?.toLowerCase().includes(term) ||
      r.rfq_type?.toLowerCase().includes(term);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? styles.inputError : styles.input;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Request for Quotation</h2>

      <form onSubmit={handleSubmit}>
        {/* Row 1: RFQ No, RFQ Type, Purchase Org, Status */}
        <div style={styles.formRow2}>
          <div style={styles.formCol}>
            <label style={styles.label}>RFQ No</label>
            <input
              style={styles.input}
              value={editingId ? "(Editing)" : "Auto Generated"}
              disabled
            />
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>RFQ Type *</label>
            <input
              style={getInputStyle("rfq_type")}
              name="rfq_type"
              value={header.rfq_type}
              onChange={handleHeaderChange}
              placeholder="Letters, numbers, spaces and hyphens only"
              required
            />
            {errors.rfq_type && (
              <div style={styles.errorText}>{errors.rfq_type}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Purchase Organization</label>
            <input
              style={getInputStyle("purchase_org")}
              name="purchase_org"
              value={header.purchase_org}
              onChange={handleHeaderChange}
              placeholder="Purchase org"
            />
            {errors.purchase_org && (
              <div style={styles.errorText}>{errors.purchase_org}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>RFQ Status *</label>
            <select
              style={styles.input}
              name="status"
              value={header.status}
              onChange={handleHeaderChange}
              required
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Pending Quote">Pending Quote</option>
              <option value="Quoted">Quoted</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div style={styles.infoText}>
              Track RFQ through procurement workflow
            </div>
          </div>
        </div>

        {/* Row 2: RFQ Date, Question Deadline, Delivery Date, Quotation Valid Until */}
        <div style={styles.formRow2}>
          <div style={styles.formCol}>
            <label style={styles.label}>RFQ Date *</label>
            <input
              style={getInputStyle("rfq_date")}
              type="date"
              name="rfq_date"
              value={header.rfq_date}
              onChange={handleHeaderChange}
              min={getTodayDate()}
              required
            />
            {errors.rfq_date && (
              <div style={styles.errorText}>{errors.rfq_date}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Question Deadline</label>
            <input
              style={getInputStyle("question_deadline")}
              type="date"
              name="question_deadline"
              value={header.question_deadline}
              onChange={handleHeaderChange}
              min={getTodayDate()}
            />
            {errors.question_deadline && (
              <div style={styles.errorText}>{errors.question_deadline}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Delivery Date</label>
            <input
              style={getInputStyle("delivery_date")}
              type="date"
              name="delivery_date"
              value={header.delivery_date}
              onChange={handleHeaderChange}
              min={getTodayDate()}
            />
            {errors.delivery_date && (
              <div style={styles.errorText}>{errors.delivery_date}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Quotation Valid Until</label>
            <input
              style={getInputStyle("quotation_valid_until")}
              type="date"
              name="quotation_valid_until"
              value={header.quotation_valid_until}
              onChange={handleHeaderChange}
              min={header.rfq_date || getTodayDate()}
            />
            {errors.quotation_valid_until && (
              <div style={styles.errorText}>{errors.quotation_valid_until}</div>
            )}
            <div style={styles.infoText}>
              Vendor quotes valid until this date
            </div>
          </div>
        </div>

        {/* Row 3: Material Group, Plant, Storage Location, Supplying Plant */}
        <div style={styles.formRow2}>
          <div style={styles.formCol}>
            <label style={styles.label}>Material Group</label>
            <input
              style={getInputStyle("material_group")}
              name="material_group"
              value={header.material_group}
              onChange={handleHeaderChange}
              placeholder="Material group"
            />
            {errors.material_group && (
              <div style={styles.errorText}>{errors.material_group}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Plant</label>
            <input
              style={getInputStyle("plant")}
              name="plant"
              value={header.plant}
              onChange={handleHeaderChange}
              placeholder="Plant"
            />
            {errors.plant && <div style={styles.errorText}>{errors.plant}</div>}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Storage Location</label>
            <input
              style={getInputStyle("storage_location")}
              name="storage_location"
              value={header.storage_location}
              onChange={handleHeaderChange}
              placeholder="Storage location"
            />
            {errors.storage_location && (
              <div style={styles.errorText}>{errors.storage_location}</div>
            )}
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Supplying Plant</label>
            <input
              style={getInputStyle("supplying_plant")}
              name="supplying_plant"
              value={header.supplying_plant}
              onChange={handleHeaderChange}
              placeholder="Supplying plant"
            />
            {errors.supplying_plant && (
              <div style={styles.errorText}>{errors.supplying_plant}</div>
            )}
          </div>
        </div>

        {/* Row 4: Currency, Payment Terms, Reference PR */}
        <div style={styles.formRow2}>
          <div style={styles.formCol}>
            <label style={styles.label}>Currency *</label>
            <select
              style={styles.input}
              name="currency"
              value={header.currency}
              onChange={handleHeaderChange}
              required
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Payment Terms *</label>
            <select
              style={styles.input}
              name="payment_terms"
              value={header.payment_terms}
              onChange={handleHeaderChange}
              required
            >
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Advance 100%">Advance 100%</option>
              <option value="50% Advance, 50% Net 30">
                50% Advance, 50% Net 30
              </option>
              <option value="Letter of Credit">Letter of Credit</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
            <div style={styles.infoText}>
              Standard procurement payment terms
            </div>
          </div>
          <div style={styles.formCol}>
            <label style={styles.label}>Ref-Purchase Requisition</label>
            <select
              style={getInputStyle("reference_pr_id")}
              name="reference_pr_id"
              value={header.reference_pr_id}
              onChange={handleHeaderChange}
            >
              <option value="">-- Select PR --</option>
              {prs
                .filter(
                  (pr) =>
                    pr.status !== "Closed" ||
                    pr.req_no === header.reference_pr_id,
                )
                .map((pr) => (
                  <option key={pr.id} value={pr.req_no}>
                    {pr.req_no} - {pr.requester || "No requester"}
                    {pr.status && ` [${pr.status}]`}
                    {pr.status === "Closed" && " (Already used)"}
                  </option>
                ))}
            </select>
            {errors.reference_pr_id && (
              <div style={styles.errorText}>{errors.reference_pr_id}</div>
            )}
            <div style={styles.infoText}>
              Select a Purchase Requisition – its items will be copied
              automatically.
            </div>
          </div>
          <div style={styles.formCol}>{/* Empty for alignment */}</div>
        </div>

        {/* Multi-Vendor Support Section */}
        <h4 style={styles.sectionTitle}>Vendors (Multi-Vendor RFQ) *</h4>
        <div style={styles.tableWrapper}>
          <table style={styles.vendorTable}>
            <thead>
              <tr>
                <th style={styles.vendorTh}>Vendor</th>
                <th style={styles.vendorTh}>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedVendors.map((vendor) => {
                const tempId = vendor.id;
                const quotesForVendor = vendorQuotes[tempId] || {};
                return (
                  <tr key={tempId}>
                    <td style={styles.td}>
                      <select
                        style={styles.input}
                        value={vendor.vendor_id}
                        onChange={(e) =>
                          updateVendorSelection(tempId, e.target.value)
                        }
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>

                      {/* Show quote table only if vendor is selected and we have items */}
                      {vendor.vendor_id && items.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            borderTop: "1px solid #ccc",
                            paddingTop: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              marginBottom: "6px",
                            }}
                          >
                            Quotes
                          </div>
                          <table
                            style={{
                              width: "100%",
                              fontSize: "11px",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr style={{ backgroundColor: "#f3f4f6" }}>
                                <th
                                  style={{
                                    padding: "4px",
                                    border: "1px solid #ddd",
                                  }}
                                >
                                  Material
                                </th>
                                <th
                                  style={{
                                    padding: "4px",
                                    border: "1px solid #ddd",
                                  }}
                                >
                                  RFQ Qty
                                </th>
                                <th
                                  style={{
                                    padding: "4px",
                                    border: "1px solid #ddd",
                                  }}
                                >
                                  Quote Price
                                </th>
                                <th
                                  style={{
                                    padding: "4px",
                                    border: "1px solid #ddd",
                                  }}
                                >
                                  Quote Qty
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it, idx) => {
                                if (!it.material_id) return null;
                                const materialName =
                                  materials.find((m) => m.id == it.material_id)
                                    ?.name || it.material_id;
                                const quote = quotesForVendor[idx] || {
                                  price: "",
                                  qty: it.qty,
                                };
                                return (
                                  <tr key={idx}>
                                    <td
                                      style={{
                                        padding: "4px",
                                        border: "1px solid #ddd",
                                      }}
                                    >
                                      {materialName}
                                    </td>
                                    <td
                                      style={{
                                        padding: "4px",
                                        border: "1px solid #ddd",
                                      }}
                                    >
                                      {it.qty}
                                    </td>
                                    <td
                                      style={{
                                        padding: "4px",
                                        border: "1px solid #ddd",
                                      }}
                                    >
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={quote.price}
                                        onChange={(e) => {
                                          const newQuotes = { ...vendorQuotes };
                                          newQuotes[tempId] = {
                                            ...quotesForVendor,
                                            [idx]: {
                                              ...quote,
                                              price: e.target.value,
                                            },
                                          };
                                          setVendorQuotes(newQuotes);
                                        }}
                                        style={{
                                          width: "80px",
                                          padding: "4px",
                                        }}
                                        placeholder="Price"
                                      />
                                    </td>
                                    <td
                                      style={{
                                        padding: "4px",
                                        border: "1px solid #ddd",
                                      }}
                                    >
                                      <input
                                        type="number"
                                        step="1"
                                        value={quote.qty}
                                        onChange={(e) => {
                                          const newQuotes = { ...vendorQuotes };
                                          newQuotes[tempId] = {
                                            ...quotesForVendor,
                                            [idx]: {
                                              ...quote,
                                              qty: e.target.value,
                                            },
                                          };
                                          setVendorQuotes(newQuotes);
                                        }}
                                        style={{
                                          width: "80px",
                                          padding: "4px",
                                        }}
                                        placeholder="Qty"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <button
                            type="button"
                            style={{
                              marginTop: "8px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                            onClick={async () => {
                              console.log("Save Quotes clicked");
                              console.log(
                                "vendor.vendor_id:",
                                vendor.vendor_id,
                              );
                              console.log("editingId:", editingId);
                              console.log("items:", items);

                              if (!vendor.vendor_id) {
                                alert("Please select a vendor first");
                                return;
                              }
                              if (!editingId) {
                                alert(
                                  "Please save the RFQ first, then add quotes",
                                );
                                return;
                              }

                              const quotesArray = [];
                              for (let i = 0; i < items.length; i++) {
                                const it = items[i];
                                if (!it.material_id) continue;
                                const quote = quotesForVendor[i];
                                if (!quote || !quote.price) continue;

                                const rfqItemId = it.id;
                                console.log(
                                  `Item ${i}: id=${rfqItemId}, material_id=${it.material_id}, qty=${it.qty}, quote.price=${quote.price}`,
                                );

                                if (!rfqItemId) {
                                  alert(
                                    `Item ${i} has no id – please re-edit the RFQ (the item id is missing from API response)`,
                                  );
                                  return;
                                }
                                quotesArray.push({
                                  rfq_item_id: rfqItemId,
                                  material_id: it.material_id,
                                  quoted_price: parseFloat(quote.price) || 0,
                                  quoted_qty: parseFloat(quote.qty) || it.qty,
                                });
                              }

                              if (quotesArray.length === 0) {
                                alert("No valid quotes to save");
                                return;
                              }

                              try {
                                const response = await rfqApi.saveQuotes({
                                  rfq_id: editingId,
                                  vendor_id: vendor.vendor_id,
                                  quotes: quotesArray,
                                });
                                console.log("Save quotes response:", response);
                                alert("Quotes saved successfully");
                                window.location.reload(); // refresh to show saved quotes
                              } catch (err) {
                                console.error("Save quotes error:", err);
                                const errorMsg =
                                  err.response?.data?.error ||
                                  err.message ||
                                  "Unknown error";
                                alert(`Failed to save quotes: ${errorMsg}`);
                              }
                            }}
                          >
                            Save Quotes
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.removeVendorBtn}
                        onClick={() => removeVendorFromRFQ(tempId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          style={styles.addVendorBtn}
          onClick={addVendorToRFQ}
        >
          + Add Vendor
        </button>
        {errors.vendors && <div style={styles.errorText}>{errors.vendors}</div>}
        <div style={styles.infoText}>
          Send RFQ to multiple vendors for competitive bidding
        </div>

        {/* Materials Section */}
        <h4 style={styles.sectionTitle}>Materials (Material & Qty) *</h4>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Material</th>
                <th style={styles.th}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>
                    <select
                      style={
                        errors[`item_${idx}_material`]
                          ? styles.inputError
                          : styles.input
                      }
                      value={it.material_id}
                      onChange={(e) =>
                        handleItemChange(idx, "material_id", e.target.value)
                      }
                    >
                      <option value="">Select Material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {errors[`item_${idx}_material`] && (
                      <div style={styles.errorText}>
                        {errors[`item_${idx}_material`]}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <input
                      style={
                        errors[`item_${idx}_qty`]
                          ? styles.inputError
                          : styles.input
                      }
                      type="number"
                      step="1"
                      min="1"
                      value={it.qty}
                      onChange={(e) =>
                        handleItemChange(idx, "qty", e.target.value)
                      }
                      placeholder="0"
                    />
                    {errors[`item_${idx}_qty`] && (
                      <div style={styles.errorText}>
                        {errors[`item_${idx}_qty`]}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errors.general && (
          <div style={{ ...styles.errorText, marginTop: "10px" }}>
            {errors.general}
          </div>
        )}

        <button
          type="button"
          style={{ ...styles.button, ...styles.addBtn }}
          onClick={addRow}
        >
          Add Material Row
        </button>

        <button type="submit" style={{ ...styles.button, ...styles.saveBtn }}>
          {editingId ? "Update RFQ" : "Save RFQ"}
        </button>

        {editingId && (
          <button
            type="button"
            style={{ ...styles.button, ...styles.cancelBtn }}
            onClick={handleCancelEdit}
          >
            Cancel Edit
          </button>
        )}
      </form>

      {/* Existing RFQs Table */}
      <h3 style={{ marginTop: "30px" }}>Existing RFQs</h3>

      <div style={styles.filterBar}>
        <input
          style={styles.searchBox}
          placeholder="Search by RFQ No / Type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Pending Quote">Pending Quote</option>
          <option value="Quoted">Quoted</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter("")}
            style={{
              ...styles.button,
              background: "#6b7280",
              color: "white",
              padding: "7px 15px",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>RFQ No</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>RFQ Date</th>
              <th style={styles.th}>Valid Until</th>
              <th style={styles.th}>Currency</th>
              <th style={styles.th}>Payment Terms</th>
              <th style={styles.th}>Ref PR</th>
              <th style={styles.th}>Plant</th>
              <th style={styles.th}>Vendors</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRFQs.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.rfq_no}</td>
                <td style={styles.td}>{r.rfq_type}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusBadgeStyle(r.status),
                    }}
                  >
                    {r.status || "Draft"}
                  </span>
                </td>
                <td style={styles.td}>{toInputDate(r.rfq_date)}</td>
                <td style={styles.td}>
                  {toInputDate(r.quotation_valid_until)}
                </td>
                <td style={styles.td}>{r.currency || "USD"}</td>
                <td style={styles.td}>{r.payment_terms || "Net 30"}</td>
                <td style={styles.td}>{r.reference_pr_id || "—"}</td>
                <td style={styles.td}>{r.plant}</td>
                <td style={styles.td}>{r.vendor_count || 0}</td>
                <td style={styles.td}>{r.total_qty}</td>
                <td style={styles.td}>{r.item_count}</td>
                <td style={styles.td}>

                  <button
  type="button"
  style={{
    background: "#374151",
    color: "white",
    padding: "4px 10px",
    marginRight: "4px",
    marginBottom: "4px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  }}
  onClick={() => setViewRFQ(r)}
>
  View
</button>
                  <button
                    type="button"
                    style={styles.editBtn}
                    onClick={() => editRFQ(r)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={() => deleteRFQ(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredRFQs.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={13}>
                  No RFQs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        {/* RFQ View Popup */}
      {viewRFQ && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
            }}
          >
            <h3>RFQ Details</h3>

            <p><b>RFQ No:</b> {viewRFQ.rfq_no}</p>
            <p><b>Type:</b> {viewRFQ.rfq_type}</p>
            <p><b>Status:</b> {viewRFQ.status}</p>
            <p><b>Currency:</b> {viewRFQ.currency}</p>
            <p><b>Payment Terms:</b> {viewRFQ.payment_terms}</p>
            <p><b>Plant:</b> {viewRFQ.plant}</p>
            <p><b>Reference PR:</b> {viewRFQ.reference_pr_id}</p>

            <button
              onClick={() => setViewRFQ(null)}
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