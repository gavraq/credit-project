# Credit Risk API Gateway Implementation (Future Phase)

> **IMPORTANT NOTE**: This document describes the planned API Gateway implementation for a future phase of the Credit Risk Workflow application. The API Gateway is **not required** for the initial implementation with local storage and no external integrations. This serves as a reference for future development.

This document details the planned implementation of the API Gateway for the Credit Risk Workflow application, which will serve as the central entry point for all external API requests in future phases.

## Table of Contents
1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Implementation](#3-implementation)
4. [Security](#4-security)
5. [Monitoring and Management](#5-monitoring-and-management)

## 1. Overview

The API Gateway serves as a unified entry point for all external systems integrating with the Credit Risk Workflow application. It provides essential cross-cutting concerns such as authentication, rate limiting, request routing, and monitoring.

### 1.1 Key Features

- **Unified Entry Point**: Single access point for all external API requests
- **Authentication and Authorization**: Centralized security enforcement
- **Rate Limiting**: Protection against abuse and overload
- **Request Routing**: Intelligent routing to appropriate backend services
- **Monitoring**: Comprehensive logging and metrics collection
- **Versioning**: API versioning support
- **Documentation**: Automatic API documentation generation

### 1.2 Benefits

- **Simplified Client Integration**: Clients interact with a single endpoint
- **Consistent Security**: Security policies applied uniformly
- **Reduced Complexity**: Cross-cutting concerns handled in one place
- **Improved Monitoring**: Centralized visibility into API usage
- **Enhanced Maintainability**: Backend services can evolve independently

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       API Gateway                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth Filter │  │ Rate Limiter│  │ Request Router      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Monitoring  │  │ Caching     │  │ Response Transformer│ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   Backend Services                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Core Banking│  │ Credit      │  │ Document            │ │
│  │ Service     │  │ Bureau Svc  │  │ Management Svc      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Regulatory  │  │ Workflow    │  │ User                │ │
│  │ Reporting   │  │ Engine      │  │ Management          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

The API Gateway is implemented using:

- **Django REST Framework**: Core API framework
- **Django Ninja**: API Gateway functionality
- **Redis**: Rate limiting and caching
- **JWT**: Authentication tokens
- **Prometheus**: Metrics collection
- **OpenAPI**: API documentation

## 3. Implementation

### 3.1 API Gateway Configuration

```python
# api_gateway/settings.py
API_GATEWAY = {
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1', 'v2'],
    'VERSION_PARAM': 'version',
    'RATE_LIMITING': {
        'enabled': True,
        'default_limit': '100/hour',
        'override_limits': {
            'core_banking': '200/hour',
            'document_management': '300/hour',
        }
    },
    'CACHING': {
        'enabled': True,
        'default_timeout': 300,  # 5 minutes
        'endpoints': {
            'counterparties': 3600,  # 1 hour
            'reference_data': 86400,  # 24 hours
        }
    },
    'MONITORING': {
        'request_logging': True,
        'metrics_collection': True,
        'health_check_enabled': True,
    }
}
```

### 3.2 API Gateway Routes

```python
# api_gateway/urls.py
from django.urls import path, include
from .views import api_gateway_router, api_documentation, health_check

urlpatterns = [
    # API Gateway entry point
    path('api/', api_gateway_router.urls),
    
    # API Documentation
    path('api/docs/', api_documentation, name='api-docs'),
    
    # Health check endpoint
    path('api/health/', health_check, name='health-check'),
]
```

### 3.3 Request Router Implementation

```python
# api_gateway/router.py
from ninja import NinjaAPI, Router
from ninja.security import APIKeyHeader, HttpBearer
from .authentication import JWTAuth
from .rate_limiting import RateLimitThrottle
from .monitoring import log_request, collect_metrics
from .caching import cache_response

# Create API Gateway
api_gateway = NinjaAPI(
    title="Credit Risk API Gateway",
    version="1.0.0",
    description="API Gateway for Credit Risk Workflow Application",
    auth=[JWTAuth()],
    docs_url="/docs"
)

# Core Banking Router
core_banking_router = Router(tags=["Core Banking"])

@core_banking_router.get("/counterparties")
@cache_response(timeout=3600)
@collect_metrics
@log_request
def get_counterparties(request):
    """
    Route request to Core Banking Service to get counterparties.
    """
    # Forward request to Core Banking Service
    response = forward_request(
        "core_banking",
        "GET",
        "/api/counterparties/",
        request.GET
    )
    return response

# Credit Bureau Router
credit_bureau_router = Router(tags=["Credit Bureau"])

@credit_bureau_router.get("/credit-reports/{customer_id}")
@collect_metrics
@log_request
def get_credit_report(request, customer_id: str):
    """
    Route request to Credit Bureau Service to get credit report.
    """
    # Forward request to Credit Bureau Service
    response = forward_request(
        "credit_bureau",
        "GET",
        f"/api/credit-reports/{customer_id}/",
        request.GET
    )
    return response

# Document Management Router
document_router = Router(tags=["Document Management"])

@document_router.post("/documents")
@collect_metrics
@log_request
def upload_document(request):
    """
    Route request to Document Management Service to upload document.
    """
    # Forward request to Document Management Service
    response = forward_request(
        "document_management",
        "POST",
        "/api/documents/",
        request.POST,
        request.FILES
    )
    return response

# Register routers with API Gateway
api_gateway.add_router("/core-banking/", core_banking_router)
api_gateway.add_router("/credit-bureau/", credit_bureau_router)
api_gateway.add_router("/documents/", document_router)
```

### 3.4 Request Forwarding

```python
# api_gateway/forwarding.py
import httpx
from django.conf import settings
import json
import logging

logger = logging.getLogger(__name__)

def forward_request(service, method, endpoint, params=None, data=None, files=None):
    """
    Forward a request to a backend service.
    
    Args:
        service: Name of the service to forward to
        method: HTTP method (GET, POST, etc.)
        endpoint: API endpoint
        params: Query parameters
        data: Request data
        files: Request files
        
    Returns:
        Response from the backend service
    """
    service_url = settings.BACKEND_SERVICES.get(service)
    if not service_url:
        logger.error(f"Unknown service: {service}")
        return {"error": "Service not found"}, 404
    
    url = f"{service_url}{endpoint}"
    
    try:
        with httpx.Client() as client:
            response = client.request(
                method=method,
                url=url,
                params=params,
                data=data,
                files=files,
                timeout=30.0
            )
            
            # Log response for monitoring
            logger.info(
                f"Forwarded {method} request to {service} ({url}): "
                f"Status {response.status_code}"
            )
            
            # Return response data and status code
            return response.json(), response.status_code
            
    except httpx.RequestError as e:
        logger.error(f"Request error forwarding to {service}: {e}")
        return {"error": "Service unavailable"}, 503
        
    except Exception as e:
        logger.error(f"Unexpected error forwarding to {service}: {e}")
        return {"error": "Internal server error"}, 500
```

## 4. Security

### 4.1 Authentication Implementation

```python
# api_gateway/authentication.py
from ninja.security import HttpBearer
from jose import jwt, JWTError
from django.conf import settings
import time

class JWTAuth(HttpBearer):
    """
    JWT authentication for API Gateway.
    """
    def authenticate(self, request, token):
        try:
            # Decode and validate JWT token
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Check if token is expired
            if payload.get('exp') and time.time() > payload['exp']:
                return None
                
            # Add user info to request for downstream services
            request.user_id = payload.get('sub')
            request.user_role = payload.get('role')
            
            return payload
            
        except JWTError:
            return None
```

### 4.2 Rate Limiting

```python
# api_gateway/rate_limiting.py
from functools import wraps
from django.core.cache import cache
from django.conf import settings
import time
import hashlib

def get_client_ip(request):
    """
    Get client IP address from request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def rate_limit(limit_per_minute=60):
    """
    Rate limiting decorator.
    
    Args:
        limit_per_minute: Maximum requests per minute
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get client identifier (IP or API key)
            client_id = request.auth.get('client_id') if request.auth else None
            if not client_id:
                client_id = get_client_ip(request)
                
            # Create cache key
            endpoint = request.path
            cache_key = f"rate_limit:{hashlib.md5(f'{client_id}:{endpoint}'.encode()).hexdigest()}"
            
            # Get current count and timestamp
            rate_data = cache.get(cache_key)
            current_time = time.time()
            
            if rate_data:
                count, window_start = rate_data
                
                # Reset if window has expired (1 minute)
                if current_time - window_start > 60:
                    count = 0
                    window_start = current_time
                
                # Check if limit exceeded
                if count >= limit_per_minute:
                    return {"error": "Rate limit exceeded"}, 429
                
                # Increment count
                count += 1
                
            else:
                count = 1
                window_start = current_time
                
            # Update cache
            cache.set(cache_key, (count, window_start), 120)  # 2 minute TTL
            
            # Add rate limit headers
            response = func(request, *args, **kwargs)
            if isinstance(response, tuple) and len(response) == 2:
                data, status = response
                headers = {
                    'X-RateLimit-Limit': str(limit_per_minute),
                    'X-RateLimit-Remaining': str(max(0, limit_per_minute - count)),
                    'X-RateLimit-Reset': str(int(window_start + 60))
                }
                return data, status, headers
            
            return response
            
        return wrapper
    
    return decorator
```

### 4.3 API Key Management

```python
# api_gateway/api_keys.py
import uuid
import hashlib
from django.db import models
from django.utils import timezone

class APIKey(models.Model):
    """
    API Key model for external clients.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    key_prefix = models.CharField(max_length=8, unique=True)
    key_hash = models.CharField(max_length=64)
    
    # Access control
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Rate limiting
    rate_limit_per_minute = models.IntegerField(default=60)
    
    # Permissions
    allowed_endpoints = models.JSONField(default=list)
    
    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"
    
    @classmethod
    def create_key(cls, name, expires_in_days=None, rate_limit=60, allowed_endpoints=None):
        """
        Create a new API key.
        
        Args:
            name: Name of the API key
            expires_in_days: Number of days until key expires
            rate_limit: Rate limit per minute
            allowed_endpoints: List of allowed endpoints
            
        Returns:
            Tuple of (APIKey instance, plain text key)
        """
        # Generate random key
        key = uuid.uuid4().hex
        
        # Create prefix (first 8 chars)
        prefix = key[:8]
        
        # Hash the key for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Set expiration date if provided
        expires_at = None
        if expires_in_days:
            expires_at = timezone.now() + timezone.timedelta(days=expires_in_days)
        
        # Create API key record
        api_key = cls.objects.create(
            name=name,
            key_prefix=prefix,
            key_hash=key_hash,
            expires_at=expires_at,
            rate_limit_per_minute=rate_limit,
            allowed_endpoints=allowed_endpoints or []
        )
        
        # Return instance and plain text key
        return api_key, f"{prefix}.{key[8:]}"
    
    @classmethod
    def validate_key(cls, key):
        """
        Validate an API key.
        
        Args:
            key: API key to validate
            
        Returns:
            APIKey instance if valid, None otherwise
        """
        try:
            # Split key into prefix and value
            prefix, value = key.split('.', 1)
            
            # Find API key by prefix
            api_key = cls.objects.get(key_prefix=prefix, is_active=True)
            
            # Check if key has expired
            if api_key.expires_at and timezone.now() > api_key.expires_at:
                return None
            
            # Validate key hash
            full_key = prefix + value
            key_hash = hashlib.sha256(full_key.encode()).hexdigest()
            
            if api_key.key_hash != key_hash:
                return None
                
            return api_key
            
        except (ValueError, cls.DoesNotExist):
            return None
```

## 5. Monitoring and Management

### 5.1 Request Logging

```python
# api_gateway/monitoring.py
import logging
import time
import json
from functools import wraps
from django.db import models
import uuid

logger = logging.getLogger('api_gateway')

class APIRequestLog(models.Model):
    """
    Model for logging API requests.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=255)
    query_params = models.TextField(null=True, blank=True)
    request_body = models.TextField(null=True, blank=True)
    response_status = models.IntegerField()
    response_time_ms = models.IntegerField()
    user_id = models.CharField(max_length=100, null=True, blank=True)
    api_key_id = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['path']),
            models.Index(fields=['response_status']),
        ]

def log_request(func):
    """
    Decorator to log API requests.
    """
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        
        # Get client IP
        client_ip = request.META.get('REMOTE_ADDR')
        
        # Get user ID if authenticated
        user_id = getattr(request, 'user_id', None)
        
        # Get API key ID if using API key auth
        api_key_id = None
        if hasattr(request, 'auth') and request.auth:
            api_key_id = request.auth.get('key_id')
        
        # Execute view function
        response = func(request, *args, **kwargs)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Extract response status
        status_code = 200
        if isinstance(response, tuple):
            if len(response) >= 2:
                status_code = response[1]
        
        # Log request
        log_entry = APIRequestLog(
            client_ip=client_ip,
            method=request.method,
            path=request.path,
            query_params=json.dumps(dict(request.GET)),
            request_body=json.dumps(dict(request.POST)) if request.method in ['POST', 'PUT', 'PATCH'] else None,
            response_status=status_code,
            response_time_ms=response_time_ms,
            user_id=user_id,
            api_key_id=api_key_id
        )
        log_entry.save()
        
        # Log to console/file
        logger.info(
            f"{request.method} {request.path} - "
            f"Status: {status_code}, "
            f"Time: {response_time_ms}ms, "
            f"User: {user_id or 'anonymous'}, "
            f"IP: {client_ip}"
        )
        
        return response
    
    return wrapper
```

### 5.2 Health Check

```python
# api_gateway/health.py
from django.http import JsonResponse
from django.conf import settings
import httpx
import asyncio

async def check_service_health(service_name, service_url):
    """
    Check health of a backend service.
    
    Args:
        service_name: Name of the service
        service_url: URL of the service
        
    Returns:
        Dict with service health status
    """
    health_url = f"{service_url}/api/health/"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(health_url, timeout=5.0)
            
            if response.status_code == 200:
                return {
                    "service": service_name,
                    "status": "up",
                    "latency_ms": int(response.elapsed.total_seconds() * 1000)
                }
            else:
                return {
                    "service": service_name,
                    "status": "degraded",
                    "status_code": response.status_code
                }
                
    except Exception as e:
        return {
            "service": service_name,
            "status": "down",
            "error": str(e)
        }

async def health_check(request):
    """
    Health check endpoint for API Gateway.
    
    Checks health of all backend services.
    """
    # Check health of backend services
    services = settings.BACKEND_SERVICES
    tasks = [
        check_service_health(name, url)
        for name, url in services.items()
    ]
    
    service_results = await asyncio.gather(*tasks)
    
    # Determine overall status
    overall_status = "up"
    for result in service_results:
        if result["status"] == "down":
            overall_status = "down"
            break
        elif result["status"] == "degraded" and overall_status != "down":
            overall_status = "degraded"
    
    # Prepare response
    response = {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "services": service_results
    }
    
    # Return appropriate status code
    status_code = 200
    if overall_status == "down":
        status_code = 503
    elif overall_status == "degraded":
        status_code = 207
    
    return JsonResponse(response, status=status_code)
```

This implementation provides a comprehensive API Gateway for the Credit Risk Workflow application, with features for authentication, rate limiting, request routing, monitoring, and health checks.
