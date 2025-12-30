# API Endpoints Update for Architecture Document

## Overview

This document outlines the necessary updates to the Credit Risk Workflow Architecture document to ensure consistent API endpoint usage with the `/api/` prefix. These changes will align the architecture documentation with the actual implementation, which uses the `/api/` prefix for all backend routes.

## Required Updates

### 1. Frontend API Service Configuration

The current API service configuration in the architecture document should be updated to:

```jsx
// frontend/src/services/api.js
import axios from 'axios';

// Base URL should not include trailing '/api' as it's added to each endpoint
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API utility functions with consistent /api/ prefix
export const get = async (url, config = {}) => {
  const response = await api.get(url, config);
  return response;
};

export const post = async (url, data, config = {}) => {
  const response = await api.post(url, data, config);
  return response;
};

export const put = async (url, data, config = {}) => {
  const response = await api.put(url, data, config);
  return response;
};

export const patch = async (url, data, config = {}) => {
  const response = await api.patch(url, data, config);
  return response;
};

export const del = async (url, config = {}) => {
  const response = await api.delete(url, config);
  return response;
};

// Add auth token to requests
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

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('jwt_refresh');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await api.post('/api/token/refresh/', { refresh: refreshToken });
        const { access } = response.data;
        
        // Update stored token
        localStorage.setItem('jwt', access);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwt_refresh');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Service-Specific API Endpoint Updates

The following service implementations need to be updated to consistently use the `/api/` prefix:

#### Authentication Service

```jsx
// frontend/src/services/authService.js
import { post, get } from './api';

const authService = {
  login: async (credentials) => {
    const response = await post('/api/token/', credentials);
    const { access, refresh, user } = response.data;
    
    // Store tokens
    localStorage.setItem('jwt', access);
    localStorage.setItem('jwt_refresh', refresh);
    
    return user;
  },
  
  logout: () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwt_refresh');
  },
  
  getCurrentUser: async () => {
    const response = await get('/api/users/profile/');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt');
  },
};

export default authService;
```

#### Application Service

```jsx
// frontend/src/services/applicationService.js
import { get, post, patch } from './api';

const applicationService = {
  getApplications: async (filters = {}) => {
    const response = await get('/api/credit/credit-applications/', { params: filters });
    return response.data;
  },
  
  getApplication: async (id) => {
    const response = await get(`/api/credit/credit-applications/${id}/`);
    return response.data;
  },
  
  createApplication: async (data) => {
    const response = await post('/api/credit/credit-applications/', data);
    return response.data;
  },
  
  updateApplication: async (id, data) => {
    const response = await patch(`/api/credit/credit-applications/${id}/`, data);
    return response.data;
  },
  
  getFormConfiguration: async (formName) => {
    const response = await get('/api/credit/credit-applications/form_configuration/', {
      params: { form_name: formName }
    });
    return response.data;
  },
  
  getDropdownOptions: async (dropdownName, context = null) => {
    const params = { dropdown_name: dropdownName };
    if (context) {
      params.context = context;
    }
    
    const response = await get('/api/credit/credit-applications/dropdown_options/', { params });
    return response.data;
  }
};

export default applicationService;
```

#### Workflow Service

```jsx
// frontend/src/services/workflowService.js
import { get, post } from './api';

const workflowService = {
  getWorkflowState: async (instanceId) => {
    const response = await get(`/api/workflow-instances/${instanceId}/`);
    return response.data;
  },
  
  getAvailableTransitions: async (instanceId) => {
    const response = await get(`/api/workflow-instances/${instanceId}/allowed-transitions/`);
    return response.data;
  },
  
  executeTransition: async (instanceId, transitionName, metadata = {}) => {
    const data = {
      transition: transitionName,
      metadata
    };
    
    const response = await post(`/api/workflow-instances/${instanceId}/transition/`, data);
    return response.data;
  }
};

export default workflowService;
```

#### Document Service

```jsx
// frontend/src/services/documentService.js
import { get, post } from './api';

const documentService = {
  getDocuments: async (contentTypeId, objectId) => {
    const response = await get('/api/documents/', {
      params: { content_type_id: contentTypeId, object_id: objectId }
    });
    return response.data;
  },
  
  getDocumentTypes: async () => {
    const response = await get('/api/document-types/');
    return response.data;
  },
  
  uploadDocument: async (formData, onProgressCallback = null) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    if (onProgressCallback) {
      config.onUploadProgress = onProgressCallback;
    }
    
    const response = await post('/api/documents/', formData, config);
    return response.data;
  },
  
  downloadDocument: async (documentId) => {
    const response = await get(`/api/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
    
    // Handle download logic
    return response.data;
  },
  
  getDocumentPreview: async (documentId) => {
    const response = await get(`/api/documents/${documentId}/preview/`);
    return response.data;
  }
};

export default documentService;
```

### 3. Backend URL Configuration

Update the backend URL configuration section to clarify that all API endpoints should be prefixed with `/api/`:

```python
# credit_risk_project/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/workflow-instances/', include('workflow_engine.urls')),
    path('api/credit/', include('credit_applications.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/token/', include('rest_framework_simplejwt.urls')),
]
```

## Implementation Notes

1. All frontend API calls must use the `/api/` prefix to match the backend URL routing.
2. The `REACT_APP_API_BASE_URL` environment variable should be set to the base URL without the trailing `/api`.
3. The architecture document should be updated to reflect these changes for consistency.
4. All components that make direct API calls should be updated to use the service functions that include the `/api/` prefix.
