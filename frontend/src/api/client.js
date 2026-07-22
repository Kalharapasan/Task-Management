import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear auth state and bounce to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

export const taskApi = {
  getAll: (params) => apiClient.get('/tasks', { params }),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (payload) => apiClient.post('/tasks', payload),
  update: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
  getStats: () => apiClient.get('/tasks/stats/dashboard'),
};

export default apiClient;
