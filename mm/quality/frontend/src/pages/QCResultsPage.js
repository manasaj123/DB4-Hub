// quality/frontend/src/pages/QCResultsPage.js
import React, { useState } from "react";
import qcLotApi from "../api/qcLotApi"; // ← ADD THIS IMPORT

export default function QCResultsPage() {
  const [lotId, setLotId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResults = async () => {
    if (!lotId) return;
    setLoading(true);
    setError("");
    try {
      const res = await qcLotApi.get(lotId);
      setResults(res.data.results || []);
    } catch (err) {
      setError("Failed to load results");
      setResults([]);
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
    pass: { color: "#059669", fontWeight: "600" },
    fail: { color: "#dc2626", fontWeight: "600" },
    hint: { textAlign: "center", padding: "40px", color: "#9ca3af" },
    error: {
      color: "#dc2626",
      padding: "12px",
      backgroundColor: "#fee2e2",
      borderRadius: "6px",
      marginBottom: "16px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>QC Results</h2>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          type="number"
          placeholder="Enter QC Lot ID"
          value={lotId}
          onChange={(e) => setLotId(e.target.value)}
        />
        <button style={styles.button} onClick={loadResults}>
          Load Results
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {!lotId ? (
        <div style={styles.hint}>Enter a QC Lot ID to view its results</div>
      ) : loading ? (
        <div style={styles.hint}>Loading...</div>
      ) : results.length === 0 ? (
        <div style={styles.hint}>No results recorded for this lot</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Parameter</th>
              <th style={styles.th}>Measured Value</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.parameter_id || "N/A"}</td>
                <td style={styles.td}>{r.measured_value}</td>
                <td style={styles.td}>{r.unit || "-"}</td>
                <td style={styles.td}>
                  {r.pass_fail ? (
                    <span style={styles.pass}>✅ PASS</span>
                  ) : (
                    <span style={styles.fail}>❌ FAIL</span>
                  )}
                </td>
                <td style={styles.td}>{r.remark || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
