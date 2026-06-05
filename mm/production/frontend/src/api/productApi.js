import axios from "axios";

const BASE = "http://localhost:4000/api/products";

const productApi = {
  // Get all products
  async list() {
    const res = await axios.get(BASE);
    return res.data;
  },
  
  // Create new product
  async create(data) {
    const res = await axios.post(BASE, data);
    return res.data;
  },
  
  // Update product
  async update(id, data) {
    const res = await axios.put(`${BASE}/${id}`, data);
    return res.data;
  },
  
  // Delete product
  async delete(id) {
    const res = await axios.delete(`${BASE}/${id}`);
    return res.data;
  },
  
  // Get only finished products
  async getFinished() {
    const res = await axios.get(`${BASE}?type=finished`);
    return res.data;
  },
  
  // Get only raw materials
  async getRawMaterials() {
    const res = await axios.get(`${BASE}?type=raw_material`);
    return res.data;
  },
  
  // Get only packaging materials
  async getPackaging() {
    const res = await axios.get(`${BASE}?type=packaging`);
    return res.data;
  }
};

export default productApi;