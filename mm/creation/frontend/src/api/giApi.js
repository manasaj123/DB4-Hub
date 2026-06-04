import axiosClient from "./axiosClient";

const giApi = {
  getAll() {
    return axiosClient.get("/gi");
  },
  getById(id) {
    return axiosClient.get(`/gi/${id}`);
  },
  create(data) {
    return axiosClient.post("/gi", data);
  },
  update(id, data) {
    return axiosClient.put(`/gi/${id}`, data);
  },
  deleteById(id) {
    return axiosClient.delete(`/gi/${id}`);
  },
  getPOsForIssue() {
    return axiosClient.get("/gi/pos-for-issue");
  },
};

export default giApi;
