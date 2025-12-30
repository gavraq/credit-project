# Credit Risk Security Implementation

This document details the security implementation for the Credit Risk Workflow application, covering authentication, authorization, data protection, and security best practices.

## Table of Contents
1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Authorization and Access Control](#3-authorization-and-access-control)
4. [Data Protection](#4-data-protection)
5. [API Security](#5-api-security)
6. [Frontend Security](#6-frontend-security)
7. [Security Monitoring and Logging](#7-security-monitoring-and-logging)

## 1. Overview

Security is a critical aspect of the Credit Risk Workflow application due to the sensitive nature of financial data and credit decisions. The application implements multiple layers of security controls to protect data confidentiality, integrity, and availability while ensuring compliance with industry regulations.

## 2. Authentication

### 2.1 JWT Authentication

The application uses JSON Web Tokens (JWT) for authentication, with token-based sessions managed through Django REST Framework Simple JWT.

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('JWT_SECRET_KEY', 'default-insecure-key-change-in-production'),
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=15),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
```

### 2.2 Token Management

JWT tokens are managed in the frontend using secure storage and automatic refresh mechanisms:

```javascript
// src/services/authService.js
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || '';

// Token storage
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Refresh token
const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${API_URL}/api/token/refresh/`, {
      refresh: refreshToken
    });
    
    const { access, refresh } = response.data;
    setTokens(access, refresh || refreshToken);
    return access;
  } catch (error) {
    clearTokens();
    window.location.href = '/login';
    throw error;
  }
};

// Axios interceptor for automatic token refresh
const setupAxiosInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    async (config) => {
      let token = getAccessToken();
      
      if (token && isTokenExpired(token)) {
        token = await refreshAccessToken();
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If 401 error and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const token = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export const authService = {
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/api/token/`, {
      username,
      password
    });
    
    const { access, refresh } = response.data;
    setTokens(access, refresh);
    return jwt_decode(access);
  },
  
  logout: () => {
    clearTokens();
    window.location.href = '/login';
  },
  
  isAuthenticated: () => {
    const token = getAccessToken();
    return token && !isTokenExpired(token);
  },
  
  getUser: () => {
    const token = getAccessToken();
    return token ? jwt_decode(token) : null;
  },
  
  setupInterceptors: (axiosInstance) => {
    setupAxiosInterceptors(axiosInstance);
  }
};
```

### 2.3 Password Policies

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

# users/validators.py
class PasswordComplexityValidator:
    """
    Validate that the password meets complexity requirements.
    """
    
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

### 2.4 Multi-Factor Authentication (Optional)

For enhanced security, the application supports multi-factor authentication using TOTP (Time-based One-Time Password):

```python
# users/models.py
class UserMFA(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mfa')
    secret_key = models.CharField(max_length=50)
    is_active = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_mfa'

# users/views.py
class EnableMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Check if MFA already exists
        mfa, created = UserMFA.objects.get_or_create(user=user)
        
        if not created and mfa.is_active:
            return Response({'detail': 'MFA is already enabled'}, status=400)
        
        # Generate secret key if needed
        if created:
            mfa.secret_key = pyotp.random_base32()
            mfa.save()
        
        # Generate QR code
        totp = pyotp.TOTP(mfa.secret_key)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="Credit Risk App"
        )
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = []
        for _ in range(10):
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            backup_codes.append(code)
        
        mfa.backup_codes = backup_codes
        mfa.save()
        
        return Response({
            'secret_key': mfa.secret_key,
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'backup_codes': backup_codes
        })

class VerifyMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        code = request.data.get('code')
        
        if not code:
            return Response({'detail': 'Code is required'}, status=400)
        
        try:
            mfa = UserMFA.objects.get(user=user)
        except UserMFA.DoesNotExist:
            return Response({'detail': 'MFA not set up'}, status=400)
        
        totp = pyotp.TOTP(mfa.secret_key)
        
        if totp.verify(code):
            mfa.is_active = True
            mfa.save()
            return Response({'detail': 'MFA enabled successfully'})
        
        return Response({'detail': 'Invalid code'}, status=400)
```

## 3. Authorization and Access Control

### 3.1 Role-Based Access Control

The application implements role-based access control (RBAC) to restrict access to features and data:

```python
# users/models.py
class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)
    
    def __str__(self):
        return self.name

# users/permissions.py
class RoleBasedPermission(permissions.BasePermission):
    """
    Permission check based on user role.
    """
    required_role = None
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
        
        # Check if user has the required role
        if self.required_role and request.user.role and request.user.role.code == self.required_role:
            return True
        
        return False

class CreditOfficerPermission(RoleBasedPermission):
    required_role = 'credit_officer'

class RelationshipManagerPermission(RoleBasedPermission):
    required_role = 'relationship_manager'

class CreditAnalystPermission(RoleBasedPermission):
    required_role = 'credit_analyst'

class CreditCommitteePermission(RoleBasedPermission):
    required_role = 'credit_committee'
```

### 3.2 Object-Level Permissions

Fine-grained permissions are implemented at the object level:

```python
# credit_applications/permissions.py
class IsOwnerOrAssignee(permissions.BasePermission):
    """
    Object-level permission to allow owners or assignees of a credit application.
    """
    
    def has_object_permission(self, request, view, obj):
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
        
        # Check if user is the creator or assignee
        return (obj.created_by == request.user or 
                obj.assigned_to == request.user)

class CanTransitionWorkflow(permissions.BasePermission):
    """
    Permission to check if user can perform a workflow transition.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Superusers have all permissions
        if request.user.is_superuser:
            return True
        
        # Get workflow instance and transition
        workflow_instance_id = request.data.get('workflow_instance')
        transition_id = request.data.get('transition')
        
        if not workflow_instance_id or not transition_id:
            return False
        
        try:
            workflow_instance = WorkflowInstance.objects.get(id=workflow_instance_id)
            transition = Transition.objects.get(id=transition_id)
            
            # Check if user's role is in the transition's role permissions
            user_role = request.user.role.code if request.user.role else None
            if user_role and user_role in transition.role_permissions:
                return True
            
            # Check if user's department is in the transition's department permissions
            user_department = request.user.department.code if request.user.department else None
            if user_department and user_department in transition.department_permissions:
                return True
            
            return False
        except (WorkflowInstance.DoesNotExist, Transition.DoesNotExist):
            return False
```

### 3.3 Permission Decorators

Custom decorators are used to enforce permissions at the view level:

```python
# users/decorators.py
def role_required(role_codes):
    """
    Decorator for views that checks if the user has the required role.
    """
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
