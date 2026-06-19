import axios from "./axiosInstance";

const qcDefectApi = {
  // ============================================
  // LIST / SEARCH
  // ============================================
  list(params) {
    return axios.get("/api/qc/defects", { params });
  },

  get(id) {
    return axios.get(`/api/qc/defects/${id}`);
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  create(data) {
    return axios.post("/api/qc/defects", data);
  },

  update(id, data) {
    return axios.put(`/api/qc/defects/${id}`, data);
  },

  delete(id) {
    return axios.delete(`/api/qc/defects/${id}`);
  },

  // ============================================
  // FILTERS
  // ============================================
  getByLot(lotId) {
    return axios.get(`/api/qc/defects/lot/${lotId}`);
  },

  getBySeverity(severity) {
    return axios.get(`/api/qc/defects/severity/${severity}`);
  },

  getByType(defectType) {
    return axios.get(`/api/qc/defects/type/${defectType}`);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================
  bulkCreate(lotId, defects) {
    return axios.post(`/api/qc/defects/bulk/${lotId}`, { defects });
  },

  bulkDelete(ids) {
    return axios.delete("/api/qc/defects/bulk", { data: { ids } });
  },

  // ============================================
  // STATISTICS
  // ============================================
  getStats() {
    return axios.get("/api/qc/defects/stats");
  },

  getStatsByLot(lotId) {
    return axios.get(`/api/qc/defects/stats/lot/${lotId}`);
  },
};

export default qcDefectApi;
