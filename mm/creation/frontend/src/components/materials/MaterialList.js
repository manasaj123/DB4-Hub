import React from "react";

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0 4px",          // Reduced from 12px
  fontSize: "12px",                 // Reduced from 14px
  background: "#ffffff",
};

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",              // Reduced from 12px 16px
  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  color: "#ffffff",
  fontWeight: "600",
  borderRadius: "4px 4px 0 0",     // Reduced from 8px
  fontSize: "11px",                 // Added smaller header font
  whiteSpace: "nowrap",             // Prevent header wrapping
};

const tdStyle = {
  padding: "6px 8px",              // Reduced from 14px
  backgroundColor: "#ffffff",
  borderRadius: "6px",             // Reduced from 12px
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", // Lighter shadow
  verticalAlign: "top",
  fontSize: "12px",                // Added
};

const actionBtnStyle = {
  padding: "3px 8px",              // Reduced from 6px 12px
  fontSize: "10px",                // Reduced from 12px
  fontWeight: "600",
  borderRadius: "4px",             // Reduced from 6px
  border: "none",
  cursor: "pointer",
  transition: "all 0.15s",         // Faster transition
  marginRight: "3px",              // Reduced from 6px
};

const editBtnStyle = {
  ...actionBtnStyle,
  background: "linear-gradient(135deg, #2768f4 0%, #2768f4 100%)",
  color: "#ffffff",
  boxShadow: "0 1px 3px rgba(16, 185, 129, 0.2)",
  marginBottom: "3px",             // Reduced from 6px
};

const deleteBtnStyle = {
  ...actionBtnStyle,
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "#ffffff",
  boxShadow: "0 1px 3px rgba(239, 68, 68, 0.2)",
};

const perishableTagStyle = {
  padding: "2px 6px",              // Reduced from 4px 12px
  fontSize: "9px",                 // Reduced from 11px
  fontWeight: "600",
  borderRadius: "10px",            // Reduced from 20px
  color: "#ffffff",
  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  whiteSpace: "nowrap",            // Keep tag on one line
};

const nonPerishableTagStyle = {
  ...perishableTagStyle,
  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
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
          padding: "20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          borderRadius: "8px",
          border: "2px dashed #d1d5db",
          color: "#6b7280",
          fontSize: "13px",
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
        padding: "6px",              // Reduced from 10px
        background: "#f8fafc",
        borderRadius: "12px",
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
            <th style={thStyle}>Valuation</th>
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
                style={{ transition: "all 0.15s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.transform = "scale(1.005)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Material */}
                <td style={tdStyle}>
                  <strong style={{ color: "#3b82f6", fontSize: "12px" }}>
                    {m.material_number || m.id}
                  </strong>
                </td>

                {/* Name */}
                <td style={tdStyle}>
                  <span style={{ color: "#1f2937", fontWeight: "600", fontSize: "12px" }}>
                    {m.name}
                  </span>
                </td>

                {/* Batch */}
                <td style={{ ...tdStyle, fontSize: "11px" }}>{m.batch_number || "—"}</td>

                {/* Expiry */}
                <td style={{ ...tdStyle, fontSize: "11px" }}>
                  {m.expiry_date
                    ? new Date(m.expiry_date).toLocaleDateString()
                    : "—"}
                </td>

                {/* Type/Group */}
                <td style={tdStyle}>
                  <div style={{ color: "#059669", fontSize: "10px" }}>
                    {m.material_type}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    {m.material_group}
                  </div>
                </td>

                {/* Storage */}
                <td style={tdStyle}>
                  <div style={{ color: "#8b5cf6", fontSize: "11px" }}>
                    WH: {m.warehouse_number}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    Loc: {m.storage_location}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    {m.storage_type}
                  </div>
                </td>

                {/* Sales Org */}
                <td style={tdStyle}>
                  <span style={{ color: "#10b981", fontSize: "11px" }}>{m.sales_org}</span>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    {m.distribution_channel}
                  </div>
                </td>

                {/* Weights */}
                <td style={{ ...tdStyle, fontSize: "11px" }}>
                  <div style={{ color: "#f59e0b" }}>
                    G: {(m.gross_weight || 0)}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    N: {(m.net_weight || 0)}
                  </div>
                </td>

                {/* UOM / Shelf */}
                <td style={{ ...tdStyle, fontSize: "11px" }}>
                  <div>{m.uom}</div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    {m.shelf_life_days}d
                  </div>
                </td>

                {/* Valuation / Issue */}
                <td style={tdStyle}>
                  <div style={{ color: "#3b82f6", fontSize: "11px" }}>{m.valuation_method}</div>
                  <div style={{ color: "#6b7280", fontSize: "10px" }}>
                    {m.issue_type}
                  </div>
                </td>

                {/* Qty */}
                <td style={{ ...tdStyle, fontSize: "12px", fontWeight: "600" }}>
                  {m.qty != null ? m.qty : "—"}
                </td>

                {/* Type (Perishable / Non-perishable) */}
                <td style={tdStyle}>
                  <span
                    style={
                      isPerishable ? perishableTagStyle : nonPerishableTagStyle
                    }
                  >
                    {isPerishable ? "Perishable" : "Non-Perish"}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  <button
                    style={{
                      ...actionBtnStyle,
                      backgroundColor: "#374151",
                      color: "#fff",
                      marginBottom: "2px",
                    }}
                    onClick={() => onView(m)}
                  >
                    View
                  </button>

                  <button
                    style={editBtnStyle}
                    onClick={() => onEdit(m)}
                    onMouseOver={(e) =>
                      (e.target.style.transform = "translateY(-1px)")
                    }
                    onMouseOut={(e) => (e.target.style.transform = "none")}
                  >
                    Edit
                  </button>

                  <button
                    style={deleteBtnStyle}
                    onClick={() => onDelete(m.id)}
                    onMouseOver={(e) =>
                      (e.target.style.transform = "translateY(-1px)")
                    }
                    onMouseOut={(e) => (e.target.style.transform = "none")}
                  >
                    Del
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