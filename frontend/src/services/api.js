import axios from 'axios';

// Set the base URL for the API (can be set from env var or fallback)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Create an Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT token attach (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally: handle specific error codes or show notifications
    if (error.response) {
      // Unauthorized or forbidden
      if ([401, 403].includes(error.response.status)) {
        // Optionally trigger logout or redirect
      }
    }
    return Promise.reject(error);
  }
);

// Example API methods
export const get = (url, config) => api.get(url, config);
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);

export default api;
