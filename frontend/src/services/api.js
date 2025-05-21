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

// Flag to prevent multiple refresh attempts at once
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let refreshSubscribers = [];

// Function to retry the original request with new token
const retryOriginalRequest = (originalRequest) => {
  return new Promise(resolve => {
    const retryRequest = (newToken) => {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      resolve(axios(originalRequest));
    };
    refreshSubscribers.push(retryRequest);
  });
};

// Notify all subscribers that refresh is complete
const onRefreshSuccess = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

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

// Global error handling with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh for 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return retryOriginalRequest(originalRequest);
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('jwt_refresh');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.removeItem('jwt');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Attempt to refresh the token
        const response = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken
        });
        
        if (response.data.access) {
          // Store the new token
          localStorage.setItem('jwt', response.data.access);
          // Notify subscribers and retry original request
          onRefreshSuccess(response.data.access);
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwt_refresh');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // For other errors or if refresh fails
    if (error.response && [401, 403].includes(error.response.status)) {
      // Clear tokens and redirect to login for auth errors
      localStorage.removeItem('jwt');
      localStorage.removeItem('jwt_refresh');
      window.location.href = '/login';
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
