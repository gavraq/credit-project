import uuid
import logging # Added import
from rest_framework import serializers
from django.db import transaction
from .models import CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm, CreditQuestionnaireForm # Ensure CreditRequestForm is available for DoesNotExist

from django.contrib.auth import get_user_model

User = get_user_model()

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
        required=False, # Allows limit_type_id to be omitted if not applicable
        allow_null=True   # Allows limit_type_id to be explicitly null if needed
    )
    # Explicitly define credit_application to allow it to be initially absent
    # during the creation of a new CreditApplication with nested limit requests.
    # The actual linking happens in CreditApplicationSerializer.create().
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
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    # Expect UUIDs for sponsors from the frontend, these will be converted to User instances
    # Serializer field name matches the model's ForeignKey field name.
    # `source` indicates the key to read from the input JSON payload.
    senior_business_sponsor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False
        # Input JSON key 'senior_business_sponsor_id' matches field name, so no 'source' needed.
    )
    second_business_sponsor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False
        # Input JSON key 'second_business_sponsor_id' matches field name, so no 'source' needed.
    )

    # These CharFields match model fields and will be populated by the validate method for saving.
    senior_business_sponsor_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    second_business_sponsor_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        # Get the User instance from the 'senior_business_sponsor_id' field in validated_data
        senior_sponsor_instance = data.get('senior_business_sponsor_id')
        if senior_sponsor_instance:
            data['senior_business_sponsor_name'] = senior_sponsor_instance.get_full_name() or senior_sponsor_instance.username
        else:
            data['senior_business_sponsor_name'] = ""

        second_sponsor_instance = data.get('second_business_sponsor_id')
        if second_sponsor_instance:
            data['second_business_sponsor_name'] = second_sponsor_instance.get_full_name() or second_sponsor_instance.username
        else:
            data['second_business_sponsor_name'] = ""
        return data

    class Meta:
        model = CreditRequestForm
        fields = [
            'id', 'credit_application',
            'counterparty_cif',
            'guarantor_name', 'guarantor_cif',
            'revenue_last_12m', 'revenue_projected_12m', 'projected_rorwa_percent',
            'country_risk_limit_available', 'kyc_approval_status',
            'relationship_comments', 'most_senior_contact', 'last_client_visit_date',
            'legal_documentation', 'positive_legal_opinion',
            'financial_statements_received', 'interim_statements_available',
            'account_executive', 
            'senior_business_sponsor_id', 'senior_business_sponsor_name',  # Use ForeignKey field name
            'second_business_sponsor_id', 'second_business_sponsor_name', # Use ForeignKey field name
            'high_priority_justification',
            'form_data', 
            'created_at', 'updated_at',
            'workflow_instance_id', 'workflow_state_name', 'available_transitions'
        ]
        # senior_business_sponsor_name and second_business_sponsor_name are effectively read_only for input
        # as they are populated by the validate method based on the sponsor instance.
        # However, they need to be in 'fields' to be included in validated_data for model creation.
        read_only_fields = ['id', 'credit_application', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if 'form_data' not in representation or not isinstance(representation['form_data'], dict):
            representation['form_data'] = {}
        if 'prioritisation_sponsorship' not in representation['form_data'] or not isinstance(representation['form_data']['prioritisation_sponsorship'], dict):
            representation['form_data']['prioritisation_sponsorship'] = {}

        # high_priority_justification is a direct model field, so it will be serialized at the top level.
        # If it's intended to be part of form_data.prioritisation_sponsorship for some reason,
        # it should be handled differently, perhaps by not being a direct model field.
        # For now, let's assume high_priority_justification is handled by default serialization.
        # If 'high_priority_justification' is truly part of the 'form_data' JSON field on the model,
        # then it should be accessed via instance.form_data.get('prioritisation_sponsorship', {}).get('high_priority_justification', '')
        # For simplicity, if high_priority_justification is a direct model field, it will be handled by super().to_representation()
        # and doesn't need special handling here unless it's meant to be *moved* into form_data.

        # If 'high_priority_justification' is a direct model field, it's already in 'representation'.
        # If it's part of the form_data JSON field in the model, it should be accessed like:
        # high_priority_just_from_form_data = instance.form_data.get('prioritisation_sponsorship', {}).get('high_priority_justification', '')
        # representation['form_data']['prioritisation_sponsorship']['high_priority_justification'] = high_priority_just_from_form_data
        # For now, assuming 'high_priority_justification' is a direct model field and handled by default serialization.
        # The 'senior_business_sponsor_name' and 'second_business_sponsor_name' are direct model fields
        # and will be serialized at the top level by default due to being in Meta.fields.

        # If high_priority_justification is a direct model field, it's already handled.
        # If it's meant to be in form_data['prioritisation_sponsorship'] specifically for output,
        # and it's also a direct model field, this could be a bit confusing.
        # Let's assume for now that direct model fields are sufficient for output.
        # If 'high_priority_justification' is part of the JSON blob 'form_data' on the model:
        prioritisation_sponsorship_data = instance.form_data.get('prioritisation_sponsorship', {})
        representation['form_data']['prioritisation_sponsorship']['high_priority_justification'] = prioritisation_sponsorship_data.get('high_priority_justification', '')

        return representation

    def get_workflow_instance_id(self, obj):
        if obj.workflow_instance:
            return obj.workflow_instance.id
        return None

    def get_workflow_state_name(self, obj):
        if obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        # This is for the sub-process (Credit Request Form).
        # We only want to allow transitions on this sub-process if the parent process
        # is in the 'CREDIT_PAPER_CREDIT_REQUEST' state.
        parent_application = obj.credit_application
        if parent_application and parent_application.workflow_instance:
            parent_state_code = parent_application.workflow_instance.current_state.code
            if parent_state_code != 'CREDIT_PAPER_CREDIT_REQUEST':
                return []
        else:
            # If there's no parent or parent workflow, no transitions are possible.
            return []

        # If parent state is correct, get transitions for the sub-process workflow.
        if obj.workflow_instance:
            try:
                user = self.context.get('request').user if self.context.get('request') else None
                if not user:
                    return []
                
                transitions = obj.workflow_instance.get_allowed_transitions(user)
                return [
                    {
                        'id': str(t.id),
                        'code': t.code,
                        'name': t.name,
                        'to_state': {
                            'id': str(t.to_state.id),
                            'code': t.to_state.code,
                            'name': t.to_state.name
                        }
                    } for t in transitions
                ]
            except Exception as e:
                logging.error(f"Error getting available transitions for CreditRequestForm {obj.id}: {e}")
        return []

class CreditReviewFormSerializer(serializers.ModelSerializer):
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    class Meta:
        model = CreditReviewForm
        fields = ['id', 'form_data', 'created_at', 'updated_at', 'workflow_instance_id', 'workflow_state_name', 'available_transitions']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_workflow_instance_id(self, obj):
        # Assuming CreditReviewForm has a 'workflow_instance' foreign key or one-to-one field
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return obj.workflow_instance.id
        return None

    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            if hasattr(obj.workflow_instance, 'get_allowed_transitions'):
                try:
                    user = self.context.get('request').user if self.context.get('request') else None
                    if user:
                        transitions = obj.workflow_instance.get_allowed_transitions(user)
                        return [
                            {
                                'id': str(t.id),
                                'code': t.code,
                                'name': t.name,
                                'to_state': {
                                    'id': str(t.to_state.id),
                                    'code': t.to_state.code,
                                    'name': t.to_state.name
                                }
                            } for t in transitions
                        ]
                except Exception as e:
                    # Consider logging this exception
                    print(f"Error getting available transitions for CreditReviewForm {obj.id}: {e}")
        return []

class BusinessSponsorshipFormSerializer(serializers.ModelSerializer):
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    # Fields to pull sponsor names from the related CreditRequestForm
    senior_business_sponsor_name = serializers.SerializerMethodField()
    second_business_sponsor_name = serializers.SerializerMethodField()

    class Meta:
        model = BusinessSponsorshipForm
        fields = [
            'id', 'form_data', 'created_at', 'updated_at',
            'workflow_instance_id', 'workflow_state_name', 'available_transitions',
            'senior_business_sponsor_name', 'second_business_sponsor_name'  # Added sponsor names
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_senior_business_sponsor_name(self, obj):
        """
        Retrieves the senior business sponsor's name from the related CreditRequestForm.
        'obj' is the BusinessSponsorshipForm instance.
        """
        try:
            return obj.credit_application.credit_request_form.senior_business_sponsor_name
        except (CreditRequestForm.DoesNotExist, AttributeError):
            # Handles cases where credit_request_form doesn't exist or relations are None
            return ""

    def get_second_business_sponsor_name(self, obj):
        """
        Retrieves the second business sponsor's name from the related CreditRequestForm.
        """
        try:
            return obj.credit_application.credit_request_form.second_business_sponsor_name
        except (CreditRequestForm.DoesNotExist, AttributeError):
            return ""

    def get_workflow_instance_id(self, obj):
        if obj.workflow_instance:
            return obj.workflow_instance.id
        return None

    def get_workflow_state_name(self, obj):
        if obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        # Adapted from CreditApplicationSerializer.get_available_transitions
        # print(f"BS Form Serializer: Getting available transitions for BS form {obj.id}")
        if obj.workflow_instance:
            # print(f"  BS Workflow instance: {obj.workflow_instance.id}")
            if hasattr(obj.workflow_instance, 'get_allowed_transitions'):
                try:
                    user = self.context.get('request').user if self.context.get('request') else None
                    if user:
                        transitions = obj.workflow_instance.get_allowed_transitions(user)
                        # print(f"  BS Found {len(transitions)} available transitions for user {user.username}")
                        # for t in transitions:
                        #     print(f"    - {t.code}: {t.name} ({t.from_state.code} → {t.to_state.code})")
                        return [
                            {
                                'id': str(t.id),
                                'code': t.code,
                                'name': t.name,
                                'to_state': {
                                    'id': str(t.to_state.id),
                                    'code': t.to_state.code,
                                    'name': t.to_state.name
                                }
                            } for t in transitions
                        ]
                    # else:
                        # print("  BS No user found in context, cannot get available transitions")
                except Exception as e:
                    print(f"  BS Error getting available transitions: {e}")
                    import traceback
                    traceback.print_exc()
            # else:
                # print("  BS Workflow instance does not have get_allowed_transitions method")
        # else:
            # print(f"  BS No workflow instance found for BS form {obj.id}")
        return []

class LegalReviewFormSerializer(serializers.ModelSerializer):
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    class Meta:
        model = LegalReviewForm
        fields = ['id', 'form_data', 'created_at', 'updated_at', 'workflow_instance_id', 'workflow_state_name', 'available_transitions']
        read_only_fields = ['id', 'created_at', 'updated_at', 'workflow_instance_id', 'workflow_state_name', 'available_transitions']

    def get_workflow_instance_id(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return str(obj.workflow_instance.id)
        return None

    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and user:
            try:
                transitions = obj.workflow_instance.get_allowed_transitions(user)
                return [
                    {
                        'id': str(t.id),
                        'code': t.code,
                        'name': t.name,
                        'to_state': {
                            'id': str(t.to_state.id),
                            'code': t.to_state.code,
                            'name': t.to_state.name
                        }
                    } for t in transitions
                ]
            except Exception as e:
                # You might want to log this error
                pass
        return []

    def update(self, instance, validated_data):
        """
        Custom update to handle saving all incoming data to the form_data JSONField.
        """
        instance.form_data = self.initial_data
        instance.save(update_fields=['form_data'])
        return instance

class CreditQuestionnaireFormSerializer(serializers.ModelSerializer):
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    class Meta:
        model = CreditQuestionnaireForm
        fields = ['id', 'form_data', 'created_at', 'updated_at', 'workflow_instance_id', 'workflow_state_name', 'available_transitions']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_workflow_instance_id(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return str(obj.workflow_instance.id)
        return None

    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and user:
            try:
                transitions = obj.workflow_instance.get_allowed_transitions(user)
                return [
                    {
                        'id': str(t.id),
                        'code': t.code,
                        'name': t.name,
                        'to_state': {
                            'id': str(t.to_state.id),
                            'code': t.to_state.code,
                            'name': t.to_state.name
                        }
                    } for t in transitions
                ]
            except Exception as e:
                # You might want to log this error
                pass
        return []

class LegalReviewFormSerializer(serializers.ModelSerializer):
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state_name = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    class Meta:
        model = LegalReviewForm
        fields = ['id', 'form_data', 'created_at', 'updated_at', 'workflow_instance_id', 'workflow_state_name', 'available_transitions']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_workflow_instance_id(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance:
            return str(obj.workflow_instance.id)
        return None

    def get_workflow_state_name(self, obj):
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and obj.workflow_instance.current_state:
            return obj.workflow_instance.current_state.name
        return None

    def get_available_transitions(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if hasattr(obj, 'workflow_instance') and obj.workflow_instance and user:
            try:
                transitions = obj.workflow_instance.get_allowed_transitions(user)
                return [
                    {
                        'id': str(t.id),
                        'code': t.code,
                        'name': t.name,
                        'to_state': {
                            'id': str(t.to_state.id),
                            'code': t.to_state.code,
                            'name': t.to_state.name
                        }
                    } for t in transitions
                ]
            except Exception as e:
                # You might want to log this error
                pass
        return []

class CreditApplicationSerializer(serializers.ModelSerializer):
    # Nested serializers for sub-processes.
    credit_request_form = CreditRequestFormSerializer(required=False, allow_null=True)
    credit_review_form = CreditReviewFormSerializer(required=False, allow_null=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(required=False, allow_null=True)
    legal_review_form = LegalReviewFormSerializer(required=False, allow_null=True)
    credit_questionnaire_form = CreditQuestionnaireFormSerializer(required=False, allow_null=True)

    counterparty = CounterpartySerializer(read_only=True)
    counterparty_id = serializers.PrimaryKeyRelatedField(
        queryset=Counterparty.objects.all(),
        source='counterparty',
        write_only=True,
        required=False,
        allow_null=True
    )

    limit_requests = LimitRequestSerializer(many=True, required=False)
    
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()
    sub_processes = serializers.SerializerMethodField()

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'reference_number', 'title', 'description', 'priority', 
            'required_by_date', 'applicant_name', 'counterparty', 'counterparty_id', 'limit_requests', 
            'created_at', 'updated_at', 'submitted_at',
            'workflow_instance_id', 'workflow_state', 'available_transitions',
            'sub_processes',
            'credit_request_form', 'credit_review_form', 'business_sponsorship_form',
            'legal_review_form', 'credit_questionnaire_form',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'submitted_at', 'reference_number']

    def get_workflow_instance_id(self, obj):
        return obj.workflow_instance.id if obj.workflow_instance else None

    def get_workflow_state(self, obj):
        if obj.workflow_instance and obj.workflow_instance.current_state:
            return {
                'id': str(obj.workflow_instance.current_state.id),
                'code': obj.workflow_instance.current_state.code,
                'name': obj.workflow_instance.current_state.name
            }
        return None

    def get_available_transitions(self, obj):
        if not obj.workflow_instance:
            return []
        try:
            user = self.context['request'].user
            transitions = obj.workflow_instance.get_allowed_transitions(user)
            return [
                {
                    'id': str(t.id), 'code': t.code, 'name': t.name,
                    'to_state': {
                        'id': str(t.to_state.id),
                        'code': t.to_state.code,
                        'name': t.to_state.name
                    }
                } for t in transitions
            ]
        except Exception as e:
            logging.error(f"Error getting available transitions for CreditApplication {obj.id}: {e}")
            return []

    def get_sub_processes(self, obj):
        sub_processes_data = []
        parent_state_code = obj.workflow_instance.current_state.code if obj.workflow_instance and obj.workflow_instance.current_state else None
        
        RELEVANT_SUB_PROCESSES_MAP = {
            'CREDIT_PAPER_CREDIT_REQUEST': ['credit_request_form'],
            'CREDIT_PAPER_CREDIT_REVIEW_PENDING': ['credit_request_form', 'credit_review_form'],
            'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form'],
            'CREDIT_PAPER_ANALYSIS_PENDING': [
                'credit_request_form', 
                'business_sponsorship_form', # Should be view-only now
                'credit_questionnaire_form', 
                'legal_review_form'
            ],
        }

        form_mappings = {
            'credit_request_form': (CreditRequestForm, CreditRequestFormSerializer, 'Credit Request'),
            'credit_review_form': (CreditReviewForm, CreditReviewFormSerializer, 'Credit Review'),
            'business_sponsorship_form': (BusinessSponsorshipForm, BusinessSponsorshipFormSerializer, 'Business Sponsorship'),
            'legal_review_form': (LegalReviewForm, LegalReviewFormSerializer, 'Legal Review'),
            'credit_questionnaire_form': (CreditQuestionnaireForm, CreditQuestionnaireFormSerializer, 'Credit Questionnaire'),
        }
        
        context = self.context
        relevant_form_keys = RELEVANT_SUB_PROCESSES_MAP.get(parent_state_code, [])
        
        for form_key in relevant_form_keys:
            if form_key in form_mappings:
                model_class, serializer_class, form_name = form_mappings[form_key]
                try:
                    form_instance = getattr(obj, form_key, None)
                    if form_instance:
                        serializer = serializer_class(form_instance, context=context)
                        sub_processes_data.append({
                            'form_name': form_name,
                            'form_key': form_key,
                            'data': serializer.data
                        })
                    else:
                        sub_processes_data.append({
                            'form_name': form_name,
                            'form_key': form_key,
                            'data': None 
                        })
                except AttributeError:
                    logging.warning(f"AttributeError when trying to access {form_key} on CreditApplication {obj.id}")
                    sub_processes_data.append({
                        'form_name': form_name,
                        'form_key': form_key,
                        'data': None
                    })
        return sub_processes_data

    def create(self, validated_data):
        # Pop data for serializers that process their fields directly (LimitRequest, CreditRequestForm)
        limit_requests_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)

        # Pop keys for JSONField forms from validated_data to clean it for parent creation,
        # but we'll use self.initial_data for their actual content.
        validated_data.pop('business_sponsorship_form', None)
        validated_data.pop('credit_review_form', None)
        validated_data.pop('legal_review_form', None)
        validated_data.pop('credit_questionnaire_form', None)

        # Get raw data for JSONField forms from initial_data.
        # Fallback to empty dict if not provided, ensuring forms are always created.
        raw_bsf_data = self.initial_data.get('business_sponsorship_form', {})
        raw_crf_data = self.initial_data.get('credit_review_form', {})
        raw_lrf_data = self.initial_data.get('legal_review_form', {})
        raw_cqf_data = self.initial_data.get('credit_questionnaire_form', {})

        # Create the parent CreditApplication instance with the now-clean validated_data.
        credit_application = CreditApplication.objects.create(**validated_data)

        # Create LimitRequest instances using their validated data.
        for lr_data in limit_requests_data:
            LimitRequest.objects.create(credit_application=credit_application, **lr_data)

        # Create CreditRequestForm using its validated data.
        if credit_request_form_data:
            CreditRequestForm.objects.create(credit_application=credit_application, **credit_request_form_data)
        else: # Ensure it's created even if no data, as it has specific fields
            CreditRequestForm.objects.create(credit_application=credit_application)
        
        # Create JSONField forms using their raw input data.
        BusinessSponsorshipForm.objects.create(credit_application=credit_application, form_data=raw_bsf_data)
        CreditReviewForm.objects.create(credit_application=credit_application, form_data=raw_crf_data)
        LegalReviewForm.objects.create(credit_application=credit_application, form_data=raw_lrf_data)
        CreditQuestionnaireForm.objects.create(credit_application=credit_application, form_data=raw_cqf_data)

        return credit_application

    def update(self, instance, validated_data):
        # Pop data for serializers that process their fields directly.
        limit_requests_data = validated_data.pop('limit_requests', None)
        credit_request_form_data = validated_data.pop('credit_request_form', None)

        # Pop keys for JSONField forms from validated_data to clean it for parent update,
        # but we'll use self.initial_data for their actual content.
        validated_data.pop('business_sponsorship_form', None)
        validated_data.pop('credit_review_form', None)
        validated_data.pop('legal_review_form', None)
        validated_data.pop('credit_questionnaire_form', None)

        # Get raw data for JSONField forms from initial_data.
        raw_bsf_data = self.initial_data.get('business_sponsorship_form')
        raw_crf_data = self.initial_data.get('credit_review_form')
        raw_lrf_data = self.initial_data.get('legal_review_form')
        raw_cqf_data = self.initial_data.get('credit_questionnaire_form')

        # Update the parent CreditApplication instance with the clean validated_data.
        instance = super().update(instance, validated_data)

        # Handle LimitRequest updates using its validated data.
        if limit_requests_data is not None:
            instance.limit_requests.all().delete()
            for lr_data in limit_requests_data:
                LimitRequest.objects.create(credit_application=instance, **lr_data)

        # Handle CreditRequestForm updates using its validated data.
        if credit_request_form_data is not None:
            CreditRequestForm.objects.update_or_create(
                credit_application=instance, defaults=credit_request_form_data
            )
        
        # Handle JSONField forms updates using their raw input data.
        if raw_bsf_data is not None:
            BusinessSponsorshipForm.objects.update_or_create(
                credit_application=instance, defaults={'form_data': raw_bsf_data}
            )

        if raw_crf_data is not None:
            CreditReviewForm.objects.update_or_create(
                credit_application=instance, defaults={'form_data': raw_crf_data}
            )
        
        if raw_cqf_data is not None:
            CreditQuestionnaireForm.objects.update_or_create(
                credit_application=instance, defaults={'form_data': raw_cqf_data}
            )

        if raw_lrf_data is not None:
            LegalReviewForm.objects.update_or_create(
                credit_application=instance, defaults={'form_data': raw_lrf_data}
            )

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Ensure limit_requests are always present in the output
        limit_requests = instance.limit_requests.all()
        representation['limit_requests'] = LimitRequestSerializer(limit_requests, many=True).data

        # Generate reference number if not present
        if not instance.reference_number:
            import datetime
            year = datetime.datetime.now().year
            count = CreditApplication.objects.filter(created_at__year=year).count()
            instance.reference_number = f"CR-{year}-{count + 1:04d}"
            instance.save(update_fields=['reference_number'])
            representation['reference_number'] = instance.reference_number
            
        return representation
