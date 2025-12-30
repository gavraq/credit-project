# Credit Risk Workflow System - Workflow Engine Implementation

This document details the implementation of the Workflow Engine component for the Credit Risk Workflow System. The Workflow Engine provides a flexible, metadata-driven state machine for managing application workflows.

## 1. Workflow Engine Overview

The Workflow Engine is designed to:

1. Define configurable workflow definitions with metadata
2. Manage state transitions with validation
3. Enforce transition permissions based on user roles
4. Support additional authorization checks (DA-level, sponsor assignment)
5. Execute system actions on transitions
6. Auto-initialize forms when entering new states
7. Track workflow history via state logs

## 2. Models

All models are located in `workflow_engine/models.py` and use UUID primary keys.

### 2.1 Workflow

The core workflow definition model.

```python
# workflow_engine/models.py

class Workflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name
```

**Key Fields:**
- `code`: Unique identifier used for lookups (e.g., `CREDIT_PAPER`, `BUSINESS_SPONSORSHIP`)
- `metadata`: JSON configuration including form metadata, field mappings, and UI configuration

### 2.2 State

Represents a state within a workflow.

```python
class State(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='states')
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_initial = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        unique_together = ('workflow', 'code')

    def __str__(self):
        return f"{self.workflow.code}: {self.name}"
```

**Key Fields:**
- `code`: Unique within workflow (e.g., `CREDIT_PAPER_DRAFT`, `CREDIT_PAPER_SUBMITTED`)
- `is_initial`: Entry point for new workflow instances
- `is_terminal`: Final state (workflow complete)
- `metadata`: JSON configuration for auto-initialization, UI behavior, navigation

### 2.3 Transition

Defines allowed state changes and who can perform them.

```python
class Transition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='transitions')
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    from_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='transitions_from')
    to_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='transitions_to')
    allowed_roles = models.JSONField(blank=True, null=True)
    conditions = models.JSONField(blank=True, null=True)
    system_action = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        unique_together = ('workflow', 'code')

    def __str__(self):
        return f"{self.workflow.code}: {self.name} ({self.from_state.code} → {self.to_state.code})"
```

**Key Fields:**
- `allowed_roles`: JSON array of role names that can perform this transition
- `conditions`: JSON object for custom validation logic (placeholder for future use)
- `system_action`: Name of action handler to execute after transition (e.g., `advance_parent_workflow`)
- `metadata`: UI behavior configuration (button styles, confirmation dialogs)

### 2.4 WorkflowInstance

Links a workflow to a specific object (e.g., CreditApplication or sub-form).

```python
class WorkflowInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='instances')
    current_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='instances')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Instance of {self.workflow.code} at state {self.current_state.code}"
```

**Key Methods:**

#### get_allowed_transitions(user)

Returns transitions the user can perform from the current state.

```python
def get_allowed_transitions(self, user):
    from_state = self.current_state
    possible_transitions = self.workflow.transitions.filter(from_state=from_state)

    allowed = []
    user_role_name = getattr(user.role, "name", None)

    for t in possible_transitions:
        role_permits = False

        # Check role permission
        if not t.allowed_roles:
            role_permits = True
        elif user_role_name:
            allowed_roles_norm = [r.strip().lower().replace(" ", "_") for r in t.allowed_roles]
            user_role_norm = user_role_name.strip().lower().replace(" ", "_")
            if user_role_norm in allowed_roles_norm:
                role_permits = True

        # Check DA-level authorization for approval transitions
        da_permits = True
        if (role_permits and
            user_role_name == 'Credit Analyst' and
            'approve' in t.code.lower() and
            self.content_type.model == 'creditapplication'):
            from .da_authorization import can_user_approve_credit_application
            credit_app = self.content_object
            if credit_app:
                da_permits = can_user_approve_credit_application(user, credit_app)

        # Check assigned sponsor authorization for Business Sponsorship
        sponsor_permits = True
        if role_permits and self.workflow.code == 'BUSINESS_SPONSORSHIP':
            bsf = self.business_sponsorship_forms.first()
            if bsf:
                is_senior = bsf.senior_business_sponsor_id == user.id
                is_second = bsf.second_business_sponsor_id == user.id
                sponsor_permits = is_senior or is_second

        if role_permits and da_permits and sponsor_permits:
            allowed.append(t)

    return allowed
```

