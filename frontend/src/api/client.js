import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = apiClient.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const refreshResponse = await refreshPromise;
        setAccessToken(refreshResponse.data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (name, email, password) => apiClient.post('/auth/register', { name, email, password }),
  refresh: (config) => apiClient.post('/auth/refresh', undefined, config),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

export const userApi = {
  getEmployees: () => apiClient.get('/users/employees'),
  getAllUsers: () => apiClient.get('/users'),
  updateRole: (id, role) => apiClient.patch(`/users/${id}/role`, { role }),
};

export const projectApi = {
  getAll: () => apiClient.get('/projects'),
  getById: (id) => apiClient.get(`/projects/${id}`),
  create: (payload) => apiClient.post('/projects', payload),
  update: (id, payload) => apiClient.put(`/projects/${id}`, payload),
  remove: (id) => apiClient.delete(`/projects/${id}`),
  getReport: () => apiClient.get('/projects/stats/report'),
};

export const taskApi = {
  getAll: (params) => apiClient.get('/tasks', { params }),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (payload) => apiClient.post('/tasks', payload),
  update: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
  getStats: () => apiClient.get('/tasks/stats/dashboard'),
  bulkUpdateStatus: (ids, status) => apiClient.patch('/tasks/bulk/status', { ids, status }),
  bulkRemove: (ids) => apiClient.delete('/tasks/bulk', { data: { ids } }),
};

export default apiClient;
