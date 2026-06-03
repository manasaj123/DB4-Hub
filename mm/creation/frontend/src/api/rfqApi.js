import axiosClient from "./axiosClient";

const rfqApi = {
  // Get all RFQs (for the list table)
  getAll() {
    return axiosClient.get("/rfq");
  },

  // Get single RFQ by ID (basic header + items + vendors)
  getById(id) {
    return axiosClient.get(`/rfq/${id}`);
  },

  // NEW: Get RFQ with full details + vendor quotes
  getRFQWithQuotes(id) {
    return axiosClient.get(`/rfq/${id}/with-quotes`);
  },

  // NEW: Save quotes for a specific vendor in an RFQ
  saveQuotes(data) {
    return axiosClient.post("/rfq/save-quotes", data);
  },

  // Create a new RFQ
  create(data) {
    return axiosClient.post("/rfq", data);
  },

  // Update an existing RFQ
  update(id, data) {
    return axiosClient.put(`/rfq/${id}`, data);
  },

  // Delete an RFQ
  deleteById(id) {
    return axiosClient.delete(`/rfq/${id}`);
  }
};

export default rfqApi;