**Authorization Layers:**
1. **Role-based**: User's role must be in `allowed_roles`
2. **DA-level**: Credit Analysts can only approve within their delegation authority
3. **Sponsor assignment**: Only assigned sponsors can action Business Sponsorship workflows

#### perform_transition(transition_code, user, comments, system_context)

Executes a state transition with full validation and side effects.

```python
def perform_transition(self, transition_code, user, comments='', system_context=None):
    # Find and validate transition
    transition = self.workflow.transitions.get(
        code=transition_code,
        from_state=self.current_state
    )

    # Verify user permission
    allowed_transitions = self.get_allowed_transitions(user)
    if transition not in allowed_transitions:
        raise PermissionError(f"User does not have permission")

    # Create audit log
    StateLog.objects.create(
        workflow_instance=self,
        transition=transition,
        from_state=self.current_state,
        to_state=transition.to_state,
        performed_by=user,
        comments=comments,
        system_context=system_context or {}
    )

    # Update state
    self.current_state = transition.to_state
    self.save(update_fields=['current_state', 'updated_at'])

    # Execute system action if defined
    if transition.system_action:
        from .actions import get_system_action_handler
        action_handler = get_system_action_handler(transition.system_action)
        if action_handler:
            action_handler(self, user, transition)

    # Auto-initialize forms for new state
    if self.content_type.model == 'creditapplication':
        from .utils import auto_initialize_forms_for_state
        auto_initialize_forms_for_state(
            self.content_object,
            state_code=self.current_state.code
        )

    return self
```

### 2.5 StateLog

Audit trail for all state transitions.

```python
class StateLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='logs')
    transition = models.ForeignKey(Transition, on_delete=models.CASCADE, related_name='logs')
    from_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='logs_from')
    to_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='logs_to')
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    performed_at = models.DateTimeField(auto_now_add=True)
    comments = models.TextField(blank=True)
    system_context = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.workflow_instance}: {self.from_state.code} → {self.to_state.code}"
```

## 3. Serializers

Serializers are located in `backend/users/serializers.py`.

### 3.1 WorkflowInstanceSerializer

```python
# backend/users/serializers.py

class WorkflowInstanceSerializer(serializers.ModelSerializer):
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowInstance
        fields = '__all__'

    def get_allowed_transitions(self, obj):
        user = self.context['request'].user
        transitions = obj.get_allowed_transitions(user)
        return [
            {
                'code': t.code,
                'name': t.name,
                'to_state': t.to_state.code,
                'description': t.description,
                'metadata': t.metadata
            }
            for t in transitions
        ]
```

### 3.2 StateLogSerializer

```python
class StateLogSerializer(serializers.ModelSerializer):
    transition = serializers.StringRelatedField()
    from_state = serializers.StringRelatedField()
    to_state = serializers.StringRelatedField()
    performed_by = serializers.StringRelatedField()

    class Meta:
        model = StateLog
        fields = '__all__'
```

### 3.3 WorkflowTransitionSerializer

Used for validating transition requests.

```python
class WorkflowTransitionSerializer(serializers.Serializer):
    transition_code = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    system_context = serializers.JSONField(required=False)
```

## 4. Views

Views are located in `backend/users/views.py` as class-based APIViews.

### 4.1 WorkflowInstanceDetailView

```python
# backend/users/views.py

class WorkflowInstanceDetailView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request, pk):
        instance = WorkflowInstance.objects.get(pk=pk)
        serializer = WorkflowInstanceSerializer(instance, context={'request': request})
        return Response(serializer.data)
```

