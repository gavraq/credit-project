# Credit Risk Workflow Application - Architecture Document

## 1. Overview

This document outlines the architecture for an internal Credit Risk Workflow application built with Django (backend) and React (frontend). The application is designed to manage credit applications through configurable workflows with document management capabilities.

### 1.1 Key Functionality

- User authentication and role-based permissions
- State-based workflow engine for credit applications
- Document upload, storage, and management
- Customizable forms with field visibility controls based on user roles
- Dashboard and reporting functionality
- PostgreSQL database for data storage

### 1.2 Technology Stack

- **Backend**: Python, Django, Django REST Framework
- **Frontend**: React, Material-UI
- **Database**: PostgreSQL
- **Package Management**: UV (instead of pip/virtualenv)
- **File Storage**: File System (development), Cloud Storage (production)

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  React        │     │  Django REST  │     │  PostgreSQL   │
│  Frontend     │◄────┤  API Backend  │◄────┤  Database     │
└───────────────┘     └───────────────┘     └───────────────┘
                             │
                             ▼
                      ┌───────────────┐
                      │ File Storage  │
                      │ (Local/Cloud) │
                      └───────────────┘
```

### 2.2 Component Interaction

1. React frontend communicates with Django REST API via HTTP/JSON
2. Django manages database interactions and business logic
3. Files are stored either locally or in cloud storage
4. Authentication happens via JWT tokens

## 3. Project Structure

```
credit_risk_workflow/
│
├── backend/                      # Django backend
│   ├── manage.py
│   ├── pyproject.toml            # Dependencies (UV format)
│   ├── credit_risk_project/      # Django project settings
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── users/                    # User authentication and permissions app
│   │   ├── models.py             # User, Group, Role models
│   │   ├── serializers.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── auth_views.py
│   │   │   ├── user_views.py
│   │   │   └── dashboard_views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   ├── services.py
│   │   ├── admin.py
│   │   ├── migrations/
│   │   └── tests/
│   │
│   ├── workflow_engine/          # Dedicated workflow management app
│   │   ├── models.py             # State, Transition, WorkflowDefinition models
│   │   ├── serializers.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   └── workflow_views.py
│   │   ├── services.py           # Workflow logic
│   │   ├── permissions.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── migrations/
│   │   └── tests/
│   │
│   ├── credit_applications/      # Core domain application
│   │   ├── models.py             # Application data models
│   │   ├── serializers.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── application_views.py
│   │   │   └── analytics_views.py
│   │   ├── services/
│   │   │   ├── application_services.py
│   │   │   └── analytics_services.py
│   │   ├── permissions.py
│   │   ├── filters.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── migrations/
│   │   └── tests/
│   │
│   ├── documents/                # Document management app
│   │   ├── models.py             # Document models
│   │   ├── serializers.py        
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── document_views.py
│   │   │   └── preview_views.py
│   │   ├── services/
│   │   │   ├── storage_service.py
│   │   │   └── preview_service.py
│   │   ├── permissions.py
│   │   ├── validators.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── migrations/
│   │   └── tests/
│   │
│   ├── core/                     # Shared functionality
│   │   ├── models.py             # Abstract base models
│   │   ├── utils.py              # Utility functions
│   │   ├── permissions.py        # Base permission classes
│   │   └── exceptions.py         # Custom exceptions
│   │
│   └── scripts/                  # Database and deployment scripts
│       ├── backup_db.sh
│       └── setup_db.py
│
├── frontend/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── assets/               # Static assets
│   │   │
│   │   ├── components/           # Reusable components
│   │   │   ├── common/           # Buttons, inputs, etc.
│   │   │   ├── layout/           # Layout components
│   │   │   ├── workflow/         # Workflow-specific components
│   │   │   ├── documents/        # Document management components
│   │   │   └── data-display/     # Tables, charts, etc.
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── Applications/
│   │   │   ├── Reports/
│   │   │   └── Settings/
│   │   │
│   │   ├── services/             # API service layer
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── applicationService.js
│   │   │   ├── workflowService.js
│   │   │   └── documentService.js
│   │   │
│   │   ├── store/                # State management (Redux)
│   │   │   ├── slices/
│   │   │   └── store.js
│   │   │
│   │   ├── utils/                # Helper functions
│   │   └── hooks/                # Custom React hooks
│   │
│   ├── package.json
│   └── README.md
│
├── docker/                       # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
└── README.md

## 4. Backend Design

### 4.1 Data Model Architecture

#### 4.1.1 Core Models Relationship

The system uses a structured approach to separate core application data from form-specific data:

```
┌─────────────────────┐       ┌─────────────────────┐
│  CreditApplication   │       │  CreditRequestForm   │
├─────────────────────┤       ├─────────────────────┤
│ - id (UUID)         │       │ - id (UUID)         │
│ - reference_number  │       │ - credit_application│◄─┐
│ - title             │       │ - guarantor_name    │  │
│ - counterparty      │       │ - guarantor_cif     │  │
│ - priority          │       │ - revenue_last_12m  │  │
│ - required_by_date  │       │ - ...               │  │
│ - description       │◄──────┼─────────────────────┘  │
│ - applicant_name    │       │                        │
│ - workflow_instance │       │  One-to-One            │
└─────────────────────┘       │  Relationship          │
                               └────────────────────────┘
```

**CreditApplication Model**:
- Serves as the core entity that tracks the credit application through its lifecycle
- Contains essential metadata like title, priority, and reference number
- Links to the counterparty (client) and workflow instance
- Maintains the high-level status of the application
- Focuses on data needed across the entire application process

**CreditRequestForm Model**:
- Connected to CreditApplication via a one-to-one relationship
- Contains detailed form data specific to the initial credit request
- Stores fields like financial data, guarantor information, and business justifications
- Focuses on data collection specific to the credit request phase
- Separates form-specific data from core application data

**Benefits of this separation**:
1. **Clear Separation of Concerns**: Core application data vs. form-specific data
2. **Flexibility**: Different forms can be associated with the same application
3. **Data Integrity**: Form data is preserved separately from application status
4. **Workflow Integration**: CreditApplication connects to the workflow engine
5. **Maintainability**: Easier to extend with new form fields without affecting core data

This architecture allows for a modular approach where different forms (CreditRequestForm, BusinessSponsorshipForm, LegalReviewForm, etc.) can be associated with a single CreditApplication as it moves through the workflow.

### 4.2 Users App

The users app manages authentication, authorization, and user management.

#### 4.1.1 Models

```python
# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class Department(models.Model):
    """Organizational department"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Role(models.Model):
    """User role with specific permissions"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Define what this role can access
    can_view_all_applications = models.BooleanField(default=False)
    can_view_department_applications = models.BooleanField(default=True)
    can_approve_applications = models.BooleanField(default=False)
    can_reject_applications = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_export_data = models.BooleanField(default=False)
    
    # Form field visibility controls
    visible_fields = models.JSONField(default=dict, help_text="Defines which fields are visible for this role in various forms")
    
    # Form field filtering
    available_dropdown_options = models.JSONField(default=dict, help_text="Defines which options are available in dropdowns for this role")
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    """Extended user model with additional fields"""
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    role = models.ForeignKey(
        Role, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    employee_id = models.CharField(max_length=50, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    def has_permission(self, permission_name):
        """Check if user has a specific permission based on their role"""
        if self.is_superuser:
            return True
            
        if not self.role:
            return False
            
        return getattr(self.role, permission_name, False)
        
    def get_visible_fields(self, form_name):
        """Get visible fields for a specific form based on user's role"""
        if not self.role:
            return []
            
        visible_fields = self.role.visible_fields
        return visible_fields.get(form_name, [])
        
    def get_dropdown_options(self, dropdown_name):
        """Get available options for a dropdown based on user's role"""
        if not self.role:
            return []
            
        dropdown_options = self.role.available_dropdown_options
        return dropdown_options.get(dropdown_name, [])
```

#### 4.1.2 Services

