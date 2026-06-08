import axiosClient from "./axiosClient";

const invoiceApi = {
  getAll: () => axiosClient.get("/invoices"),
  create: (data) => axiosClient.post("/invoices", data),
  verify: (id) => axiosClient.patch(`/invoices/${id}/verify`),
  toggleBlock: (id) => axiosClient.patch(`/invoices/${id}/toggle-block`),
  getLineItems: (id) => axiosClient.get(`/invoices/${id}/items`),
};

export default invoiceApi;
