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
    LegalReviewForm, CreditQuestionnaireForm, CreditAnalysisForm,
    CreditCompilationForm, CreditApprovalForm, ClimateScorecard
)
from workflow_engine.models import WorkflowInstance, Workflow, State # Added Workflow, State

User = get_user_model()

logger = logging.getLogger(__name__)


def _get_credit_workflow_artifacts(obj, request=None):
    from credit_workflow.artifacts import get_workflow_artifact_descriptors

    return get_workflow_artifact_descriptors(obj, request=request)

class LimitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimitType
        fields = ['id', 'name', 'code']

class CounterpartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty
        fields = ['id', 'name', 'cif_number', 'country_of_incorporation', 'business_description', 'created_at', 'updated_at']

class LimitRequestListSerializer(serializers.ListSerializer):
    """
    Custom ListSerializer to handle limit_requests that may be passed
    as a JSON string (e.g., from multipart/form-data).
    """
    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                self.fail('invalid', message_format='Invalid JSON format for limit requests.')
        
        if not isinstance(data, list):
            self.fail('not_a_list', input_type=type(data).__name__)

        return super().to_internal_value(data)

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
        list_serializer_class = LimitRequestListSerializer

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
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditRequestForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        logger.info(f"CreditRequestForm get_available_transitions - User: {user}, Has workflow: {hasattr(obj, 'workflow_instance')}")
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            logger.info(f"CreditRequestForm - Returning empty transitions (user={user}, wf={getattr(obj, 'workflow_instance', None)})")
            return []
        try:
            logger.info(f"CreditRequestForm - Getting transitions for user {user.username} with role {getattr(user.role, 'name', 'No role')}")
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            logger.info(f"CreditRequestForm - Found {len(transitions)} transitions")
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
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
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    # Handle ForeignKey fields - accept UUID, return User object
    credit_reviewer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='credit_reviewer', write_only=True, required=False, allow_null=True
    )

    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditReviewForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditReviewForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditReviewForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditReviewForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application', 'credit_reviewer']

class BusinessSponsorshipFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the BusinessSponsorshipForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the BusinessSponsorshipForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for BusinessSponsorshipForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = BusinessSponsorshipForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application', 'senior_business_sponsor_name', 'second_business_sponsor_name']

class LegalReviewFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the LegalReviewForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the LegalReviewForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for LegalReviewForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = LegalReviewForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditQuestionnaireFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditQuestionnaireForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditQuestionnaireForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditQuestionnaireForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditQuestionnaireForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditAnalysisFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditAnalysisForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditAnalysisForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditAnalysisForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditAnalysisForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditCompilationFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditCompilationForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditCompilationForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditCompilationForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditCompilationForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']

class CreditApprovalFormSerializer(serializers.ModelSerializer):
    # Add workflow instance serialization
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    
    def get_workflow_instance(self, obj):
        """Return workflow instance details for the CreditApprovalForm"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
        
    def get_available_transitions(self, obj):
        """Return available transitions for the CreditApprovalForm's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for CreditApprovalForm workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []
    
    class Meta:
        model = CreditApprovalForm
        fields = '__all__'
        read_only_fields = ['id', 'credit_application']


