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
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);

// API functions for credit applications
export const fetchCreditRequest = async (id) => (await get(`/api/credit/credit-applications/${id}/`)).data;

export const submitCreditRequest = async (payload) => {
  if (!payload || !payload.title) {
    throw new Error('Form data is incomplete. Title is required.');
  }

  return (
    await api.post('/api/credit/credit-applications/', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  ).data;
};

export const updateCreditRequest = async (id, payload) => (
  await api.patch(`/api/credit/credit-applications/${id}/`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
).data;

export const submitCreditReview = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_review_form', formData);
};

export const performWorkflowTransition = async (workflowInstanceId, payload) => (
  await api.post(`/api/workflow-instances/${workflowInstanceId}/transition/`, payload)
).data;

export const fetchCreditArtifact = async (id, artifactKey) => (
  await get(`/api/credit/credit-applications/${id}/artifacts/${artifactKey}/`)
).data;

export const findArtifactByKey = (application, artifactKey) => (
  application?.artifacts?.find((artifact) => artifact.key === artifactKey) || null
);

export const findArtifactActionByKey = (artifact, actionKey) => (
  artifact?.actions?.find((action) => action.key === actionKey) || null
);

export const findArtifactActionByCapability = (artifact, capability) => {
  if (!artifact?.capabilities?.includes(capability)) {
    return null;
  }

  return findArtifactActionByKey(artifact, capability);
};

export const saveCreditArtifact = async (id, artifactKey, formData) => (
  await patch(`/api/credit/credit-applications/${id}/artifacts/${artifactKey}/`, formData)
).data;

export const saveBusinessSponsorshipForm = async (id, formData) => {
  return saveCreditArtifact(id, 'business_sponsorship_form', formData);
};

export const saveCreditRequestForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_request_form', formData);
};

export const saveCreditReviewForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_review_form', formData);
};


export const saveCreditQuestionnaireForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_questionnaire_form', formData);
};

export const saveCreditAnalysisForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_analysis_form', formData);
};

export const saveLegalReviewForm = async (id, formData) => {
  return saveCreditArtifact(id, 'legal_review_form', formData);
};

export const saveCreditCompilationForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_compilation_form', formData);
};

export const saveCreditApprovalForm = async (id, formData) => {
  return saveCreditArtifact(id, 'credit_approval_form', formData);
};

// Climate Scorecard API functions
export const saveClimateScorecard = async (id, formData) => (
  await patch(`/api/credit/credit-applications/${id}/climate-scorecard/`, formData)
).data;

export const invokeArtifactAction = async (action, payload = {}) => {
  if (!action?.path || !action?.method) {
    throw new Error('Artifact action is missing path or method');
  }

  const method = action.method.toLowerCase();
  const config = {
    url: action.path,
    method,
  };

  if (method !== 'get' && method !== 'delete') {
    config.data = payload;
  }

  return (await api.request(config)).data;
};

export const getApplicationsAwaitingMyApproval = async () => (
  await get('/api/credit/credit-applications/awaiting-my-approval/')
).data;

// Function to fetch a list of counterparties
export const fetchCounterpartyList = async () => (await get(`/api/credit/counterparties/`)).data;

// Function to fetch a list of limit types
export const fetchLimitTypes = async () => (await get(`/api/credit/limit-types/`)).data;

// Function to fetch users by role
export const fetchUsersByRole = async (roleName) => {
  const encodedRoleName = encodeURIComponent(roleName);
  // Use the existing endpoint /api/users/?role=<role_name>
  return (await get(`/api/users/?role=${encodedRoleName}`)).data;
};

export default api;
