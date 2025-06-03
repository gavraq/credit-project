# Credit Risk Workflow System - Credit Applications Implementation

This document details the implementation of the Credit Applications app for the Credit Risk Workflow System. The Credit Applications app handles the core business logic for credit requests, including form data storage, limit management, and integration with the workflow engine.

## 1. Credit Applications Overview

The Credit Applications app is designed to:

1. Manage credit application creation and updates
2. Store form data using JSON fields for flexibility
3. Handle limit requests with proper validation
4. Integrate with the workflow engine for state management

## 2. Models

### 2.1 Counterparty Model

```python
# credit_applications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from workflow_engine.models import WorkflowInstance

User = get_user_model()

class Counterparty(models.Model):
    name = models.CharField(max_length=255)
    cif_number = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Counterparties"
    
    def __str__(self):
        return self.name
```

### 2.2 LimitType Model

```python
class LimitType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
```

### 2.3 CreditApplication Model

```python
class CreditApplication(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    
    title = models.CharField(max_length=255)
    counterparty = models.ForeignKey(
        Counterparty, 
        on_delete=models.PROTECT,
        related_name='credit_applications'
    )
    guarantor = models.ForeignKey(
        Counterparty, 
        on_delete=models.SET_NULL,
        related_name='guaranteed_applications',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='created_applications'
    )
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL,
        related_name='assigned_applications',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Generic relation to workflow instances
    workflow_instances = GenericRelation(
        WorkflowInstance,
        content_type_field='content_type',
        object_id_field='object_id'
    )
    
    def __str__(self):
        return self.title
    
    def create_workflow_instance(self, user):
        """
        Create a workflow instance for this credit application.
        """
        from django.contrib.contenttypes.models import ContentType
        from workflow_engine.models import WorkflowDefinition, WorkflowState, WorkflowInstance
        
        # Get the credit request workflow definition
        workflow_def = WorkflowDefinition.objects.get(name='Credit Request Workflow')
        
        # Get the initial state
        initial_state = WorkflowState.objects.get(
            workflow_definition=workflow_def,
            is_initial_state=True
        )
        
        # Create the workflow instance
        workflow_instance = WorkflowInstance.objects.create(
            workflow_definition=workflow_def,
            current_state=initial_state,
            content_type=ContentType.objects.get_for_model(self),
            object_id=self.id,
            created_by=user
        )
        
        return workflow_instance
    
    def get_active_workflow_instance(self):
        """
        Get the active workflow instance for this credit application.
        """
        return self.workflow_instances.first()
```

### 2.4 CreditRequestForm Model

```python
class CreditRequestForm(models.Model):
    credit_application = models.OneToOneField(
        CreditApplication, 
        on_delete=models.CASCADE,
        related_name='credit_request_form'
    )
    form_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Credit Request Form for {self.credit_application.title}"
```

### 2.5 LimitRequest Model

```python
class LimitRequest(models.Model):
    credit_application = models.ForeignKey(
        CreditApplication, 
        on_delete=models.CASCADE,
        related_name='limit_requests'
    )
    limit_type = models.ForeignKey(
        LimitType, 
        on_delete=models.PROTECT
    )
    existing_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        null=True,
        blank=True
    )
    existing_tenor = models.IntegerField(
        null=True,
        blank=True
    )
    proposed_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2
    )
    proposed_tenor = models.IntegerField(
        null=True,
        blank=True
    )
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.limit_type.name} limit for {self.credit_application.title}"
```

## 3. Serializers

### 3.1 Counterparty Serializer

```python
# credit_applications/serializers.py
from rest_framework import serializers
from .models import (
    Counterparty, LimitType, CreditApplication,
    CreditRequestForm, LimitRequest
)

class CounterpartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty
        fields = ['id', 'name', 'cif_number', 'description', 'is_active', 'created_at', 'updated_at']
```

### 3.2 LimitType Serializer

```python
class LimitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimitType
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
```

### 3.3 LimitRequest Serializer

