import React, { useEffect, useState, useCallback } from "react";

const formRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "12px",
  flexWrap: "wrap",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "13px",
  color: "#1f2937",
  flex: 1,
  minWidth: "180px",
};

const inputStyle = {
  padding: "8px 12px",
  fontSize: "13px",
  borderRadius: "6px",
  border: "2px solid #e5e7eb",
  backgroundColor: "#fafbfc",
  transition: "all 0.2s",
  outline: "none",
};

const inputErrorStyle = {
  ...inputStyle,
  border: "2px solid #dc2626",
  backgroundColor: "#fef2f2",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const selectErrorStyle = {
  ...selectStyle,
  border: "2px solid #dc2626",
  backgroundColor: "#fef2f2",
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: "600",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s",
  marginRight: "8px",
};

const primaryBtnStyle = {
  ...buttonStyle,
  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
};

const cancelBtnStyle = {
  ...buttonStyle,
  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)",
};

const errorMessageStyle = {
  color: "#dc2626",
  fontSize: "11px",
  marginTop: "4px",
};

const asteriskStyle = {
  color: "#dc2626",
  marginLeft: "2px",
};

const getDefaultFormState = () => ({
  material_number: "",
  industry_sector: "",
  material_type: "",
  material_group: "",
  storage_type: "",
  warehouse_number: "",
  sales_org: "",
  storage_location: "",
  distribution_channel: "",
  gross_weight: "",
  net_weight: "",
  name: "",
  batch_number: "",
  uom: "KG",
  shelf_life_days: "",
  expiry_date: "",
  valuation_method: "MOVING_AVG",
  issue_type: "FIFO",
  perishable: false,
  qty: "",
});

