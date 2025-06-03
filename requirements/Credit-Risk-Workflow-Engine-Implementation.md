# Credit Risk Workflow System - Workflow Engine Implementation

This document details the implementation of the Workflow Engine component for the Credit Risk Workflow System. The Workflow Engine provides a flexible state machine for managing application workflows.

## 1. Workflow Engine Overview

The Workflow Engine is designed to:

1. Define configurable workflow definitions
2. Manage state transitions with validation
3. Enforce transition permissions based on user roles
4. Track workflow history

## 2. Models

### 2.1 Workflow Definition

```python
# workflow_engine/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class WorkflowDefinition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
```

### 2.2 Workflow State

```python
class WorkflowState(models.Model):
    workflow_definition = models.ForeignKey(
        WorkflowDefinition, 
        on_delete=models.CASCADE,
        related_name='states'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_initial_state = models.BooleanField(default=False)
    is_final_state = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('workflow_definition', 'name')
    
    def __str__(self):
        return f"{self.workflow_definition.name} - {self.name}"
```

### 2.3 Workflow Transition

```python
class WorkflowTransition(models.Model):
    workflow_definition = models.ForeignKey(
        WorkflowDefinition, 
        on_delete=models.CASCADE,
        related_name='transitions'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    source_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.CASCADE,
        related_name='source_transitions'
    )
    target_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.CASCADE,
        related_name='target_transitions'
    )
    allowed_roles = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('workflow_definition', 'name')
    
    def __str__(self):
        return f"{self.workflow_definition.name} - {self.name}"
```

### 2.4 Workflow Instance

```python
class WorkflowInstance(models.Model):
    workflow_definition = models.ForeignKey(
        WorkflowDefinition, 
        on_delete=models.PROTECT,
        related_name='instances'
    )
    current_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.PROTECT,
        related_name='current_instances'
    )
    content_type = models.ForeignKey(
        'contenttypes.ContentType',
        on_delete=models.CASCADE
    )
    object_id = models.PositiveIntegerField()
    created_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='created_workflow_instances'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.workflow_definition.name} - {self.id}"
    
    def get_allowed_transitions(self, user=None):
        """
        Get transitions allowed from the current state.
        If user is provided, filter by user's roles.
        """
        transitions = WorkflowTransition.objects.filter(
            workflow_definition=self.workflow_definition,
            source_state=self.current_state
        )
        
        if user:
            user_roles = [role.name for role in user.roles.all()]
            filtered_transitions = []
            
            for transition in transitions:
                # If no roles specified, anyone can perform the transition
                if not transition.allowed_roles:
                    filtered_transitions.append(transition)
                    continue
                
                # Check if user has any of the allowed roles
                if any(role in transition.allowed_roles for role in user_roles):
                    filtered_transitions.append(transition)
            
            return filtered_transitions
        
        return transitions
    
    def transition(self, transition_name, user, metadata=None):
        """
        Perform a transition on the workflow instance.
        """
        try:
            transition = WorkflowTransition.objects.get(
                workflow_definition=self.workflow_definition,
                source_state=self.current_state,
                name=transition_name
            )
        except WorkflowTransition.DoesNotExist:
            raise ValueError(f"Transition '{transition_name}' not found or not allowed from current state")
        
        # Check if user has permission to perform this transition
        if user:
            user_roles = [role.name for role in user.roles.all()]
            if transition.allowed_roles and not any(role in transition.allowed_roles for role in user_roles):
                raise ValueError(f"User does not have permission to perform transition '{transition_name}'")
        
        # Perform the transition
        old_state = self.current_state
        self.current_state = transition.target_state
        self.save()
        
        # Record the transition in history
        WorkflowHistory.objects.create(
            workflow_instance=self,
            transition=transition,
            from_state=old_state,
            to_state=transition.target_state,
            performed_by=user,
            metadata=metadata or {}
        )
        
        return self
```

### 2.5 Workflow History

```python
class WorkflowHistory(models.Model):
    workflow_instance = models.ForeignKey(
        WorkflowInstance, 
        on_delete=models.CASCADE,
        related_name='history'
    )
    transition = models.ForeignKey(
        WorkflowTransition, 
        on_delete=models.PROTECT,
        related_name='history'
    )
    from_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.PROTECT,
        related_name='from_history'
    )
    to_state = models.ForeignKey(
        WorkflowState, 
        on_delete=models.PROTECT,
        related_name='to_history'
    )
    performed_by = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='workflow_history'
    )
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.workflow_instance} - {self.transition.name} - {self.created_at}"
```

## 3. Serializers

### 3.1 Workflow Definition Serializer

```python
# workflow_engine/serializers.py
from rest_framework import serializers
from .models import (
    WorkflowDefinition, WorkflowState, WorkflowTransition,
    WorkflowInstance, WorkflowHistory
)

class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowDefinition
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
```

### 3.2 Workflow State Serializer

