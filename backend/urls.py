"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from backend.users.views import MyTokenObtainPairView # Import the custom view
from rest_framework_simplejwt.views import (
    # TokenObtainPairView, # Comment out or remove the default import
    TokenRefreshView,
)
from backend.views import ProtectedHelloView, HealthCheckView
from backend.users.views import WorkflowInstanceTransitionView, WorkflowInstanceLogListView, UserListView, WorkflowInstanceDetailView, WorkflowInstanceListView # MyTokenObtainPairView is now imported above

urlpatterns = [
    path('', lambda request: redirect('/admin/')),  # Redirect root to admin
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckView.as_view(), name='health_check'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # Use the custom view
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/hello/', ProtectedHelloView.as_view(), name='protected_hello'),
    path('api/workflow-instances/', WorkflowInstanceListView.as_view(), name='workflow_instance_list'),
    path('api/workflow-instances/<uuid:pk>/', WorkflowInstanceDetailView.as_view(), name='workflow_instance_detail'),
    path('api/workflow-instances/<uuid:pk>/transition/', WorkflowInstanceTransitionView.as_view(), name='workflow_instance_transition'),
    path('api/workflow-instances/<uuid:pk>/logs/', WorkflowInstanceLogListView.as_view(), name='workflow_instance_logs'),
    path('api/credit/', include('credit_applications.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/users/', UserListView.as_view(), name='user-list'),
]

# Serve static files in production
if settings.DEBUG or True:  # Always serve static files since we're using Django to serve them
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
