# Credit Risk Workflow System - API Service Implementation

This document details the implementation of the API service layer for the Credit Risk Workflow System. The API service provides a centralized interface for all frontend-to-backend communication, ensuring consistent authentication, error handling, and endpoint usage.

## 1. API Service Overview

The API service layer follows these key principles:

1. **Consistent Endpoint Usage**: All API endpoints use the `/api/` prefix
2. **Centralized Authentication**: JWT tokens are managed automatically
3. **Standardized Error Handling**: Consistent approach to handling errors
4. **Service Abstraction**: Business logic is encapsulated in service functions

## 2. API Base Configuration

The API service is configured with a base URL and default headers. The base URL does not include the `/api/` prefix, as this is added to individual endpoint paths.

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
```

## 3. API Utility Functions

The API service provides utility functions for different HTTP methods, ensuring consistent usage of the `/api/` prefix:

```jsx
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
```

## 4. Authentication Handling

The API service automatically handles authentication by adding JWT tokens to requests and refreshing expired tokens:

```jsx
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
```

## 5. Service-Specific Implementations

### 5.1 Authentication Service

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

### 5.2 Form Data Services

Instead of a single, monolithic `applicationService.js`, the API services are organized by form type, each providing a generic save function that aligns with the backend's `@action` endpoints. All save functions send a flat `formData` object.

```jsx
// frontend/src/services/api.js (or a dedicated form service file)

import { patch, post } from './api';

// Used for creating any new application
export const createCreditApplication = async (data) => {
  const response = await post('/api/credit-applications/', data);
  return response.data;
};

// Used for saving an existing Credit Request form
export const saveCreditRequestForm = async (id, data) => {
  const response = await patch(`/api/credit-applications/${id}/save_credit_request_form/`, data);
  return response.data;
};

// Used for saving an existing Business Sponsorship form
export const saveBusinessSponsorshipForm = async (id, data) => {
  const response = await patch(`/api/credit-applications/${id}/save_business_sponsorship_form/`, data);
  return response.data;
};

// Used for saving an existing Credit Questionnaire form
export const saveCreditQuestionnaireForm = async (id, data) => {
  const response = await patch(`/api/credit-applications/${id}/save_credit_questionnaire_form/`, data);
  return response.data;
};

// Used for saving an existing Legal Review form
export const saveLegalReviewForm = async (id, data) => {
  const response = await patch(`/api/credit-applications/${id}/save_legal_review_form/`, data);
  return response.data;
};
```
```

### 5.3 Workflow Service

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

### 5.4 Document Service

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
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  getDocumentPreview: async (documentId) => {
    const response = await get(`/api/documents/${documentId}/preview/`);
    return response.data;
  }
};

export default documentService;
```

## 6. Backend URL Configuration

The backend URL configuration ensures all API endpoints are prefixed with `/api/`:

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

## 7. Implementation Notes

1. All frontend components should use the API service functions rather than making direct axios calls
2. All API endpoints must include the `/api/` prefix
3. JWT tokens are stored in localStorage under the keys `jwt` and `jwt_refresh`
4. Token refresh is handled automatically on 401 errors
5. Environment-specific API base URLs are configured via environment variables