```python
class WorkflowStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowState
        fields = [
            'id', 'name', 'description', 'is_initial_state', 
            'is_final_state', 'created_at', 'updated_at'
        ]
```

### 3.3 Workflow Transition Serializer

```python
class WorkflowTransitionSerializer(serializers.ModelSerializer):
    source_state_name = serializers.CharField(source='source_state.name', read_only=True)
    target_state_name = serializers.CharField(source='target_state.name', read_only=True)
    
    class Meta:
        model = WorkflowTransition
        fields = [
            'id', 'name', 'description', 'source_state', 'source_state_name',
            'target_state', 'target_state_name', 'allowed_roles', 
            'created_at', 'updated_at'
        ]
```

### 3.4 Workflow Instance Serializer

```python
class WorkflowInstanceSerializer(serializers.ModelSerializer):
    workflow_definition_name = serializers.CharField(source='workflow_definition.name', read_only=True)
    current_state = WorkflowStateSerializer(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow_definition', 'workflow_definition_name',
            'current_state', 'content_type', 'object_id',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### 3.5 Workflow History Serializer

```python
class WorkflowHistorySerializer(serializers.ModelSerializer):
    transition_name = serializers.CharField(source='transition.name', read_only=True)
    from_state_name = serializers.CharField(source='from_state.name', read_only=True)
    to_state_name = serializers.CharField(source='to_state.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = WorkflowHistory
        fields = [
            'id', 'workflow_instance', 'transition', 'transition_name',
            'from_state', 'from_state_name', 'to_state', 'to_state_name',
            'performed_by', 'performed_by_name', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
```

## 4. Views

### 4.1 Workflow Instance Views

```python
# workflow_engine/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WorkflowInstance, WorkflowTransition
from .serializers import (
    WorkflowInstanceSerializer, WorkflowTransitionSerializer,
    WorkflowHistorySerializer
)

class WorkflowInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowInstance.objects.all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def allowed_transitions(self, request, pk=None):
        instance = self.get_object()
        transitions = instance.get_allowed_transitions(request.user)
        serializer = WorkflowTransitionSerializer(transitions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        instance = self.get_object()
        history = instance.history.all()
        serializer = WorkflowHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        instance = self.get_object()
        transition_name = request.data.get('transition')
        metadata = request.data.get('metadata', {})
        
        if not transition_name:
            return Response(
                {'error': 'Transition name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instance.transition(transition_name, request.user, metadata)
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
```

## 5. URL Configuration

```python
# workflow_engine/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowInstanceViewSet

router = DefaultRouter()
router.register(r'', WorkflowInstanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

## 6. Integration with Credit Applications

The Workflow Engine is integrated with the Credit Applications app to manage the credit request workflow:

```python
# credit_applications/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from workflow_engine.models import WorkflowInstance

User = get_user_model()

class CreditApplication(models.Model):
    # ... other fields
    
    # Generic relation to workflow instances
    workflow_instances = GenericRelation(
        WorkflowInstance,
        content_type_field='content_type',
        object_id_field='object_id'
    )
    
    def create_workflow_instance(self, user):
        """
        Create a workflow instance for this credit application.
        """
        from workflow_engine.models import WorkflowDefinition, WorkflowState
        
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
```

## 7. Credit Request Workflow Definition

The Credit Request Workflow is defined with the following states and transitions:

### 7.1 States

1. **Draft**: Initial state when a credit request is created
2. **Submitted**: Credit request has been submitted for review
3. **Business Review**: Credit request is under business review
4. **Credit Analysis**: Credit request is under credit analysis
5. **Legal Review**: Credit request is under legal review
6. **Final Approval**: Credit request is awaiting final approval
7. **Approved**: Credit request has been approved
8. **Rejected**: Credit request has been rejected
9. **Cancelled**: Credit request has been cancelled

### 7.2 Transitions

1. **Submit**: Draft → Submitted (Roles: Applicant)
2. **Assign to Business**: Submitted → Business Review (Roles: Credit Manager)
3. **Assign to Credit**: Business Review → Credit Analysis (Roles: Business Sponsor)
4. **Request Legal Review**: Credit Analysis → Legal Review (Roles: Credit Analyst)
5. **Return to Credit**: Legal Review → Credit Analysis (Roles: Legal Reviewer)
6. **Submit for Approval**: Credit Analysis → Final Approval (Roles: Credit Analyst)
7. **Approve**: Final Approval → Approved (Roles: Credit Committee)
8. **Reject**: Final Approval → Rejected (Roles: Credit Committee)
9. **Return for Revision**: Final Approval → Credit Analysis (Roles: Credit Committee)
10. **Cancel**: Any State → Cancelled (Roles: Credit Manager, Admin)

## 8. Implementation Notes

1. The Workflow Engine is designed to be generic and reusable across different types of workflows
2. All API endpoints use the `/api/` prefix for consistency
3. Transitions are validated based on the current state and user roles
4. Workflow history is tracked for audit and reporting purposes
5. The system supports custom metadata for transitions, allowing additional context to be stored
