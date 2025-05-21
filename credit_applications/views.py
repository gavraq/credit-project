from rest_framework import viewsets
from .models import CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm
from .serializers import CreditApplicationSerializer, CounterpartySerializer, LimitRequestSerializer, LimitTypeSerializer, CreditRequestFormSerializer

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
    
    def update(self, request, *args, **kwargs):
        # Add detailed logging for debugging
        import json
        print(f"\n\nUPDATE REQUEST DATA: {json.dumps(request.data, indent=2, default=str)}\n\n")
        
        try:
            # Save a copy of the limit requests data before it gets consumed by the serializer
            limit_requests_data = request.data.get('limit_requests', [])
            print(f"Limit requests in request: {len(limit_requests_data)}")
            for i, limit in enumerate(limit_requests_data):
                print(f"  Limit {i+1}: {json.dumps(limit, indent=2, default=str)}")
            
            # Extract credit_request_form data from request if present
            credit_request_form_data = request.data.pop('credit_request_form', None)
            
            # Log what we're about to do
            print(f"Extracted credit_request_form_data: {json.dumps(credit_request_form_data, indent=2, default=str)}")
            print(f"Remaining request data: {json.dumps(request.data, indent=2, default=str)}")
            
            # Perform regular update
            response = super().update(request, *args, **kwargs)
            
            # Get the updated instance
            instance = self.get_object()
            
            # If credit_request_form data was provided, update the related CreditRequestForm
            if credit_request_form_data:
                try:
                    # Get or create the related CreditRequestForm
                    credit_request_form, created = CreditRequestForm.objects.get_or_create(
                        credit_application=instance
                    )
                    
                    print(f"Found existing CreditRequestForm: {not created}")
                    
                    # Update each field individually
                    for field, value in credit_request_form_data.items():
                        if hasattr(credit_request_form, field):
                            print(f"Setting {field} = {value}")
                            setattr(credit_request_form, field, value)
                        else:
                            print(f"WARNING: Field {field} not found on CreditRequestForm model")
                    
                    credit_request_form.save()
                except Exception as e:
                    print(f"Error updating credit_request_form: {e}")
                    import traceback
                    traceback.print_exc()
            
            # IMPORTANT: Handle limit requests directly to ensure they're properly saved
            if limit_requests_data:
                from .models import LimitRequest
                
                # Check if any limit requests were actually saved by the serializer
                existing_limits = LimitRequest.objects.filter(credit_application=instance)
                print(f"Existing limits after serializer update: {existing_limits.count()}")
                
                # If no limits were saved or fewer than expected, manually create them
                if existing_limits.count() != len(limit_requests_data):
                    print("Limit requests not properly saved by serializer, manually creating them")
                    
                    # Delete any existing limit requests to avoid duplicates
                    existing_limits.delete()
                    
                    # Manually create each limit request
                    for i, limit_data in enumerate(limit_requests_data):
                        try:
                            # Create the limit request
                            limit = LimitRequest(
                                credit_application=instance,
                                limit_type_id=limit_data.get('limit_type_id'),
                                existing_amount=limit_data.get('existing_amount'),
                                existing_tenor=limit_data.get('existing_tenor'),
                                proposed_amount=limit_data.get('proposed_amount'),
                                proposed_tenor=limit_data.get('proposed_tenor'),
                                comments=limit_data.get('comments', '')
                            )
                            limit.save()
                            print(f"Manually created limit request {i+1} with ID: {limit.id}")
                        except Exception as e:
                            print(f"Error manually creating limit request: {e}")
                            import traceback
                            traceback.print_exc()
                
                # Verify limits were created
                final_limits = LimitRequest.objects.filter(credit_application=instance)
                print(f"Final limit requests count: {final_limits.count()}")
                for i, limit in enumerate(final_limits):
                    print(f"  Limit {i+1}: ID={limit.id}, type={limit.limit_type_id}, amount={limit.proposed_amount}")
            
            return response
        except Exception as e:
            print(f"ERROR in update method: {e}")
            import traceback
            traceback.print_exc()
            raise

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


