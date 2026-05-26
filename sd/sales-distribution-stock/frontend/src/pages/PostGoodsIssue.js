import React, { useEffect, useState } from "react";
import { getReadyDeliveries, performPGI } from "../services/pgiService";

const PostGoodsIssue = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const res = await getReadyDeliveries();
      setDeliveries(res.data);
    } catch (err) {
      console.error("Error loading ready deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handlePGI = async (deliveryId) => {
    if (!window.confirm("Confirm Post Goods Issue? Stock will be reduced."))
      return;
    try {
      await performPGI(deliveryId);
      alert("PGI completed successfully.");
      loadDeliveries(); // refresh list
    } catch (err) {
      const msg = err.response?.data?.message || "PGI failed";
      alert(msg);
    }
  };

  return (
    <div className="page-container">
      <style>{`
        .page-container {
          max-width: 1100px; margin: auto; padding: 20px; font-family: Segoe UI, sans-serif;
        }
        h2 { margin-bottom: 16px; }
        .data-table {
          width: 100%; border-collapse: collapse; margin-top: 12px;
        }
        .data-table th {
          background: #e0f2fe; padding: 8px; border: 1px solid #ddd; font-size: 13px;
        }
        .data-table td {
          padding: 6px; border: 1px solid #ddd; font-size: 13px;
        }
        .data-table tr:nth-child(even) { background: #f9fafb; }
        .data-table button {
          padding: 4px 10px; border: none; border-radius: 4px;
          cursor: pointer; font-size: 12px; background: #16a34a; color: white;
        }
      `}</style>

      <h2>Post Goods Issue (PGI)</h2>

      {loading ? (
        <p>Loading...</p>
      ) : deliveries.length === 0 ? (
        <p>No deliveries ready for PGI.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Delivery ID</th>
              <th>Shipping Point</th>
              <th>Warehouse</th>
              <th>Customer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.shippingPoint}</td>
                <td>{d.warehouse}</td>
                <td>
                  {d.SalesOrder?.soldToParty?.customerCode} -{" "}
                  {d.SalesOrder?.soldToParty?.name}
                </td>
                <td>
                  <button onClick={() => handlePGI(d.id)}>
                    Post Goods Issue
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PostGoodsIssue;