### 4.2 WorkflowInstanceTransitionView

```python
class WorkflowInstanceTransitionView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def post(self, request, pk):
        instance = WorkflowInstance.objects.get(pk=pk)
        serializer = WorkflowTransitionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            instance.perform_transition(
                transition_code=data['transition_code'],
                user=request.user,
                comments=data.get('comments', ''),
                system_context=data.get('system_context', {})
            )

            # Return updated credit application data
            credit_app = instance.credit_applications.first()
            if credit_app:
                from credit_applications.serializers import CreditApplicationSerializer
                app_serializer = CreditApplicationSerializer(
                    credit_app,
                    context={'request': request}
                )
                return Response(app_serializer.data)

            return Response(WorkflowInstanceSerializer(instance, context={'request': request}).data)

        except (ValueError, PermissionError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
```

### 4.3 WorkflowInstanceLogListView

```python
class WorkflowInstanceLogListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request, pk):
        instance = get_object_or_404(WorkflowInstance, pk=pk)
        logs = StateLog.objects.filter(workflow_instance=instance).order_by('-performed_at')
        serializer = StateLogSerializer(logs, many=True)
        return Response(serializer.data)
```

### 4.4 WorkflowInstanceListView

```python
class WorkflowInstanceListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request):
        instances = WorkflowInstance.objects.all().select_related('workflow', 'current_state')
        data = [{
            'id': str(instance.id),
            'workflow': instance.workflow.code,
            'current_state': instance.current_state.code,
            'created_at': instance.created_at.isoformat()
        } for instance in instances]
        return Response(data)
```

## 5. URL Configuration

URLs are defined in `backend/urls.py`.

```python
# backend/urls.py

urlpatterns = [
    # ... other urls ...

    path('api/workflow-instances/',
         WorkflowInstanceListView.as_view(),
         name='workflow_instance_list'),

    path('api/workflow-instances/<uuid:pk>/',
         WorkflowInstanceDetailView.as_view(),
         name='workflow_instance_detail'),

    path('api/workflow-instances/<uuid:pk>/transition/',
         WorkflowInstanceTransitionView.as_view(),
         name='workflow_instance_transition'),

    path('api/workflow-instances/<uuid:pk>/logs/',
         WorkflowInstanceLogListView.as_view(),
         name='workflow_instance_logs'),
]
```

## 6. System Actions

System actions are automated handlers executed after transitions. They are defined in `workflow_engine/actions.py`.

### 6.1 Action Handler Registry

```python
# workflow_engine/actions.py

SYSTEM_ACTION_HANDLERS = {
    'advance_parent_workflow': advance_parent_workflow,
    'create_sub_workflow': create_sub_workflow,
    # Add more handlers as needed
}

def get_system_action_handler(action_name):
    """Get the handler function for a system action."""
    return SYSTEM_ACTION_HANDLERS.get(action_name)
```

### 6.2 Advance Parent Workflow

Used when a sub-workflow completion should advance the parent workflow.

```python
def advance_parent_workflow(workflow_instance, user, transition):
    """
    Advances the parent workflow when a sub-workflow completes.
    Configuration comes from transition metadata.
    """
    metadata = transition.metadata or {}
    parent_transition_code = metadata.get('parent_transition_code')

    if not parent_transition_code:
        return

    # Get the parent credit application
    content_object = workflow_instance.content_object
    if hasattr(content_object, 'credit_application'):
        credit_app = content_object.credit_application
        parent_instance = credit_app.workflow_instance

        if parent_instance:
            parent_instance.perform_transition(
                transition_code=parent_transition_code,
                user=user,
                comments=f"Auto-advanced from {workflow_instance.workflow.code}",
                system_context={'triggered_by': str(workflow_instance.id)}
            )
```

## 7. Integration with Credit Applications

### 7.1 Model Relationships

CreditApplication and sub-forms use direct ForeignKey relationships to WorkflowInstance.

