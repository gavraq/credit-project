from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
import json
import logging

logger = logging.getLogger(__name__)

# Import workflow models
from workflow_engine.models import Workflow, State, WorkflowInstance, Transition

# Import all form models
from .models import (
    CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm,
    CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm, CreditQuestionnaireForm,
    CreditAnalysisForm, CreditCompilationForm, CreditApprovalForm, ClimateScorecard
)
from .serializers import (
    CreditApplicationSerializer, CounterpartySerializer, LimitRequestSerializer,
    LimitTypeSerializer, CreditRequestFormSerializer, LegalReviewFormSerializer,
    CreditQuestionnaireFormSerializer, BusinessSponsorshipFormSerializer,
    CreditReviewFormSerializer, ClimateScorecardSerializer
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
                from workflow_engine.models import Workflow, State, WorkflowInstance
                from django.contrib.contenttypes.models import ContentType
                from .models import (
                    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm,
                    CreditQuestionnaireForm, CreditAnalysisForm, CreditCompilationForm, CreditApprovalForm
                )

                # Parent workflow for CreditApplication
                workflow_def = Workflow.objects.get(code='CREDIT_PAPER')
                initial_state = State.objects.get(workflow=workflow_def, is_initial=True)
                
                parent_workflow_instance = WorkflowInstance.objects.create(
                    workflow=workflow_def,
                    current_state=initial_state,
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=instance.id
                )
                instance.workflow_instance = parent_workflow_instance
                instance.save(update_fields=['workflow_instance'])
                print(f"Created parent workflow instance with ID: {parent_workflow_instance.id}")
                
                # Use metadata-driven auto-initialization for initial state
                from workflow_engine.utils import auto_initialize_forms_for_state
                initialized_forms = auto_initialize_forms_for_state(
                    instance, 
                    state_code=initial_state.code
                )
                
                if initialized_forms:
                    print(f"Auto-initialized {len(initialized_forms)} forms: {list(initialized_forms.keys())}")
                else:
                    print("No forms needed for initial state or auto-initialization failed")
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
        """
        Set the creator of the application to the current user and pass to the serializer.
        The serializer is responsible for all object and workflow creation.
        """
        creator = self.request.user if self.request.user.is_authenticated else None
        logger.info(f"CreditApplicationViewSet.perform_create called by user: {creator}")
        serializer.save(created_by=creator)


    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        """
        Perform a workflow transition for this credit application.
        Expects {"transition_code": "...", "comments": "..."}
        """
        credit_app = self.get_object()
        workflow_instance = credit_app.workflow_instance
        if not workflow_instance:
            return Response({"detail": "No workflow instance linked."}, status=status.HTTP_400_BAD_REQUEST)
        transition_code = request.data.get('transition_code')
        comments = request.data.get('comments', '')
        try:
            transition = Transition.objects.get(
                workflow=workflow_instance.workflow,
                from_state=workflow_instance.current_state,
                code=transition_code
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

    @action(detail=False, methods=['get'], url_path='awaiting-my-approval')
    def awaiting_my_approval(self, request):
        """
        Get credit applications that are awaiting approval by the current user.
        Uses DA-level authorization to filter applications.
        """
        user = request.user
        
        # Check if user is a Credit Analyst with DA level
        if not user.role or user.role.name != 'Credit Analyst' or not user.da_level:
            return Response([], safe=False)
        
        try:
            from workflow_engine.da_authorization import filter_applications_by_approval_authority
            
            # Get all applications in approval pending state
            applications_queryset = CreditApplication.objects.all()
            
            # Filter by what this user can approve based on their DA level
            approved_applications = filter_applications_by_approval_authority(user, applications_queryset)
            
            # Serialize the results
            serializer = self.get_serializer(approved_applications, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error filtering applications by approval authority: {e}")
            return Response(
                {'detail': 'Error filtering applications by approval authority'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get', 'post'], url_path='legal-review-form')
    def legal_review_form_handler(self, request, pk=None):
        credit_application = self.get_object()
        try:
            legal_review_instance = LegalReviewForm.objects.get(credit_application=credit_application)
        except LegalReviewForm.DoesNotExist:
            if request.method == 'GET':
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            # If POST and not found, it will be created by the serializer if data is valid
            legal_review_instance = None 

        if request.method == 'GET':
            serializer = LegalReviewFormSerializer(legal_review_instance, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            # For POST, we are creating or updating the form_data
            # The frontend sends the entire form_data blob
            # We expect the payload to be like: { "form_data": { ... } }
            # Or directly the form_data content: { "field1": "value1", ... }
            # The saveLegalReviewForm in frontend sends { legal_review_form: { ... actual form data ... } }
            # So request.data will be { legal_review_form: { ... } }
            
            form_payload = request.data.get('legal_review_form', request.data) # Adapt to actual payload structure

            # We need to ensure the LegalReviewForm model instance exists
            if legal_review_instance is None:
                 # Create one if it doesn't exist, associating with the credit_application
                 # This might also be handled by serializer if 'credit_application' is a writable field
                 # Or, ensure it's created when CreditApplication is created/specific stage is reached.
                 # For now, let's assume it should exist or be created here.
                legal_review_instance = LegalReviewForm.objects.create(credit_application=credit_application, form_data={})
            
            # The serializer expects the instance and data for update
            # The data should primarily be the form_data field
            serializer = LegalReviewFormSerializer(
                legal_review_instance, 
                data={'form_data': form_payload}, # Pass the actual form data to 'form_data' field
                partial=True, # Allow partial updates to form_data
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-update-ranks')
    def bulk_update_ranks(self, request):
        """
        Bulk update ranks for multiple credit applications.
        Expected payload: [{"id": "uuid", "rank": 1}, {"id": "uuid", "rank": 2}, ...]
        """
        try:
            rank_updates = request.data
            
            if not isinstance(rank_updates, list):
                return Response(
                    {'detail': 'Expected a list of rank updates'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate that all required fields are present
            for update in rank_updates:
                if 'id' not in update or 'rank' not in update:
                    return Response(
                        {'detail': 'Each rank update must contain "id" and "rank" fields'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Perform bulk update within a transaction
            with transaction.atomic():
                for update in rank_updates:
                    try:
                        application = CreditApplication.objects.get(id=update['id'])
                        application.rank = update['rank']
                        application.save(update_fields=['rank'])
                    except CreditApplication.DoesNotExist:
                        return Response(
                            {'detail': f'Credit application with id {update["id"]} not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                    except Exception as e:
                        logger.error(f"Error updating rank for application {update['id']}: {e}")
                        return Response(
                            {'detail': f'Error updating application {update["id"]}'}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            
            return Response({'detail': f'Successfully updated ranks for {len(rank_updates)} applications'})

        except Exception as e:
            logger.error(f"Error in bulk rank update: {e}")
            return Response(
                {'detail': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get', 'patch'], url_path='climate-scorecard')
    def climate_scorecard_handler(self, request, pk=None):
        """
        GET: Retrieve climate scorecard for a credit application.
        PATCH: Update/save climate scorecard data.
        """
        credit_application = self.get_object()

        try:
            scorecard = credit_application.climate_scorecard
        except ClimateScorecard.DoesNotExist:
            if request.method == 'GET':
                return Response({'detail': 'Climate scorecard not found.'}, status=status.HTTP_404_NOT_FOUND)
            # For PATCH, create a new scorecard
            scorecard = ClimateScorecard.objects.create(credit_application=credit_application)

        if request.method == 'GET':
            serializer = ClimateScorecardSerializer(scorecard, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'PATCH':
            # Handle climate_scorecard_ prefixed data from frontend
            scorecard_data = {}
            prefix = 'climate_scorecard_'
            for key, value in request.data.items():
                if key.startswith(prefix):
                    field_name = key[len(prefix):]
                    scorecard_data[field_name] = value
                else:
                    # Also accept non-prefixed data
                    scorecard_data[key] = value

            serializer = ClimateScorecardSerializer(
                scorecard,
                data=scorecard_data,
                partial=True,
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='climate-scorecard/generate')
    def generate_climate_scorecard(self, request, pk=None):
        """
        Trigger AI generation of climate scorecard fields.
        Returns generated field values with confidence scores.
        """
        credit_application = self.get_object()

        try:
            scorecard = credit_application.climate_scorecard
        except ClimateScorecard.DoesNotExist:
            # Create scorecard if it doesn't exist
            scorecard = ClimateScorecard.objects.create(credit_application=credit_application)

        try:
            # Import AI service (will be implemented in Phase 4)
            from .services.climate_ai_service import ClimateAIService

            ai_service = ClimateAIService()
            result = ai_service.generate_scorecard(
                counterparty=credit_application.counterparty,
                credit_application=credit_application,
                documents=None  # Future enhancement: include attached documents
            )

            # Update scorecard with generated fields
            # Get list of date fields that need validation
            from django.db.models import DateField
            date_fields = {f.name for f in scorecard._meta.get_fields() if isinstance(f, DateField)}

            # Get CharField max_length constraints
            from django.db.models import CharField
            char_field_limits = {}
            for f in scorecard._meta.get_fields():
                if isinstance(f, CharField) and hasattr(f, 'max_length') and f.max_length:
                    char_field_limits[f.name] = f.max_length

            for field_name, value in result.get('fields', {}).items():
                if hasattr(scorecard, field_name):
                    # Validate date fields
                    if field_name in date_fields and value is not None:
                        import re
                        if isinstance(value, str):
                            # Only accept YYYY-MM-DD format
                            if not re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                                logger.warning(f"Skipping invalid date value for {field_name}: {value}")
                                continue
                    # Truncate CharField values that exceed max_length
                    if field_name in char_field_limits and isinstance(value, str):
                        max_len = char_field_limits[field_name]
                        if len(value) > max_len:
                            logger.warning(f"Truncating {field_name} from {len(value)} to {max_len} chars")
                            value = value[:max_len]
                    setattr(scorecard, field_name, value)

            # Set AI metadata
            from django.utils import timezone
            scorecard.ai_generated = True
            scorecard.ai_generated_at = timezone.now()
            scorecard.ai_model_version = result.get('model_version', 'unknown')
            scorecard.ai_confidence_scores = result.get('confidence_scores', {})
            scorecard.ai_generation_notes = result.get('generation_notes', '')
            scorecard.analyst_review_status = 'pending'
            scorecard.save()

            # Return the updated scorecard
            serializer = ClimateScorecardSerializer(scorecard, context={'request': request})
            return Response({
                'success': True,
                'scorecard': serializer.data,
                'confidence_scores': result.get('confidence_scores', {}),
                'generation_notes': result.get('generation_notes', ''),
                'model_version': result.get('model_version', 'unknown')
            })

        except ImportError:
            # AI service not yet implemented
            return Response({
                'success': False,
                'detail': 'AI service not yet available. Please enter data manually.'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
        except Exception as e:
            logger.error(f"Error generating climate scorecard: {e}", exc_info=True)
            return Response({
                'success': False,
                'detail': f'Error generating climate scorecard: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


