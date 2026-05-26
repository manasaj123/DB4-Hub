import api from './api';

export const addStock = (data) => api.post('/stock', data);
export const getStock = (params) => api.get('/stock', { params });