# Credit Risk Workflow System - Authentication Implementation

This document details the implementation of the authentication system for the Credit Risk Workflow System. The authentication system provides user management, role-based access control, and secure token-based authentication.

## 1. Authentication Overview

The authentication system is designed to:

1. Manage user accounts with role-based permissions
2. Provide secure JWT token-based authentication
3. Handle token refresh for extended sessions
4. Protect routes based on user roles and permissions

## 2. Backend Implementation

### 2.1 Custom User Model

```python
# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class Department(models.Model):
    """Department model for organizational structure."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    """Role model for user permissions."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom User model with email as the unique identifier."""
    username = None
    email = models.EmailField(_('email address'), unique=True)
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    roles = models.ManyToManyField(
        Role,
        related_name='users',
        blank=True
    )
    phone_number = models.CharField(max_length=20, blank=True)
    position = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()

    def has_role(self, role_name):
        """Check if user has a specific role."""
        return self.roles.filter(name=role_name, is_active=True).exists()

    def has_permission(self, permission):
        """Check if user has a specific permission through any of their roles."""
        for role in self.roles.filter(is_active=True):
            if permission in role.permissions:
                return True
        return False
```

### 2.2 Serializers

```python
# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, Role

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    roles_info = RoleSerializer(source='roles', many=True, read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'password',
            'department', 'department_name', 'roles', 'roles_info',
            'phone_number', 'position', 'profile_image',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        roles = validated_data.pop('roles', [])
        
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        if roles:
            user.roles.set(roles)
        
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        roles = validated_data.pop('roles', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        if roles is not None:
            instance.roles.set(roles)
        
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'department', 'department_name', 'roles',
            'phone_number', 'position', 'profile_image'
        ]
        read_only_fields = ['id', 'email']
    
    def get_roles(self, obj):
        return [{'id': role.id, 'name': role.name} for role in obj.roles.all()]
```

### 2.3 Views

```python
# users/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Department, Role
from .serializers import (
    UserSerializer, UserProfileSerializer,
    DepartmentSerializer, RoleSerializer
)
from .permissions import IsAdminUser, IsOwnerOrAdmin

User = get_user_model()

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(roles__name=role)
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department__name=department)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        return queryset
    
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin])
    def profile(self, request):
        if request.method == 'GET':
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data)
        
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Both current_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'success': 'Password updated successfully'})
```

### 2.4 Permissions

```python
# users/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.has_role('admin'))


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admins to view/edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is admin or staff
        if request.user.is_staff or request.user.has_role('admin'):
            return True
        
        # Allow if user is the owner
        return obj == request.user
```

### 2.5 URLs

```python
# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, DepartmentViewSet, RoleViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### 2.6 JWT Configuration

```python
# credit_risk_project/settings.py
from datetime import timedelta

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
```

## 3. Frontend Implementation

### 3.1 Authentication Service

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
    const response = await get('/api/auth/users/profile/');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt');
  },
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('jwt_refresh');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await post('/api/token/refresh/', { refresh: refreshToken });
    const { access } = response.data;
    
    localStorage.setItem('jwt', access);
    return access;
  },
  
  updateProfile: async (profileData) => {
    const response = await post('/api/auth/users/profile/', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await post('/api/auth/users/change_password/', passwordData);
    return response.data;
  }
};

export default authService;
```

### 3.2 Login Component

```jsx
// frontend/src/components/Login/index.jsx
import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const history = useHistory();
  const location = useLocation();
  
  // Get the return URL from location state or default to dashboard
  const { from } = location.state || { from: { pathname: '/dashboard' } };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await authService.login({ email, password });
      
      // Redirect to the page user was trying to access
      history.replace(from);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

### 3.3 Protected Route Component

```jsx
// frontend/src/components/ProtectedRoute/index.jsx
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        // Check if user is authenticated
        const isAuthenticated = authService.isAuthenticated();
        
        if (!isAuthenticated) {
          // Not logged in, redirect to login page with return URL
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }
        
        // If roles are specified, check if user has required role
        if (roles && roles.length > 0) {
          const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]');
          const hasRequiredRole = roles.some(role => userRoles.includes(role));
          
          if (!hasRequiredRole) {
            // User doesn't have required role, redirect to unauthorized page
            return <Redirect to="/unauthorized" />;
          }
        }
        
        // User is authenticated and has required role, render component
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
```

### 3.4 Logout Button Component

```jsx
// frontend/src/components/LogoutButton/index.jsx
import React from 'react';
import { useHistory } from 'react-router-dom';
import authService from '../../services/authService';