```python
# users/services.py
class UserPermissionService:
    @staticmethod
    def get_form_configuration(user, form_name):
        """
        Get configuration for a form based on user's role
        Includes visible fields, readonly fields, and other settings
        """
        if not user.role:
            # Default minimal configuration
            return {
                "visible_fields": [],
                "readonly_fields": [],
                "required_fields": []
            }
            
        # Get form configuration from role
        role_config = user.role.visible_fields.get(form_name, {})
        
        # Merge with any user-specific overrides if needed
        return role_config
        
    @staticmethod
    def get_dropdown_options(user, dropdown_name, context=None):
        """
        Get available options for a dropdown field
        Can be filtered by user role, department, or other context
        """
        if not user.role:
            return []
            
        # Get base options from role
        base_options = user.role.available_dropdown_options.get(dropdown_name, [])
        
        # Apply additional filters based on context
        if context and dropdown_name == "assigned_to":
            # Example: Filter users by department for assignment dropdown
            if not user.has_permission("can_view_all_applications"):
                # Limit to same department
                from users.models import User
                return [
                    option for option in base_options 
                    if User.objects.get(id=option['value']).department_id == user.department_id
                ]
                
        return base_options
```

#### 4.1.3 Views

```python
# users/views/auth_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny, IsAuthenticated

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token endpoint that includes user details"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add user details to response
            from users.serializers import UserSerializer
            user = request.user
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
            
        return response

class UserProfileView(APIView):
    """Get the current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from users.serializers import UserSerializer
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
```

```python
# users/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class UserDashboardView(APIView):
    """User-specific dashboard showing their work"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """User-specific dashboard showing their work"""
        user = request.user
        
        # Get user's applications
        from credit_applications.models import CreditApplication
        assigned_applications = CreditApplication.objects.filter(
            assigned_to=user
        ).select_related('workflow__current_state')
        
        # Get data for dashboard
        from credit_applications.serializers import CreditApplicationListSerializer
        data = {
            'assigned_count': assigned_applications.count(),
            'assigned_applications': CreditApplicationListSerializer(
                assigned_applications[:5], many=True
            ).data,
            'by_status': self._group_by_status(assigned_applications),
            'recent_activity': self._get_recent_activity(user)
        }
        
        return Response(data)
    
    def _group_by_status(self, applications):
        """Group applications by their workflow status"""
        status_counts = {}
        for app in applications:
            state_name = app.workflow.current_state.name if app.workflow else "No Workflow"
            status_counts[state_name] = status_counts.get(state_name, 0) + 1
        
        return [
            {'name': status, 'count': count} 
            for status, count in status_counts.items()
        ]
    
    def _get_recent_activity(self, user):
        """Get recent activity for the user"""
        # Implementation depends on activity tracking
        # This is a placeholder
        return []
```

### 4.2 Workflow Engine App

The workflow engine app manages state transitions and workflow definitions.

#### 4.2.1 Models

```python
# workflow_engine/models.py
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

class WorkflowDefinition(models.Model):
    """Definition of a workflow type"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class State(models.Model):
    """A state in a workflow"""
    name = models.CharField(max_length=100)
    workflow = models.ForeignKey('WorkflowDefinition', related_name='states', on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    is_initial = models.BooleanField(default=False)
    is_final = models.BooleanField(default=False)
    ui_color = models.CharField(max_length=7, default="#FFFFFF")  # For frontend display
    
    class Meta:
        unique_together = ('workflow', 'name')
    
    def __str__(self):
        return f"{self.workflow.name} - {self.name}"

class Transition(models.Model):
    """A transition between states"""
    name = models.CharField(max_length=100)
    workflow = models.ForeignKey('WorkflowDefinition', related_name='transitions', on_delete=models.CASCADE)
    source_state = models.ForeignKey('State', related_name='outgoing_transitions', on_delete=models.CASCADE)
    target_state = models.ForeignKey('State', related_name='incoming_transitions', on_delete=models.CASCADE)
    permission_codename = models.CharField(max_length=100, blank=True)
    conditions = models.JSONField(blank=True, default=dict)  # Store conditions as JSON
    
    class Meta:
        unique_together = ('workflow', 'source_state', 'name')
    
    def __str__(self):
        return f"{self.source_state.name} -> {self.target_state.name} ({self.name})"

class WorkflowInstance(models.Model):
    """An instance of a workflow attached to a model instance"""
    workflow_definition = models.ForeignKey('WorkflowDefinition', on_delete=models.PROTECT)
    current_state = models.ForeignKey('State', on_delete=models.PROTECT)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [models.Index(fields=['content_type', 'object_id'])]
    
    def __str__(self):
        return f"{self.workflow_definition.name} for {self.content_type.model} #{self.object_id}"

class StateLog(models.Model):
    """Log of state transitions"""
    workflow_instance = models.ForeignKey('WorkflowInstance', related_name='logs', on_delete=models.CASCADE)
    transition = models.ForeignKey('Transition', null=True, on_delete=models.SET_NULL)
    from_state = models.ForeignKey('State', related_name='logs_from', on_delete=models.PROTECT)
    to_state = models.ForeignKey('State', related_name='logs_to', on_delete=models.PROTECT)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    performed_at = models.DateTimeField(auto_now_add=True)
    comments = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, default=dict)
    
    class Meta:
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.from_state.name} → {self.to_state.name} by {self.performed_by}"
```

#### 4.2.2 Services

```python
# workflow_engine/services.py
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import PermissionDenied
from .models import WorkflowDefinition, State, Transition, WorkflowInstance, StateLog
from .exceptions import WorkflowError, InvalidTransitionError, ConditionFailedError

class WorkflowService:
    @classmethod
    def initialize_workflow(cls, instance, workflow_name):
        """Create a new workflow instance for a model instance"""
        try:
            workflow_def = WorkflowDefinition.objects.get(name=workflow_name, is_active=True)
            initial_state = workflow_def.states.get(is_initial=True)
            
            # Create the workflow instance
            content_type = ContentType.objects.get_for_model(instance)
            
            workflow_instance = WorkflowInstance.objects.create(
                workflow_definition=workflow_def,
                current_state=initial_state,
                content_type=content_type,
                object_id=instance.id
            )
            
            # Log the initial state
            StateLog.objects.create(
                workflow_instance=workflow_instance,
                from_state=initial_state,
                to_state=initial_state,
                comments="Workflow initialized"
            )
            
            return workflow_instance
        except Exception as e:
            raise WorkflowError(f"Failed to initialize workflow: {str(e)}")
    
    @classmethod
    def get_workflow_instance(cls, instance):
        """Get the workflow instance for a model instance"""
        if not hasattr(instance, 'workflow_instances'):
            return None
            
        return instance.workflow_instances.select_related(
            'workflow_definition', 'current_state'
        ).first()
    
    @classmethod
    def get_available_transitions(cls, instance, user=None):
        """Get available transitions for the given instance and user"""
        workflow_instance = cls.get_workflow_instance(instance)
        if not workflow_instance:
            return []
            
        transitions = workflow_instance.current_state.outgoing_transitions.all()
        
        # Filter by permissions if user is provided
        if user:
            transitions = [t for t in transitions if cls._can_execute_transition(t, user)]
            
        # Filter by conditions
        transitions = [t for t in transitions if cls._evaluate_conditions(t, instance)]
        
        return transitions
    
    @classmethod
    @transaction.atomic
    def execute_transition(cls, instance, transition_name, user=None, **kwargs):
        """Execute a transition on the given instance"""
        workflow_instance = cls.get_workflow_instance(instance)
        if not workflow_instance:
            raise WorkflowError("No workflow instance found")
            
        # Find the requested transition
        try:
            transition = workflow_instance.current_state.outgoing_transitions.get(
                name=transition_name,
                workflow=workflow_instance.workflow_definition
            )
        except Transition.DoesNotExist:
            raise InvalidTransitionError(f"Transition '{transition_name}' not found")
            
        # Check permissions
        if user and not cls._can_execute_transition(transition, user):
            raise PermissionDenied(f"User does not have permission to execute '{transition_name}'")
            
        # Check conditions
        if not cls._evaluate_conditions(transition, instance):
            raise ConditionFailedError(f"Conditions not met for transition '{transition_name}'")
            
        # Execute transition
        from_state = workflow_instance.current_state
        workflow_instance.current_state = transition.target_state
        workflow_instance.save()
        
        # Log the transition
        StateLog.objects.create(
            workflow_instance=workflow_instance,
            transition=transition,
            from_state=from_state,
            to_state=transition.target_state,
            performed_by=user,
            comments=kwargs.get('comments', ''),
            metadata=kwargs.get('metadata', {})
        )
        
        # Trigger any post-transition actions
        cls._trigger_post_transition_actions(instance, transition, **kwargs)
        
        return workflow_instance
    
    @classmethod
    def _can_execute_transition(cls, transition, user):
        """Check if user has permission to execute transition"""
        if user.is_superuser:
            return True
            
        if not transition.permission_codename:
            return True
            
        return user.has_permission(transition.permission_codename)
    
    @classmethod
    def _evaluate_conditions(cls, transition, instance):
        """Evaluate transition conditions"""
        # Simple implementation - in a real system, this would be more sophisticated
        conditions = transition.conditions
        
        if not conditions:
            return True
            
        # Example: Check if application amount is below threshold
        if 'max_amount' in conditions and hasattr(instance, 'amount'):
            if instance.amount > conditions['max_amount']:
                return False
                
        return True
    
    @classmethod
    def _trigger_post_transition_actions(cls, instance, transition, **kwargs):
        """Trigger actions after a successful transition"""
        # This would contain business logic triggered by transitions
        # For example, sending notifications, updating related records, etc.
        pass
```

