// frontend/src/services/customerService.js
import api from './api';

export const getCustomers = () => {
  console.log('Fetching active customers...');
  return api.get('/customers');
};

export const getDeletedCustomers = () => {
  console.log('Fetching deleted customers...');
  return api.get('/customers/deleted');
};

export const getCustomerById = id => {
  console.log('Fetching customer by ID:', id);
  return api.get(`/customers/${id}`);
};

export const createCustomer = data => {
  console.log('Creating customer with data:', data);
  return api.post('/customers', data);
};

export const updateCustomer = (id, data) => {
  console.log('Updating customer:', id, data);
  return api.put(`/customers/${id}`, data);
};

export const softDeleteCustomer = id => {
  console.log('Soft deleting customer:', id);
  return api.delete(`/customers/${id}`);
};

export const restoreCustomer = id => {
  console.log('Restoring customer:', id);
  return api.put(`/customers/${id}/restore`);
};