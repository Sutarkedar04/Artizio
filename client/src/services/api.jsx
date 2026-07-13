import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const artworkAPI = {
  getAll: () => api.get('/api/artworks'),
  getMyArtworks: () => api.get('/api/artworks/my-artworks'),
  getById: (id) => api.get(`/api/artworks/${id}`),
  create: (formData) => api.post('/api/artworks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/api/artworks/${id}`, data),
  delete: (id) => api.delete(`/api/artworks/${id}`),
  setFeatured: (id, isFeatured) => api.patch(`/api/artworks/${id}/feature`, { isFeatured }),
};

export const commissionAPI = {
  getAll: () => api.get('/api/commissions'),
  getMyRequests: () => api.get('/api/commissions/my-requests'),
  getArtistCommissions: () => api.get('/api/commissions/artist-commissions'),
  create: (formData) => api.post('/api/commissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, data) => api.put(`/api/commissions/${id}`, data),
  updateArtistStatus: (id, data) => api.put(`/api/commissions/${id}/artist-status`, data),
  cancel: (id, reason) => api.put(`/api/commissions/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/api/commissions/${id}`),
};

export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (formData) => api.put('/api/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verifyEmail: (token) => api.get(`/api/users/verify-email/${token}`),
  resendVerification: (email) => api.post('/api/users/resend-verification', { email }),
  upgradeToArtist: () => api.post('/api/users/upgrade-to-artist'),
  switchToUser: () => api.post('/api/users/switch-to-user'),
  getArtistStatus: () => api.get('/api/users/artist-status'),
  followUser: (userId) => api.post(`/api/users/${userId}/follow`),
  getFollowers: (userId) => api.get(`/api/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/api/users/${userId}/following`),
};

export const communityAPI = {
  getFeed: () => api.get('/api/community/feed'),
  likeArtwork: (id) => api.post(`/api/community/${id}/like`),
  commentOnArtwork: (id, text) => api.post(`/api/community/${id}/comments`, { text }),
  deleteComment: (artworkId, commentId) => api.delete(`/api/community/${artworkId}/comments/${commentId}`),
  getTrending: () => api.get('/api/community/trending'),
  searchArtworks: (params) => api.get('/api/community/search', { params }),
};

export const artistAPI = {
  getProfile: (id) => api.get(`/api/artists/${id}`),
  search: (query) => api.get('/api/artists', { params: { search: query } }),
  updateProfile: (data) => api.put('/api/artists/profile', data),
  followArtist: (id) => api.post(`/api/artists/${id}/follow`),
  getArtistArtworks: (id) => api.get(`/api/artists/${id}/artworks`),
};


export default api;