### 4.3 Credit Applications App

The credit applications app manages credit application data and business logic.

#### 4.3.1 Models

```python
# credit_applications/models.py
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from django.conf import settings

class CreditApplication(models.Model):
    """Core model for credit applications"""
    # Basic application fields
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    
    # Applicant information
    applicant_name = models.CharField(max_length=100)
    applicant_email = models.EmailField()
    applicant_phone = models.CharField(max_length=20)
    
    # Relationships
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT,
        related_name='created_applications'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_applications'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Workflow integration
    workflow_instances = GenericRelation('workflow_engine.WorkflowInstance')
    
    # Document integration
    documents = GenericRelation('documents.Document')
    
    # Fields to support future risk assessment integration
    risk_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Risk score from external system"
    )
    risk_assessment_date = models.DateTimeField(null=True, blank=True)
    risk_assessment_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Reference ID from external risk assessment system"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Application {self.id}: {self.title} ({self.amount})"
    
    @property
    def workflow(self):
        """Get the primary workflow instance"""
        return self.workflow_instances.select_related('current_state').first()
    
    @property
    def status(self):
        """Get the current status based on workflow state"""
        wf = self.workflow
        return wf.current_state.name if wf and wf.current_state else "No Workflow"
    
    def get_documents(self, document_type=None):
        """Get all documents attached to this application"""
        docs = self.documents.all()
        if document_type:
            docs = docs.filter(document_type__code=document_type)
        return docs
```

#### 4.3.2 Services

```python
# credit_applications/services/application_services.py
from django.db import models, transaction
from django.utils import timezone
from credit_applications.models import CreditApplication
from workflow_engine.services import WorkflowService

class ApplicationService:
    @staticmethod
    def get_visible_applications(user):
        """Get applications visible to the user based on permissions"""
        queryset = CreditApplication.objects.all()
        
        # Superusers can see everything
        if user.is_superuser:
            return queryset
            
        # Filter based on user role permissions
        if user.has_permission('can_view_all_applications'):
            return queryset
            
        if user.has_permission('can_view_department_applications'):
            return queryset.filter(
                models.Q(created_by__department=user.department) |
                models.Q(assigned_to__department=user.department)
            )
            
        # Default: users see only their own
        return queryset.filter(
            models.Q(created_by=user) | models.Q(assigned_to=user)
        )
    
    @staticmethod
    @transaction.atomic
    def create_application(data, user):
        """Create a new application with initial workflow"""
        # Create the application
        application = CreditApplication.objects.create(
            title=data['title'],
            amount=data['amount'],
            description=data.get('description', ''),
            applicant_name=data['applicant_name'],
            applicant_email=data['applicant_email'],
            applicant_phone=data['applicant_phone'],
            created_by=user,
            assigned_to=data.get('assigned_to')
        )
        
        # Initialize workflow
        WorkflowService.initialize_workflow(
            application, 
            workflow_name="credit_application_workflow"
        )
        
        return application
    
    @staticmethod
    @transaction.atomic
    def update_application(application, data, user):
        """Update an application"""
        # Update basic fields
        for field in ['title', 'amount', 'description', 'applicant_name', 
                      'applicant_email', 'applicant_phone', 'assigned_to']:
            if field in data:
                setattr(application, field, data[field])
        
        application.save()
        return application
```

```python
# credit_applications/services/analytics_services.py
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import timedelta
from credit_applications.models import CreditApplication

class ApplicationAnalyticsService:
    @staticmethod
    def get_pipeline_dashboard(time_period='month'):
        """Calculate dashboard data for the application pipeline"""
        # Set time range based on period
        now = timezone.now()
        if time_period == 'week':
            start_date = now - timedelta(days=7)
        elif time_period == 'month':
            start_date = now - timedelta(days=30)
        elif time_period == 'quarter':
            start_date = now - timedelta(days=90)
        elif time_period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)  # Default to month
        
        # Get applications in time period
        applications = CreditApplication.objects.filter(created_at__gte=start_date)
        
        # Summary statistics
        total_count = applications.count()
        total_amount = applications.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Group by status
        from django.contrib.contenttypes.models import ContentType
        from workflow_engine.models import WorkflowInstance, State
        
        app_content_type = ContentType.objects.get_for_model(CreditApplication)
        status_counts = {}
        
        workflow_instances = WorkflowInstance.objects.filter(
            content_type=app_content_type,
            object_id__in=applications.values_list('id', flat=True)
        ).select_related('current_state')
        
        for wi in workflow_instances:
            state_name = wi.current_state.name
            status_counts[state_name] = status_counts.get(state_name, 0) + 1
        
        by_status = [
            {'name': status, 'count': count, 'percentage': (count / total_count * 100) if total_count else 0} 
            for status, count in status_counts.items()
        ]
        
        return {
            'total_applications': total_count,
            'total_amount': total_amount,
            'by_status': by_status,
            'time_period': time_period
        }
    
    @staticmethod
    def get_historical_trends(months=12):
        """Calculate historical trends for applications"""
        now = timezone.now()
        start_date = now - timedelta(days=30 * months)
        
        # Prepare data structure for trends
        trend_data = []
        
        # For each month
        for i in range(months):
            month_start = start_date + timedelta(days=30 * i)
            month_end = start_date + timedelta(days=30 * (i + 1))
            
            # Get applications for this month
            month_applications = CreditApplication.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            )
            
            # Calculate metrics
            count = month_applications.count()
            amount_sum = month_applications.aggregate(Sum('amount'))['amount__sum'] or 0
            
            # Add to trend data
            trend_data.append({
                'month': month_start.strftime('%b %Y'),
                'count': count,
                'amount': amount_sum,
                'average_amount': amount_sum / count if count else 0
            })
        
        return trend_data
```

#### 4.3.3 Views

```python
# credit_applications/views/application_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from credit_applications.models import CreditApplication
from credit_applications.serializers import (
    CreditApplicationSerializer,
    CreditApplicationCreateSerializer,
    CreditApplicationDetailSerializer
)
from credit_applications.services.application_services import ApplicationService
from credit_applications.permissions import CanViewApplication, CanCreateApplication
from users.services import UserPermissionService

class CreditApplicationViewSet(viewsets.ModelViewSet):
    """API endpoint for credit applications"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter applications based on user permissions"""
        return ApplicationService.get_visible_applications(self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreditApplicationCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return CreditApplicationDetailSerializer
        return CreditApplicationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateApplication()]
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanViewApplication()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        application = ApplicationService.create_application(
            serializer.validated_data,
            request.user
        )
        
        return Response(
            CreditApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        application = ApplicationService.update_application(
            instance,
            serializer.validated_data,
            request.user
        )
        
        return Response(
            CreditApplicationDetailSerializer(application).data
        )
    
    @action(detail=False, methods=['get'])
    def form_configuration(self, request):
        """Return form configuration based on user role"""
        form_name = request.query_params.get('form_name', 'credit_application')
        config = UserPermissionService.get_form_configuration(
            request.user, form_name
        )
        return Response(config)
    
    @action(detail=False, methods=['get'])
    def dropdown_options(self, request):
        """Return dropdown options for forms"""
        dropdown_name = request.query_params.get('dropdown_name')
        if not dropdown_name:
            return Response({"error": "dropdown_name parameter is required"}, status=400)
            
        options = UserPermissionService.get_dropdown_options(
            request.user, 
            dropdown_name, 
            context=request.query_params.get('context')
        )
        return Response(options)
```

