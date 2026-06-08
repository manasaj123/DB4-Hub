import React, { useEffect, useState } from "react";
import stockApi from "../api/stockApi";
import materialApi from "../api/materialApi";

const titleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "12px",
  color: "#111827",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  padding: "16px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  marginBottom: "16px",
};

const filterBarStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e5e7eb",
};

const searchInputStyle = {
  padding: "6px 10px",
  fontSize: "13px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  width: "220px",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle = {
  textAlign: "left",
  padding: "8px 8px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontWeight: "600",
};

const tdStyle = {
  padding: "8px 8px",
  borderBottom: "1px solid #f3f4f6",
};

const sectionHeaderStyle = {
  fontSize: "14px",
  fontWeight: 600,
  margin: "8px 0",
  padding: "8px",
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
};

const totalRowStyle = {
  backgroundColor: "#e5e7eb",
  fontWeight: "bold",
};

const lowStockStyle = {
  color: "#dc2626",
  fontWeight: "bold",
};

const normalStockStyle = {
  color: "#10b981",
};

const expiredStockStyle = {
  backgroundColor: "#fee2e2",
  color: "#dc2626",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  if (dateString.length === 10) return dateString;
  return dateString.substring(0, 10);
};

const isExpired = (expiryDate) => {
  if (!expiryDate || expiryDate === "-") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
};

const isExpiringSoon = (expiryDate) => {
  if (!expiryDate || expiryDate === "-") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysDiff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0 && daysDiff <= 7;
};

