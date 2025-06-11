import uuid
import logging # Added import
from rest_framework import serializers
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

    def validate(self, data):
        return data

    class Meta:
        model = CreditRequestForm
        fields = [
            'id', 'credit_application',
            'counterparty_cif', # Added field
            'guarantor_name', 'guarantor_cif',
            'revenue_last_12m', 'revenue_projected_12m', 'projected_rorwa_percent',
            'country_risk_limit_available', 'kyc_approval_status',
            'relationship_comments', 'most_senior_contact', 'last_client_visit_date',
            'legal_documentation', 'positive_legal_opinion',
            'financial_statements_received', 'interim_statements_available',
            'account_executive', 'senior_business_sponsor_id', 'senior_business_sponsor_name', 'second_business_sponsor_id', 'second_business_sponsor_name',
            'high_priority_justification',
            'form_data', 
            'created_at', 'updated_at',
            'workflow_instance_id', 'workflow_state_name', 'available_transitions'
        ]
        read_only_fields = ['id', 'credit_application', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if 'form_data' not in representation or not isinstance(representation['form_data'], dict):
            representation['form_data'] = {}
        if 'prioritisation_sponsorship' not in representation['form_data'] or not isinstance(representation['form_data']['prioritisation_sponsorship'], dict):
            representation['form_data']['prioritisation_sponsorship'] = {}

        representation['form_data']['prioritisation_sponsorship']['senior_business_sponsor_name'] = instance.senior_business_sponsor_name
        representation['form_data']['prioritisation_sponsorship']['second_business_sponsor_name'] = instance.second_business_sponsor_name
        representation['form_data']['prioritisation_sponsorship']['high_priority_justification'] = instance.high_priority_justification

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

    class Meta:
        model = BusinessSponsorshipForm
        fields = [
            'id', 'form_data', 'created_at', 'updated_at', 
            'workflow_instance_id', 'workflow_state_name', 'available_transitions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

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
    class Meta:
        model = LegalReviewForm
        fields = ['id', 'form_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

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

class CreditApplicationSerializer(serializers.ModelSerializer):
    # Nested serializers for all possible sub-processes.
    # They are read-only here because they are fetched, not written, through this serializer.
    # Their own dedicated views/serializers handle their writes.
    credit_request_form = CreditRequestFormSerializer(read_only=True)
    credit_review_form = CreditReviewFormSerializer(read_only=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(read_only=True)
    legal_review_form = LegalReviewFormSerializer(read_only=True)
    credit_questionnaire_form = CreditQuestionnaireFormSerializer(read_only=True)

    # Fields for writing data
    counterparty = CounterpartySerializer(required=False)
    limit_requests = LimitRequestSerializer(many=True, required=False)
    
    # Fields for exposing parent workflow state
    workflow_instance_id = serializers.SerializerMethodField()
    workflow_state = serializers.SerializerMethodField()
    available_transitions = serializers.SerializerMethodField()

    # The new "Application Hub" field
    sub_processes = serializers.SerializerMethodField()

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'reference_number', 'title', 'description', 'priority', 
            'required_by_date', 'applicant_name', 'counterparty', 'limit_requests', 
            'created_at', 'updated_at', 'submitted_at',
            # Parent workflow fields
            'workflow_instance_id', 'workflow_state', 'available_transitions',
            # Sub-process hub field
            'sub_processes',
            # Individual sub-process forms (for convenience, though `sub_processes` is primary)
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
        """
        Gathers related sub-process forms that are relevant to the current state
        of the parent workflow, creating the "Application Hub" data structure.
        """
        sub_processes_data = []
        parent_state_code = obj.workflow_instance.current_state.code if obj.workflow_instance and obj.workflow_instance.current_state else None

        # Defines which sub-processes are active in each parent state
        RELEVANT_SUB_PROCESSES_MAP = {
            'CREDIT_PAPER_CREDIT_REQUEST': ['credit_request_form'],
            'CREDIT_PAPER_CREDIT_REVIEW_PENDING': ['credit_request_form', 'credit_review_form'],
            'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': ['credit_request_form', 'business_sponsorship_form'],
            'CREDIT_PAPER_ANALYSIS_PENDING': [
                'credit_request_form', 
                'business_sponsorship_form', # Should be view-only now
                'credit_questionnaire_form', 
                'legal_review_form'
            ],
            # Add other parent states and their relevant forms here
        }

        form_mappings = {
            'credit_request_form': (CreditRequestForm, CreditRequestFormSerializer, 'Credit Request'),
            'credit_review_form': (CreditReviewForm, CreditReviewFormSerializer, 'Credit Review'),
            'business_sponsorship_form': (BusinessSponsorshipForm, BusinessSponsorshipFormSerializer, 'Business Sponsorship'),
            'legal_review_form': (LegalReviewForm, LegalReviewFormSerializer, 'Legal Review'),
            'credit_questionnaire_form': (CreditQuestionnaireForm, CreditQuestionnaireFormSerializer, 'Credit Questionnaire'),
        }

        relevant_forms = RELEVANT_SUB_PROCESSES_MAP.get(parent_state_code, [])

        for related_name in form_mappings.keys(): # Iterate all possible forms
            is_relevant = related_name in relevant_forms
            
            if hasattr(obj, related_name):
                try:
                    form_instance = getattr(obj, related_name)
                    # Pass context to nested serializer to get user for transitions
                    serializer = form_mappings[related_name][1](form_instance, context=self.context)
                    data = serializer.data
                    
                    # Determine if the form should be editable
                    # General rule: editable if not in a terminal state (e.g., 'SUBMITTED')
                    # And if it's a relevant form for the current parent state.
                    workflow_state_name = data.get('workflow_state_name', '')
                    is_submitted = 'SUBMITTED' in workflow_state_name.upper() if workflow_state_name else False
                    is_editable = is_relevant and not is_submitted

                    sub_processes_data.append({
                        'form_type': form_mappings[related_name][2],
                        'form_model_name': related_name,
                        'id': data.get('id'),
                        'workflow_state': workflow_state_name,
                        'is_relevant': is_relevant,
                        'is_editable': is_editable,
                        'available_transitions': data.get('available_transitions', []) if is_editable else []
                    })
                except Exception as e:
                    logging.error(f"Error serializing {related_name} for application {obj.id}: {e}")

        return sub_processes_data

    def create(self, validated_data):
        limit_requests_data = validated_data.pop('limit_requests', [])
        counterparty_data = validated_data.pop('counterparty', None)

        if counterparty_data:
            counterparty, _ = Counterparty.objects.get_or_create(
                cif_number=counterparty_data.get('cif_number'),
                defaults=counterparty_data
            )
            validated_data['counterparty'] = counterparty

        credit_application = CreditApplication.objects.create(**validated_data)

        for limit_request_data in limit_requests_data:
            limit_request_data['credit_application'] = credit_application
            LimitRequest.objects.create(**limit_request_data)

        return credit_application

    def update(self, instance, validated_data):
        # Use initial_data for limit_requests to handle wholesale updates from the frontend
        limit_requests_data = self.initial_data.get('limit_requests', [])
        validated_data.pop('limit_requests', None) # Remove from validated_data to prevent default handling

        counterparty_data = validated_data.pop('counterparty', None)
        if counterparty_data:
            counterparty, _ = Counterparty.objects.get_or_create(
                cif_number=counterparty_data.get('cif_number'),
                defaults=counterparty_data
            )
            instance.counterparty = counterparty

        # Update the parent instance
        instance = super().update(instance, validated_data)

        # Wholesale update of limit requests
        instance.limit_requests.all().delete()
        for lr_data in limit_requests_data:
            lr_data.pop('id', None) # Remove id for creation
            lr_data['credit_application_id'] = instance.id
            # Use serializer to create to ensure validation
            limit_serializer = LimitRequestSerializer(data=lr_data)
            if limit_serializer.is_valid(raise_exception=True):
                limit_serializer.save()

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
