import React, { useEffect, useState, useCallback } from "react";
import qcLotApi from "../api/qcLotApi";
import QCLotList from "../components/qc/QCLotList";
import QCLotForm from "../components/qc/QCLotForm";

export default function QCLotsPage() {
  const [lots, setLots] = useState([]);
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const styles = {
    container: {
      padding: "20px",
      fontSize: "14px",
      maxWidth: "1200px",
      margin: "0 auto"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1f2937",
      margin: 0
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "16px",
      marginBottom: "20px"
    },
    statCard: {
      padding: "16px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      textAlign: "center"
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "bold",
      margin: "4px 0"
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280",
      textTransform: "uppercase"
    },
    filterRow: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "20px",
      padding: "12px",
      backgroundColor: "#f9fafb",
      borderRadius: "8px",
      flexWrap: "wrap"
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500"
    },
    select: {
      padding: "6px 10px",
      fontSize: "13px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white"
    },
    addButton: {
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "500"
    },
    cancelButton: {
      padding: "8px 16px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "#fff",
      color: "#374151",
      cursor: "pointer",
      marginLeft: "8px"
    },
    message: {
      padding: "10px 16px",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "13px"
    },
    successMessage: {
      backgroundColor: "#d1fae5",
      color: "#065f46"
    },
    errorMessage: {
      backgroundColor: "#fee2e2",
      color: "#991b1b"
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status) params.status = status;
      if (stage) params.stage = stage;
      
      const res = await qcLotApi.list(params);
      setLots(res.data || []);
    } catch (err) {
      setError("Failed to load QC lots");
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [status, stage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateLot = async (data) => {
    setError("");
    setSuccess("");
    try {
      await qcLotApi.create(data);
      setSuccess("QC Lot created successfully!");
      setShowForm(false);
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create QC lot");
    }
  };

  // Calculate stats - including ACCEPTED_WITH_DEVIATION
  const totalLots = lots.length;
  const pendingLots = lots.filter(l => l.status === "PENDING").length;
  const acceptedLots = lots.filter(l => l.status === "ACCEPTED").length;
  const acceptedWithDeviationLots = lots.filter(l => l.status === "ACCEPTED_WITH_DEVIATION").length;
  const rejectedLots = lots.filter(l => l.status === "REJECTED").length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>QC Lots Management</h2>
        {!showForm && (
          <button 
            style={styles.addButton}
            onClick={() => setShowForm(true)}
          >
            + New QC Lot
          </button>
        )}
      </div>

      {error && <div style={{...styles.message, ...styles.errorMessage}}>{error}</div>}
      {success && <div style={{...styles.message, ...styles.successMessage}}>{success}</div>}

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#2563eb"}}>{totalLots}</div>
          <div style={styles.statLabel}>Total Lots</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#d97706"}}>{pendingLots}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#059669"}}>{acceptedLots}</div>
          <div style={styles.statLabel}>Accepted</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#8b5cf6"}}>{acceptedWithDeviationLots}</div>
          <div style={styles.statLabel}>Accepted w/ Deviation</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: "#dc2626"}}>{rejectedLots}</div>
          <div style={styles.statLabel}>Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <label style={styles.label}>
          <span>Status:</span>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={styles.select}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="ACCEPTED_WITH_DEVIATION">Accepted with Deviation</option>
          </select>
        </label>

        <label style={styles.label}>
          <span>Stage:</span>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            style={styles.select}
          >
            <option value="">All Stages</option>
            <option value="FIELD">Field</option>
            <option value="WAREHOUSE">Warehouse</option>
          </select>
        </label>

        <button 
          style={{...styles.addButton, backgroundColor: "#6b7280", fontSize: "12px"}}
          onClick={() => { setStatus(""); setStage(""); }}
        >
          Clear Filters
        </button>
      </div>

      {/* QC Lot List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Loading QC lots...
        </div>
      ) : (
        <QCLotList lots={lots} onRefresh={load} />
      )}

      {/* Create Form */}
      {showForm && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Create New QC Lot</h3>
            <button 
              style={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
          <QCLotForm onSave={handleCreateLot} />
        </div>
      )}
    </div>
  );
}