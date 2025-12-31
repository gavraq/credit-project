import axios from 'axios';

// Set the base URL for the API (can be set from env var or fallback)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Use the default axios transformRequest
  // This will ensure proper JSON serialization
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
      resolve(api(originalRequest));
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
          const newAccessToken = response.data.access;
          // Store the new token
          localStorage.setItem('jwt', newAccessToken);
          
          // Update the default authorization header for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Update the authorization header for the original request
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Notify subscribers with the new token
          onRefreshSuccess(newAccessToken);

          // Retry the original request with the updated header
          return api(originalRequest);
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
export const post = (url, data, config) => {
  // Debug the request data
  console.log('POST request to:', url);
  console.log('POST data type:', typeof data);
  console.log('POST data:', data);
  
  // If data contains limit_requests, log it specifically
  if (data && data.limit_requests) {
    console.log('limit_requests type:', typeof data.limit_requests);
    console.log('limit_requests is array:', Array.isArray(data.limit_requests));
    console.log('limit_requests[0] type:', data.limit_requests[0] ? typeof data.limit_requests[0] : 'N/A');
    console.log('limit_requests:', JSON.stringify(data.limit_requests, null, 2));
  }
  
  return api.post(url, data, config);
};
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

export const submitCreditRequest = async (payload) => {
  try {
    console.log('Submitting credit request with JSON payload:', payload);

    if (!payload || !payload.title) {
      throw new Error('Form data is incomplete. Title is required.');
    }

    if (!payload.counterparty_id) {
      console.warn('WARNING: counterparty_id is null or undefined. This will likely cause a 400 error.');
    }

    const response = await api.post('/api/credit/credit-applications/', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting credit request:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const updateCreditRequest = async (id, payload) => {
  try {
    console.log(`Updating credit request ${id} with JSON payload:`, payload);
    const response = await api.patch(`/api/credit/credit-applications/${id}/`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating credit request:', error.response ? error.response.data : error.message);
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

export const performWorkflowTransition = async (workflowInstanceId, payload) => {
  try {
    console.log(`Performing workflow transition for instance ${workflowInstanceId} with payload:`, payload);
    const response = await api.post(`/api/workflow-instances/${workflowInstanceId}/transition/`, payload);
    return response.data;
  } catch (error) {
    console.error('Error performing workflow transition:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const saveBusinessSponsorshipForm = async (id, formData) => {
  try {
    console.log(`Submitting business sponsorship form for ID ${id} with data:`, formData);
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting business sponsorship form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};


export const saveCreditQuestionnaireForm = async (id, formData) => {
  try {
    console.log(`Submitting credit questionnaire form for ID ${id} with data:`, formData);
    // The formData is already expected to be structured with a top-level key 
    // (e.g., { credit_questionnaire_form: { ... } }) by the component calling this.
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit questionnaire form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const saveCreditAnalysisForm = async (id, formData) => {
  try {
    console.log(`Submitting credit analysis form for ID ${id} with data:`, formData);
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit analysis form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const saveLegalReviewForm = async (id, formData) => {
  try {
    console.log(`Submitting legal review form for ID ${id} with data:`, formData);
    // The formData is expected to be structured with a top-level key 
    // (e.g., { legal_review_form: { ... } }) by the component calling this.
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting legal review form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const saveCreditCompilationForm = async (id, formData) => {
  try {
    console.log(`Submitting credit compilation form for ID ${id} with data:`, formData);
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit compilation form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const saveCreditApprovalForm = async (id, formData) => {
  try {
    console.log(`Submitting credit approval form for ID ${id} with data:`, formData);
    const response = await patch(`/api/credit/credit-applications/${id}/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting credit approval form:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Climate Scorecard API functions
export const saveClimateScorecard = async (id, formData) => {
  try {
    console.log(`Saving climate scorecard for ID ${id} with data:`, formData);
    const response = await patch(`/api/credit/credit-applications/${id}/climate-scorecard/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error saving climate scorecard:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const generateClimateScorecard = async (id) => {
  try {
    console.log(`Generating AI climate scorecard for ID ${id}`);
    const response = await post(`/api/credit/credit-applications/${id}/climate-scorecard/generate/`);
    return response.data;
  } catch (error) {
    console.error('Error generating climate scorecard:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const getApplicationsAwaitingMyApproval = async () => {
  try {
    const response = await get('/api/credit/credit-applications/awaiting-my-approval/');
    return response.data;
  } catch (error) {
    console.error('Error fetching applications awaiting approval:', error);
    throw error;
  }
};

// Function to fetch a list of counterparties
export const fetchCounterpartyList = async () => {
  try {
    const response = await get(`/api/credit/counterparties/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching counterparty list:', error);
    throw error;
  }
};

// Function to fetch a list of limit types
export const fetchLimitTypes = async () => {
  try {
    const response = await get(`/api/credit/limit-types/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching limit types:', error);
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