export default function MaterialForm({
  onSave,
  editingMaterial,
  onCancelEdit,
}) {
  const [form, setForm] = useState(getDefaultFormState);
  const [errors, setErrors] = useState({});

  const safeString = useCallback((val) => {
    if (val === null || val === undefined || val === "") return "";
    return String(val);
  }, []);

  useEffect(() => {
    if (editingMaterial) {
      setForm({
        material_number: safeString(editingMaterial.material_number),
        industry_sector: safeString(editingMaterial.industry_sector),
        material_type: safeString(editingMaterial.material_type),
        material_group: safeString(editingMaterial.material_group),
        storage_type: safeString(editingMaterial.storage_type),
        warehouse_number: safeString(editingMaterial.warehouse_number),
        sales_org: safeString(editingMaterial.sales_org),
        storage_location: safeString(editingMaterial.storage_location),
        distribution_channel: safeString(editingMaterial.distribution_channel),
        gross_weight: safeString(editingMaterial.gross_weight),
        net_weight: safeString(editingMaterial.net_weight),
        name: safeString(editingMaterial.name),
        uom: safeString(editingMaterial.uom) || "KG",
        shelf_life_days: safeString(editingMaterial.shelf_life_days),
        valuation_method:
          safeString(editingMaterial.valuation_method) || "MOVING_AVG",
        issue_type: safeString(editingMaterial.issue_type) || "FIFO",
        perishable: !!editingMaterial.perishable,
        qty: safeString(editingMaterial.qty),
        batch_number: safeString(editingMaterial.batch_number),
        expiry_date: safeString(editingMaterial.expiry_date),
      });
    } else {
      setForm(getDefaultFormState());
    }
    setErrors({});
  }, [editingMaterial, safeString]);

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim() === "") return "Material name is required";
    const nameRegex = /^[A-Za-z0-9\s]+$/; // ← allow numbers
    if (!nameRegex.test(name))
      return "Name can only contain letters, numbers and spaces";
    return "";
  };

  const validateUOM = (uom) => {
    if (!uom) return "Unit of Measurement is required";
    return "";
  };

  const validateMaterialGroup = (group) => {
    if (!group || group.trim() === "") return "";
    const groupRegex = /^[A-Za-z\s]+$/;
    if (!groupRegex.test(group))
      return "Material group should only contain letters and spaces";
    return "";
  };

  const validateWarehouseNumber = (warehouse) => {
    if (!warehouse || warehouse.trim() === "") return "";
    const warehouseRegex = /^[A-Za-z0-9\s]+$/;
    if (!warehouseRegex.test(warehouse))
      return "Warehouse number should only contain letters, numbers and spaces";
    return "";
  };

  const validateSalesOrg = (salesOrg) => {
    if (!salesOrg || salesOrg.trim() === "") return "";
    const salesRegex = /^[A-Za-z0-9\s]+$/;
    if (!salesRegex.test(salesOrg))
      return "Sales org should only contain letters, numbers and spaces";
    return "";
  };

  const validateStorageLocation = (location) => {
    if (!location || location.trim() === "") return "";
    const locationRegex = /^[A-Za-z0-9\s]+$/;
    if (!locationRegex.test(location))
      return "Storage location should only contain letters, numbers and spaces";
    return "";
  };

  const validateGrossWeight = (weight) => {
    if (weight && weight !== "") {
      const num = Number(weight);
      if (isNaN(num)) return "Gross weight must be a number";
      if (num < 0) return "Gross weight cannot be negative";
    }
    return "";
  };

  const validateNetWeight = (weight) => {
    if (weight && weight !== "") {
      const num = Number(weight);
      if (isNaN(num)) return "Net weight must be a number";
      if (num < 0) return "Net weight cannot be negative";
    }
    return "";
  };

  const validateShelfLife = (days) => {
    if (days && days !== "") {
      const num = Number(days);
      if (isNaN(num)) return "Shelf life must be a number";
      if (num < 0) return "Shelf life cannot be negative";
    }
    return "";
  };

  const validateQty = (qty) => {
    if (qty && qty !== "") {
      const num = Number(qty);
      if (isNaN(num)) return "Quantity must be a number";
      if (num < 0) return "Quantity cannot be negative";
    }
    return "";
  };

  const validateBatchNumber = (bn) => {
    if (!bn || bn.trim() === "") return "Batch number is required";
    if (!/^[A-Za-z0-9]+$/.test(bn))
      return "Only letters and numbers are allowed";
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    // Real-time input restrictions
    if (name === "batch_number") {
      processedValue = value.replace(/[^A-Za-z0-9]/g, ""); // ← no \s
    }
    if (name === "material_group") {
      processedValue = value.replace(/[^A-Za-z\s]/g, "");
    }
    if (name === "warehouse_number") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }
    if (name === "sales_org") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }
    if (name === "storage_location") {
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateName(form.name);
    if (nameError) newErrors.name = nameError;

    const uomError = validateUOM(form.uom);
    if (uomError) newErrors.uom = uomError;

    const materialGroupError = validateMaterialGroup(form.material_group);
    if (materialGroupError) newErrors.material_group = materialGroupError;

    const warehouseError = validateWarehouseNumber(form.warehouse_number);
    if (warehouseError) newErrors.warehouse_number = warehouseError;

    const salesOrgError = validateSalesOrg(form.sales_org);
    if (salesOrgError) newErrors.sales_org = salesOrgError;

    const storageLocationError = validateStorageLocation(form.storage_location);
    if (storageLocationError) newErrors.storage_location = storageLocationError;

    const grossWeightError = validateGrossWeight(form.gross_weight);
    if (grossWeightError) newErrors.gross_weight = grossWeightError;

    const netWeightError = validateNetWeight(form.net_weight);
    if (netWeightError) newErrors.net_weight = netWeightError;

    const shelfLifeError = validateShelfLife(form.shelf_life_days);
    if (shelfLifeError) newErrors.shelf_life_days = shelfLifeError;

    const qtyError = validateQty(form.qty);
    if (qtyError) newErrors.qty = qtyError;

    const bnError = validateBatchNumber(form.batch_number);
    if (bnError) newErrors.batch_number = bnError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const basePayload = {
      industry_sector: form.industry_sector || null,
      material_type: form.material_type || null,
      material_group: form.material_group || null,
      storage_type: form.storage_type || null,
      warehouse_number: form.warehouse_number || null,
      sales_org: form.sales_org || null,
      storage_location: form.storage_location || null,
      distribution_channel: form.distribution_channel || null,
      gross_weight: form.gross_weight ? Number(form.gross_weight) : null,
      net_weight: form.net_weight ? Number(form.net_weight) : null,
      name: form.name || null,
      batch_number: form.batch_number,
      uom: form.uom || null,
      shelf_life_days: form.shelf_life_days
        ? Number(form.shelf_life_days)
        : null,
      expiry_date: form.expiry_date || null,
      valuation_method: form.valuation_method || "MOVING_AVG",
      issue_type: form.issue_type || "FIFO",
      perishable: form.perishable ? 1 : 0,
      qty: form.qty ? Number(form.qty) : null,
    };

    const payload = editingMaterial
      ? { ...basePayload, material_number: form.material_number }
      : basePayload;

    await onSave(payload);

    if (!editingMaterial) {
      setForm(getDefaultFormState());
    }
  };

  const getInputStyle = (fieldName) => {
    return errors[fieldName] ? inputErrorStyle : inputStyle;
  };

  const getSelectStyle = (fieldName) => {
    return errors[fieldName] ? selectErrorStyle : selectStyle;
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
    >
      <div style={formRowStyle}>
        <label style={labelStyle}>
          Material Number
          <input
            name="material_number"
            value={form.material_number || ""}
            style={inputStyle}
            readOnly
            placeholder="Auto"
          />
        </label>

        <label style={labelStyle}>
          Name <span style={asteriskStyle}></span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={getInputStyle("name")}
            required
            placeholder="Only letters and spaces"
          />
          {errors.name && <div style={errorMessageStyle}>{errors.name}</div>}
        </label>

        <label style={labelStyle}>
          UOM <span style={asteriskStyle}></span>
          <select
            name="uom"
            value={form.uom}
            onChange={handleChange}
            style={getSelectStyle("uom")}
            required
          >
            <option value="KG">KG (Kilograms)</option>
            <option value="LTR">LTR (Liters)</option>
            <option value="PCS">PCS (Pieces)</option>
            <option value="BOXES">BOXES (Boxes)</option>
          </select>
          {errors.uom && <div style={errorMessageStyle}>{errors.uom}</div>}
        </label>

        <label style={labelStyle}>
          Qty
          <input
            type="number"
            name="qty"
            value={form.qty}
            onChange={handleChange}
            style={getInputStyle("qty")}
            min="0"
            step="0.01"
            placeholder="Quantity"
          />
          {errors.qty && <div style={errorMessageStyle}>{errors.qty}</div>}
        </label>
      </div>

      <div style={formRowStyle}>
        <label style={labelStyle}>
          Industry Sector
          <select
            name="industry_sector"
            value={form.industry_sector}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Select Sector</option>
            <option value="CHEMICALS">Chemicals</option>
            <option value="PHARMA">Pharmaceuticals</option>
            <option value="FOOD">Food & Beverages</option>
            <option value="ELECTRONICS">Electronics</option>
          </select>
        </label>

        <label style={labelStyle}>
          Material Type
          <select
            name="material_type"
            value={form.material_type}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Select Type</option>
            <option value="RAW">Raw Material</option>
            <option value="SEMI">Semi-Finished</option>
            <option value="FINISHED">Finished Good</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
      </div>

      <div style={formRowStyle}>
        <label style={labelStyle}>
          Material Group
          <input
            name="material_group"
            value={form.material_group}
            onChange={handleChange}
            style={getInputStyle("material_group")}
            placeholder="Only letters and spaces"
          />
          {errors.material_group && (
            <div style={errorMessageStyle}>{errors.material_group}</div>
          )}
        </label>
        <label style={labelStyle}>
          Storage Type
          <select
            name="storage_type"
            value={form.storage_type}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Select Type</option>
            <option value="BULK">Bulk</option>
            <option value="PALLET">Pallet</option>
            <option value="SHELF">Shelf</option>
            <option value="COLD_STORAGE">Cold Storage</option>
          </select>
        </label>
        <label style={labelStyle}>
          Warehouse Number
          <input
            name="warehouse_number"
            value={form.warehouse_number}
            onChange={handleChange}
            style={getInputStyle("warehouse_number")}
            placeholder="Letters, numbers and spaces only"
          />
          {errors.warehouse_number && (
            <div style={errorMessageStyle}>{errors.warehouse_number}</div>
          )}
        </label>
      </div>

      <div style={formRowStyle}>
        <label style={labelStyle}>
          Sales Org
          <input
            name="sales_org"
            value={form.sales_org}
            onChange={handleChange}
            style={getInputStyle("sales_org")}
            placeholder="Letters, numbers and spaces only"
          />
          {errors.sales_org && (
            <div style={errorMessageStyle}>{errors.sales_org}</div>
          )}
        </label>
        <label style={labelStyle}>
          Storage Location
          <input
            name="storage_location"
            value={form.storage_location}
            onChange={handleChange}
            style={getInputStyle("storage_location")}
            placeholder="Letters, numbers and spaces only"
          />
          {errors.storage_location && (
            <div style={errorMessageStyle}>{errors.storage_location}</div>
          )}
        </label>
        <label style={labelStyle}>
          Distribution Channel
          <select
            name="distribution_channel"
            value={form.distribution_channel}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Select Channel</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
            <option value="EXPORT">Export</option>
          </select>
        </label>
      </div>

      <div style={formRowStyle}>
        <label style={labelStyle}>
          Gross Weight
          <input
            type="number"
            step="0.01"
            name="gross_weight"
            value={form.gross_weight}
            onChange={handleChange}
            style={getInputStyle("gross_weight")}
            min="0"
            placeholder="Gross weight"
          />
          {errors.gross_weight && (
            <div style={errorMessageStyle}>{errors.gross_weight}</div>
          )}
        </label>
        <label style={labelStyle}>
          Net Weight
          <input
            type="number"
            step="0.01"
            name="net_weight"
            value={form.net_weight}
            onChange={handleChange}
            style={getInputStyle("net_weight")}
            min="0"
            placeholder="Net weight"
          />
          {errors.net_weight && (
            <div style={errorMessageStyle}>{errors.net_weight}</div>
          )}
        </label>
        <label style={labelStyle}>
          Shelf Life (days)
          <input
            type="number"
            name="shelf_life_days"
            value={form.shelf_life_days}
            onChange={handleChange}
            style={getInputStyle("shelf_life_days")}
            min="0"
            placeholder="Shelf life in days"
          />
          {errors.shelf_life_days && (
            <div style={errorMessageStyle}>{errors.shelf_life_days}</div>
          )}
        </label>
      </div>

      <div style={formRowStyle}>
        <label style={labelStyle}>
          Valuation Method
          <select
            name="valuation_method"
            value={form.valuation_method}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="MOVING_AVG">Moving Average</option>
            <option value="FIFO">FIFO</option>
            <option value="LIFO">LIFO</option>
          </select>
        </label>
        <label style={labelStyle}>
          Issue Type
          <select
            name="issue_type"
            value={form.issue_type}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="FIFO">FIFO</option>
            <option value="LIFO">LIFO</option>
            <option value="FEFO">FEFO</option>
          </select>
        </label>
      </div>

      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderRadius: "8px",
          borderLeft: "4px solid #3b82f6",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1e40af",
          }}
        >
          <input
            type="checkbox"
            name="perishable"
            checked={!!form.perishable}
            onChange={handleChange}
          />
          <span>Perishable item (has expiry date)</span>
        </label>
      </div>

      {/* Batch & Expiry Row */}
      <div style={formRowStyle}>
        <label style={labelStyle}>
          Batch Number <span style={asteriskStyle}>*</span>
          <input
            name="batch_number"
            value={form.batch_number}
            onChange={handleChange}
            style={getInputStyle("batch_number")}
            required
            placeholder="Only letters and numbers"
          />
          {errors.batch_number && (
            <div style={errorMessageStyle}>{errors.batch_number}</div>
          )}
        </label>

        <label style={labelStyle}>
          Expiry Date
          <input
            type="date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </label>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          type="submit"
          style={primaryBtnStyle}
          onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.target.style.transform = "none")}
        >
          {editingMaterial ? "Update Material" : "Save Material"}
        </button>
        {editingMaterial && (
          <button
            type="button"
            style={cancelBtnStyle}
            onClick={onCancelEdit}
            onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.target.style.transform = "none")}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
