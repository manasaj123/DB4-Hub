// quality/frontend/src/pages/QCDefectsPage.js
import React, { useState } from "react";
import qcLotApi from "../api/qcLotApi"; // ← ADD THIS IMPORT

export default function QCDefectsPage() {
  const [lotId, setLotId] = useState("");
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDefects = async () => {
    if (!lotId) return;
    setLoading(true);
    setError("");
    try {
      const res = await qcLotApi.get(lotId);
      setDefects(res.data.defects || []);
    } catch (err) {
      setError("Failed to load defects");
      setDefects([]);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
    searchBox: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      alignItems: "center",
    },
    input: {
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      width: "200px",
    },
    button: {
      padding: "8px 16px",
      backgroundColor: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "#fff",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      backgroundColor: "#f3f4f6",
      borderBottom: "2px solid #e5e7eb",
      fontWeight: "600",
    },
    td: { padding: "12px 16px", borderBottom: "1px solid #e5e7eb" },
    severityCritical: { color: "#dc2626", fontWeight: "600" },
    severityMajor: { color: "#d97706", fontWeight: "600" },
    severityMinor: { color: "#059669", fontWeight: "600" },
    hint: { textAlign: "center", padding: "40px", color: "#9ca3af" },
    error: {
      color: "#dc2626",
      padding: "12px",
      backgroundColor: "#fee2e2",
      borderRadius: "6px",
      marginBottom: "16px",
    },
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return styles.severityCritical;
      case "MAJOR":
        return styles.severityMajor;
      default:
        return styles.severityMinor;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>QC Defects</h2>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          type="number"
          placeholder="Enter QC Lot ID"
          value={lotId}
          onChange={(e) => setLotId(e.target.value)}
        />
        <button style={styles.button} onClick={loadDefects}>
          Load Defects
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {!lotId ? (
        <div style={styles.hint}>Enter a QC Lot ID to view its defects</div>
      ) : loading ? (
        <div style={styles.hint}>Loading...</div>
      ) : defects.length === 0 ? (
        <div style={styles.hint}>No defects recorded for this lot</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Defect Type</th>
              <th style={styles.th}>Rejected Qty</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Severity</th>
              <th style={styles.th}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((d) => (
              <tr key={d.id}>
                <td style={styles.td}>{d.id}</td>
                <td style={styles.td}>{d.defect_type}</td>
                <td style={styles.td}>{d.qty_rejected}</td>
                <td style={styles.td}>{d.unit || "-"}</td>
                <td style={styles.td}>
                  <span style={getSeverityStyle(d.severity)}>
                    {d.severity || "MINOR"}
                  </span>
                </td>
                <td style={styles.td}>{d.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
