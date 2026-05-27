import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Artwork APIs
export const artworkAPI = {
  getAll: () => api.get('/api/artworks'),
  getById: (id) => api.get(`/api/artworks/${id}`),
  create: (formData) => api.post('/api/artworks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/api/artworks/${id}`, data),
  delete: (id) => api.delete(`/api/artworks/${id}`),
};

// Commission APIs
export const commissionAPI = {
  getAll: () => api.get('/api/commissions'),
  getMyRequests: () => api.get('/api/commissions/my-requests'),
  create: (formData) => api.post('/api/commissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, data) => api.put(`/api/commissions/${id}`, data),
  cancel: (id, reason) => api.put(`/api/commissions/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/api/commissions/${id}`),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (formData) => api.put('/api/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;