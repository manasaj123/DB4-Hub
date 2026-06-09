import React from "react";

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0 12px",
  fontSize: "14px",
  background: "#ffffff",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  color: "#ffffff",
  fontWeight: "600",
  borderRadius: "8px 8px 0 0",
  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
};

const tdStyle = {
  padding: "14px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
  verticalAlign: "top",
};

const actionBtnStyle = {
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: "600",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s",
  marginRight: "6px",
};

const editBtnStyle = {
  ...actionBtnStyle,
  background: "linear-gradient(135deg, #2768f4 0%, #2768f4 100%)",
  color: "#ffffff",
  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
  marginBottom: "6px",
};

const deleteBtnStyle = {
  ...actionBtnStyle,
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "#ffffff",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
};

const perishableTagStyle = {
  padding: "4px 12px",
  fontSize: "11px",
  fontWeight: "600",
  borderRadius: "20px",
  color: "#ffffff",
  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)",
};

const nonPerishableTagStyle = {
  ...perishableTagStyle,
  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  fontSize: "11px",
};

export default function MaterialList({
  data,
  onEdit,
  onDelete,
  onView
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          borderRadius: "12px",
          border: "2px dashed #d1d5db",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        No materials yet. Add your first material above!
      </div>
    );
  }

  return (
    <div
  style={{
    overflowX: "auto",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "16px",
  }}
>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Material</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Batch</th>
            <th style={thStyle}>Expiry</th>
            <th style={thStyle}>Type/Group</th>
            <th style={thStyle}>Storage</th>
            <th style={thStyle}>Sales Org</th>
            <th style={thStyle}>Weights</th>
            <th style={thStyle}>UOM/Shelf</th>
            <th style={thStyle}>Valuation/Issue</th>
            {/* NEW: Qty column */}
            <th style={thStyle}>Qty</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => {
            const isPerishable = m.perishable === 1 || m.perishable === true;
            return (
              <tr
                key={m.id}
                style={{ transition: "all 0.2s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Material */}
                <td style={tdStyle}>
                  <strong style={{ color: "#3b82f6" }}>
                    {m.material_number || m.id}
                  </strong>
                </td>

                {/* Name */}
                <td style={tdStyle}>
                  <span style={{ color: "#1f2937", fontWeight: "600" }}>
                    {m.name}
                  </span>
                </td>

                {/* Batch */}
                <td style={tdStyle}>{m.batch_number || "—"}</td>

                {/* Expiry */}
                <td style={tdStyle}>
                  {m.expiry_date
                    ? new Date(m.expiry_date).toLocaleDateString()
                    : "—"}
                </td>

                {/* Type/Group */}
                <td style={tdStyle}>
                  <div style={{ color: "#059669", fontSize: "12px" }}>
                    {m.material_type}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    {m.material_group}
                  </div>
                </td>

                {/* Storage */}
                <td style={tdStyle}>
                  <div style={{ color: "#8b5cf6" }}>
                    WH: {m.warehouse_number}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Loc: {m.storage_location}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Type: {m.storage_type}
                  </div>
                </td>

                {/* Sales Org */}
                <td style={tdStyle}>
                  <span style={{ color: "#10b981" }}>{m.sales_org}</span>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Dist: {m.distribution_channel}
                  </div>
                </td>

                {/* Weights */}
                <td style={tdStyle}>
                  <div style={{ color: "#f59e0b" }}>
                    Gross: {(m.gross_weight || 0) + " "}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Net: {(m.net_weight || 0) + " "}
                  </div>
                </td>

                {/* UOM / Shelf */}
                <td style={tdStyle}>
                  <div>{m.uom}</div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    {m.shelf_life_days} days
                  </div>
                </td>

                {/* Valuation / Issue */}
                <td style={tdStyle}>
                  <div style={{ color: "#3b82f6" }}>{m.valuation_method}</div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    {m.issue_type}
                  </div>
                </td>

                {/* NEW: Qty cell */}
                <td style={tdStyle}>{m.qty != null ? m.qty : ""}</td>

                {/* Type (Perishable / Non-perishable) */}
                <td style={tdStyle}>
                  <span
                    style={
                      isPerishable ? perishableTagStyle : nonPerishableTagStyle
                    }
                  >
                    {isPerishable ? "Perishable" : "Non-Perishable"}
                  </span>
                </td>

                {/* Actions */}
                <td style={tdStyle}>
  <button
    style={{
      ...actionBtnStyle,
      backgroundColor: "#374151",
      color: "#fff",
      marginBottom: "6px",
    }}
    onClick={() => onView(m)}
  >
    View
  </button>

  <button
    style={editBtnStyle}
    onClick={() => onEdit(m)}
    onMouseOver={(e) =>
      (e.target.style.transform = "translateY(-2px)")
    }
    onMouseOut={(e) => (e.target.style.transform = "none")}
  >
    Edit
  </button>

  <button
    style={deleteBtnStyle}
    onClick={() => onDelete(m.id)}
    onMouseOver={(e) =>
      (e.target.style.transform = "translateY(-2px)")
    }
    onMouseOut={(e) => (e.target.style.transform = "none")}
  >
    Delete
  </button>
</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}