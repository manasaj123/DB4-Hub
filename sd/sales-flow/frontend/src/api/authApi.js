// api/authApi.js
import axios from "axios";

const API_URL = "http://localhost:5007/api/auth";

export const registerApi = async (name, email, password, role) => {
  const response = await axios.post(`${API_URL}/register`, {
    name,
    email,
    password,
    role  // Send role to backend
  });
  return response.data;
};

export const loginApi = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password
  });
  return response.data;
};