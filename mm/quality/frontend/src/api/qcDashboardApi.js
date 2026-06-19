import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5004/api",
});

const qcDashboardApi = {
  // Get summary for dashboard
  async getSummary() {
    const res = await client.get("/qc/summary");
    return res.data;
  },

  // Get recent activities
  async getRecentActivities(limit = 10) {
    const res = await client.get(`/qc/activities?limit=${limit}`);
    return res.data;
  },

  // Get quality metrics
  async getMetrics() {
    const res = await client.get("/qc/metrics");
    return res.data;
  },

  // Get chart data
  async getChartData(period = "week") {
    const res = await client.get(`/qc/chart-data?period=${period}`);
    return res.data;
  },
};

export default qcDashboardApi;
