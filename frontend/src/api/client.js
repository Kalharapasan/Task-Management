import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let accessToken = null;
let refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshToken(token) {
  refreshToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
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
          const activeRefreshToken = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
          refreshPromise = apiClient
            .post('/auth/refresh', { refreshToken: activeRefreshToken })
            .then((res) => {
              if (res.data?.data?.refreshToken) {
                setRefreshToken(res.data.data.refreshToken);
              }
              return res;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const refreshResponse = await refreshPromise;
        setAccessToken(refreshResponse.data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.data?.refreshToken) {
      setRefreshToken(res.data.data.refreshToken);
    }
    return res;
  },
  register: (name, email, password) => apiClient.post('/auth/register', { name, email, password }),
  refresh: (config) => {
    const activeRefreshToken = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
    return apiClient.post('/auth/refresh', { refreshToken: activeRefreshToken }, config);
  },
  logout: async () => {
    const activeRefreshToken = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
    try {
      await apiClient.post('/auth/logout', { refreshToken: activeRefreshToken });
    } finally {
      setRefreshToken(null);
      setAccessToken(null);
    }
  },
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
