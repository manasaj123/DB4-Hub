import axios from "./axiosInstance";

const capaApi = {
  // List all CAPA records with optional filters
  list(params) {
    return axios.get("/api/qc/capa", { params });
  },

  // Get single CAPA by ID
  get(id) {
    return axios.get(`/api/qc/capa/${id}`);
  },

  // Create new CAPA
  create(data) {
    return axios.post("/api/qc/capa", data);
  },

  // Update CAPA status
  updateStatus(id, status) {
    return axios.patch(`/api/qc/capa/${id}/status`, { status });
  },

  // Update entire CAPA
  update(id, data) {
    return axios.put(`/api/qc/capa/${id}`, data);
  },

  // Delete CAPA
  delete(id) {
    return axios.delete(`/api/qc/capa/${id}`);
  },

  // Get CAPA by lot ID
  getByLot(lotId) {
    return axios.get(`/api/qc/capa/lot/${lotId}`);
  },

  // Get CAPA by defect ID
  getByDefect(defectId) {
    return axios.get(`/api/qc/capa/defect/${defectId}`);
  },
};

export default capaApi;