```python
# credit_applications/models.py

class CreditApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ... other fields ...

    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_applications'
    )

class CreditRequestForm(models.Model):
    credit_application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='credit_request_form'
    )
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_request_forms'
    )
    # ... form-specific fields ...
```

### 7.2 Workflow Hierarchy

Every form has its own sub-workflow to track its lifecycle independently:

```
CreditApplication (CREDIT_PAPER workflow)
├── CreditRequestForm (CREDIT_REQUEST workflow)
├── CreditReviewForm (CREDIT_REVIEW workflow)
├── BusinessSponsorshipForm (BUSINESS_SPONSORSHIP workflow) *
├── CreditQuestionnaireForm (CREDIT_QUESTIONNAIRE workflow)
├── LegalReviewForm (LEGAL_REVIEW workflow)
├── CreditAnalysisForm (CREDIT_ANALYSIS workflow)
├── CreditCompilationForm (CREDIT_COMPILATION workflow)
└── CreditApprovalForm (CREDIT_APPROVAL workflow)

* Has additional sponsor assignment authorization
```

**Why Sub-Workflows?**
1. **Independent State Tracking**: Each form progresses through DRAFT → IN_PROGRESS → SUBMITTED
2. **Role-Based Actions**: Different roles work on different forms (RM, Credit Analyst, Business Sponsor, Legal Reviewer)
3. **Transition Conditions**: Parent workflow uses sub-workflow states as prerequisites (e.g., can only advance when `CREDIT_REVIEW_SUBMITTED`)
4. **Audit Trail**: Each form's state changes are logged separately

### 7.3 Creating Workflow Instances

Workflow instances are created when forms are auto-initialized:

```python
# workflow_engine/utils.py

def auto_initialize_forms_for_state(credit_app, state_code):
    """
    Auto-initialize forms based on state metadata.
    Creates sub-workflow instances where configured.
    """
    state = State.objects.get(code=state_code)
    metadata = state.metadata or {}
    forms_to_init = metadata.get('auto_initialize_forms', [])

    for form_config in forms_to_init:
        form_key = form_config.get('form_key')
        sub_workflow_code = form_config.get('sub_workflow_code')

        # Create form if it doesn't exist
        form_instance = get_or_create_form(credit_app, form_key)

        # Create sub-workflow if configured
        if sub_workflow_code and not form_instance.workflow_instance:
            workflow = Workflow.objects.get(code=sub_workflow_code)
            initial_state = workflow.states.get(is_initial=True)

            wi = WorkflowInstance.objects.create(
                workflow=workflow,
                current_state=initial_state,
                content_type=ContentType.objects.get_for_model(form_instance),
                object_id=form_instance.id
            )
            form_instance.workflow_instance = wi
            form_instance.save()
```

## 8. Authorization

### 8.1 DA-Level Authorization

Credit Analysts have delegation authority limits that restrict which applications they can approve.

```python
# workflow_engine/da_authorization.py

def can_user_approve_credit_application(user, credit_app):
    """
    Check if user's DA level permits approving this application.
    """
    # Get user's DA level from profile
    user_da_level = getattr(user, 'da_level', None)
    if not user_da_level:
        return False

    # Get application's required approval level
    required_level = calculate_required_approval_level(credit_app)

    return user_da_level >= required_level
```

### 8.2 Sponsor Authorization

Business Sponsorship workflows restrict actions to assigned sponsors.

```python
# Checked in WorkflowInstance.get_allowed_transitions()

if self.workflow.code == 'BUSINESS_SPONSORSHIP':
    bsf = self.business_sponsorship_forms.first()
    if bsf:
        is_senior = bsf.senior_business_sponsor_id == user.id
        is_second = bsf.second_business_sponsor_id == user.id
        sponsor_permits = is_senior or is_second
```

## 9. Workflows in the System

### 9.1 CREDIT_PAPER (Main Workflow)

