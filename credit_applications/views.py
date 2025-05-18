from rest_framework import viewsets
from .models import CreditApplication, Counterparty, LimitRequest, LimitType
from .serializers import CreditApplicationSerializer, CounterpartySerializer, LimitRequestSerializer, LimitTypeSerializer

class LimitTypeViewSet(viewsets.ModelViewSet):
    queryset = LimitType.objects.all()
    serializer_class = LimitTypeSerializer

class CounterpartyViewSet(viewsets.ModelViewSet):
    queryset = Counterparty.objects.all()
    serializer_class = CounterpartySerializer

class LimitRequestViewSet(viewsets.ModelViewSet):
    queryset = LimitRequest.objects.all()
    serializer_class = LimitRequestSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class CreditApplicationViewSet(viewsets.ModelViewSet):
    queryset = CreditApplication.objects.all()
    serializer_class = CreditApplicationSerializer

    def perform_create(self, serializer):
        # Import here to avoid circular import
        from workflow_engine.models import WorkflowDefinition, State, WorkflowInstance
        from django.contrib.contenttypes.models import ContentType
        # Find the workflow definition for CreditApplication (parent process)
        workflow_def = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
        initial_state = State.objects.get(workflow_definition=workflow_def, is_initial=True)
        credit_app = serializer.save()
        # Create workflow instance and link
        instance = WorkflowInstance.objects.create(
            workflow_definition=workflow_def,
            current_state=initial_state,
            content_type=ContentType.objects.get_for_model(credit_app),
            object_id=credit_app.id
        )
        credit_app.workflow_instance = instance
        credit_app.save(update_fields=['workflow_instance'])

    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        """
        Perform a workflow transition for this credit application.
        Expects {"transition_code": "...", "comments": "..."}
        """
        from workflow_engine.models import Transition, StateLog
        credit_app = self.get_object()
        workflow_instance = credit_app.workflow_instance
        if not workflow_instance:
            return Response({"detail": "No workflow instance linked."}, status=status.HTTP_400_BAD_REQUEST)
        transition_code = request.data.get('transition_code')
        comments = request.data.get('comments', '')
        try:
            transition = Transition.objects.get(
                workflow_definition=workflow_instance.workflow_definition,
                code=transition_code,
                from_state=workflow_instance.current_state
            )
        except Transition.DoesNotExist:
            return Response({"detail": "Invalid or unavailable transition for current state."}, status=status.HTTP_400_BAD_REQUEST)
        # Role-based permission enforcement
        user = request.user
        # allowed_roles may be a list of names or IDs; support both
        allowed_roles = transition.allowed_roles or []
        user_role_name = getattr(getattr(user, 'role', None), 'name', None)
        user_role_id = str(getattr(getattr(user, 'role', None), 'id', ''))
        allowed_roles_str = [str(r) for r in allowed_roles]
        if not user.is_superuser and user_role_name not in allowed_roles_str and user_role_id not in allowed_roles_str:
            return Response({"detail": "You do not have permission to perform this transition. Your role is not allowed."}, status=status.HTTP_403_FORBIDDEN)
        # Perform transition
        prev_state = workflow_instance.current_state
        workflow_instance.current_state = transition.to_state
        workflow_instance.save(update_fields=['current_state'])
        # Audit log
        StateLog.objects.create(
            workflow_instance=workflow_instance,
            transition=transition,
            from_state=prev_state,
            to_state=transition.to_state,
            performed_by=request.user if request.user.is_authenticated else None,
            comments=comments
        )
        return Response({"detail": "Transition successful.", "new_state": {
            "id": str(transition.to_state.id),
            "code": transition.to_state.code,
            "name": transition.to_state.name
        }})


