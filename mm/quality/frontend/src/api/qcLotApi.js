// frontend/src/api/qcLotApi.js
import axios from "./axiosInstance";

const qcLotApi = {
  // ============================================
  // QC LOTS
  // ============================================
  list(params) {
    return axios.get("/api/qc/lots", { params });
  },

  get(id) {
    return axios.get(`/api/qc/lots/${id}`);
  },

  create(data) {
    return axios.post("/api/qc/lots", data);
  },

  update(id, data) {
    return axios.put(`/api/qc/lots/${id}`, data);
  },

  delete(id) {
    return axios.delete(`/api/qc/lots/${id}`);
  },

  updateStatus(id, status) {
    return axios.patch(`/api/qc/lots/${id}/status`, { status });
  },

  // ============================================
  // QC RESULTS
  // ============================================
  recordResults(id, data) {
    return axios.post(`/api/qc/lots/${id}/results`, data);
  },

  getResults(lotId) {
    return axios.get(`/api/qc/lots/${lotId}/results`);
  },

  // ============================================
  // QC DEFECTS
  // ============================================
  getDefects(lotId) {
    return axios.get(`/api/qc/lots/${lotId}/defects`);
  },

  addDefect(lotId, data) {
    return axios.post(`/api/qc/lots/${lotId}/defects`, data);
  },

  // ============================================
  // BATCH OPERATIONS
  // ============================================
  getDetail(id) {
    return axios.get(`/api/qc/lots/${id}/detail`);
  },

  // Get lot with all results and defects
  getFullDetail(id) {
    return axios.get(`/api/qc/lots/${id}/full`);
  },
};

export default qcLotApi;
