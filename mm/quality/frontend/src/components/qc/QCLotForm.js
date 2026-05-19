import React, { useState } from "react";

export default function QCLotForm({ onSave, initialData }) {
  const [form, setForm] = useState(initialData || {
    batch_id: "",
    material_id: "",
    material_name: "", // New field
    vendor_id: "",
    location_id: "",
    stage: "WAREHOUSE",
    source_type: "MANUAL",
    source_id: "",
    planned_date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  const styles = {
    form: {
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "16px"
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    label: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#374151",
      textTransform: "uppercase"
    },
    input: {
      padding: "8px 10px",
      fontSize: "13px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      outline: "none"
    },
    inputError: {
      padding: "8px 10px",
      fontSize: "13px",
      borderRadius: "6px",
      border: "1px solid #ef4444",
      outline: "none",
      backgroundColor: "#fef2f2"
    },
    errorText: {
      color: "#ef4444",
      fontSize: "11px"
    },
    button: {
      padding: "10px 20px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "500"
    },
    required: {
      color: "#ef4444"
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.material_id.trim()) newErrors.material_id = "Material ID is required";
    if (!form.material_name.trim()) newErrors.material_name = "Material Name is required";
    if (!form.batch_id.trim()) newErrors.batch_id = "Batch ID is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors(e => ({ ...e, [name]: undefined }));
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    
    onSave({
      ...form,
      batch_id: form.batch_id || null,
      source_id: form.source_id || null,
      vendor_id: form.vendor_id || null,
      location_id: form.location_id || null
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.grid}>
        <div style={styles.field}>
          <span style={styles.label}>
            Material ID <span style={styles.required}>*</span>
          </span>
          <input
            style={errors.material_id ? styles.inputError : styles.input}
            name="material_id"
            value={form.material_id}
            onChange={handleChange}
            placeholder="Enter material ID"
          />
          {errors.material_id && <span style={styles.errorText}>{errors.material_id}</span>}
        </div>

        <div style={styles.field}>
          <span style={styles.label}>
            Material Name <span style={styles.required}>*</span>
          </span>
          <input
            style={errors.material_name ? styles.inputError : styles.input}
            name="material_name"
            value={form.material_name}
            onChange={handleChange}
            placeholder="Enter material name"
          />
          {errors.material_name && <span style={styles.errorText}>{errors.material_name}</span>}
        </div>

        <div style={styles.field}>
          <span style={styles.label}>
            Batch ID <span style={styles.required}>*</span>
          </span>
          <input
            style={errors.batch_id ? styles.inputError : styles.input}
            name="batch_id"
            value={form.batch_id}
            onChange={handleChange}
            placeholder="Enter batch ID"
          />
          {errors.batch_id && <span style={styles.errorText}>{errors.batch_id}</span>}
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Vendor ID</span>
          <input
            style={styles.input}
            name="vendor_id"
            value={form.vendor_id}
            onChange={handleChange}
            placeholder="Enter vendor ID"
          />
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Location ID</span>
          <input
            style={styles.input}
            name="location_id"
            value={form.location_id}
            onChange={handleChange}
            placeholder="Enter location ID"
          />
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Stage</span>
          <select
            style={styles.input}
            name="stage"
            value={form.stage}
            onChange={handleChange}
          >
            <option value="FIELD">Field</option>
            <option value="WAREHOUSE">Warehouse</option>
          </select>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Source Type</span>
          <select
            style={styles.input}
            name="source_type"
            value={form.source_type}
            onChange={handleChange}
          >
            <option value="MANUAL">Manual</option>
            <option value="GRN">GRN</option>
            <option value="FIELD">Field</option>
          </select>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Source ID</span>
          <input
            style={styles.input}
            name="source_id"
            value={form.source_id}
            onChange={handleChange}
            placeholder="Optional source ID"
          />
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Planned Date</span>
          <input
            style={styles.input}
            type="date"
            name="planned_date"
            value={form.planned_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" style={styles.button}>
        Create QC Lot
      </button>
    </form>
  );
}