The primary workflow for credit applications, tracking the overall approval process.

**States:**
- `CREDIT_PAPER_CREDIT_REQUEST` (initial) - Credit Request being prepared
- `CREDIT_PAPER_CREDIT_REVIEW_PENDING` - Awaiting Credit Review completion
- `CREDIT_PAPER_BUSINESS_SPONSOR_PENDING` - Awaiting Business Sponsorship
- `CREDIT_PAPER_ANALYSIS_PENDING` - Parallel analysis phase (Questionnaire, Legal, Credit Analysis)
- `CREDIT_PAPER_COMPILATION` - Credit Compilation phase
- `CREDIT_PAPER_APPROVAL_PENDING` - Awaiting final approval
- `CREDIT_PAPER_APPROVED` (terminal) - Application approved
- `CREDIT_PAPER_REJECTED` (terminal) - Application rejected

### 9.2 Sub-Workflows (Form-Level)

All sub-workflows follow the same state pattern:

| Workflow | Form | States |
|----------|------|--------|
| CREDIT_REQUEST | CreditRequestForm | DRAFT → IN_PROGRESS → SUBMITTED |
| CREDIT_REVIEW | CreditReviewForm | DRAFT → IN_PROGRESS → SUBMITTED |
| BUSINESS_SPONSORSHIP | BusinessSponsorshipForm | DRAFT → IN_PROGRESS → SUBMITTED |
| CREDIT_QUESTIONNAIRE | CreditQuestionnaireForm | DRAFT → IN_PROGRESS → SUBMITTED |
| LEGAL_REVIEW | LegalReviewForm | DRAFT → IN_PROGRESS → SUBMITTED |
| CREDIT_ANALYSIS | CreditAnalysisForm | DRAFT → IN_PROGRESS → SUBMITTED |
| CREDIT_COMPILATION | CreditCompilationForm | DRAFT → IN_PROGRESS → SUBMITTED |
| CREDIT_APPROVAL | CreditApprovalForm | DRAFT → IN_PROGRESS → SUBMITTED |

**State Code Pattern:**
- `{WORKFLOW}_DRAFT` - Form being edited, can save without submitting
- `{WORKFLOW}_IN_PROGRESS` - Form actively being worked on
- `{WORKFLOW}_SUBMITTED` - Form completed and submitted (terminal)

### 9.3 Parent-Child Workflow Coordination

When a sub-workflow reaches its terminal state, it can trigger advancement of the parent workflow:

```
CreditReviewForm SUBMITTED
    → Parent advances from CREDIT_REVIEW_PENDING to BUSINESS_SPONSOR_PENDING

BusinessSponsorshipForm SUBMITTED
    → Parent advances from BUSINESS_SPONSOR_PENDING to ANALYSIS_PENDING

[All analysis forms SUBMITTED]
    → Parent advances from ANALYSIS_PENDING to COMPILATION
```

This coordination is configured via `system_action` on transitions and `conditions` that check sub-workflow states.

## 10. Implementation Notes

1. **UUID Primary Keys**: All models use UUIDs for distributed system compatibility
2. **Code-Based Lookups**: Use `code` field for stable references, not names
3. **Metadata-Driven**: Configuration stored in JSON fields for flexibility
4. **Audit Trail**: All transitions logged in StateLog with user and context
5. **System Actions**: Automated workflows via transition.system_action field
6. **Role Normalization**: Role names are normalized for comparison (spaces → underscores, lowercase)
7. **Layered Authorization**: Role + DA-level + Sponsor checks for comprehensive security

## 11. Related Documentation

- [Metadata-Driven Workflow System](../architecture/metadata-driven-workflow-system.md) - Architecture overview
- [Credit-Risk-Form-Lifecycle](./Credit-Risk-Form-Lifecycle.md) - Form data handling
- [Credit-Risk-API-Service-Implementation](./Credit-Risk-API-Service-Implementation.md) - API layer details
