// frontend/src/services/billingService.js
import api from './api';

export const getBillings = () => api.get('/billings');
export const getDeletedBillings = () => api.get('/billings/deleted');
export const getBillingById = id => api.get(`/billings/${id}`);
export const createBilling = data => api.post('/billings', data);
export const updateBilling = (id, data) => api.put(`/billings/${id}`, data);
export const softDeleteBilling = id => api.delete(`/billings/${id}`);
export const restoreBilling = id => api.put(`/billings/${id}/restore`);

// helpers
export const getDeliveries = () => api.get('/deliveries');

//new

export const getUnbilledDeliveries = () => api.get('/billings/unbilled-deliveries');