```python
# credit_applications/views/analytics_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from credit_applications.permissions import CanViewAnalytics
from credit_applications.services.analytics_services import ApplicationAnalyticsService

class PipelineDashboardView(APIView):
    """Pipeline analytics dashboard data"""
    permission_classes = [IsAuthenticated, CanViewAnalytics]
    
    def get(self, request):
        time_period = request.GET.get('period', 'month')
        return Response(
            ApplicationAnalyticsService.get_pipeline_dashboard(time_period)
        )

class ApplicationTrendsView(APIView):
    """Historical trends for applications"""
    permission_classes = [IsAuthenticated, CanViewAnalytics]
    
    def get(self, request):
        months = int(request.GET.get('months', 12))
        return Response(
            ApplicationAnalyticsService.get_historical_trends(months)
        )
```

### 4.4 Documents App

The documents app manages document uploads and storage.

#### 4.4.1 Models

```python
# documents/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid
import os

def document_upload_path(instance, filename):
    """Generate a unique path for uploaded documents"""
    ext = filename.split('.')[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    # Organize by year/month and document type
    return f"documents/{instance.document_type.code}/{instance.uploaded_at.strftime('%Y/%m')}/{unique_name}"

class DocumentType(models.Model):
    """Types of documents that can be uploaded"""
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    allowed_extensions = models.JSONField(default=list)  # e.g. ['pdf', 'docx', 'jpg']
    max_size_mb = models.PositiveIntegerField(default=10)  # Default 10MB limit
    
    def __str__(self):
        return self.name

class Document(models.Model):
    """Represents an uploaded document"""
    title = models.CharField(max_length=255)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    file = models.FileField(upload_to=document_upload_path)
    file_size = models.PositiveIntegerField(help_text="Size in bytes")
    file_type = models.CharField(max_length=100, help_text="MIME type")
    original_filename = models.CharField(max_length=255)
    
    # Generic relation to allow documents to be attached to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    
    # Preview for quick viewing
    has_preview = models.BooleanField(default=False)
    preview_file = models.FileField(upload_to='previews/', null=True, blank=True)
    
    # Versioning - for document updates
    version = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='next_versions'
    )
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['document_type']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def extension(self):
        return os.path.splitext(self.file.name)[1].lower().lstrip('.')
    
    @property
    def file_url(self):
        return self.file.url if self.file else None
    
    @property
    def is_image(self):
        return self.file_type.startswith('image/')
    
    @property
    def is_pdf(self):
        return self.file_type == 'application/pdf'
    
    @property
    def is_office_document(self):
        office_types = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ]
        return self.file_type in office_types
```

#### 4.4.2 Services

```python
# documents/services/storage_service.py
from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponse
from django.utils import timezone
import mimetypes
import os
from pathlib import Path

from ..models import Document, DocumentType

class DocumentStorageService:
    @staticmethod
    def store_document(file, user, content_object, document_type_id, title=None, description=''):
        """Store an uploaded document"""
        # Get document type
        document_type = DocumentType.objects.get(id=document_type_id)
        
        # Validate file extension
        ext = os.path.splitext(file.name)[1].lower().lstrip('.')
        if document_type.allowed_extensions and ext not in document_type.allowed_extensions:
            raise ValueError(f"File type not allowed. Accepted types: {', '.join(document_type.allowed_extensions)}")
        
        # Validate file size
        max_size = document_type.max_size_mb * 1024 * 1024  # Convert MB to bytes
        if file.size > max_size:
            raise ValueError(f"File too large. Maximum size: {document_type.max_size_mb}MB")
        
        # Create document record
        document = Document(
            title=title or file.name,
            document_type=document_type,
            file=file,
            file_size=file.size,
            file_type=mimetypes.guess_type(file.name)[0] or 'application/octet-stream',
            original_filename=file.name,
            content_object=content_object,
            uploaded_by=user,
            description=description
        )
        document.save()
        
        # Create directory for document if needed (for organization)
        os.makedirs(os.path.dirname(document.file.path), exist_ok=True)
        
        return document
        
        return document
    
    @staticmethod
    def generate_download_response(document):
        """Generate a response for downloading a document"""
        file_path = document.file.path
        content_type = document.file_type
        
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type
        )
        
        # Set the Content-Disposition header to force download
        filename = document.original_filename
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
```

```python
# documents/services/preview_service.py
import os
from django.core.files.base import ContentFile

class PreviewService:
    @staticmethod
    def create_preview(document):
        """Create a preview for the document if possible"""
        if document.is_image:
            # For images, we can use the original as preview or generate a thumbnail
            return PreviewService._create_image_preview(document)
            
        elif document.is_pdf:
            # For PDFs, generate a preview of the first page
            return PreviewService._create_pdf_preview(document)
            
        elif document.is_office_document:
            # For Office documents, convert to PDF then preview
            return PreviewService._create_office_preview(document)
            
        # No preview available for this type
        return False
    
    @staticmethod
    def _create_image_preview(document):
        """Create preview for image documents"""
        # Simplified implementation - in practice use libraries like Pillow
        document.has_preview = True
        document.preview_file = document.file
        document.save(update_fields=['has_preview', 'preview_file'])
        return True
    
    @staticmethod
    def _create_pdf_preview(document):
        """Create preview for PDF documents"""
        # In a real implementation, use a library like pdf2image
        # This is a simplified placeholder
        try:
            # Assume we use pdf2image to create a JPG of the first page
            document.has_preview = True
            # Preview generation logic would go here
            # document.preview_file = ContentFile(preview_data, name=f"{document.id}_preview.jpg")
            document.save(update_fields=['has_preview', 'preview_file'])
            return True
        except Exception as e:
            print(f"Error creating PDF preview: {str(e)}")
            return False
    
    @staticmethod
    def _create_office_preview(document):
        """Create preview for Office documents"""
        # In a real implementation, use a library like libreoffice
        # This is a simplified placeholder
        try:
            # Office document conversion logic would go here
            document.has_preview = True
            # document.preview_file = ContentFile(preview_data, name=f"{document.id}_preview.jpg")
            document.save(update_fields=['has_preview', 'preview_file'])
            return True
        except Exception as e:
            print(f"Error creating Office document preview: {str(e)}")
            return False
```

#### 4.4.3 Views

