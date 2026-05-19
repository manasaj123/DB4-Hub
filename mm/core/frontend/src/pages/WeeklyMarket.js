import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function WeeklyMarket() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyMarket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/api/stock/weekly");
      setWeeklyData(res.data);
    } catch (err) {
      console.error(
        "Weekly market error:",
        err.response?.data || err.message
      );
      alert(
        "Failed to load weekly market data: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyMarket();
  }, [fetchWeeklyMarket]);

  if (loading) {
    return (
      <div className="container">
        <h2>Weekly Market – FRO View</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Weekly Market – FRO View</h2>

      {weeklyData.length === 0 ? (
        <p>No market data available</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Farmer</th>
              <th>Material</th>
              <th>Total Qty</th>
            </tr>
          </thead>

          <tbody>
            {weeklyData.map((item, index) => (
              <tr key={index}>
                <td>{item.customerName || "-"}</td>
                <td>{item.farmerName || "-"}</td>
                <td>{item.materialName}</td>
                <td>{item.totalQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}