import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

class WorkflowDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name

class State(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_definition = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='states')
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_initial = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        unique_together = ('workflow_definition', 'code')

    def __str__(self):
        return f"{self.workflow_definition.code}: {self.name}"

class Transition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_definition = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='transitions')
    code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    from_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='transitions_from')
    to_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='transitions_to')
    allowed_roles = models.JSONField(blank=True, null=True)  # List of role codes or IDs
    conditions = models.JSONField(blank=True, null=True)     # Validation logic, system checks
    system_action = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        unique_together = ('workflow_definition', 'code')

    def __str__(self):
        return f"{self.workflow_definition.code}: {self.name} ({self.from_state.code} → {self.to_state.code})"

class WorkflowInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_definition = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='instances')
    current_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='instances')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Instance of {self.workflow_definition.code} at state {self.current_state.code}"

    def get_allowed_transitions(self, user):
        from_state = self.current_state
        transitions = self.workflow_definition.transitions.filter(from_state=from_state)
        user_role = getattr(user.role, "name", None)
        allowed = []
        for t in transitions:
            if t.allowed_roles and user_role:
                # Normalize role strings for comparison
                allowed_roles_norm = [r.lower().replace(" ", "_") for r in t.allowed_roles]
                user_role_norm = user_role.lower().replace(" ", "_")
                if user_role_norm in allowed_roles_norm:
                    allowed.append(t)
        return allowed
        
    def perform_transition(self, transition_code, user, comments='', system_context=None):
        """Perform a workflow transition.
        
        Args:
            transition_code: The code of the transition to perform
            user: The user performing the transition
            comments: Optional comments about the transition
            system_context: Optional system context data
            
        Returns:
            The updated workflow instance
            
        Raises:
            ValueError: If the transition is not allowed
            PermissionError: If the user doesn't have permission to perform the transition
        """
        # Find the transition by code
        try:
            transition = self.workflow_definition.transitions.get(
                code=transition_code,
                from_state=self.current_state
            )
        except Transition.DoesNotExist:
            raise ValueError(f"Transition '{transition_code}' is not valid from current state '{self.current_state.code}'")
        
        # Check if user has permission to perform this transition
        allowed_transitions = self.get_allowed_transitions(user)
        if transition not in allowed_transitions:
            raise PermissionError(f"User does not have permission to perform transition '{transition_code}'")
        
        # Create a log entry for this transition
        StateLog.objects.create(
            workflow_instance=self,
            transition=transition,
            from_state=self.current_state,
            to_state=transition.to_state,
            performed_by=user,
            comments=comments,
            system_context=system_context or {}
        )
        
        # Update the current state
        old_state = self.current_state
        self.current_state = transition.to_state
        self.save(update_fields=['current_state', 'updated_at'])
        
        print(f"Workflow transition: {old_state.code} -> {self.current_state.code} via {transition_code}")
        
        return self

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
        return f"{self.workflow_instance}: {self.from_state.code} → {self.to_state.code} by {self.performed_by}"

# Create your models here.
