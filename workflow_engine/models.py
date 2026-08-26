import uuid
import logging
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

logger = logging.getLogger(__name__)

class Workflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name

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

class Transition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='transitions')
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
        unique_together = ('workflow', 'code')

    def __str__(self):
        return f"{self.workflow.code}: {self.name} ({self.from_state.code} → {self.to_state.code})"

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

    def get_allowed_transitions(self, user):
        from workflow_engine.services.transitions import get_allowed_transitions_for_user

        return get_allowed_transitions_for_user(self, user)
        
    def perform_transition(self, transition_code, user, comments='', system_context=None):
        from workflow_engine.services.transitions import execute_transition

        return execute_transition(self, transition_code, user, comments, system_context)

class WorkflowArtifact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name='artifacts',
    )
    artifact_key = models.CharField(max_length=100)
    artifact_kind = models.CharField(max_length=50, default='form')
    title = models.CharField(max_length=255)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    object_id = models.UUIDField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('workflow_instance', 'artifact_key')

    def __str__(self):
        return f"{self.workflow_instance_id}:{self.artifact_key}"

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