class ClimateScorecardSerializer(serializers.ModelSerializer):
    """
    Serializer for the PRA SS5/25 Enhanced Climate Scorecard.
    Includes workflow instance details, available transitions, and AI metadata.
    """
    workflow_instance = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    def get_workflow_instance(self, obj):
        """Return workflow instance details for the ClimateScorecard"""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None

    def get_available_transitions(self, obj):
        """Return available transitions for the ClimateScorecard's workflow instance"""
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [{'code': t.code, 'name': t.name, 'description': t.description, 'metadata': t.metadata} for t in transitions]
        except Exception as e:
            logger.error(f"Error getting available transitions for ClimateScorecard workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []

    class Meta:
        model = ClimateScorecard
        fields = '__all__'
        read_only_fields = ['id', 'credit_application', 'ai_generated', 'ai_generated_at', 'ai_model_version', 'ai_confidence_scores']


class CreditApplicationSerializer(serializers.ModelSerializer):

    limit_requests = LimitRequestSerializer(many=True, required=False)
    
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
                # Skip if it's already a User instance
                if hasattr(data_copy[field], '_meta') and hasattr(data_copy[field]._meta, 'model_name'):
                    continue
                    
                try:
                    user = User.objects.get(id=data_copy[field])
                    data_copy[field] = user
                except User.DoesNotExist:
                    data_copy[field] = None
                    logger.warning(f"User with id {data_copy[field]} not found.")
                except Exception as e:
                    logger.warning(f"Error resolving user field {field} with value {data_copy[field]}: {e}")
                    # If there's any other error, leave the field as-is
                    pass
        return data_copy
    
    def _resolve_date_fields(self, data, date_fields):
        """
        Resolve date fields by ensuring they're in YYYY-MM-DD format.
        
        Args:
            data (dict): The data dictionary containing date fields
            date_fields (list): List of field names to resolve
            
        Returns:
            dict: The data dictionary with properly formatted dates
        """
        if not data or not isinstance(data, dict):
            return data
        
        data_copy = data.copy()
        for field in date_fields:
            if field in data_copy and data_copy[field]:
                # Skip empty strings, None, or placeholder values
                if data_copy[field] in ['', '**', '*', None]:
                    data_copy[field] = None
                    continue
                    
                try:
                    # If it's already a date object, convert to string
                    if hasattr(data_copy[field], 'strftime'):
                        data_copy[field] = data_copy[field].strftime('%Y-%m-%d')
                    # If it's a string, try to parse and reformat
                    elif isinstance(data_copy[field], str):
                        # Handle various date formats
                        date_str = data_copy[field].strip()
                        if 'T' in date_str:
                            # Extract just the date part from datetime
                            date_str = date_str.split('T')[0]
                        
                        # Parse and reformat to YYYY-MM-DD
                        from datetime import datetime
                        try:
                            # Try parsing common formats
                            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
                                try:
                                    parsed_date = datetime.strptime(date_str, fmt)
                                    data_copy[field] = parsed_date.strftime('%Y-%m-%d')
                                    break
                                except ValueError:
                                    continue
                            else:
                                # If no format worked, try ISO format
                                parsed_date = datetime.fromisoformat(date_str)
                                data_copy[field] = parsed_date.strftime('%Y-%m-%d')
                        except Exception:
                            # If all parsing fails, set to None
                            data_copy[field] = None
                            logger.warning(f"Could not parse date field {field} with value '{data_copy[field]}', setting to None")
                except Exception as e:
                    logger.warning(f"Error processing date field {field} with value {data_copy[field]}: {e}")
                    data_copy[field] = None
        return data_copy
    
    def _extract_artifact_data(self, data):
        """Extract and group artifact data from the main payload using configured prefixes."""
        from workflow_engine.utils import get_dynamic_artifact_prefixes
        
        prefix_map = get_dynamic_artifact_prefixes()
        if not prefix_map:
            logger.warning("No dynamic artifact prefixes available, skipping artifact data extraction")
            return {}
        
        artifact_groups = {artifact_key: {} for artifact_key in prefix_map.values()}

        for key, value in data.items():
            for prefix, artifact_key in prefix_map.items():
                if key.startswith(prefix):
                    field_name = key[len(prefix):]
                    artifact_groups[artifact_key][field_name] = value
        
        return artifact_groups
    
    def _update_artifact_instance(self, instance, artifact_key, artifact_data):
        """
        Updates or creates an artifact-backed instance using update_or_create and
        manages its associated workflow instance.
        """
        from workflow_engine.utils import get_dynamic_artifact_model_map
        
        model_map = get_dynamic_artifact_model_map()
        if not model_map:
            logger.warning("No dynamic artifact model mapping available, skipping artifact update")
            return
        
        model_class = model_map.get(artifact_key)
        if not model_class or not artifact_data:
            return

        from workflow_engine.utils import get_dynamic_artifact_field_mappings
        
        field_mappings = get_dynamic_artifact_field_mappings()
        boolean_fields_map = field_mappings['boolean_fields']
        user_fields_map = field_mappings['user_fields']
        datetime_fields_map = field_mappings['datetime_fields']

        if artifact_key in boolean_fields_map:
            artifact_data = self._convert_booleans(
                artifact_data,
                boolean_fields_map[artifact_key],
                nullable_fields=[],
            )
        
        user_fields_to_process = user_fields_map.get(artifact_key, [])
        
        if artifact_key == 'credit_request_form':
            user_fields_to_process.extend(['senior_business_sponsor_id', 'second_business_sponsor_id'])
        
        if artifact_key == 'credit_compilation_form':
            user_fields_to_process.extend(['compiler'])
        
        if artifact_key == 'credit_approval_form':
            user_fields_to_process.extend(['approver'])

        if artifact_key == 'credit_review_form':
            user_fields_to_process.extend(['credit_reviewer', 'assigned_credit_analyst'])

        if artifact_key == 'business_sponsorship_form':
            user_fields_to_process.extend(['senior_business_sponsor', 'second_business_sponsor'])

        if artifact_key == 'legal_review_form':
            user_fields_to_process.extend(['legal_reviewer'])

        if artifact_key == 'credit_questionnaire_form':
            user_fields_to_process.extend(['questionnaire_completor'])

        if artifact_key == 'credit_analysis_form':
            user_fields_to_process.extend(['credit_analyst'])

        if user_fields_to_process:
            artifact_data = self._resolve_user_fields(artifact_data, user_fields_to_process)
        
        # Handle date fields dynamically (following the same pattern as boolean/user fields)
        # Note: If date_fields_map is added to workflow metadata in the future, use this pattern:
        # date_fields_map = field_mappings.get('date_fields', {})
        # if form_type in date_fields_map:
        #     form_data = self._resolve_date_fields(form_data, date_fields_map[form_type])
        
        # Handle common date field issues (empty strings, placeholder values, etc.)
        # This applies to all forms and handles DateField validation issues
        for field_name, field_value in artifact_data.items():
            if field_value in ['', '**', '*', 'None', None]:
                artifact_data[field_name] = None
            elif isinstance(field_value, str) and field_name.endswith('_date') and field_value.strip() == '':
                artifact_data[field_name] = None
        
        if artifact_key in datetime_fields_map:
            for field in datetime_fields_map[artifact_key]:
                if field in artifact_data and artifact_data[field] and isinstance(artifact_data[field], str):
                    try:
                        dt_str = artifact_data[field]
                        
                        # If it's just a date-time without timezone info (like '2025-06-20T20:50')
                        if 'T' in dt_str and not any(x in dt_str for x in ['Z', '+', '-']):
                            # Append seconds if needed
                            if len(dt_str.split('T')[1].split(':')) < 3:
                                dt_str = f"{dt_str}:00"
                            naive_dt = timezone.datetime.fromisoformat(dt_str)
                            artifact_data[field] = timezone.make_aware(naive_dt)
                        else:
                            dt_str = dt_str.replace('Z', '+00:00')
                            dt = timezone.datetime.fromisoformat(dt_str)
                            if timezone.is_naive(dt):
                                artifact_data[field] = timezone.make_aware(dt)
                            else:
                                artifact_data[field] = dt
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing datetime for {field}: {e}")
                        pass

        artifact_data['form_last_saved_at'] = timezone.now()
        
        if artifact_key == 'credit_request_form':
            logger.info(
                "Saving credit_request_form with guarantor_name: '%s'",
                artifact_data.get('guarantor_name', 'NOT SET'),
            )
            logger.info(
                "Saving credit_request_form with guarantor_cif: '%s'",
                artifact_data.get('guarantor_cif', 'NOT SET'),
            )
        
        artifact_instance, created = model_class.objects.update_or_create(
            credit_application=instance,
            defaults=artifact_data
        )
        logger.info(
            "%s artifact %s for CA %s",
            'Created' if created else 'Updated',
            artifact_key,
            instance.id,
        )

        if not hasattr(artifact_instance, 'workflow_instance') or not artifact_instance.workflow_instance:
            try:
                import re
                model_name = model_class.__name__
                base_name = model_name[:-4] if model_name.endswith('Form') else model_name
                s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', base_name)
                workflow_code = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).upper()
                
                logger.info(f"Attempting to create sub-workflow '{workflow_code}' for {model_name}")
                
                sub_wf_def = Workflow.objects.get(code=workflow_code)
                sub_initial_state = State.objects.get(workflow=sub_wf_def, is_initial=True)
                
                sub_wf_instance = WorkflowInstance.objects.create(
                    workflow=sub_wf_def,
                    current_state=sub_initial_state,
                    content_type=ContentType.objects.get_for_model(artifact_instance),
                    object_id=artifact_instance.id
                )
                artifact_instance.workflow_instance = sub_wf_instance
                artifact_instance.save(update_fields=['workflow_instance'])
                logger.info(
                    "Created sub-workflow instance ID: %s for %s ID: %s",
                    sub_wf_instance.id,
                    model_name,
                    artifact_instance.id,
                )
            
            except Workflow.DoesNotExist:
                logger.warning(f"Workflow with code '{workflow_code}' not found for {model_name}. No sub-workflow created.")
            except State.DoesNotExist:
                logger.error(f"Initial state for workflow '{workflow_code}' not found for {model_name}. No sub-workflow created.")
            except Exception as e:
                logger.error(f"Error creating workflow instance for {model_name}: {e}", exc_info=True)
        
        return artifact_instance
    
    # ... (rest of the code remains the same)
    workflow_instance = serializers.SerializerMethodField()
    
    climate_scorecard = serializers.SerializerMethodField()

    # Additional fields
    workflow_state = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    artifacts = serializers.SerializerMethodField()
    counterparty = CounterpartySerializer(read_only=True)
    counterparty_id = serializers.PrimaryKeyRelatedField(
        queryset=Counterparty.objects.all(), source='counterparty', write_only=True
    )

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'reference_number', 'title', 'counterparty', 'counterparty_id', 'description', 'priority', 
            'required_by_date', 'amount', 'rank', 'created_by', 'assigned_to', 'relationship_manager',
            'created_at', 'updated_at', 'submitted_at', 'workflow_instance',
            'workflow_state', 'workflow_state_name', 'available_transitions', 'created_by_name', 'assigned_to_name',
            'current_user_role', 'climate_scorecard', 'limit_requests', 'artifacts'
        ]
        read_only_fields = ['id', 'reference_number', 'workflow_instance', 'created_at', 'updated_at', 'submitted_at', 'created_by', 'created_by_name', 'assigned_to_name']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_current_user_role(self, obj):
        """Get the current user's role information."""
        request = self.context.get('request')
        if request and request.user and hasattr(request.user, 'role') and request.user.role:
            return {
                'id': str(request.user.role.id),
                'name': request.user.role.name,
                'code': request.user.role.code if hasattr(request.user.role, 'code') else None
            }
        return None

    def get_workflow_state(self, obj):
        """Get the full workflow state object with metadata."""
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            state = obj.workflow_instance.current_state
            return {
                'id': str(state.id),
                'name': state.name,
                'code': state.code,
                'metadata': state.metadata or {}
            }
        return None
    
    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return "N/A"

    def get_available_transitions(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not hasattr(obj, 'workflow_instance') or not obj.workflow_instance:
            logger.warning(f"Cannot get available transitions: user={user}, has_workflow_instance={hasattr(obj, 'workflow_instance')}, workflow_instance_exists={bool(getattr(obj, 'workflow_instance', None))}")
            return []
        try:
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            result = [{'code': t.code, 'name': t.name, 'description': t.description} for t in transitions]
            logger.info(f"Found {len(result)} available transitions for user {user.username} with role '{user.role.name if hasattr(user, 'role') and user.role else 'None'}'")
            return result
        except Exception as e:
            logger.error(f"Error getting available transitions for workflow instance {obj.workflow_instance.id}: {e}", exc_info=True)
            return []

    def get_workflow_instance(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return {
                'id': str(obj.workflow_instance.id),
                'current_state': obj.workflow_instance.current_state.name if obj.workflow_instance.current_state else None,
                'workflow_definition': obj.workflow_instance.workflow.name if obj.workflow_instance.workflow else None
            }
        return None
    
    def get_climate_scorecard(self, obj):
        """Get climate scorecard data if it exists."""
        try:
            scorecard = obj.climate_scorecard
            serializer = ClimateScorecardSerializer(scorecard, context=self.context)
            return serializer.data
        except ClimateScorecard.DoesNotExist:
            return None

    def get_artifacts(self, obj):
        request = self.context.get('request')
        return _get_credit_workflow_artifacts(obj, request=request)

    @transaction.atomic
    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"CASCADE_DEBUG validated_data: {validated_data}")
        logger.info("--- Running new, scalable create method ---")

        # Get the request from the context to access the user
        request = self.context.get('request')
        # 1. Handle limit requests payload (incorporating your JSON string parsing)
        limit_requests_payload = self.initial_data.get('limit_requests', [])
        if isinstance(limit_requests_payload, str):
            try:
                limit_requests_payload = json.loads(limit_requests_payload)
            except json.JSONDecodeError:
                logger.warning("Could not decode limit_requests JSON string during create.")
                limit_requests_payload = []
        validated_data.pop('limit_requests', None) # Remove from data for super().create

        # Set created_by from the request user
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # 2. Extract ALL prefixed form data using the new helper method.
        # This replaces the manual extraction logic.
        artifact_updates = self._extract_artifact_data(self.initial_data)

        # 3. IMPORTANT: The frontend should send fields for the main model (like counterparty_id
        # and relationship_manager_id) WITHOUT a prefix. They will be in validated_data.
        # The new architecture correctly separates concerns, so we no longer need to
        # manually move fields from the form data to the main application data.
        
        # 4. Create the parent CreditApplication instance using non-prefixed data.
        credit_application = super().create(validated_data)
        logger.info(f"Created CreditApplication with ID: {credit_application.id}")

        # 5. Loop through and save data for each sub-form found.
        # This is the scalable part that will handle all future forms.
        for artifact_key, artifact_data in artifact_updates.items():
            if artifact_data:
                self._update_artifact_instance(credit_application, artifact_key, artifact_data)

        # 6. Handle limit requests creation (incorporating your robust loop)
        if limit_requests_payload:
            for lr_data in limit_requests_payload:
                lr_data.pop('id', None)
                limit_type_id = lr_data.pop('limit_type_id', None)
                if limit_type_id:
                    try:
                        limit_type = LimitType.objects.get(id=limit_type_id)
                        lr_data.pop('limit_type', None) # remove nested object if present
                        LimitRequest.objects.create(
                            credit_application=credit_application,
                            limit_type=limit_type,
                            **lr_data
                        )
                    except LimitType.DoesNotExist:
                        logger.warning(f"LimitType with id {limit_type_id} not found.")

        # 7. Create initial workflow instance (using your explicit logic)
        try:
            # Use the correct model 'Workflow' and the correct name 'Credit Paper Approval Workflow'
            workflow = Workflow.objects.get(name='Credit Paper Approval Workflow')
            # Find the initial state for this workflow
            initial_state = State.objects.get(workflow=workflow, is_initial=True)
            
            if not initial_state:
                raise State.DoesNotExist(f"Initial state for workflow '{workflow.name}' not found.")
            
            # Create the workflow instance using the generic foreign key `content_object`
            wf_instance = WorkflowInstance.objects.create(
                workflow=workflow,
                content_object=credit_application,
                current_state=initial_state
            )
            # Link the instance back to the credit application
            credit_application.workflow_instance = wf_instance
            credit_application.save(update_fields=['workflow_instance'])
            logger.info(f"Created and linked workflow instance {wf_instance.id} for CreditApplication ID: {credit_application.id}")
        
        except Workflow.DoesNotExist:
            logger.error("'Credit Paper Approval Workflow' not found. Cannot create workflow instance.")
        except State.DoesNotExist as e:
            logger.error(f"Error finding initial state for workflow: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during workflow instance creation: {e}", exc_info=True)

        return credit_application

    @transaction.atomic
    def update(self, instance, validated_data):
        logger.info("--- Running final corrected update method ---")

        # 1. Use initial_data to reliably get payloads
        limit_requests_payload = self.initial_data.get('limit_requests', [])
        if isinstance(limit_requests_payload, str):
            try:
                limit_requests_payload = json.loads(limit_requests_payload)
            except json.JSONDecodeError:
                logger.warning("Could not decode limit_requests JSON string during update.")
                # Set to None to distinguish from an intentional empty list
                limit_requests_payload = None
        
        validated_data.pop('limit_requests', None)

        # 2. Extract all prefixed form data
        artifact_updates = self._extract_artifact_data(self.initial_data)

        # 3. Update the main CreditApplication instance
        logger.info(f"Updating CreditApplication with validated_data keys: {list(validated_data.keys())}")
        if 'relationship_manager' in validated_data:
            logger.info(f"Updating relationship_manager to: {validated_data['relationship_manager']}")
        instance = super().update(instance, validated_data)
        logger.info(f"Updated CreditApplication with ID: {instance.id}")

        # 4. Loop through and save data for each sub-form
        for artifact_key, artifact_data in artifact_updates.items():
            if artifact_data:
                self._update_artifact_instance(instance, artifact_key, artifact_data)

        # 5. Handle limit requests with your robust "wholesale replacement" strategy
        if limit_requests_payload is not None:
            instance.limit_requests.all().delete()
            for lr_data in limit_requests_payload:
                lr_data.pop('id', None)
                limit_type_id = lr_data.pop('limit_type_id', None)
                if limit_type_id:
                    try:
                        limit_type = LimitType.objects.get(id=limit_type_id)
                        LimitRequest.objects.create(
                            credit_application=instance,
                            limit_type=limit_type,
                            **lr_data
                        )
                    except LimitType.DoesNotExist:
                        logger.warning(f"LimitType with id {limit_type_id} not found during update.")

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # The 'limit_requests' field is now handled automatically by the serializer.

        if not instance.reference_number:
            import datetime
            year = datetime.datetime.now().year
            count = CreditApplication.objects.filter(created_at__year=year).count()
            instance.reference_number = f"CR-{year}-{count + 1:04d}"
            instance.save(update_fields=['reference_number'])
            representation['reference_number'] = instance.reference_number
            
        return representation
