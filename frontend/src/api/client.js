import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Required so the httpOnly refresh-token cookie is sent to /auth/refresh
  // and /auth/logout, even though the frontend and API run on different ports.
  withCredentials: true,
});

// The access token lives in memory (module-level variable), not
// localStorage/cookies, so it disappears on a full page reload by
// design — AuthContext re-obtains one via a silent /auth/refresh call
// on startup instead. This keeps the long-lived credential (the
// refresh token) exclusively in an httpOnly cookie the JS can't touch.
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

// If a request comes back 401 (expired access token), try exactly once
// to silently refresh it using the httpOnly cookie, then replay the
// original request. If the refresh itself fails, the session is truly
// over and the app redirects to /login.
let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
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
  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

export const taskApi = {
  getAll: (params) => apiClient.get('/tasks', { params }), // params may include page/limit
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (payload) => apiClient.post('/tasks', payload),
  update: (id, payload) => apiClient.put(`/tasks/${id}`, payload),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
  getStats: () => apiClient.get('/tasks/stats/dashboard'),
};

export default apiClient;