export default function StockPage() {
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showZeroNegative, setShowZeroNegative] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [stockRes, materialRes] = await Promise.all([
        stockApi.getSummary(),
        materialApi.getAll(),
      ]);
      setRows(stockRes.data);
      setMaterials(materialRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getMaterialName = (materialId) => {
    const material = materials.find((m) => m.id == materialId);
    return material ? material.name : "-";
  };

  // Apply filters
  const filterRow = (row) => {
    const materialName = getMaterialName(row.material_id).toLowerCase();
    if (searchTerm && !materialName.includes(searchTerm.toLowerCase()))
      return false;
    if (!showZeroNegative && parseFloat(row.qty) <= 0) return false;
    if (!showExpired && row.expiry_date && isExpired(row.expiry_date))
      return false;
    return true;
  };

  const filteredRows = rows.filter(filterRow);

  const perishableRows = filteredRows.filter((r) => r.perishable === 1);
  const nonPerishableRows = filteredRows.filter((r) => r.perishable === 0);

  const totalPerishableQty = perishableRows.reduce(
    (sum, r) => sum + (parseFloat(r.qty) || 0),
    0,
  );
  const totalNonPerishableQty = nonPerishableRows.reduce(
    (sum, r) => sum + (parseFloat(r.qty) || 0),
    0,
  );

  // Material summary (same as original logic)
  const getMaterialSummary = (rows) => {
    const summary = {};
    rows.forEach((row) => {
      const materialId = row.material_id;
      const materialName = getMaterialName(materialId);
      if (!summary[materialId]) {
        summary[materialId] = {
          material_id: materialId,
          material_name: materialName,
          total_qty: 0,
          batches: [],
          isExpired: false,
          lowStockBatches: 0,
        };
      }
      summary[materialId].total_qty += parseFloat(row.qty) || 0;
      summary[materialId].batches.push(row);
      if (row.expiry_date && isExpired(row.expiry_date)) {
        summary[materialId].isExpired = true;
      }
      if ((parseFloat(row.qty) || 0) < lowStockThreshold) {
        summary[materialId].lowStockBatches++;
      }
    });
    return Object.values(summary);
  };

  const perishableSummary = getMaterialSummary(perishableRows);
  const nonPerishableSummary = getMaterialSummary(nonPerishableRows);
  const sortByMaterialName = (a, b) =>
    (a.material_name || "").localeCompare(b.material_name || "");

  return (
    <div>
      <div style={titleStyle}>Stock Summary</div>
      <div style={cardStyle}>
        {/* Filter Bar */}
        <div style={filterBarStyle}>
          <input
            type="text"
            placeholder="🔍 Search by material name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={showZeroNegative}
              onChange={() => setShowZeroNegative(!showZeroNegative)}
            />
            Show zero/negative stock
          </label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={showExpired}
              onChange={() => setShowExpired(!showExpired)}
            />
            Show expired stock
          </label>
          <button
            style={{
              padding: "4px 10px",
              fontSize: "13px",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
            }}
            onClick={load}
          >
            🔄 Refresh
          </button>
          <div
            style={{ marginLeft: "auto", fontSize: "12px", color: "#6b7280" }}
          >
            Displaying {filteredRows.length} of {rows.length} entries
          </div>
        </div>

        {loading ? (
          <div
            style={{ fontSize: "13px", textAlign: "center", padding: "20px" }}
          >
            Loading stock data...
          </div>
        ) : filteredRows.length === 0 ? (
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No stock entries match current filters.
          </div>
        ) : (
          <>
            {/* Perishable Stock Table */}
            <div style={sectionHeaderStyle}>
              🌡️ Perishable Stock
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  fontWeight: "normal",
                }}
              >
                (Total: {totalPerishableQty.toFixed(2)} units)
              </span>
            </div>
            {perishableRows.length === 0 ? (
              <div
                style={{ fontSize: "13px", color: "#6b7280", padding: "8px" }}
              >
                No perishable stock.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Material</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Batch</th>
                    <th style={thStyle}>Expiry Date</th>
                    <th style={thStyle}>Quantity</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perishableRows.map((r, idx) => {
                    const expired = isExpired(r.expiry_date);
                    const expiringSoon = isExpiringSoon(r.expiry_date);
                    const lowStock = parseFloat(r.qty) < lowStockThreshold;
                    const materialName = getMaterialName(r.material_id);
                    return (
                      <tr key={idx} style={expired ? expiredStockStyle : {}}>
                        <td style={tdStyle}>
                          <strong>{materialName}</strong>
                        </td>
                        <td style={tdStyle}>{r.location_id}</td>
                        <td style={tdStyle}>{r.batch_id || "-"}</td>
                        <td style={tdStyle}>
                          {formatDate(r.expiry_date)}
                          {expiringSoon && !expired && (
                            <span
                              style={{
                                marginLeft: "4px",
                                fontSize: "10px",
                                color: "#f59e0b",
                              }}
                            >
                              ⚠️
                            </span>
                          )}
                          {expired && (
                            <span
                              style={{
                                marginLeft: "4px",
                                fontSize: "10px",
                                color: "#dc2626",
                              }}
                            >
                              💀
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={lowStock ? lowStockStyle : normalStockStyle}
                          >
                            {parseFloat(r.qty).toFixed(2)}
                            {lowStock && (
                              <span
                                style={{ marginLeft: "4px", fontSize: "10px" }}
                              >
                                ⚠️ Low
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {expired
                            ? "Expired"
                            : expiringSoon
                              ? "Expiring Soon"
                              : lowStock
                                ? "Low Stock"
                                : "Good"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={totalRowStyle}>
                    <td colSpan="4" style={tdStyle}>
                      <strong>Total Perishable Stock</strong>
                    </td>
                    <td colSpan="2" style={tdStyle}>
                      <strong>{totalPerishableQty.toFixed(2)} units</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Non-Perishable Stock Table */}
            <div style={{ ...sectionHeaderStyle, marginTop: "20px" }}>
              📦 Non-Perishable Stock
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  fontWeight: "normal",
                }}
              >
                (Total: {totalNonPerishableQty.toFixed(2)} units)
              </span>
            </div>
            {nonPerishableRows.length === 0 ? (
              <div
                style={{ fontSize: "13px", color: "#6b7280", padding: "8px" }}
              >
                No non-perishable stock.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Material</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Batch</th>
                    <th style={thStyle}>Quantity</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nonPerishableRows.map((r, idx) => {
                    const lowStock = parseFloat(r.qty) < lowStockThreshold;
                    const materialName = getMaterialName(r.material_id);
                    return (
                      <tr key={idx}>
                        <td style={tdStyle}>
                          <strong>{materialName}</strong>
                        </td>
                        <td style={tdStyle}>{r.location_id}</td>
                        <td style={tdStyle}>{r.batch_id || "-"}</td>
                        <td style={tdStyle}>
                          <span
                            style={lowStock ? lowStockStyle : normalStockStyle}
                          >
                            {parseFloat(r.qty).toFixed(2)}
                            {lowStock && (
                              <span
                                style={{ marginLeft: "4px", fontSize: "10px" }}
                              >
                                ⚠️ Low
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {lowStock ? "Low Stock" : "In Stock"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={totalRowStyle}>
                    <td colSpan="3" style={tdStyle}>
                      <strong>Total Non-Perishable Stock</strong>
                    </td>
                    <td colSpan="2" style={tdStyle}>
                      <strong>{totalNonPerishableQty.toFixed(2)} units</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Material-wise Summary */}
            <div style={{ ...sectionHeaderStyle, marginTop: "20px" }}>
              📊 Material-wise Summary
            </div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Total Quantity</th>
                  <th style={thStyle}>Batches</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...perishableSummary, ...nonPerishableSummary]
                  .sort(sortByMaterialName)
                  .map((summary, idx) => {
                    const isPerishable = perishableSummary.includes(summary);
                    const hasLowStock = summary.lowStockBatches > 0;
                    return (
                      <tr key={idx}>
                        <td style={tdStyle}>
                          <strong>{summary.material_name}</strong>
                        </td>
                        <td style={tdStyle}>
                          {isPerishable ? "Perishable" : "Non-Perishable"}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={
                              summary.total_qty < lowStockThreshold
                                ? lowStockStyle
                                : normalStockStyle
                            }
                          >
                            {summary.total_qty.toFixed(2)}
                          </span>
                        </td>
                        <td style={tdStyle}>{summary.batches.length}</td>
                        <td style={tdStyle}>
                          {summary.isExpired
                            ? "💀 Has Expired Stock"
                            : hasLowStock
                              ? "⚠️ Low Stock"
                              : "✓ Healthy"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={totalRowStyle}>
                  <td colSpan="2" style={tdStyle}>
                    <strong>Total Materials</strong>
                  </td>
                  <td colSpan="3" style={tdStyle}>
                    <strong>
                      {perishableSummary.length + nonPerishableSummary.length}{" "}
                      materials
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Legend (unchanged) */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                📖 Legend:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "8px",
                }}
              >
                <div>🟢 Good / In Stock – Normal stock level</div>
                <div>
                  🟡 Low Stock / Expiring Soon – Below threshold / Expires
                  within 7 days
                </div>
                <div>🔴 Expired – Past expiry date</div>
                <div>⚠️ Low Stock Alert</div>
                <div>💀 Expired Stock</div>
                <div>✓ Healthy Stock</div>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "8px",
                }}
              >
                Low Stock Threshold: <strong>{lowStockThreshold} units</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
