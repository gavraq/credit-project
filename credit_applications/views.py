from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
import json

# Import workflow models
from workflow_engine.models import WorkflowDefinition, State, WorkflowInstance

# Import all form models
from .models import (
    CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm,
    CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm, CreditQuestionnaireForm,
    CreditAnalysisForm, CreditCompilationForm, CreditApprovalForm
)
from .serializers import (
    CreditApplicationSerializer, CounterpartySerializer, LimitRequestSerializer,
    LimitTypeSerializer, CreditRequestFormSerializer
)

class LimitTypeViewSet(viewsets.ModelViewSet):
    queryset = LimitType.objects.all()
    serializer_class = LimitTypeSerializer

class CounterpartyViewSet(viewsets.ModelViewSet):
    queryset = Counterparty.objects.all()
    serializer_class = CounterpartySerializer

class LimitRequestViewSet(viewsets.ModelViewSet):
    queryset = LimitRequest.objects.all()
    serializer_class = LimitRequestSerializer

class CreditApplicationViewSet(viewsets.ModelViewSet):
    queryset = CreditApplication.objects.all()
    serializer_class = CreditApplicationSerializer
    
    def update(self, request, *args, **kwargs):
        import json
        from rest_framework.response import Response
        from rest_framework import status
        print(f"\n\nVIEWSET UPDATE - request.data: {json.dumps(request.data, indent=2, default=str)}\n")
        
        instance = self.get_object()
        
        # --- Workflow Instance Creation (Optional) ---
        create_workflow_instance_flag = request.data.get('create_workflow_instance', False)
        if create_workflow_instance_flag and not instance.workflow_instance:
            print(f"Attempting to create workflow instance for credit application: {instance.id}")
            try:
                from workflow_engine.models import WorkflowDefinition, State, WorkflowInstance
                from django.contrib.contenttypes.models import ContentType
                from .models import (
                    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm,
                    CreditQuestionnaireForm, CreditAnalysisForm, CreditCompilationForm, CreditApprovalForm
                )

                # Parent workflow for CreditApplication
                workflow_def = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
                initial_state = State.objects.get(workflow_definition=workflow_def, is_initial=True)
                
                parent_workflow_instance = WorkflowInstance.objects.create(
                    workflow_definition=workflow_def,
                    current_state=initial_state,
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=instance.id
                )
                instance.workflow_instance = parent_workflow_instance
                instance.save(update_fields=['workflow_instance'])
                print(f"Created parent workflow instance with ID: {parent_workflow_instance.id}")
                
                sub_workflows_config = [
                    ('CREDIT_REQUEST', CreditRequestForm, 'creditrequestform'),
                    ('CREDIT_REVIEW', CreditReviewForm, 'creditreviewform'),
                    ('BUSINESS_SPONSORSHIP', BusinessSponsorshipForm, 'businesssponsorshipform'),
                    ('LEGAL_REVIEW', LegalReviewForm, 'legalreviewform'),
                    ('CREDIT_QUESTIONNAIRE', CreditQuestionnaireForm, 'creditquestionnaireform'),
                    ('CREDIT_ANALYSIS', CreditAnalysisForm, 'creditanalysisform'),
                    ('CREDIT_COMPILATION', CreditCompilationForm, 'creditcompilationform'),
                    ('CREDIT_APPROVAL', CreditApprovalForm, 'creditapprovalform'),
                ]
                
                for wf_code, model_cls, related_name in sub_workflows_config:
                    try:
                        sub_wf_def = WorkflowDefinition.objects.get(code=wf_code)
                        sub_initial_state = State.objects.get(workflow_definition=sub_wf_def, is_initial=True)
                        sub_obj = getattr(instance, related_name, None)
                        if not sub_obj:
                            sub_obj = model_cls.objects.create(credit_application=instance)
                            print(f"Created {model_cls.__name__} with ID: {sub_obj.id} for sub-workflow {wf_code}")
                        
                        if not getattr(sub_obj, 'workflow_instance', None):
                            sub_wf_instance = WorkflowInstance.objects.create(
                                workflow_definition=sub_wf_def,
                                current_state=sub_initial_state,
                                content_type=ContentType.objects.get_for_model(sub_obj),
                                object_id=sub_obj.id
                            )
                            sub_obj.workflow_instance = sub_wf_instance
                            sub_obj.save(update_fields=['workflow_instance'])
                            print(f"Created sub-workflow instance for {model_cls.__name__} ({wf_code}) with ID: {sub_wf_instance.id}")
                        else:
                            print(f"{model_cls.__name__} ({wf_code}) already has workflow instance: {sub_obj.workflow_instance.id}")
                    except WorkflowDefinition.DoesNotExist:
                        print(f"WorkflowDefinition with code {wf_code} not found. Skipping sub-workflow creation.")
                    except State.DoesNotExist:
                        print(f"Initial state for workflow {wf_code} not found. Skipping sub-workflow creation.")
                    except Exception as e_sub_wf:
                        print(f"Error creating sub-workflow for {wf_code} on {model_cls.__name__}: {e_sub_wf}")
            except Exception as e_wf_main:
                print(f"Error during main workflow instance creation process: {e_wf_main}")
                # Depending on policy, you might want to return an error or just log and continue
                # For now, we log and continue to attempt the main data update.

        # --- Standard DRF Update Logic ---
        try:
            data_for_serializer = request.data.copy()
            data_for_serializer.pop('create_workflow_instance', None) # Remove flag if present
            
            partial = kwargs.pop('partial', True) # Default for PATCH is partial=True
            serializer = self.get_serializer(instance, data=data_for_serializer, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer) # This calls serializer.save()
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
                
            return Response(serializer.data)
            
        except Exception as e_main_update:
            print(f"Error during main update of CreditApplication: {e_main_update}")
            import traceback
            traceback.print_exc()
            # Return a DRF error response
            return Response(
                {'detail': f'An error occurred during the update: {str(e_main_update)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        # Import here to avoid circular import
        from workflow_engine.models import WorkflowDefinition, State, WorkflowInstance
        from django.contrib.contenttypes.models import ContentType
        from .models import (
            CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm,
            CreditQuestionnaireForm, CreditAnalysisForm, CreditCompilationForm, CreditApprovalForm
        )
        # Extract form_data from request data if present
        form_data = serializer.context['request'].data.get('form_data')
        
        # Parent workflow for CreditApplication
        workflow_def = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
        initial_state = State.objects.get(workflow_definition=workflow_def, is_initial=True)
        credit_app = serializer.save()
        # Create parent workflow instance and link
        instance = WorkflowInstance.objects.create(
            workflow_definition=workflow_def,
            current_state=initial_state,
            content_type=ContentType.objects.get_for_model(credit_app),
            object_id=credit_app.id
        )
        credit_app.workflow_instance = instance
        credit_app.save(update_fields=['workflow_instance'])

        # Sub-process workflow codes (must match those in workflow_engine)
        sub_workflows = [
            ('CREDIT_REQUEST', CreditRequestForm, 'credit_request_forms'),
            ('CREDIT_REVIEW', CreditReviewForm, 'credit_review_forms'),
            ('BUSINESS_SPONSORSHIP', BusinessSponsorshipForm, 'business_sponsorship_forms'),
            ('LEGAL_REVIEW', LegalReviewForm, 'legal_review_forms'),
            ('CREDIT_QUESTIONNAIRE', CreditQuestionnaireForm, 'credit_questionnaire_forms'),
            ('CREDIT_ANALYSIS', CreditAnalysisForm, 'credit_analysis_forms'),
            ('CREDIT_COMPILATION', CreditCompilationForm, 'credit_compilation_forms'),
            ('CREDIT_APPROVAL', CreditApprovalForm, 'credit_approval_forms'),
        ]
        for wf_code, model_cls, related_name in sub_workflows:
            try:
                sub_wf_def = WorkflowDefinition.objects.get(code=wf_code)
                sub_initial_state = State.objects.get(workflow_definition=sub_wf_def, is_initial=True)
                
                # If this is the CreditRequestForm, we need to handle it differently now
                if model_cls == CreditRequestForm:
                    # The serializer already created a CreditRequestForm instance
                    # Let's retrieve it instead of creating a new one
                    try:
                        sub_obj = credit_app.credit_request_form
                    except CreditRequestForm.DoesNotExist:
                        # If it doesn't exist for some reason, create it
                        sub_obj = model_cls.objects.create(credit_application=credit_app)
                else:
                    sub_obj = model_cls.objects.create(credit_application=credit_app)
                    
                sub_instance = WorkflowInstance.objects.create(
                    workflow_definition=sub_wf_def,
                    current_state=sub_initial_state,
                    content_type=ContentType.objects.get_for_model(sub_obj),
                    object_id=sub_obj.id
                )
                sub_obj.workflow_instance = sub_instance
                sub_obj.save(update_fields=['workflow_instance'])
            except (WorkflowDefinition.DoesNotExist, State.DoesNotExist) as e:
                # Optionally: log or raise warning if a sub-process workflow is missing
                continue


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