```python
class LimitRequestSerializer(serializers.ModelSerializer):
    limit_type_name = serializers.CharField(source='limit_type.name', read_only=True)
    
    class Meta:
        model = LimitRequest
        fields = [
            'id', 'credit_application', 'limit_type', 'limit_type_name',
            'existing_amount', 'existing_tenor', 'proposed_amount', 
            'proposed_tenor', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### 3.4 CreditRequestForm Serializer

```python
class CreditRequestFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditRequestForm
        fields = ['id', 'credit_application', 'form_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### 3.5 CreditApplication Serializer

```python
class CreditApplicationSerializer(serializers.ModelSerializer):
    counterparty_name = serializers.CharField(source='counterparty.name', read_only=True)
    guarantor_name = serializers.CharField(source='guarantor.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    limit_requests = LimitRequestSerializer(many=True, required=False)
    credit_request_form = CreditRequestFormSerializer(required=False)
    workflow_instance = serializers.SerializerMethodField()
    create_workflow_instance = serializers.BooleanField(write_only=True, required=False)
    
    class Meta:
        model = CreditApplication
        fields = [
            'id', 'title', 'counterparty', 'counterparty_name', 
            'guarantor', 'guarantor_name', 'status',
            'created_by', 'created_by_name', 'assigned_to', 'assigned_to_name',
            'created_at', 'updated_at', 'limit_requests', 'credit_request_form',
            'workflow_instance', 'create_workflow_instance'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'workflow_instance']
    
    def get_workflow_instance(self, obj):
        instance = obj.get_active_workflow_instance()
        if instance:
            return instance.id
        return None
    
    def create(self, validated_data):
        limit_requests_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        create_workflow_instance = validated_data.pop('create_workflow_instance', False)
        
        # Create credit application
        credit_application = CreditApplication.objects.create(**validated_data)
        
        # Create credit request form if provided
        if credit_request_form_data:
            CreditRequestForm.objects.create(
                credit_application=credit_application,
                **credit_request_form_data
            )
        else:
            # Create empty form data
            CreditRequestForm.objects.create(
                credit_application=credit_application,
                form_data={}
            )
        
        # Create limit requests
        for limit_request_data in limit_requests_data:
            LimitRequest.objects.create(
                credit_application=credit_application,
                **limit_request_data
            )
        
        # Create workflow instance if requested
        if create_workflow_instance:
            credit_application.create_workflow_instance(
                self.context['request'].user
            )
        
        return credit_application
    
    def update(self, instance, validated_data):
        limit_requests_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        create_workflow_instance = validated_data.pop('create_workflow_instance', False)
        
        # Update credit application fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update credit request form if provided
        if credit_request_form_data:
            credit_request_form, created = CreditRequestForm.objects.get_or_create(
                credit_application=instance
            )
            
            if 'form_data' in credit_request_form_data:
                credit_request_form.form_data = credit_request_form_data['form_data']
                credit_request_form.save()
        
        # Handle limit requests - replace existing ones
        if limit_requests_data:
            # Delete existing limit requests
            instance.limit_requests.all().delete()
            
            # Create new limit requests
            for limit_request_data in limit_requests_data:
                LimitRequest.objects.create(
                    credit_application=instance,
                    **limit_request_data
                )
        
        # Create workflow instance if requested and not already exists
        if create_workflow_instance and not instance.get_active_workflow_instance():
            instance.create_workflow_instance(
                self.context['request'].user
            )
        
        return instance
```

## 4. Views

### 4.1 Counterparty ViewSet

```python
# credit_applications/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    Counterparty, LimitType, CreditApplication,
    CreditRequestForm, LimitRequest
)
from .serializers import (
    CounterpartySerializer, LimitTypeSerializer,
    CreditApplicationSerializer, CreditRequestFormSerializer,
    LimitRequestSerializer
)

class CounterpartyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Counterparty.objects.filter(is_active=True)
    serializer_class = CounterpartySerializer
    permission_classes = [IsAuthenticated]
```

### 4.2 LimitType ViewSet

```python
class LimitTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LimitType.objects.filter(is_active=True)
    serializer_class = LimitTypeSerializer
    permission_classes = [IsAuthenticated]
```

### 4.3 CreditApplication ViewSet

```python
class CreditApplicationViewSet(viewsets.ModelViewSet):
    queryset = CreditApplication.objects.all()
    serializer_class = CreditApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        """
        queryset = CreditApplication.objects.all()
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by counterparty
        counterparty_id = self.request.query_params.get('counterparty_id', None)
        if counterparty_id:
            queryset = queryset.filter(counterparty_id=counterparty_id)
        
        # Filter by created_by
        created_by_id = self.request.query_params.get('created_by_id', None)
        if created_by_id:
            queryset = queryset.filter(created_by_id=created_by_id)
        
        # Filter by assigned_to
        assigned_to_id = self.request.query_params.get('assigned_to_id', None)
        if assigned_to_id:
            queryset = queryset.filter(assigned_to_id=assigned_to_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set created_by to the current user.
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def form_configuration(self, request):
        """
        Get form configuration for a specific form.
        """
        form_name = request.query_params.get('form_name', None)
        if not form_name:
            return Response(
                {'error': 'form_name parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get form configuration from settings or database
        # This is a placeholder for actual implementation
        form_config = {
            'credit_request_form': {
                'sections': [
                    {
                        'name': 'counterparty',
                        'title': 'Counterparty Information',
                        'fields': [
                            {
                                'name': 'counterparty',
                                'label': 'Counterparty Name',
                                'type': 'select',
                                'required': True,
                                'options_source': 'counterparties'
                            },
                            {
                                'name': 'counterparty_cif',
                                'label': 'Counterparty CIF number',
                                'type': 'text',
                                'required': True,
                                'disabled': True
                            },
                            # ... other fields
                        ]
                    },
                    {
                        'name': 'limits',
                        'title': 'Limits',
                        'fields': [
                            {
                                'name': 'limit_type',
                                'label': 'Limit Type',
                                'type': 'select',
                                'required': True,
                                'options_source': 'limit_types'
                            },
                            {
                                'name': 'existing_amount',
                                'label': 'Existing Amount',
                                'type': 'number',
                                'required': False
                            },
                            {
                                'name': 'existing_tenor',
                                'label': 'Existing Tenor (days)',
                                'type': 'number',
                                'required': False
                            },
                            {
                                'name': 'proposed_amount',
                                'label': 'Proposed Amount',
                                'type': 'number',
                                'required': True
                            },
                            {
                                'name': 'proposed_tenor',
                                'label': 'Proposed Tenor (days)',
                                'type': 'number',
                                'required': False
                            },
                            {
                                'name': 'comments',
                                'label': 'Comments',
                                'type': 'textarea',
                                'required': False
                            }
                        ],
                        'repeatable': True
                    },
                    # ... other sections
                ]
            }
        }
        
        if form_name not in form_config:
            return Response(
                {'error': f'Form configuration for {form_name} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(form_config[form_name])
    
    @action(detail=False, methods=['get'])
    def dropdown_options(self, request):
        """
        Get options for dropdown fields.
        """
        dropdown_name = request.query_params.get('dropdown_name', None)
        if not dropdown_name:
            return Response(
                {'error': 'dropdown_name parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get options based on dropdown name
        if dropdown_name == 'counterparties':
            counterparties = Counterparty.objects.filter(is_active=True)
            serializer = CounterpartySerializer(counterparties, many=True)
            return Response(serializer.data)
        
        elif dropdown_name == 'limit_types':
            limit_types = LimitType.objects.filter(is_active=True)
            serializer = LimitTypeSerializer(limit_types, many=True)
            return Response(serializer.data)
        
        # ... other dropdown options
        
        return Response(
            {'error': f'Dropdown options for {dropdown_name} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
```

## 5. URL Configuration

```python
# credit_applications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CounterpartyViewSet, LimitTypeViewSet,
    CreditApplicationViewSet
)

router = DefaultRouter()
router.register(r'counterparties', CounterpartyViewSet)
router.register(r'limit-types', LimitTypeViewSet)
router.register(r'credit-applications', CreditApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

## 6. Main URL Configuration

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

## 7. Frontend Integration

The Credit Applications backend integrates with the frontend through the API service layer. All API endpoints are prefixed with `/api/` for consistency.

### 7.1 API Endpoints

1. **Counterparties**: `/api/credit/counterparties/`
2. **Limit Types**: `/api/credit/limit-types/`
3. **Credit Applications**: `/api/credit/credit-applications/`
4. **Form Configuration**: `/api/credit/credit-applications/form_configuration/`
5. **Dropdown Options**: `/api/credit/credit-applications/dropdown_options/`

### 7.2 Data Flow

1. The frontend fetches form configuration and dropdown options
2. The user fills out the Credit Request Form
3. The form data is submitted to create or update a credit application
4. The backend creates or updates related models (CreditRequestForm, LimitRequest)
5. Workflow instances are created when requested by the frontend

## 8. Implementation Notes

1. The Credit Applications app uses a flexible data model with JSON fields for form data
2. All API endpoints use the `/api/` prefix for consistency
3. The app integrates with the Workflow Engine for state management
4. The backend provides configuration endpoints for dynamic form rendering
5. Limit requests are properly structured with the correct field names
6. The system supports both creating new credit requests and editing existing ones
