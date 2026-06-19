import axios from "./axiosInstance";

const qcResultApi = {
  // ============================================
  // LIST / SEARCH
  // ============================================
  list(params) {
    return axios.get("/api/qc/results", { params });
  },

  get(id) {
    return axios.get(`/api/qc/results/${id}`);
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  create(data) {
    return axios.post("/api/qc/results", data);
  },

  update(id, data) {
    return axios.put(`/api/qc/results/${id}`, data);
  },

  delete(id) {
    return axios.delete(`/api/qc/results/${id}`);
  },

  // ============================================
  // FILTERS
  // ============================================
  getByLot(lotId) {
    return axios.get(`/api/qc/results/lot/${lotId}`);
  },

  getByParameter(parameterId) {
    return axios.get(`/api/qc/results/parameter/${parameterId}`);
  },

  getByStatus(passFail) {
    return axios.get(`/api/qc/results/status/${passFail}`);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================
  bulkCreate(lotId, results) {
    return axios.post(`/api/qc/results/bulk/${lotId}`, { results });
  },

  bulkUpdate(ids, data) {
    return axios.put("/api/qc/results/bulk", { ids, data });
  },

  // ============================================
  // STATISTICS
  // ============================================
  getStats() {
    return axios.get("/api/qc/results/stats");
  },

  getStatsByLot(lotId) {
    return axios.get(`/api/qc/results/stats/lot/${lotId}`);
  },

  getPassRate(lotId) {
    return axios.get(`/api/qc/results/pass-rate/${lotId}`);
  },
};

export default qcResultApi;