const LogoutButton = () => {
  const history = useHistory();
  
  const handleLogout = () => {
    authService.logout();
    history.push('/login');
  };
  
  return (
    <button 
      className="logout-button"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
```

### 3.5 Auth Context Provider

```jsx
// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        } catch (error) {
          console.error('Error loading user:', error);
          // If token is invalid, logout
          authService.logout();
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);
  
  const value = {
    currentUser,
    setCurrentUser,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### 3.6 App Routing with Authentication

```jsx
// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreditRequestForm from './components/CreditRequestForm';
import Unauthorized from './components/Unauthorized';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/unauthorized" component={Unauthorized} />
          <ProtectedRoute exact path="/dashboard" component={Dashboard} />
          <ProtectedRoute 
            path="/credit-request/new" 
            component={CreditRequestForm} 
          />
          <ProtectedRoute 
            path="/credit-request/:id" 
            component={CreditRequestForm} 
          />
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </AuthProvider>
    </Router>
  );
};

export default App;
```

## 4. API Token Management

### 4.1 Token Storage

JWT tokens are stored in the browser's localStorage:

- Access token: `jwt`
- Refresh token: `jwt_refresh`

### 4.2 Token Refresh

The API service automatically handles token refresh when a 401 Unauthorized response is received:

```jsx
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

## 5. Implementation Notes

1. The authentication system uses JWT tokens for secure, stateless authentication
2. All API endpoints use the `/api/` prefix for consistency
3. The system supports role-based access control with custom permissions
4. Token refresh is handled automatically on 401 errors
5. Protected routes ensure only authenticated users with appropriate roles can access certain pages
6. The logout button is included in the top navigation bar for easy access

## 6. Security Enhancements

### 6.1 Password Policies

Strong password policies are enforced through Django's password validation:

```python
# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'users.validators.PasswordComplexityValidator',
    },
]
```

Custom complexity validator:

```python
# users/validators.py
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class PasswordComplexityValidator:
    """Validate that the password meets complexity requirements."""

    def validate(self, password, user=None):
        if not any(char.isdigit() for char in password):
            raise ValidationError(
                _("Password must contain at least 1 digit."),
                code='password_no_digit',
            )

        if not any(char.isupper() for char in password):
            raise ValidationError(
                _("Password must contain at least 1 uppercase letter."),
                code='password_no_upper',
            )

        if not any(char.islower() for char in password):
            raise ValidationError(
                _("Password must contain at least 1 lowercase letter."),
                code='password_no_lower',
            )

        if not any(char in '!@#$%^&*()_-+={}[]\\|:;"\'<>,.?/' for char in password):
            raise ValidationError(
                _("Password must contain at least 1 special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 1 digit, 1 uppercase letter, "
            "1 lowercase letter, and 1 special character."
        )
```

### 6.2 Object-Level Permissions

Fine-grained permissions for credit applications:

```python
# credit_applications/permissions.py
from rest_framework import permissions

class IsOwnerOrAssignee(permissions.BasePermission):
    """Object-level permission for application owners or assignees."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        return (obj.created_by == request.user or
                obj.assigned_to == request.user)


class CanTransitionWorkflow(permissions.BasePermission):
    """Permission to check if user can perform a workflow transition."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        workflow_instance_id = request.data.get('workflow_instance')
        transition_id = request.data.get('transition')

        if not workflow_instance_id or not transition_id:
            return False

        try:
            workflow_instance = WorkflowInstance.objects.get(id=workflow_instance_id)
            transition = Transition.objects.get(id=transition_id)

            # Check user's role against transition permissions
            user_role = request.user.role.code if request.user.role else None
            if user_role and user_role in transition.role_permissions:
                return True

            # Check user's department against transition permissions
            user_department = request.user.department.code if request.user.department else None
            if user_department and user_department in transition.department_permissions:
                return True

            return False
        except (WorkflowInstance.DoesNotExist, Transition.DoesNotExist):
            return False
```

### 6.3 Permission Decorators

Custom decorators for view-level permission enforcement:

```python
# users/decorators.py
from functools import wraps
from django.shortcuts import redirect
from django.core.exceptions import PermissionDenied

def role_required(role_codes):
    """Decorator that checks if the user has the required role."""
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('login')

            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)

            if not isinstance(role_codes, (list, tuple)):
                roles = [role_codes]
            else:
                roles = role_codes

            user_role = request.user.role.code if request.user.role else None

            if user_role and user_role in roles:
                return view_func(request, *args, **kwargs)

            raise PermissionDenied("You do not have permission to access this resource.")

        return _wrapped_view

    return decorator
```

Usage example:

```python
from users.decorators import role_required

@role_required(['credit_officer', 'credit_analyst'])
def sensitive_view(request):
    # Only accessible by credit officers and analysts
    pass
```

### 6.4 Multi-Factor Authentication (Optional)

For enhanced security, MFA can be implemented using TOTP (Time-based One-Time Password):

```python
# users/models.py
class UserMFA(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mfa')
    secret_key = models.CharField(max_length=50)
    is_active = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

# Requirements: pip install pyotp qrcode
```

**Note**: MFA is an optional enhancement not currently implemented in the base system.
