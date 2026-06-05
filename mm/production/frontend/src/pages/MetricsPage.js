import React, { useEffect, useState } from "react";
import DateInput from "../components/DateInput";
import metricApi from "../api/metricApi";

function MetricsPage() {
  const [date, setDate] = useState("2026-01-20");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (date) {
      loadMetrics(date);
    }
  }, [date]);

  const loadMetrics = async (d) => {
    setLoading(true);
    setError("");
    try {
      const data = await metricApi.getDaily(d);
      setMetrics(data);
    } catch (err) {
      setError("Failed to load metrics");
      console.error("Load metrics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getYieldColor = (yieldPercent) => {
    if (yieldPercent >= 90) return '#28a745';
    if (yieldPercent >= 70) return '#ffc107';
    return '#dc3545';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return '#28a745';
    if (efficiency >= 70) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <style>{`
        .message {
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          animation: fadeIn 0.3s ease-in;
          font-size: 13px;
        }
        .message-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .metric-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .metric-card.highlight {
          border: 2px solid #007bff;
          background: #f0f7ff;
        }
        .metric-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .metric-subtitle {
          font-size: 12px;
          color: #999;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .status-indicator {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .status-open { background-color: #ffc107; }
        .status-progress { background-color: #17a2b8; }
        .status-completed { background-color: #28a745; }
        .status-cancelled { background-color: #dc3545; }
      `}</style>

      <h2>Process Efficiency / Yield</h2>
      <p style={{ color: "#666", marginTop: "-0px", marginBottom: "20px", fontSize: "13px" }}>
        Daily production performance metrics and efficiency analysis
      </p>

      {error && <div className="message message-error">{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: "bold" }}>Date: </label>
        <DateInput value={date} onChange={setDate} />
      </div>

      {loading && !metrics && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading metrics...
        </div>
      )}

      {metrics && (
        <>
          {/* Key Performance Indicators */}
          <div className="metrics-grid">
            <div className="metric-card highlight">
              <div className="metric-label">Yield %</div>
              <div className="metric-value" style={{ color: getYieldColor(metrics.yield_percent) }}>
                {metrics.yield_percent}%
              </div>
              <div className="metric-subtitle">Actual ÷ Planned × 100</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(metrics.yield_percent, 100)}%`,
                    backgroundColor: getYieldColor(metrics.yield_percent)
                  }}
                />
              </div>
            </div>

            <div className="metric-card highlight">
              <div className="metric-label">Efficiency %</div>
              <div className="metric-value" style={{ color: getEfficiencyColor(metrics.efficiency_percent) }}>
                {metrics.efficiency_percent}%
              </div>
              <div className="metric-subtitle">(Actual - Wastage) ÷ Planned × 100</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(metrics.efficiency_percent, 100)}%`,
                    backgroundColor: getEfficiencyColor(metrics.efficiency_percent)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Production Quantities */}
          <h3 style={{ marginTop: "24px" }}>Production Quantities</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Planned</div>
              <div className="metric-value" style={{ color: "#007bff" }}>
                {metrics.total_planned.toFixed(2)}
              </div>
              <div className="metric-subtitle">From Work Orders</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Actual</div>
              <div className="metric-value" style={{ color: "#28a745" }}>
                {metrics.total_actual.toFixed(2)}
              </div>
              <div className="metric-subtitle">Produced Quantity</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Wastage</div>
              <div className="metric-value" style={{ color: "#dc3545" }}>
                {metrics.total_wastage.toFixed(2)}
              </div>
              <div className="metric-subtitle">Material Loss</div>
            </div>
          </div>

          {/* Work Order Status */}
          <h3 style={{ marginTop: "24px" }}>Work Order Status</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Orders</div>
              <div className="metric-value">{metrics.work_orders_count}</div>
              <div className="metric-subtitle">All Work Orders</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <span className="status-indicator status-open"></span>
                Open
              </div>
              <div className="metric-value" style={{ color: "#ffc107" }}>
                {metrics.open_orders}
              </div>
              <div className="metric-subtitle">Not Started</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <span className="status-indicator status-progress"></span>
                In Progress
              </div>
              <div className="metric-value" style={{ color: "#17a2b8" }}>
                {metrics.in_progress_orders}
              </div>
              <div className="metric-subtitle">Being Produced</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <span className="status-indicator status-completed"></span>
                Completed
              </div>
              <div className="metric-value" style={{ color: "#28a745" }}>
                {metrics.completed_orders}
              </div>
              <div className="metric-subtitle">Finished</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                <span className="status-indicator status-cancelled"></span>
                Cancelled
              </div>
              <div className="metric-value" style={{ color: "#dc3545", fontSize: "28px" }}>
                {metrics.cancelled_orders || 0}
              </div>
              <div className="metric-subtitle">Excluded from KPIs</div>
            </div>
          </div>

          

          {/* Plan & Capacity Summary */}
          <h3 style={{ marginTop: "24px" }}>Plan & Capacity</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Plan Lines</div>
              <div className="metric-value">{metrics.plan_lines}</div>
              <div className="metric-subtitle">Total Planned Qty: {metrics.plan_total_qty}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Capacity Lines</div>
              <div className="metric-value">{metrics.capacity_lines}</div>
              <div className="metric-subtitle">Total Hours: {metrics.capacity_total_hours}</div>
            </div>
          </div>
        </>
      )}

      {!loading && !metrics && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666", background: "#f8f9fa", borderRadius: "8px" }}>
          <p>No metrics available for this date.</p>
          <p style={{ fontSize: "13px" }}>Create work orders and enter actual quantities to see performance metrics.</p>
        </div>
      )}
    </div>
  );
}

export default MetricsPage;