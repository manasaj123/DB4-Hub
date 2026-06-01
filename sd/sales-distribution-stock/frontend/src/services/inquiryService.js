// frontend/src/services/inquiryService.js
import api from "./api";

export const getInquiries = () => api.get("/inquiries");
export const getDeletedInquiries = () => api.get("/inquiries/deleted");
export const getInquiryById = (id) => api.get(`/inquiries/${id}`);
export const createInquiry = (data) => api.post("/inquiries", data);
export const updateInquiry = (id, data) => api.put(`/inquiries/${id}`, data);
export const softDeleteInquiry = (id) => api.delete(`/inquiries/${id}`);
export const restoreInquiry = (id) => api.put(`/inquiries/${id}/restore`);
export const convertInquiryToOrder = (id) =>
  api.post(`/inquiries/${id}/convert-to-order`);

// helpers
export const getCustomers = () => api.get("/customers");
export const getMaterials = () => api.get("/materials");
