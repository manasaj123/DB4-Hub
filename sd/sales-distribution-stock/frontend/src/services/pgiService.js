import api from "./api";

export const getReadyDeliveries = () => api.get("/pgi/ready");
export const performPGI = (deliveryId) => api.post(`/pgi/${deliveryId}`);
