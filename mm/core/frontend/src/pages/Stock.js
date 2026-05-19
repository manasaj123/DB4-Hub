import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Stock.css";

export default function Stock() {
  const [materials, setMaterials] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [materialsRes, collectionsRes] = await Promise.all([
        axios.get("http://localhost:5001/api/materials"),
        axios.get("http://localhost:5001/api/collections"),
      ]);

      setMaterials(materialsRes.data);

      const normalized = collectionsRes.data.map((c) => ({
        id: c.id,
        materialId: c.materialId || c.material_id,
        qty: c.qty,
        mfgDate:
          c.mfgDate || c.mfg_date ? formatDate(c.mfgDate || c.mfg_date) : "",
        expiryDate:
          c.expiryDate || c.expiry_date
            ? formatDate(c.expiryDate || c.expiry_date)
            : "",
        status: c.status,
        partyName:
          c.partyName || c.farmerName || c.customerName || c.party_name,
      }));

      setCollections(normalized);
    } catch (err) {
      console.error("Stock data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStock = (materialId) => {
    const idNum = Number(materialId);

    let materialCollections = collections
      .filter((c) => Number(c.materialId) === idNum)
      // ➜ Option B: hide completed lots from visible stock
      .filter((c) => c.status !== "Completed");

    const material = materials.find((m) => Number(m.id) === idNum);
    if (!material) return [];

    if (material.issue_type === "FIFO") {
      materialCollections.sort(
        (a, b) => new Date(a.mfgDate) - new Date(b.mfgDate)
      );
    } else {
      materialCollections.sort(
        (a, b) => new Date(b.mfgDate) - new Date(a.mfgDate)
      );
    }

    return materialCollections;
  };

  if (loading) {
    return (
      <div className="container">
        <h2 className="page-title">Stock</h2>
        <p className="loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="page-title">Stock Management (Smart FIFO/LIFO)</h2>

      {materials.length === 0 ? (
        <p className="no-data">No materials added</p>
      ) : (
        <div className="materials-grid">
          {materials.map((m) => {
            const stock = getStock(m.id);

            // ➜ Option A: skip materials that currently have no stock
            if (stock.length === 0) {
              return null;
            }

            return (
              <div
                key={m.id}
                className={`material-card ${m.issue_type.toLowerCase()}`}
              >
                <h3 className="material-header">
                  📦 {m.name.toUpperCase()} ({m.unit})
                  <span className={`issue-type ${m.issue_type.toLowerCase()}`}>
                    {m.issue_type}
                  </span>
                </h3>

                <table className="stock-table">
                  <thead>
                    <tr>
                      <th className="table-corner-left">Party</th>
                      <th>Qty</th>
                      <th>MFG Date</th>
                      <th>Expiry</th>
                      <th className="table-corner-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((c, index) => (
                      <tr
                        key={c.id || index}
                        className={index === 0 ? "highlight-row" : ""}
                      >
                        <td>{c.partyName}</td>
                        <td className="qty-cell">
                          {c.qty} {m.unit}
                        </td>
                        <td>{c.mfgDate || "-"}</td>
                        <td>{c.expiryDate || "-"}</td>
                        <td>{c.status || "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <button className="refresh-btn" onClick={fetchData}>
        🔄 Refresh Stock
      </button>
    </div>
  );
}

/* import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Stock.css";

export default function Stock() {
  const [materials, setMaterials] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local date formatter (same idea as in Collection)
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch materials + collections and normalize collection fields
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [materialsRes, collectionsRes] = await Promise.all([
        axios.get("http://localhost:5001/api/materials"),
        axios.get("http://localhost:5001/api/collections"),
      ]);

      setMaterials(materialsRes.data);

      const normalized = collectionsRes.data.map((c) => ({
        id: c.id,
        materialId: c.materialId || c.material_id,
        qty: c.qty,
        mfgDate:
          c.mfgDate || c.mfg_date ? formatDate(c.mfgDate || c.mfg_date) : "",
        expiryDate:
          c.expiryDate || c.expiry_date
            ? formatDate(c.expiryDate || c.expiry_date)
            : "",
        status: c.status,
        partyName:
          c.partyName || c.farmerName || c.customerName || c.party_name,
      }));

      setCollections(normalized);
    } catch (err) {
      console.error("Stock data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStock = (materialId) => {
    const idNum = Number(materialId);

    let materialCollections = collections.filter(
      (c) => Number(c.materialId) === idNum
    );

    const material = materials.find((m) => Number(m.id) === idNum);
    if (!material) return [];

    // FIFO / LIFO based on material.issue_type
    if (material.issue_type === "FIFO") {
      materialCollections.sort(
        (a, b) => new Date(a.mfgDate) - new Date(b.mfgDate)
      );
    } else {
      materialCollections.sort(
        (a, b) => new Date(b.mfgDate) - new Date(a.mfgDate)
      );
    }

    return materialCollections;
  };

  if (loading) {
    return (
      <div className="container">
        <h2 className="page-title">Stock</h2>
        <p className="loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="page-title">Stock Management (Smart FIFO/LIFO)</h2>

      {materials.length === 0 ? (
        <p className="no-data">No materials added</p>
      ) : (
        <div className="materials-grid">
          {materials.map((m) => {
            const stock = getStock(m.id);
            return (
              <div
                key={m.id}
                className={`material-card ${m.issue_type.toLowerCase()}`}
              >
                <h3 className="material-header">
                  📦 {m.name.toUpperCase()} ({m.unit})
                  <span className={`issue-type ${m.issue_type.toLowerCase()}`}>
                    {m.issue_type}
                  </span>
                </h3>

                {stock.length === 0 ? (
                  <p className="no-stock">No stock available for {m.name}</p>
                ) : (
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th className="table-corner-left">Party</th>
                        <th>Qty</th>
                        <th>MFG Date</th>
                        <th>Expiry</th>
                        <th className="table-corner-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((c, index) => (
                        <tr
                          key={c.id || index}
                          className={index === 0 ? "highlight-row" : ""}
                        >
                          <td>{c.partyName}</td>
                          <td className="qty-cell">
                            {c.qty} {m.unit}
                          </td>
                          <td>{c.mfgDate || "-"}</td>
                          <td>{c.expiryDate || "-"}</td>
                          <td>{c.status || "Pending"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button className="refresh-btn" onClick={fetchData}>
        🔄 Refresh Stock
      </button>
    </div>
  );
} */