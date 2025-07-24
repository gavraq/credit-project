import uuid
import logging
import json
from datetime import datetime
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q
from django.forms.models import model_to_dict
from django.utils import timezone
from rest_framework import serializers
from .models import (
    CreditApplication, Counterparty, LimitRequest, LimitType, 
    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, 
    LegalReviewForm, CreditQuestionnaireForm
)
from workflow_engine.models import WorkflowInstance, WorkflowDefinition, State # Added WorkflowDefinition, State

User = get_user_model()

logger = logging.getLogger(__name__)

class LimitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimitType
        fields = ['id', 'name', 'code']

class CounterpartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty
        fields = ['id', 'name', 'cif_number', 'country_of_incorporation', 'business_description', 'created_at', 'updated_at']

class LimitRequestSerializer(serializers.ModelSerializer):
    limit_type = LimitTypeSerializer(read_only=True)
    limit_type_id = serializers.PrimaryKeyRelatedField(
        queryset=LimitType.objects.all(),
        source='limit_type',
        write_only=True,
        required=False,
        allow_null=True
    )
    credit_application = serializers.PrimaryKeyRelatedField(
        queryset=CreditApplication.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = LimitRequest
        fields = [
            'id', 'credit_application', 'limit_type', 'limit_type_id',
            'existing_amount', 'existing_tenor', 'proposed_amount', 'proposed_tenor',
            'comments'
        ]

class CreditRequestFormSerializer(serializers.ModelSerializer):
    # Custom field handling for boolean fields that might come as strings
    country_risk_limit_available = serializers.BooleanField(required=False)
    kyc_approval_status = serializers.BooleanField(required=False)
    positive_legal_opinion = serializers.BooleanField(required=False)
    financial_statements_received = serializers.BooleanField(required=False)
    
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    interim_statements_available = serializers.BooleanField(required=False)
    
    # Add available transitions for permissions
    available_transitions = serializers.SerializerMethodField()
    
    # Explicitly include denormalized fields
    counterparty_name = serializers.CharField(read_only=True)
    relationship_manager_name = serializers.CharField(read_only=True)
    detailed_limit_comments = serializers.CharField(read_only=True)
    senior_business_sponsor_name = serializers.CharField(read_only=True)
    second_business_sponsor_name = serializers.CharField(read_only=True)
    
    def to_internal_value(self, data):
        # Convert string booleans to Python booleans before validation
        boolean_fields = ['country_risk_limit_available', 'kyc_approval_status', 
                        'positive_legal_opinion', 'financial_statements_received', 
                        'interim_statements_available']
        
        data_copy = data.copy() if isinstance(data, dict) else {}
        
        # Convert boolean fields using the enhanced _convert_booleans method
        # All these fields are non-nullable in the model
        data_copy = CreditApplicationSerializer._convert_booleans(
            self, data_copy, boolean_fields, nullable_fields=[]
        )
        
        # Handle datetime fields with timezone awareness
        datetime_fields = ['form_started_at', 'form_completed_at']
        for field in datetime_fields:
            if field in data_copy and data_copy[field] and isinstance(data_copy[field], str):
                try:
                    # Handle various datetime string formats
                    dt_str = data_copy[field]
                    
                    # If it's just a date-time without timezone info (like '2025-06-20T20:50')
                    if 'T' in dt_str and not any(x in dt_str for x in ['Z', '+', '-']):
                        # Append seconds if needed
                        if len(dt_str.split('T')[1].split(':')) < 3:
                            dt_str = f"{dt_str}:00"
                        # Create datetime and make it timezone aware
                        naive_dt = timezone.datetime.fromisoformat(dt_str)
                        data_copy[field] = timezone.make_aware(naive_dt)
                    else:
                        # Handle ISO format with Z or timezone offset
                        dt_str = dt_str.replace('Z', '+00:00')
                        dt = timezone.datetime.fromisoformat(dt_str)
                        # Ensure it's timezone aware
                        if timezone.is_naive(dt):
                            data_copy[field] = timezone.make_aware(dt)
                        else:
                            data_copy[field] = dt
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing datetime for {field}: {e}")
                    # If parsing fails, let the field validation handle it
                    pass
        
        return super().to_internal_value(data_copy)
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditRequestForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow_definition.name if obj.workflow_instance.workflow_definition else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditRequestForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditRequestForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditRequestForm
        fields = [
            'id', 'credit_application', 'workflow_instance', 'available_transitions', 'counterparty_cif', 'counterparty_name',
            'guarantor_name', 'guarantor_cif', 'revenue_last_12m', 'revenue_projected_12m',
            'projected_rorwa_percent', 'country_risk_limit_available', 'kyc_approval_status',
            'relationship_comments', 'relationship_manager_name', 'most_senior_contact',
            'last_client_visit_date', 'legal_documentation', 'positive_legal_opinion',
            'financial_statements_received', 'interim_statements_available', 'detailed_limit_comments',
            'account_executive', 'senior_business_sponsor_name', 'senior_business_sponsor_id',
            'second_business_sponsor_name', 'second_business_sponsor_id',
            'high_priority_justification', 'created_at', 'updated_at',
            'form_started_at', 'form_completed_at', 'form_last_saved_at'
        ]
        read_only_fields = ['id', 'credit_application', 'counterparty_name', 'relationship_manager_name', 
                           'detailed_limit_comments', 'senior_business_sponsor_name', 'second_business_sponsor_name']

class CreditReviewFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditReviewForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class BusinessSponsorshipFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessSponsorshipForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class LegalReviewFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalReviewForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditQuestionnaireFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditQuestionnaireForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditApplicationSerializer(serializers.ModelSerializer):
    
    def _convert_booleans(self, data, boolean_fields, nullable_fields=None):
        """
        Convert string boolean values to Python booleans.
        Handles various string representations including 'true'/'false', 'yes'/'no',
        and empty strings (converts to False for non-nullable fields, None for nullable fields).
        
        Args:
            data (dict): The data dictionary containing boolean fields
            boolean_fields (list): List of field names to check and convert
            nullable_fields (list, optional): List of fields that can be null (None)
            
        Returns:
            dict: The data dictionary with converted boolean values
        """
        if nullable_fields is None:
            nullable_fields = []
            
        data_copy = data.copy() if isinstance(data, dict) else {}
        
        for field in boolean_fields:
            if field in data_copy:
                value = data_copy[field]
                
                # Handle string values
                if isinstance(value, str):
                    value = value.lower().strip()
                    if value in ('true', 'yes', 'y', '1'):
                        data_copy[field] = True
                    elif value in ('false', 'no', 'n', '0'):
                        data_copy[field] = False
                    elif value == '':
                        # Empty string is treated as None for nullable fields,
                        # or False for non-nullable fields
                        data_copy[field] = None if field in nullable_fields else False
                    else:
                        # For any other string value, set to False for non-nullable fields
                        # or None for nullable fields
                        data_copy[field] = None if field in nullable_fields else False
                        
                # Handle None values for non-nullable fields
                elif value is None and field not in nullable_fields:
                    data_copy[field] = False
                    
        return data_copy
    
    def _resolve_user_fields(self, data, user_fields):
        """
        Resolve user foreign keys.
        
        Args:
            data (dict): The data dictionary containing user fields
            user_fields (list): List of field names to resolve
            
        Returns:
            dict: The data dictionary with resolved user objects
        """
        if not data or not isinstance(data, dict):
            return data
        
        data_copy = data.copy()
        for field in user_fields:
            if field in data_copy and data_copy[field]:
                try:
                    user = User.objects.get(id=data_copy[field])
                    data_copy[field] = user
                except User.DoesNotExist:
                    data_copy[field] = None
                    logger.warning(f"User with id {data_copy[field]} not found.")
        return data_copy
    
    def _extract_form_data(self, data, form_prefix, fields=None):
        """
        Extract form data from flat prefixed fields.
        
        Args:
            data (dict): The data dictionary containing prefixed fields
            form_prefix (str): The prefix used for the form fields (e.g., 'credit_request_form')
            fields (list, optional): List of field names to extract. If None, extract all prefixed fields.
            
        Returns:
            dict: The extracted form data
        """
        form_data = {}
        
        # Check for nested object first (backward compatibility)
        if form_prefix in data and isinstance(data[form_prefix], dict):
            return data[form_prefix]
        
        # Extract flat, prefixed fields
        prefix = f"{form_prefix}_"
        for key, value in data.items():
            if key.startswith(prefix):
                field_name = key[len(prefix):]  # Remove prefix
                form_data[field_name] = value
        
        return form_data
    
    def _update_sub_form(self, instance, form_model, form_data, related_name):
        """
        Helper method to update or create a sub-form and its workflow instance
        
        Args:
            instance (CreditApplication): The parent credit application instance
            form_model (Model): The form model class
            form_data (dict): The form data to update or create with
            related_name (str): The related name attribute on the instance
            
        Returns:
            Model: The updated or created form instance
        """
        try:
            # Get or create the sub-form
            sub_form = getattr(instance, related_name, None)
            if not sub_form:
                sub_form = form_model.objects.create(credit_application=instance)
                logger.info(f"Created new {form_model.__name__} ID: {sub_form.id} for CreditApplication ID: {instance.id}")
            
            # Update the sub-form fields
            for field, value in form_data.items():
                setattr(sub_form, field, value)
            sub_form.save()
            logger.info(f"Updated {form_model.__name__} ID: {sub_form.id} with fields: {list(form_data.keys())}")
            
            # Create workflow instance if it doesn't exist
            if not sub_form.workflow_instance:
                try:
                    # Determine workflow definition code based on form model
                    workflow_code_map = {
                        'CreditRequestForm': 'CREDIT_REQUEST',
                        'BusinessSponsorshipForm': 'BUSINESS_SPONSORSHIP',
                        'CreditReviewForm': 'CREDIT_REVIEW',
                        'LegalReviewForm': 'LEGAL_REVIEW'
                    }
                    
                    workflow_code = workflow_code_map.get(form_model.__name__)
                    if workflow_code:
                        sub_wf_def = WorkflowDefinition.objects.get(code=workflow_code)
                        sub_initial_state = State.objects.get(workflow_definition=sub_wf_def, is_initial=True)
                        
                        sub_wf_instance = WorkflowInstance.objects.create(
                            workflow_definition=sub_wf_def,
                            current_state=sub_initial_state,
                            content_type=ContentType.objects.get_for_model(sub_form),
                            object_id=sub_form.id
                        )
                        sub_form.workflow_instance = sub_wf_instance
                        sub_form.save(update_fields=['workflow_instance'])
                        logger.info(f"Created workflow instance ID: {sub_wf_instance.id} for {form_model.__name__} ID: {sub_form.id}")
                except Exception as e_wf:
                    logger.error(f"Error creating workflow instance for {form_model.__name__} ID {sub_form.id}: {str(e_wf)}")
                    # Continue with the process even if workflow creation fails
            
            return sub_form
        except Exception as e:
            logger.error(f"Error in _update_sub_form for {form_model.__name__}: {str(e)}")
            raise
    limit_requests = LimitRequestSerializer(many=True, read_only=True)
    workflow_instance = serializers.SerializerMethodField()
    
    # Method fields for forms
    credit_request_form = serializers.SerializerMethodField()
    business_sponsorship_form = serializers.SerializerMethodField()
    credit_questionnaire_form = serializers.SerializerMethodField()
    legal_review_form = serializers.SerializerMethodField()
    credit_review_form = serializers.SerializerMethodField()
    
    # Additional fields
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    sub_processes = serializers.SerializerMethodField()

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'reference_number', 'title', 'counterparty', 'counterparty_id', 'priority', 
            'required_by_date', 'amount', 'created_by', 'assigned_to', 'relationship_manager',
            'created_at', 'updated_at', 'submitted_at', 'workflow_instance',
            'workflow_state_name', 'available_transitions', 'created_by_name', 'assigned_to_name',
            'credit_request_form', 'credit_review_form', 'business_sponsorship_form',
            'legal_review_form', 'credit_questionnaire_form', 'limit_requests', 'sub_processes'
        ]
        read_only_fields = ['id', 'reference_number', 'workflow_instance', 'created_at', 'updated_at', 'submitted_at', 'created_by', 'created_by_name', 'assigned_to_name']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return "N/A"

    def get_available_transitions(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []

    def get_workflow_instance(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow_definition.name if obj.workflow_instance.workflow_definition else None
            }
        return None
        
    def get_credit_request_form(self, obj):
        try:
            # Use the correct related name - credit_request_form
            form = obj.credit_request_form
            serializer = CreditRequestFormSerializer(form)
            return serializer.data
        except CreditRequestForm.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting credit_request_form for application {obj.id}: {e}")
            return None
            
    def get_credit_review_form(self, obj):
        try:
            form = obj.credit_review_form
            return {
                'id': str(form.id),
                'form_data': form.form_data
            }
        except CreditReviewForm.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting credit_review_form for application {obj.id}: {e}")
            return None
            
    def get_business_sponsorship_form(self, obj):
        try:
            form = obj.business_sponsorship_form
            return {
                'id': str(form.id),
                'form_data': form.form_data
            }
        except BusinessSponsorshipForm.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting business_sponsorship_form for application {obj.id}: {e}")
            return None
            
    def get_legal_review_form(self, obj):
        try:
            form = obj.legal_review_form
            return {
                'id': str(form.id),
                'form_data': form.form_data
            }
        except LegalReviewForm.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting legal_review_form for application {obj.id}: {e}")
            return None
            
    def get_credit_questionnaire_form(self, obj):
        try:
            form = obj.credit_questionnaire_form
            return {
                'id': str(form.id),
                'form_data': form.form_data
            }
        except CreditQuestionnaireForm.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting credit_questionnaire_form for application {obj.id}: {e}")
            return None

    def get_sub_processes(self, obj):
        logger.info(f"--- get_sub_processes called for application: {obj.id} ---")
        
        # For newly created applications, always include credit_request_form
        # even if workflow_instance is not fully set up yet
        if not hasattr(obj, 'workflow_instance') or not obj.workflow_instance or not obj.workflow_instance.current_state:
            logger.info(f"New application detected for CA ID {obj.id}, including default sub-processes.")
            # Default to showing credit_request_form for new applications
            form_list = ['credit_request_form']
        else:
            # Get form list based on workflow state
            current_state = obj.workflow_instance.current_state
            parent_state_code = current_state.metadata.get('parent_state', current_state.code) if current_state.metadata else current_state.code
            
            # Use the helper function to get relevant sub-processes based on metadata
            from workflow_engine.utils import get_relevant_sub_processes_for_state
            form_list = get_relevant_sub_processes_for_state(parent_state_code)

        # Import the utility function to get form metadata dynamically
        from workflow_engine.utils import get_form_metadata, FormMetadataError

        sub_processes_data = []
        for form_name in form_list:
            try:
                # Get form metadata dynamically
                form_metadata = get_form_metadata(form_name)
            except FormMetadataError as e:
                # Log the error and skip this form
                logger.error(f"Error getting metadata for form {form_name}: {e}")
                # Skip this form and continue with the next one
                continue
            
            # Check if form instance exists
            form_instance = getattr(obj, form_name, None)
            if form_instance:
                try:
                    # Get the proper serializer for this form type and pass request context
                    request = self.context.get('request')
                    serializer_context = {'request': request} if request else {}
                    
                    if form_name == 'credit_request_form':
                        serializer = CreditRequestFormSerializer(form_instance, context=serializer_context)
                    elif form_name == 'business_sponsorship_form':
                        serializer = BusinessSponsorshipFormSerializer(form_instance, context=serializer_context)
                    elif form_name == 'credit_review_form':
                        serializer = CreditReviewFormSerializer(form_instance, context=serializer_context)
                    elif form_name == 'legal_review_form':
                        serializer = LegalReviewFormSerializer(form_instance, context=serializer_context)
                    elif form_name == 'credit_questionnaire_form':
                        serializer = CreditQuestionnaireFormSerializer(form_instance, context=serializer_context)
                    else:
                        # Default to a basic serializer if no specific one is found
                        serializer = None
                        
                    # Add form data to sub_processes
                    sub_processes_data.append({
                        'form_name': form_metadata['title'],
                        'form_key': form_metadata['form_key'],  # Add form_key for frontend
                        'form_title': getattr(form_instance, 'get_form_title', lambda: form_metadata['title'])(),
                        'data': serializer.data if serializer else {}
                    })
                    logger.info(f"Added sub-process '{form_name}' for CA ID {obj.id}")
                except Exception as e:
                    logger.error(f"Error serializing sub-process '{form_name}' for CA ID {obj.id}: {e}", exc_info=True)
            else:
                # Include form in list even if instance doesn't exist yet
                sub_processes_data.append({
                    'form_name': form_metadata['title'],
                    'form_key': form_metadata['form_key'],
                    'form_title': form_metadata['title'],
                    'data': None
                })
                logger.info(f"Added placeholder for sub-process '{form_name}' for CA ID {obj.id}")
                
        return sub_processes_data

    @transaction.atomic
    def create(self, validated_data):
        logger.info(f"CreditApplicationSerializer.create called. Validated data (before pops): {validated_data}")
        
        # Extract form data using helper methods
        credit_request_form_data = self._extract_form_data(self.initial_data, 'credit_request_form')
        limit_requests_payload = self.initial_data.get('limit_requests', [])
        validated_data.pop('limit_requests', None)
        validated_data.pop('credit_request_form', None)  # Remove if present in validated_data
        
        # Handle counterparty - frontend sends counterparty object but we need counterparty_id
        counterparty = self.initial_data.get('counterparty')
        if counterparty and isinstance(counterparty, dict) and 'id' in counterparty:
            validated_data['counterparty_id'] = counterparty['id']
        elif counterparty and not isinstance(counterparty, dict):
            validated_data['counterparty_id'] = counterparty
            
        logger.info(f"Creating CreditApplication for user: {validated_data.get('created_by')}")
        logger.info(f"Counterparty data: {counterparty}, counterparty_id: {validated_data.get('counterparty_id')}")

        # Ensure created_by is set from perform_create context
        if 'created_by' not in validated_data and self.context.get('request') and self.context['request'].user.is_authenticated:
             validated_data['created_by'] = self.context['request'].user
        logger.info(f"Creating CreditApplication for user: {validated_data.get('created_by')}")

        # Process credit_request_form_data using helper methods
        if credit_request_form_data:
            logger.info(f"Processing credit_request_form_data: {credit_request_form_data}")
            
            # Handle relationship_manager if it's in the prefixed fields
            if 'relationship_manager_id' in credit_request_form_data:
                try:
                    relationship_manager_id = credit_request_form_data.pop('relationship_manager_id')
                    if relationship_manager_id:
                        User = get_user_model()
                        relationship_manager = User.objects.get(id=relationship_manager_id)
                        validated_data['relationship_manager'] = relationship_manager
                        logger.info(f"Set relationship_manager to user ID: {relationship_manager_id}")
                except Exception as e:
                    logger.warning(f"Failed to set relationship_manager: {str(e)}")
            
            # Convert string booleans to Python booleans
            boolean_fields = ['country_risk_limit_available', 'kyc_approval_status', 
                            'positive_legal_opinion', 'financial_statements_received', 
                            'interim_statements_available']
            credit_request_form_data = self._convert_booleans(credit_request_form_data, boolean_fields, nullable_fields=[])
            
            # Resolve user foreign keys
            user_fields = ['senior_business_sponsor_id', 'second_business_sponsor_id']
            credit_request_form_data = self._resolve_user_fields(credit_request_form_data, user_fields)
            
            # Set form timestamps
            if 'form_started_at' not in credit_request_form_data or not credit_request_form_data['form_started_at']:
                credit_request_form_data['form_started_at'] = timezone.now()
            credit_request_form_data['form_last_saved_at'] = timezone.now()

        # 1. Create the main application object
        credit_application = CreditApplication.objects.create(**validated_data)
        logger.info(f"Created CreditApplication with ID: {credit_application.id}")

        # 2. Initialize the workflow for the newly created credit application
        try:
            workflow_def = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
            initial_state = State.objects.get(workflow_definition=workflow_def, is_initial=True)
            
            workflow_instance = WorkflowInstance.objects.create(
                workflow_definition=workflow_def,
                current_state=initial_state,
                content_type=ContentType.objects.get_for_model(credit_application),
                object_id=credit_application.id
            )
            credit_application.workflow_instance = workflow_instance
            credit_application.save(update_fields=['workflow_instance'])
            logger.info(f"Created and assigned WorkflowInstance ID: {workflow_instance.id} to CA ID: {credit_application.id}")

            # 3. Create the credit request form with processed data and its sub-workflow instance
            try:
                if credit_request_form_data:
                    # Create the CreditRequestForm with all fields from credit_request_form_data
                    crf = CreditRequestForm.objects.create(
                        credit_application=credit_application,
                        **credit_request_form_data
                    )
                    logger.info(f"Created CreditRequestForm ID: {crf.id} for CA ID: {credit_application.id} with fields: {credit_request_form_data.keys()}")
                else:
                    # Create an empty form if no data was provided
                    crf = CreditRequestForm.objects.create(credit_application=credit_application)
                    logger.info(f"Created empty CreditRequestForm ID: {crf.id} for CA ID: {credit_application.id}")
                
                # Create sub-workflow instance for the CreditRequestForm
                try:
                    sub_wf_def = WorkflowDefinition.objects.get(code='CREDIT_REQUEST')
                    sub_initial_state = State.objects.get(workflow_definition=sub_wf_def, is_initial=True)
                    
                    sub_wf_instance = WorkflowInstance.objects.create(
                        workflow_definition=sub_wf_def,
                        current_state=sub_initial_state,
                        content_type=ContentType.objects.get_for_model(crf),
                        object_id=crf.id
                    )
                    crf.workflow_instance = sub_wf_instance
                    crf.save(update_fields=['workflow_instance'])
                    logger.info(f"Created sub-workflow instance ID: {sub_wf_instance.id} for CreditRequestForm ID: {crf.id}")
                except Exception as e_sub_wf:
                    logger.error(f"Error creating sub-workflow for CreditRequestForm: {str(e_sub_wf)}")
                    # Continue with the process even if sub-workflow creation fails
                # Verify the CreditRequestForm was created with expected fields
                logger.info(f"CreditRequestForm created with fields: {[f.name for f in CreditRequestForm._meta.fields]}")
                logger.info(f"CreditRequestForm values: {model_to_dict(crf)}")


            except Exception as e:
                logger.error(f"An unexpected error occurred during workflow/sub-form initialization for CA ID {credit_application.id}: {e}", exc_info=True)

        except WorkflowDefinition.DoesNotExist:
            logger.error(f"CRITICAL: WorkflowDefinition with code 'CREDIT_PAPER' not found. Cannot create application correctly.")
        except State.DoesNotExist:
            logger.error(f"CRITICAL: Initial state for 'CREDIT_PAPER' workflow not found. Cannot create application correctly.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during workflow/sub-form initialization for CA ID {credit_application.id}: {e}", exc_info=True)

        # 4. Create any limit requests that were part of the payload
        if limit_requests_payload:
            for lr_data in limit_requests_payload:
                lr_data = lr_data.copy()  # Create a copy to avoid modifying the original
                lr_data.pop('id', None)  # Remove id if present
                limit_type_id = lr_data.pop('limit_type_id', None)
                if limit_type_id:
                    try:
                        limit_type = LimitType.objects.get(id=limit_type_id)
                        lr_data.pop('limit_type', None)  # Remove limit_type if present
                        LimitRequest.objects.create(
                            credit_application=credit_application,
                            limit_type=limit_type,
                            **lr_data
                        )
                    except LimitType.DoesNotExist:
                        logging.warning(f"LimitType with id {limit_type_id} not found.")
            logger.info(f"Successfully created {len(limit_requests_payload)} LimitRequest(s) for CA ID: {credit_application.id}")

        return credit_application

    @transaction.atomic
    def update(self, instance, validated_data):
        # Extract form data using helper methods
        credit_request_form_data = self._extract_form_data(self.initial_data, 'credit_request_form')
        limit_requests_payload = self.initial_data.get('limit_requests', [])
        validated_data.pop('credit_request_form', None)
        validated_data.pop('limit_requests', None)
        
        # Handle counterparty - frontend sends counterparty object but we need counterparty_id
        counterparty = self.initial_data.get('counterparty')
        if counterparty and isinstance(counterparty, dict) and 'id' in counterparty:
            validated_data['counterparty_id'] = counterparty['id']
        elif counterparty and not isinstance(counterparty, dict):
            validated_data['counterparty_id'] = counterparty
            
        # Update the main application
        instance = super().update(instance, validated_data)

        # Update or create the CreditRequestForm
        if credit_request_form_data:
            # Handle relationship_manager if it's in the prefixed fields
            if 'relationship_manager_id' in credit_request_form_data:
                try:
                    relationship_manager_id = credit_request_form_data.pop('relationship_manager_id')
                    if relationship_manager_id:
                        User = get_user_model()
                        relationship_manager = User.objects.get(id=relationship_manager_id)
                        instance.relationship_manager = relationship_manager
                        instance.save(update_fields=['relationship_manager'])
                        logger.info(f"Updated relationship_manager to user ID: {relationship_manager_id}")
                except Exception as e:
                    logger.warning(f"Failed to update relationship_manager: {str(e)}")
        
            # Convert string booleans to Python booleans
            boolean_fields = ['country_risk_limit_available', 'kyc_approval_status', 
                            'positive_legal_opinion', 'financial_statements_received', 
                            'interim_statements_available']
            credit_request_form_data = self._convert_booleans(credit_request_form_data, boolean_fields, nullable_fields=[])
            
            # Resolve user foreign keys
            user_fields = ['senior_business_sponsor_id', 'second_business_sponsor_id']
            credit_request_form_data = self._resolve_user_fields(credit_request_form_data, user_fields)
            
            # Set form_last_saved_at timestamp
            credit_request_form_data['form_last_saved_at'] = timezone.now()
            
            # Use _update_sub_form helper method
            self._update_sub_form(
                instance=instance,
                form_model=CreditRequestForm,
                form_data=credit_request_form_data,
                related_name='credit_request_form'
            )

        # Handle limit requests - delete existing and create new ones
        if limit_requests_payload is not None:
            instance.limit_requests.all().delete()
            for lr_data in limit_requests_payload:
                lr_data.pop('id', None)
                limit_type_id = lr_data.pop('limit_type_id', None)
                if limit_type_id:
                    try:
                        limit_type = LimitType.objects.get(id=limit_type_id)
                        lr_data.pop('limit_type', None)
                        LimitRequest.objects.create(
                            credit_application=instance,
                            limit_type=limit_type,
                            **lr_data
                        )
                    except LimitType.DoesNotExist:
                        logging.warning(f"LimitType with id {limit_type_id} not found.")

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        limit_requests = instance.limit_requests.all()
        representation['limit_requests'] = LimitRequestSerializer(limit_requests, many=True).data

        if not instance.reference_number:
            import datetime
            year = datetime.datetime.now().year
            count = CreditApplication.objects.filter(created_at__year=year).count()
            instance.reference_number = f"CR-{year}-{count + 1:04d}"
            instance.save(update_fields=['reference_number'])
            representation['reference_number'] = instance.reference_number
            
        return representation