```python
# documents/views/document_views.py
from rest_framework import viewsets, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.contenttypes.models import ContentType

from documents.models import Document, DocumentType
from documents.serializers import (
    DocumentSerializer, 
    DocumentUploadSerializer,
    DocumentTypeSerializer
)
from documents.permissions import CanManageDocuments
from documents.services.storage_service import DocumentStorageService
from documents.services.preview_service import PreviewService

class DocumentViewSet(viewsets.ModelViewSet):
    """API endpoints for document management"""
    serializer_class = DocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [IsAuthenticated, CanManageDocuments]
    
    def get_queryset(self):
        """Filter documents based on user permissions"""
        # Similar permission filtering as applications
        user = self.request.user
        
        # Filter by content type and object if specified
        queryset = Document.objects.all()
        
        content_type_id = self.request.query_params.get('content_type_id')
        object_id = self.request.query_params.get('object_id')
        
        if content_type_id and object_id:
            queryset = queryset.filter(
                content_type_id=content_type_id,
                object_id=object_id
            )
        
        # Apply user permission filtering
        if not user.is_superuser and not user.has_permission('can_view_all_documents'):
            queryset = queryset.filter(uploaded_by=user)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Upload a new document"""
        serializer = DocumentUploadSerializer(data=request.data)
        if serializer.is_valid():
            # Extract metadata
            content_type_id = serializer.validated_data['content_type_id']
            object_id = serializer.validated_data['object_id']
            document_type_id = serializer.validated_data['document_type_id']
            
            # Validate the target object exists and user has permission
            try:
                content_type = ContentType.objects.get_for_id(content_type_id)
                target_object = content_type.get_object_for_this_type(id=object_id)
                
                # Check permission on target object
                if not self.has_permission_for_object(request.user, target_object):
                    return Response(
                        {"error": "You don't have permission to attach documents to this object"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                # Process the file
                document = DocumentStorageService.store_document(
                    file=serializer.validated_data['file'],
                    user=request.user,
                    content_object=target_object,
                    document_type_id=document_type_id,
                    title=serializer.validated_data.get('title'),
                    description=serializer.validated_data.get('description', '')
                )
                
                # Generate preview if possible
                PreviewService.create_preview(document)
                
                return Response(
                    DocumentSerializer(document).data, 
                    status=status.HTTP_201_CREATED
                )
                
            except (ContentType.DoesNotExist, Exception) as e:
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a document"""
        document = self.get_object()
        return DocumentStorageService.generate_download_response(document)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get document preview"""
        document = self.get_object()
        
        if not document.has_preview:
            # Generate preview on-demand if not already created
            success = PreviewService.create_preview(document)
            if not success:
                return Response(
                    {"error": "Preview not available for this document type"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response({
            "preview_url": document.preview_file.url if document.preview_file else None,
            "type": document.file_type
        })
        
    def has_permission_for_object(self, user, obj):
        """Check if user has permission to attach documents to the object"""
        # Implementation depends on your permission system
        # For example, check if user can view/edit the target object
        if hasattr(obj, 'can_be_edited_by'):
            return obj.can_be_edited_by(user)
        return True  # Default permission strategy
```

## 5. Database Configuration

### 5.1 PostgreSQL Setup

```python
# credit_risk_project/settings/base.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'credit_risk_db'),
        'USER': os.environ.get('DB_USER', 'credit_risk_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # 10 minutes connection persistence
        'OPTIONS': {
            'sslmode': os.environ.get('DB_SSLMODE', 'prefer'),
        },
    }
}
```

### 5.2 Environment-Specific Database Settings

```python
# credit_risk_project/settings/development.py
from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'credit_risk_dev',
        'USER': 'developer',
        'PASSWORD': 'dev_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# credit_risk_project/settings/production.py
from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': 'require',
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        },
    }
}
```

### 5.3 Document Storage Configuration

```python
# credit_risk_project/settings/base.py

# Local file storage configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Configure media serving for development
# In urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Your URL patterns
]

# Add this only for development environments
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

For production, you'll need to configure your web server (e.g., Nginx) to serve the media files directly:

```
# Example Nginx configuration for media files
location /media/ {
    alias /path/to/your/project/media/;
}
```


## 6. Frontend Components

### 6.1 React Setup

```jsx
// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/Auth/LoginPage';

// Main pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import ApplicationListPage from './pages/Applications/ApplicationListPage';
import ApplicationDetailPage from './pages/Applications/ApplicationDetailPage';
import ApplicationCreatePage from './pages/Applications/ApplicationCreatePage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';

// Auth guard for protected routes
import PrivateRoute from './components/common/PrivateRoute';

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          {/* Auth routes */}
          <Route path="/auth">
            <AuthLayout>
              <Switch>
                <Route path="/auth/login" component={LoginPage} />
                <Redirect to="/auth/login" />
              </Switch>
            </AuthLayout>
          </Route>
          
          {/* Protected routes */}
          <PrivateRoute path="/dashboard">
            <DashboardLayout>
              <Switch>
                <Route exact path="/dashboard" component={DashboardPage} />
                <Route exact path="/dashboard/applications" component={ApplicationListPage} />
                <Route path="/dashboard/applications/create" component={ApplicationCreatePage} />
                <Route path="/dashboard/applications/:id" component={ApplicationDetailPage} />
                <Route path="/dashboard/reports" component={ReportsPage} />
                <Route path="/dashboard/settings" component={SettingsPage} />
                <Redirect to="/dashboard" />
              </Switch>
            </DashboardLayout>
          </PrivateRoute>
          
          {/* Default redirect */}
          <Redirect to="/dashboard" />
        </Switch>
      </Router>
    </Provider>
  );
};

export default App;
```

### 6.2 API Services

```jsx
// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirect to login if token expired
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

```jsx
// frontend/src/services/authService.js
import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/token/', credentials);
    const { access, refresh, user } = response.data;
    
    // Store tokens
    localStorage.setItem('authToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    return user;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authService;
```

```jsx
// frontend/src/services/applicationService.js
import api from './api';

const applicationService = {
  getApplications: async (filters = {}) => {
    const response = await api.get('/applications/', { params: filters });
    return response.data;
  },
  
  getApplication: async (id) => {
    const response = await api.get(`/applications/${id}/`);
    return response.data;
  },
  
  createApplication: async (data) => {
    const response = await api.post('/applications/', data);
    return response.data;
  },
  
  updateApplication: async (id, data) => {
    const response = await api.patch(`/applications/${id}/`, data);
    return response.data;
  },
  
  getFormConfiguration: async (formName) => {
    const response = await api.get('/applications/form_configuration/', {
      params: { form_name: formName }
    });
    return response.data;
  },
  
  getDropdownOptions: async (dropdownName, context = null) => {
    const params = { dropdown_name: dropdownName };
    if (context) {
      params.context = context;
    }
    
    const response = await api.get('/applications/dropdown_options/', { params });
    return response.data;
  }
};

export default applicationService;
```

```jsx
// frontend/src/services/workflowService.js
import api from './api';

const workflowService = {
  getWorkflowState: async (instanceId) => {
    const response = await api.get(`/workflow/${instanceId}/`);
    return response.data;
  },
  
  getAvailableTransitions: async (applicationId) => {
    const response = await api.get(`/workflow/${applicationId}/available_transitions/`);
    return response.data;
  },
  
  executeTransition: async (applicationId, transitionName, metadata = {}) => {
    const data = {
      transition: transitionName,
      metadata
    };
    
    const response = await api.post(`/workflow/${applicationId}/transition/`, data);
    return response.data;
  }
};

export default workflowService;
```

```jsx
// frontend/src/services/documentService.js
import api from './api';

const documentService = {
  getDocuments: async (contentTypeId, objectId) => {
    const response = await api.get('/documents/', {
      params: { content_type_id: contentTypeId, object_id: objectId }
    });
    return response.data;
  },
  
  getDocumentTypes: async () => {
    const response = await api.get('/document-types/');
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
    
    const response = await api.post('/documents/', formData, config);
    return response.data;
  },
  
  downloadDocument: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/download/`, {
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
    const response = await api.get(`/documents/${documentId}/preview/`);
    return response.data;
  }
};

export default documentService;
```

### 6.3 React Component Examples

#### 6.3.1 Workflow Components

```jsx
// frontend/src/components/workflow/StateViewer.jsx
import React from 'react';
import PropTypes from 'prop-types';

const StateViewer = ({ currentState, availableTransitions, onTransition }) => {
  if (!currentState) {
    return <div className="workflow-no-state">No workflow state available</div>;
  }
  
  return (
    <div className="workflow-state-viewer">
      <div 
        className="current-state" 
        style={{ 
          backgroundColor: currentState.ui_color,
          borderLeft: `4px solid ${currentState.ui_color}`,
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        <h3 className="state-title">Current Status: {currentState.name}</h3>
        {currentState.description && (
          <p className="state-description">{currentState.description}</p>
        )}
      </div>
      
      <div className="available-actions">
        <h4>Available Actions:</h4>
        {availableTransitions.length > 0 ? (
          <div className="transition-buttons">
            {availableTransitions.map(transition => (
              <button 
                key={transition.id}
                onClick={() => onTransition(transition.name)}
                className="transition-button"
              >
                {transition.name}
              </button>
            ))}
          </div>
        ) : (
          <p>No actions available at this time.</p>
        )}
      </div>
    </div>
  );
};

StateViewer.propTypes = {
  currentState: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    ui_color: PropTypes.string
  }),
  availableTransitions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onTransition: PropTypes.func.isRequired
};

