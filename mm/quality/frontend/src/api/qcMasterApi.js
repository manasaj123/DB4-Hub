import axios from "./axiosInstance";

const qcMasterApi = {
  // ============================================
  // QC PARAMETERS
  // ============================================
  getParameters() {
    return axios.get("/api/qc/master/parameters");
  },

  getParameter(id) {
    return axios.get(`/api/qc/master/parameters/${id}`);
  },

  createParameter(data) {
    return axios.post("/api/qc/master/parameters", data);
  },

  updateParameter(id, data) {
    return axios.put(`/api/qc/master/parameters/${id}`, data);
  },

  deleteParameter(id) {
    return axios.delete(`/api/qc/master/parameters/${id}`);
  },

  // ============================================
  // MATERIAL QC TEMPLATES
  // ============================================
  getTemplate(materialId) {
    return axios.get(`/api/qc/master/templates/${materialId}`);
  },

  saveTemplate(materialId, params) {
    return axios.post(`/api/qc/master/templates/${materialId}`, { params });
  },

  listTemplates() {
    return axios.get("/api/qc/master/templates");
  },

  deleteTemplate(materialId) {
    return axios.delete(`/api/qc/master/templates/${materialId}`);
  },

  // ============================================
  // QC PLANS
  // ============================================
  getPlans() {
    return axios.get("/api/qc/master/plans");
  },

  getPlan(id) {
    return axios.get(`/api/qc/master/plans/${id}`);
  },

  createPlan(data) {
    return axios.post("/api/qc/master/plans", data);
  },

  updatePlan(id, data) {
    return axios.put(`/api/qc/master/plans/${id}`, data);
  },

  deletePlan(id) {
    return axios.delete(`/api/qc/master/plans/${id}`);
  },
};

export default qcMasterApi;
