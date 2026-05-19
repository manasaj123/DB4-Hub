import React from "react";
import { Link } from "react-router-dom";

export default function QCLotList({ lots, onRefresh }) {
  const styles = {
    empty: {
      textAlign: "center",
      padding: "40px",
      color: "#9ca3af",
      fontSize: "14px",
      backgroundColor: "#f9fafb",
      borderRadius: "8px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px",
      backgroundColor: "white",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    th: {
      textAlign: "left",
      padding: "10px 12px",
      borderBottom: "2px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      fontWeight: "600",
      color: "#374151"
    },
    td: {
      padding: "10px 12px",
      borderBottom: "1px solid #f3f4f6"
    },
    link: {
      color: "#2563eb",
      textDecoration: "none",
      fontWeight: "500"
    },
    badge: (status) => ({
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-block",
      textTransform: "uppercase",
      backgroundColor: 
        status === "ACCEPTED" ? "#d1fae5" :
        status === "REJECTED" ? "#fee2e2" :
        status === "ACCEPTED_WITH_DEVIATION" ? "#fef3c7" :
        "#e0e7ff",
      color:
        status === "ACCEPTED" ? "#065f46" :
        status === "REJECTED" ? "#991b1b" :
        status === "ACCEPTED_WITH_DEVIATION" ? "#92400e" :
        "#3730a3"
    })
  };

  if (!lots || lots.length === 0) {
    return <div style={styles.empty}>No QC lots found. Create a new QC lot to get started.</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Lot ID</th>
            <th style={styles.th}>Material ID</th>
            <th style={styles.th}>Material Name</th>
            <th style={styles.th}>Vendor ID</th>
            <th style={styles.th}>Batch ID</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Stage</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {lots.map(l => (
            <tr key={l.id}>
              <td style={styles.td}><strong>{l.id}</strong></td>
              <td style={styles.td}>{l.material_id || "-"}</td>
              <td style={styles.td}>{l.material_name || "-"}</td>
              <td style={styles.td}>{l.vendor_id || "-"}</td>
              <td style={styles.td}>{l.batch_id || "-"}</td>
              <td style={styles.td}>{l.location_id || "-"}</td>
              <td style={styles.td}>{l.stage}</td>
              <td style={styles.td}>
                <span style={styles.badge(l.status)}>
                  {l.status?.replace(/_/g, " ")}
                </span>
              </td>
              <td style={styles.td}>{formatDate(l.planned_date || l.created_at)}</td>
              <td style={styles.td}>
                <Link style={styles.link} to={`/qc/lots/${l.id}`}>
                  Inspect →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}