export default StateViewer;
```

#### 6.3.2 Document Components

```jsx
// frontend/src/components/documents/DocumentUploader.jsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { documentService } from '../../services/documentService';

const DocumentUploader = ({ 
  contentTypeId, 
  objectId, 
  documentTypeId,
  onUploadComplete 
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_type_id', contentTypeId);
      formData.append('object_id', objectId);
      formData.append('document_type_id', documentTypeId);
      formData.append('title', file.name);
      
      // Upload with progress tracking
      const document = await documentService.uploadDocument(
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      );
      
      if (onUploadComplete) {
        onUploadComplete(document);
      }
      
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false
  });
  
  return (
    <div className="document-uploader">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <div className="progress-text">{progress}% Uploaded</div>
          </div>
        ) : (
          <div className="upload-prompt">
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag & drop a file here, or click to select a file</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="upload-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};

DocumentUploader.propTypes = {
  contentTypeId: PropTypes.number.isRequired,
  objectId: PropTypes.number.isRequired,
  documentTypeId: PropTypes.number.isRequired,
  onUploadComplete: PropTypes.func
};

export default DocumentUploader;
```

#### 6.3.3 Application Page Component

```jsx
// frontend/src/pages/Applications/ApplicationDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import applicationService from '../../services/applicationService';
import workflowService from '../../services/workflowService';
import documentService from '../../services/documentService';

import StateViewer from '../../components/workflow/StateViewer';
import WorkflowHistory from '../../components/workflow/WorkflowHistory';
import DocumentUploader from '../../components/documents/DocumentUploader';
import DocumentList from '../../components/documents/DocumentList';
import { contentTypes } from '../../constants/contentTypes';

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workflowState, setWorkflowState] = useState(null);
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Document management
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  
  // Load application data
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getApplication(id);
        setApplication(data);
        
        // Load workflow state if available
        if (data.workflow_instance_id) {
          fetchWorkflowState(data.workflow_instance_id);
          fetchAvailableTransitions(data.id);
        }
      } catch (error) {
        console.error('Failed to load application:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplication();
  }, [id]);
  
  // Load document types
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const types = await documentService.getDocumentTypes();
        setDocumentTypes(types);
        if (types.length > 0) {
          setSelectedDocumentType(types[0].id);
        }
      } catch (error) {
        console.error('Error fetching document types:', error);
      }
    };
    
    fetchDocumentTypes();
  }, []);
  
  const fetchWorkflowState = async (instanceId) => {
    try {
      const state = await workflowService.getWorkflowState(instanceId);
      setWorkflowState(state);
    } catch (error) {
      console.error('Error fetching workflow state:', error);
    }
  };
  
  const fetchAvailableTransitions = async (applicationId) => {
    try {
      const transitions = await workflowService.getAvailableTransitions(applicationId);
      setAvailableTransitions(transitions);
    } catch (error) {
      console.error('Error fetching available transitions:', error);
    }
  };
  
  const handleTransition = async (transitionName) => {
    try {
      // Show confirmation dialog based on the transition
      const confirmed = window.confirm(
        `Are you sure you want to ${transitionName.toLowerCase()} this application?`
      );
      
      if (confirmed) {
        const result = await workflowService.executeTransition(
          application.id, 
          transitionName
        );
        
        // Refresh workflow state and transitions
        if (application.workflow_instance_id) {
          fetchWorkflowState(application.workflow_instance_id);
          fetchAvailableTransitions(application.id);
        }
      }
    } catch (error) {
      console.error('Transition failed:', error);
    }
  };
  
  const handleDocumentUploadComplete = () => {
    setShowUploader(false);
    // Force refresh of documents tab
    setActiveTab(1);
  };
  
  if (loading) {
    return <div className="loading">Loading application details...</div>;
  }
  
  if (!application) {
    return <div className="error">Application not found</div>;
  }
  
  return (
    <div className="application-detail-page">
      <div className="page-header">
        <h1>Application #{application.id}: {application.title}</h1>
        <button 
          className="btn-back"
          onClick={() => history.push('/dashboard/applications')}
        >
          Back to Applications
        </button>
      </div>
      
      <div className="application-summary">
        <div className="summary-item">
          <label>Status:</label>
          <span className="status-badge">{application.status}</span>
        </div>
        <div className="summary-item">
          <label>Amount:</label>
          <span>${application.amount.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <label>Created By:</label>
          <span>{application.created_by_name}</span>
        </div>
        <div className="summary-item">
          <label>Date:</label>
          <span>{new Date(application.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <Tabs 
        selectedIndex={activeTab} 
        onSelect={index => setActiveTab(index)}
        className="application-tabs"
      >
        <TabList>
          <Tab>Details</Tab>
          <Tab>Documents</Tab>
          <Tab>Workflow</Tab>
        </TabList>
        
        <TabPanel>
          <div className="application-details">
            <h2>Application Details</h2>
            
            <div className="detail-section">
              <h3>Applicant Information</h3>
              <div className="detail-row">
                <label>Name:</label>
                <span>{application.applicant_name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{application.applicant_email}</span>
              </div>
              <div className="detail-row">
                <label>Phone:</label>
                <span>{application.applicant_phone}</span>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Application Information</h3>
              <div className="detail-row">
                <label>Title:</label>
                <span>{application.title}</span>
              </div>
              <div className="detail-row">
                <label>Amount:</label>
                <span>${application.amount.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <label>Description:</label>
                <p>{application.description || 'No description provided.'}</p>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Assignment</h3>
              <div className="detail-row">
                <label>Assigned To:</label>
                <span>{application.assigned_to_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="application-documents">
            <div className="documents-header">
              <h2>Documents</h2>
              
              {!showUploader ? (
                <div className="document-actions">
                  <select 
                    value={selectedDocumentType || ''}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                  >
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn-upload"
                    onClick={() => setShowUploader(true)}
                    disabled={!selectedDocumentType}
                  >
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="upload-container">
                  <h3>Upload {documentTypes.find(t => t.id.toString() === selectedDocumentType.toString())?.name}</h3>
                  <DocumentUploader
                    contentTypeId={contentTypes.CREDIT_APPLICATION}
                    objectId={application.id}
                    documentTypeId={selectedDocumentType}
                    onUploadComplete={handleDocumentUploadComplete}
                  />
                  <button 
                    className="btn-cancel"
                    onClick={() => setShowUploader(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <DocumentList
              contentTypeId={contentTypes.CREDIT_APPLICATION}
              objectId={application.id}
            />
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="application-workflow">
            <h2>Workflow</h2>
            
            {workflowState ? (
              <>
                <StateViewer
                  currentState={workflowState.current_state}
                  availableTransitions={availableTransitions}
                  onTransition={handleTransition}
                />
                
                <WorkflowHistory
                  history={workflowState.history || []}
                />
              </>
            ) : (
              <p>No workflow information available for this application.</p>
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ApplicationDetailPage;
```

## 7. State Management

### 7.1 Understanding Redux in React

Redux is not a separate application but a state management library that works within your React frontend application. It provides a predictable way to manage application state, especially for complex applications with many components.

**What Redux Does:**
- Centralizes your application's state in a single store
- Provides a predictable pattern for updating that state
- Makes state changes traceable and debuggable
- Helps manage complex state that is shared across multiple components

**Why Use Redux:**
- For a Credit Risk Workflow app with many forms, workflows, and data dependencies
- When components in different parts of the app need to access/update the same data
- To keep state management logic separate from UI components

### 7.2 Redux Implementation

In your React frontend, Redux will be implemented like this:

```jsx
// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import applicationReducer from './slices/applicationSlice';
import uiReducer from './slices/uiSlice';

// This creates the Redux store that holds your application state
export const store = configureStore({
  reducer: {
    auth: authReducer,           // State related to authentication
    applications: applicationReducer, // State for credit applications
    ui: uiReducer                // UI state (loading indicators, modals, etc.)
  }
});
```

This store is then connected to your React application using a Provider component:

```jsx
// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```

### 7.3 Example Redux Slice

Redux Toolkit uses "slices" to organize related state and its logic:

```jsx
// frontend/src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// This async action fetches user data from the API
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(error.response?.data || { detail: 'Login failed' });
    }
  }
);

// This slice defines the auth state structure and how it changes
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: localStorage.getItem('authToken') ? true : false,
    loading: false,
    error: null
  },
  // Reducers define how to update the state
  reducers: {
    logout: (state) => {
      localStorage.removeItem('authToken');
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  // Extra reducers handle the async action states
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 7.4 Using Redux in Components

In your React components, you connect to the Redux store using hooks:

```jsx
// frontend/src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/authSlice';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Get state from Redux
  const { loading, error } = useSelector(state => state.auth);
  
  // Get dispatch function to send actions to Redux
  const dispatch = useDispatch();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Dispatch the login action
    await dispatch(login({ username, password }));
  };
  
  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        {error && <div className="error">{error.detail}</div>}
      </form>
    </div>
  );
};

export default LoginPage;
```

### 7.5 Alternative: React Context

For smaller applications, you might not need Redux and could use React's built-in Context API instead:

```jsx
// Simple context example
import React, { createContext, useState, useContext } from 'react';

// Create a context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = async (credentials) => {
    // Login logic here
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using this context
export const useAuth = () => useContext(AuthContext);
```

For your Credit Risk Workflow application, Redux is recommended due to the complexity of the state (managing workflows, forms, documents, etc.) and the need to share data across different parts of the application.

## 8. Deployment Configuration

### 8.1 Local Deployment

For the initial deployment, the application will run directly on a local server without containerization, using the existing Nginx setup.

#### 8.1.1 Backend Setup

```bash
# Create a new project (if starting fresh)
uv init credit_risk_project

# Create a virtual environment (with pip, if needed)
uv venv --seed

# Add dependencies (if not already in pyproject.toml)
uv add django gunicorn psycopg2

# For editable install (if needed, use pip)
uv pip install -e .

# Set up the database
# Make sure PostgreSQL is installed on your server
createdb credit_risk_db
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run with Gunicorn in production on port 8000
gunicorn credit_risk_project.wsgi:application --bind 0.0.0.0:8000
```

#### 8.1.2 Frontend Setup

```bash
# Install dependencies
npm install

# Build the production bundle
npm run build

# The build folder should be served by your existing Nginx
```

#### 8.1.3 Serving the Frontend from Django

Since you've chosen to serve the React frontend directly from Django (Option 1), here's a detailed implementation guide:

1. **Configure Django Settings**

   Add or update these settings in your Django `settings.py`:

   ```python
   # credit_risk_project/settings.py
   
   # Add your domain to allowed hosts
   ALLOWED_HOSTS = ['credit.gavinslater.co.uk', 'localhost', '127.0.0.1']
   
   # Add your domain to CSRF trusted origins (for HTTPS)
   CSRF_TRUSTED_ORIGINS = ['https://credit.gavinslater.co.uk']
   
   # Static files configuration
   STATIC_URL = '/static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   
   # Extra places for collectstatic to find static files
   STATICFILES_DIRS = [
       os.path.join(BASE_DIR, 'static'),
       # This will be where we'll put the React build files
       os.path.join(BASE_DIR, 'frontend_build'),
   ]
   
   # Media files configuration
   MEDIA_URL = '/media/'
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   ```

2. **Set Up URL Patterns to Serve React**

   Update your main `urls.py` to serve the React application and handle media files:

   ```python
   # credit_risk_project/urls.py
   from django.contrib import admin
   from django.urls import path, include, re_path
   from django.views.generic import TemplateView
   from django.conf import settings
   from django.conf.urls.static import static
   
   urlpatterns = [
       path('admin/', admin.site.urls),
       path('api/', include('api.urls')),  # Your API URLs
       
       # Serve React App - IMPORTANT: This should be the last entry!
       re_path(r'^.*
```

#### 8.1.4 Systemd Service for Backend

Create a systemd service file to manage the Django application running on port 8000:

```
# /etc/systemd/system/credit-risk-backend.service
[Unit]
Description=Credit Risk Workflow Backend
After=network.target

[Service]
User=your_user
Group=your_group
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 credit_risk_project.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable credit-risk-backend
sudo systemctl start credit-risk-backend
```

### 8.2 Future Containerization

Docker configuration can be implemented later when the application is more mature and ready for containerized deployment.
```

## 9. Development Workflow

### 9.1 Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/credit-risk-workflow.git
cd credit-risk-workflow

# Backend setup
cd backend
uv venv
uv pip install -e ".[dev]"

# Create database
psql -U postgres -c "CREATE DATABASE credit_risk_dev;"
psql -U postgres -c "CREATE USER developer WITH PASSWORD 'dev_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE credit_risk_dev TO developer;"

# Run migrations
uv run python manage.py migrate

# Create a superuser
uv run python manage.py createsuperuser

# Run development server
uv run python manage.py runserver

# Frontend setup (in a new terminal)
cd ../frontend
npm install
npm start
```

### 9.2 Development Workflow

1. **Feature Branches**: Create feature branches for new functionality
   ```bash
   git checkout -b feature/workflow-implementation
   ```

2. **Regular Testing**: Run tests before committing
   ```bash
   # Backend tests
   cd backend
   uv run pytest
   
   # Frontend tests
   cd frontend
   npm test
   ```

3. **Code Quality**: Maintain code quality with linters
   ```bash
   # Backend linting
   cd backend
   uv run black .
   uv run isort .
   
   # Frontend linting
   cd frontend
   npm run lint
   ```

4. **Pull Requests**: Create pull requests for code review before merging

## 10. Security Considerations

### 10.1 Authentication and Authorization

- JWT token-based authentication
- Role-based access control
- Permission checks on API endpoints
- Token expiration and refresh mechanism

### 10.2 Data Protection

- HTTPS for all connections
- Encrypted database connections
- File validations (type, size limits)
- Document access permissions
- Regular backups of uploaded files
- Proper file permissions on media directory

### 10.3 Input Validation

- Server-side validation of all inputs
- Sanitization of user inputs
- Protection against common vulnerabilities (CSRF, XSS)

### 10.4 Audit Trail

- Complete workflow history
- Document access and modification logs
- User action tracking

## 11. Future Enhancements

### 11.1 Risk Assessment Integration

Future integration with external risk assessment systems:

```python
# credit_applications/services/risk_assessment_service.py
class ExternalRiskAssessmentService:
    """Service for future integration with external risk assessment systems"""
    
    @staticmethod
    def prepare_for_assessment(application):
        """
        Prepare application data for sending to external risk assessment
        """
        # Transform application data to the format expected by external system
        return {
            "reference_id": str(application.id),
            "applicant_name": application.applicant_name,
            "amount": float(application.amount),
            # Other required fields
        }
    
    @staticmethod
    def record_assessment_result(application, result_data):
        """
        Record risk assessment results from external system
        """
        application.risk_score = result_data.get('score')
        application.risk_assessment_date = timezone.now()
        application.risk_assessment_reference = result_data.get('reference_id')
        application.save(update_fields=[
            'risk_score', 'risk_assessment_date', 'risk_assessment_reference'
        ])
        
        # Trigger workflow transition based on score
        if application.workflow:
            from workflow_engine.services import WorkflowService
            
            if application.risk_score is not None:
                if application.risk_score >= 70:
                    WorkflowService.execute_transition(
                        application, 
                        "Risk Assessment Complete", 
                        metadata={"risk_score": application.risk_score}
                    )
```

### 11.2 Advanced Reporting

- PDF report generation
- Data visualization dashboards
- Export to Excel/CSV

### 11.3 Workflow Improvements

- Visual workflow designer
- Conditional transitions based on data
- Automated triggers and notifications
- SLA tracking and reminders

## 12. Conclusion

This architecture document outlines a robust and scalable design for the Credit Risk Workflow application. The system is built on modern technologies and follows best practices for separation of concerns, modularity, and code organization.

Key strengths of this architecture include:

1. **Modular Design**: Clear separation of concerns with specialized apps
2. **Workflow Engine**: Flexible state-based workflow engine that can be adapted to different processes
3. **Document Management**: Secure document upload, storage, and preview functionality
4. **Role-Based Permissions**: Fine-grained control over user access and actions
5. **Modern Frontend**: Responsive React-based UI with component-based architecture
6. **API-Driven**: Clean REST API for communication between frontend and backend
7. **Containerization**: Docker-based deployment for consistency across environments
8. **PostgreSQL Integration**: Robust database design with proper indexing and constraints

By implementing this architecture, you'll have a solid foundation for your Credit Risk Workflow application that can be extended with additional features as your requirements evolve., TemplateView.as_view(template_name='index.html')),
   ]
   
   # Serve media files in development
   if settings.DEBUG:
       urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
   ```

3. **Build the React Frontend**

   ```bash
   # In your frontend directory
   npm run build
   ```

4. **Create Directory Structure for React Files**

   ```bash
   # In your Django project root
   mkdir -p frontend_build/static
   ```

5. **Copy React Build Files to Django**

   ```bash
   # Copy the index.html to a templates directory
   mkdir -p templates
   cp frontend/build/index.html templates/
   
   # Edit the index.html file to work with Django
   # You need to add {% load static %} at the top and 
   # replace references like "/static/..." with "{% static '...' %}"
   
   # Copy all static assets (JS, CSS, images)
   cp -r frontend/build/static/* frontend_build/static/
   ```

6. **Collect Static Files**

   ```bash
   python manage.py collectstatic
   ```

7. **Configure Django for Production Serving**

   When running in production, you should use a WSGI server like Gunicorn and serve static files with your web server (which is already handled by your proxy setup):

   ```bash
   # Install Gunicorn
   uv add gunicorn
   
   # Start Django with Gunicorn
   gunicorn credit_risk_project.wsgi:application --bind 0.0.0.0:8000
   ```

8. **Create a Systemd Service for the Backend**

   Create a service file at `/etc/systemd/system/credit-risk-backend.service`:

   ```
   [Unit]
   Description=Credit Risk Workflow Backend
   After=network.target
   
   [Service]
   User=your_user
   Group=your_group
   WorkingDirectory=/path/to/backend
   ExecStart=/path/to/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 credit_risk_project.wsgi:application
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start the service:

   ```bash
   sudo systemctl enable credit-risk-backend
   sudo systemctl start credit-risk-backend
   ```

9. **Verify Your Proxy Configuration**

   Ensure your existing proxy configuration still points to the Django backend:
   
   - Source: credit.gavinslater.co.uk
   - Destination: http://192.168.1.138:8000
   - SSL: Letsencrypt
   - Access: Public
   - Status: Online

This setup will have Django serve both the backend API and the React frontend from the same application. The React frontend will be served at the root URL, and the API will be accessible at `/api/` endpoints.

With this approach, you don't need to modify your existing proxy configuration since everything is being served from the same Django application on port 8000.
```

#### 8.1.4 Systemd Service for Backend

Create a systemd service file to manage the Django application running on port 8000:

```
# /etc/systemd/system/credit-risk-backend.service
[Unit]
Description=Credit Risk Workflow Backend
After=network.target

[Service]
User=your_user
Group=your_group
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 credit_risk_project.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable credit-risk-backend
sudo systemctl start credit-risk-backend
```

### 8.2 Future Containerization

Docker configuration can be implemented later when the application is more mature and ready for containerized deployment.
```

## 9. Development Workflow

### 9.1 Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/credit-risk-workflow.git
cd credit-risk-workflow

# Backend setup
cd backend
uv venv
uv pip install -e ".[dev]"

# Create database
psql -U postgres -c "CREATE DATABASE credit_risk_dev;"
psql -U postgres -c "CREATE USER developer WITH PASSWORD 'dev_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE credit_risk_dev TO developer;"

# Run migrations
uv run python manage.py migrate

# Create a superuser
uv run python manage.py createsuperuser

# Run development server
uv run python manage.py runserver

# Frontend setup (in a new terminal)
cd ../frontend
npm install
npm start
```

### 9.2 Development Workflow

1. **Feature Branches**: Create feature branches for new functionality
   ```bash
   git checkout -b feature/workflow-implementation
   ```

2. **Regular Testing**: Run tests before committing
   ```bash
   # Backend tests
   cd backend
   uv run pytest
   
   # Frontend tests
   cd frontend
   npm test
   ```

3. **Code Quality**: Maintain code quality with linters
   ```bash
   # Backend linting
   cd backend
   uv run black .
   uv run isort .
   
   # Frontend linting
   cd frontend
   npm run lint
   ```

4. **Pull Requests**: Create pull requests for code review before merging

## 10. Security Considerations

### 10.1 Authentication and Authorization

- JWT token-based authentication
- Role-based access control
- Permission checks on API endpoints
- Token expiration and refresh mechanism

### 10.2 Data Protection

- HTTPS for all connections
- Encrypted database connections
- File validations (type, size limits)
- Document access permissions
- Regular backups of uploaded files
- Proper file permissions on media directory

### 10.3 Input Validation

- Server-side validation of all inputs
- Sanitization of user inputs
- Protection against common vulnerabilities (CSRF, XSS)

### 10.4 Audit Trail

- Complete workflow history
- Document access and modification logs
- User action tracking

## 11. Future Enhancements

### 11.1 Risk Assessment Integration

Future integration with external risk assessment systems:

```python
# credit_applications/services/risk_assessment_service.py
class ExternalRiskAssessmentService:
    """Service for future integration with external risk assessment systems"""
    
    @staticmethod
    def prepare_for_assessment(application):
        """
        Prepare application data for sending to external risk assessment
        """
        # Transform application data to the format expected by external system
        return {
            "reference_id": str(application.id),
            "applicant_name": application.applicant_name,
            "amount": float(application.amount),
            # Other required fields
        }
    
    @staticmethod
    def record_assessment_result(application, result_data):
        """
        Record risk assessment results from external system
        """
        application.risk_score = result_data.get('score')
        application.risk_assessment_date = timezone.now()
        application.risk_assessment_reference = result_data.get('reference_id')
        application.save(update_fields=[
            'risk_score', 'risk_assessment_date', 'risk_assessment_reference'
        ])
        
        # Trigger workflow transition based on score
        if application.workflow:
            from workflow_engine.services import WorkflowService
            
            if application.risk_score is not None:
                if application.risk_score >= 70:
                    WorkflowService.execute_transition(
                        application, 
                        "Risk Assessment Complete", 
                        metadata={"risk_score": application.risk_score}
                    )
```

### 11.2 Advanced Reporting

- PDF report generation
- Data visualization dashboards
- Export to Excel/CSV

### 11.3 Workflow Improvements

- Visual workflow designer
- Conditional transitions based on data
- Automated triggers and notifications
- SLA tracking and reminders

## 12. Conclusion

This architecture document outlines a robust and scalable design for the Credit Risk Workflow application. The system is built on modern technologies and follows best practices for separation of concerns, modularity, and code organization.

Key strengths of this architecture include:

1. **Modular Design**: Clear separation of concerns with specialized apps
2. **Workflow Engine**: Flexible state-based workflow engine that can be adapted to different processes
3. **Document Management**: Secure document upload, storage, and preview functionality
4. **Role-Based Permissions**: Fine-grained control over user access and actions
5. **Modern Frontend**: Responsive React-based UI with component-based architecture
6. **API-Driven**: Clean REST API for communication between frontend and backend
7. **Containerization**: Docker-based deployment for consistency across environments
8. **PostgreSQL Integration**: Robust database design with proper indexing and constraints

By implementing this architecture, you'll have a solid foundation for your Credit Risk Workflow application that can be extended with additional features as your requirements evolve.