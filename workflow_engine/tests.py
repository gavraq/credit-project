from django.test import TestCase
from django.contrib.auth import get_user_model
from workflow_engine.models import WorkflowDefinition, State, Transition, WorkflowInstance
from backend.users.models import Role

class WorkflowInstanceAllowedTransitionsTest(TestCase):
    def setUp(self):
        # Create roles
        self.role_rm = Role.objects.create(name="Relationship Manager")
        self.role_analyst = Role.objects.create(name="Credit Analyst")
        # Create user
        User = get_user_model()
        self.user_rm = User.objects.create(username="rm1", role=self.role_rm, employee_id="E001")
        self.user_analyst = User.objects.create(username="ca1", role=self.role_analyst, employee_id="E002")
        # Create workflow definition
        self.workflow_def = WorkflowDefinition.objects.create(code="credit_request", name="Credit Request Workflow")
        # Create states
        self.state_draft = State.objects.create(code="DRAFT", name="Draft", workflow_definition=self.workflow_def)
        self.state_review = State.objects.create(code="IN_REVIEW", name="In Review", workflow_definition=self.workflow_def)
        # Create transitions
        self.transition_submit = Transition.objects.create(
            workflow_definition=self.workflow_def,
            code="submit",
            name="Submit for Review",
            from_state=self.state_draft,
            to_state=self.state_review,
            allowed_roles=["Relationship Manager"]
        )
        self.transition_return = Transition.objects.create(
            workflow_definition=self.workflow_def,
            code="return",
            name="Return to Draft",
            from_state=self.state_review,
            to_state=self.state_draft,
            allowed_roles=["Credit Analyst"]
        )
        # Create workflow instance
        from django.contrib.contenttypes.models import ContentType
        user_ct = ContentType.objects.get_for_model(self.user_rm)
        self.instance = WorkflowInstance.objects.create(
            workflow_definition=self.workflow_def,
            current_state=self.state_draft,
            content_type=user_ct,
            object_id=self.user_rm.pk
        )

    def test_allowed_transitions_for_relationship_manager(self):
        allowed = self.instance.get_allowed_transitions(self.user_rm)
        self.assertEqual(len(allowed), 1)
        self.assertEqual(allowed[0].code, "submit")

    def test_allowed_transitions_for_credit_analyst(self):
        allowed = self.instance.get_allowed_transitions(self.user_analyst)
        self.assertEqual(len(allowed), 0)

    def test_allowed_transitions_after_state_change(self):
        # Move to IN_REVIEW
        self.instance.current_state = self.state_review
        self.instance.save()
        allowed_rm = self.instance.get_allowed_transitions(self.user_rm)
        allowed_analyst = self.instance.get_allowed_transitions(self.user_analyst)
        self.assertEqual(len(allowed_rm), 0)
        self.assertEqual(len(allowed_analyst), 1)
        self.assertEqual(allowed_analyst[0].code, "return")
