import api from './api';

export const getQuotations = () => api.get('/quotations');
export const getDeletedQuotations = () => api.get('/quotations/deleted');
export const getQuotationById = (id) => api.get(`/quotations/${id}`);
export const createQuotation = (data) => api.post('/quotations', data);
export const updateQuotation = (id, data) => api.put(`/quotations/${id}`, data);
export const softDeleteQuotation = (id) => api.delete(`/quotations/${id}`);
export const restoreQuotation = (id) => api.put(`/quotations/${id}/restore`);
export const convertQuotationToOrder = (id) => api.post(`/quotations/${id}/convert-to-order`);

// Helpers (if needed, reuse from other services)
export const getCustomers = () => api.get('/customers');
export const getMaterials = () => api.get('/materials');
export const getInquiries = () => api.get('/inquiries'); // for reference selection