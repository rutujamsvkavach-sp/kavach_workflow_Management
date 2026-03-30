import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kavach_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("kavach_token");
      localStorage.removeItem("kavach_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  getUsers: () => api.get("/auth/users"),
  updateUserApproval: (id, payload) => api.put(`/auth/users/${id}/approval`, payload),
};

export const recordsApi = {
  getAll: (params) => api.get("/data", { params }),
  create: (payload) => api.post("/data", payload),
  update: (id, payload) => api.put(`/data/${id}`, payload),
  remove: (id) => api.delete(`/data/${id}`),
};

export const uploadApi = {
  uploadFiles: (formData) =>
    api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default api;
