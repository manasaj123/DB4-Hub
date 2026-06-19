// quality/frontend/src/pages/QCParametersPage.js
import React, { useEffect, useState } from "react";
import qcMasterApi from "../api/qcMasterApi";

export default function QCParametersPage() {
  const [params, setParams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const styles = {
    container: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    title: { fontSize: "24px", fontWeight: "bold" },
    table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden" },
    th: { padding: "12px", textAlign: "left", backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" },
    td: { padding: "12px", borderBottom: "1px solid #e5e7eb" }
  };

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const res = await qcMasterApi.getParameters();
      setParams(res.data || []);
    } catch (err) {
      setError("Failed to load parameters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>QC Parameters</h2>
        <button>+ New Parameter</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Lower Limit</th>
            <th style={styles.th}>Upper Limit</th>
          </tr>
        </thead>
        <tbody>
          {params.map(p => (
            <tr key={p.id}>
              <td style={styles.td}>{p.id}</td>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.unit}</td>
              <td style={styles.td}>{p.lower_spec_limit}</td>
              <td style={styles.td}>{p.upper_spec_limit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}