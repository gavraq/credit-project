import axios from 'axios';

// Set the base URL for the API (can be set from env var or fallback)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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
        const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
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

// API functions for credit applications
export const fetchCreditRequest = async (id) => {
  try {
    const response = await get(`/api/credit/credit-applications/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credit request:', error);
    throw error;
  }
};

export const submitCreditRequest = async (formData) => {
  try {
    const response = await post('/api/credit/credit-applications/', formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit request:', error);
    throw error;
  }
};

export const updateCreditRequest = async (id, formData) => {
  try {
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating credit request:', error);
    throw error;
  }
};

export const submitCreditReview = async (id, formData) => {
  try {
    console.log('Submitting credit review with data:', formData);
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit review:', error);
    throw error;
  }
};

export const performWorkflowTransition = async (workflowInstanceId, transitionCode, comments = '', systemContext = {}) => {
  try {
    console.log(`DEBUG: Performing workflow transition: ${transitionCode} on instance ${workflowInstanceId}`);
    const payload = {
      transition_code: transitionCode,
      comments: comments || ''
    };
    
    if (Object.keys(systemContext).length > 0) {
      payload.system_context = systemContext;
    }
    
    // Make sure to use the correct API endpoint with the /api prefix
    const url = `/api/workflow-instances/${workflowInstanceId}/transition/`;
    console.log(`DEBUG: Making POST request to: ${url} with payload:`, payload);
    
    try {
      const response = await post(url, payload);
      console.log('DEBUG: Transition response:', response.data);
      return response.data;
    } catch (postError) {
      console.error('DEBUG: Error in transition POST request:', postError);
      console.error('DEBUG: Error response:', postError.response?.data);
      throw postError;
    }
  } catch (error) {
    console.error('DEBUG: Error performing workflow transition:', error);
    throw error;
  }
};

// Function to fetch users by role
export const fetchUsersByRole = async (roleName) => {
  try {
    const encodedRoleName = encodeURIComponent(roleName);
    // Use the existing endpoint /api/users/?role=<role_name>
    const response = await get(`/api/users/?role=${encodedRoleName}`);
    return response.data; // Assuming the response is an array of user objects
  } catch (error) {
    console.error(`Error fetching users for role ${roleName}:`, error);
    throw error;
  }
};

export default api;
