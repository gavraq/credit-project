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
        from_state = self.current_state
        # Fetch all transitions from the current state
        possible_transitions = self.workflow.transitions.filter(from_state=from_state)
        
        allowed = []
        user_role_name = getattr(user.role, "name", None)

        for t in possible_transitions:
            # Assume the transition is not permitted by role, then prove it is
            role_permits = False

            if not t.allowed_roles:  # If allowed_roles is empty or None, transition is permitted by role
                role_permits = True
            elif user_role_name:     # If there are allowed_roles, user must have a role and it must match
                # Normalize role strings for comparison (stripping whitespace first is a good practice)
                allowed_roles_norm = [r.strip().lower().replace(" ", "_") for r in t.allowed_roles]
                user_role_norm = user_role_name.strip().lower().replace(" ", "_")
                if user_role_norm in allowed_roles_norm:
                    role_permits = True
            
            # Check DA-level authorization for approval transitions
            da_permits = True
            if (role_permits and
                user_role_name == 'Credit Analyst' and
                'approve' in t.code.lower() and
                self.content_type and
                self.content_type.model == 'creditapplication'):
                try:
                    from .da_authorization import can_user_approve_credit_application
                    credit_app = self.content_object
                    if credit_app:
                        da_permits = can_user_approve_credit_application(user, credit_app)
                except Exception as e:
                    logger.error(f"Error checking DA authorization: {e}")
                    da_permits = False

            # Check assigned sponsor authorization for Business Sponsorship workflows
            sponsor_permits = True
            if role_permits and self.workflow.code == 'BUSINESS_SPONSORSHIP':
                try:
                    # Get the BusinessSponsorshipForm linked to this workflow instance
                    bsf = self.business_sponsorship_forms.first()
                    if bsf:
                        # User must be one of the assigned sponsors
                        is_senior_sponsor = bsf.senior_business_sponsor and bsf.senior_business_sponsor.id == user.id
                        is_second_sponsor = bsf.second_business_sponsor and bsf.second_business_sponsor.id == user.id
                        sponsor_permits = is_senior_sponsor or is_second_sponsor
                        if not sponsor_permits:
                            logger.debug(f"User {user.username} is not an assigned sponsor for this application")
                except Exception as e:
                    logger.error(f"Error checking sponsor authorization: {e}")
                    sponsor_permits = False

            # Placeholder for checking additional conditions defined in t.conditions
            # For now, we assume other conditions are met or not yet implemented.
            # conditions_permit = self._check_custom_conditions(t, user)
            conditions_permit = True

            if role_permits and conditions_permit and da_permits and sponsor_permits:
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
        import logging
        logger = logging.getLogger(__name__)

        # Find the transition by code
        try:
            transition = self.workflow.transitions.get(
                code=transition_code,
                from_state=self.current_state
            )
        except Transition.DoesNotExist:
            raise ValueError(f"Transition '{transition_code}' is not valid from current state '{self.current_state.code}'")

        # Check if user has permission to perform this transition
        allowed_transitions = self.get_allowed_transitions(user)
        if transition not in allowed_transitions:
            # Allow system user to bypass this check if the role is in allowed_roles
            allowed_role_codes = transition.allowed_roles or []
            if not (user.username == 'system' and 'system' in allowed_role_codes) :
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

        logger.info(f"Workflow transition: {old_state.code} -> {self.current_state.code} via {transition_code} for instance {self.id}")

        # Execute system action if defined for the transition
        if transition.system_action:
            from .actions import get_system_action_handler # Delayed import
            action_handler = get_system_action_handler(transition.system_action)
            if action_handler:
                try:
                    logger.info(f"Executing system action: {transition.system_action} for instance {self.id}")
                    action_handler(self, user, transition)
                except Exception as e_sys_action:
                    logger.error(f"Error executing system action '{transition.system_action}' for instance {self.id}: {e_sys_action}", exc_info=True)
            else:
                logger.warning(f"No handler found for system action: {transition.system_action} for instance {self.id}")

        # Auto-initialize forms for the new state if this is a CreditApplication workflow
        try:
            from django.contrib.contenttypes.models import ContentType
            from credit_applications.models import CreditApplication
            
            # Check if this workflow instance is attached to a CreditApplication
            if self.content_type and self.content_type.model == 'creditapplication':
                credit_app = self.content_object
                if credit_app:
                    try:
                        from .utils import auto_initialize_forms_for_state
                        initialized_forms = auto_initialize_forms_for_state(
                            credit_app, 
                            state_code=self.current_state.code
                        )
                        if initialized_forms:
                            logger.info(f"Auto-initialized {len(initialized_forms)} forms for application {credit_app.id} in state {self.current_state.code}")
                    except Exception as e:
                        logger.error(f"Error auto-initializing forms for application after transition: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Error during form auto-initialization check: {e}", exc_info=True)

        # Parent workflow transitions are now handled by metadata-driven system actions
        # See workflow_engine/actions.py for implementation

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
