import axios from "axios";

const BASE = "http://localhost:4000/api/bom";

const bomApi = {
  // Get all BOM entries
  async list() {
    const res = await axios.get(BASE);
    return res.data;
  },

  // Get single BOM entry
  async getById(id) {
    const res = await axios.get(`${BASE}/${id}`);
    return res.data;
  },

  // Get BOM for a specific product
  async getByProduct(productId) {
    const res = await axios.get(`${BASE}/product/${productId}`);
    return res.data;
  },

  // Create BOM entry
  async create(data) {
    const res = await axios.post(BASE, data);
    return res.data;
  },

  // Update BOM entry
  async update(id, data) {
    const res = await axios.put(`${BASE}/${id}`, data);
    return res.data;
  },

  // Delete BOM entry
  async delete(id) {
    const res = await axios.delete(`${BASE}/${id}`);
    return res.data;
  },

  // Bulk create BOM entries
  async bulkCreate(entries) {
    const res = await axios.post(`${BASE}/bulk`, { entries });
    return res.data;
  },

  // Get products that have BOM
  async getProductsWithBOM() {
    const res = await axios.get(`${BASE}/stats/products-with-bom`);
    return res.data;
  },

  // Get materials used in BOM
  async getMaterialsUsed() {
    const res = await axios.get(`${BASE}/stats/materials-used`);
    return res.data;
  }
};

export default bomApi;