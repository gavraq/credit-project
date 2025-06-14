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

        # Ensure these names are populated even if they are None/empty on the instance, to maintain structure
        representation['form_data']['prioritisation_sponsorship']['senior_business_sponsor_name'] = instance.senior_business_sponsor_name or ''
        representation['form_data']['prioritisation_sponsorship']['second_business_sponsor_name'] = instance.second_business_sponsor_name or ''
        representation['form_data']['prioritisation_sponsorship']['high_priority_justification'] = instance.high_priority_justification or ''

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
        # Pop nested data before creating the main instance
        limit_requests_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        business_sponsorship_form_data = validated_data.pop('business_sponsorship_form', None)
        credit_review_form_data = validated_data.pop('credit_review_form', None)
        legal_review_form_data = validated_data.pop('legal_review_form', None)
        credit_questionnaire_form_data = validated_data.pop('credit_questionnaire_form', None)

        # Create the main CreditApplication instance
        credit_application = CreditApplication.objects.create(**validated_data)

        # Create LimitRequest instances
        for lr_data in limit_requests_data:
            LimitRequest.objects.create(credit_application=credit_application, **lr_data)

        # Create nested OneToOne forms based on their model structure
        if credit_request_form_data:
            # Logic from update() to handle sponsor FKs and names, adapted for create()
            sbs_id_val = credit_request_form_data.get('senior_business_sponsor_id')
            if sbs_id_val:
                try:
                    user_instance = User.objects.get(pk=sbs_id_val)
                    credit_request_form_data['senior_business_sponsor_id'] = user_instance
                    credit_request_form_data['senior_business_sponsor_name'] = user_instance.get_full_name() or user_instance.username
                except (User.DoesNotExist, ValueError):
                    credit_request_form_data['senior_business_sponsor_id'] = None
                    credit_request_form_data['senior_business_sponsor_name'] = ''

            sbs2_id_val = credit_request_form_data.get('second_business_sponsor_id')
            if sbs2_id_val:
                try:
                    user_instance_2 = User.objects.get(pk=sbs2_id_val)
                    credit_request_form_data['second_business_sponsor_id'] = user_instance_2
                    credit_request_form_data['second_business_sponsor_name'] = user_instance_2.get_full_name() or user_instance_2.username
                except (User.DoesNotExist, ValueError):
                    credit_request_form_data['second_business_sponsor_id'] = None
                    credit_request_form_data['second_business_sponsor_name'] = ''

            CreditRequestForm.objects.create(credit_application=credit_application, **credit_request_form_data)
        
        if business_sponsorship_form_data:
            BusinessSponsorshipForm.objects.create(credit_application=credit_application, form_data=business_sponsorship_form_data)

        if credit_review_form_data:
            CreditReviewForm.objects.create(credit_application=credit_application, form_data=credit_review_form_data)

        if credit_questionnaire_form_data:
            CreditQuestionnaireForm.objects.create(credit_application=credit_application, form_data=credit_questionnaire_form_data)

        # LegalReviewForm also uses form_data
        if legal_review_form_data:
            LegalReviewForm.objects.create(credit_application=credit_application, form_data=legal_review_form_data)

        return credit_application

    def update(self, instance, validated_data):
        # CRITICAL: For nested data not defined as fields on this serializer, we must use initial_data.
        limit_requests_data = self.initial_data.get('limit_requests')
        credit_request_form_data = self.initial_data.get('credit_request_form')
        business_sponsorship_form_data = self.initial_data.get('business_sponsorship_form')
        credit_review_form_data = self.initial_data.get('credit_review_form')
        legal_review_form_data = self.initial_data.get('legal_review_form')
        credit_questionnaire_form_data = self.initial_data.get('credit_questionnaire_form')

        # Remove nested serializer data from validated_data before calling super().update()
        # as we handle them manually using self.initial_data.
        validated_data.pop('limit_requests', None)
        validated_data.pop('credit_request_form', None)
        validated_data.pop('business_sponsorship_form', None)
        validated_data.pop('credit_review_form', None)
        validated_data.pop('legal_review_form', None)
        validated_data.pop('credit_questionnaire_form', None)

        # Update the main CreditApplication instance fields from the (now cleaned) validated_data
        instance = super().update(instance, validated_data)

        # Handle LimitRequest (ManyToOne): Delete existing and create new ones
        if limit_requests_data is not None:
            instance.limit_requests.all().delete()
            for lr_data in limit_requests_data:
                if 'limit_type' in lr_data and isinstance(lr_data.get('limit_type'), dict):
                    lr_data['limit_type_id'] = lr_data.pop('limit_type')['id']
                lr_data.pop('id', None)
                LimitRequest.objects.create(credit_application=instance, **lr_data)

        # Handle nested OneToOne forms based on their model structure
        if credit_request_form_data is not None:
            # Convert string IDs to User instances for ForeignKey fields in CreditRequestForm
            # that are unconventionally named with an _id suffix.
            sbs_id_val = credit_request_form_data.get('senior_business_sponsor_id')
            if sbs_id_val and isinstance(sbs_id_val, str):
                try:
                    user_instance = User.objects.get(pk=sbs_id_val)
                    credit_request_form_data['senior_business_sponsor_id'] = user_instance
                    credit_request_form_data['senior_business_sponsor_name'] = user_instance.get_full_name() or user_instance.username
                except User.DoesNotExist:
                    credit_request_form_data['senior_business_sponsor_id'] = None
                    credit_request_form_data['senior_business_sponsor_name'] = '' # Ensure name is cleared or set to default
                except ValueError: # Handle cases where sbs_id_val is not a valid UUID
                    credit_request_form_data['senior_business_sponsor_id'] = None
                    credit_request_form_data['senior_business_sponsor_name'] = ''
            elif 'senior_business_sponsor_id' in credit_request_form_data and credit_request_form_data['senior_business_sponsor_id'] is None:
                 credit_request_form_data['senior_business_sponsor_id'] = None
                 credit_request_form_data['senior_business_sponsor_name'] = '' # Ensure name is also cleared

            sbs2_id_val = credit_request_form_data.get('second_business_sponsor_id')
            if sbs2_id_val and isinstance(sbs2_id_val, str):
                try:
                    user_instance_2 = User.objects.get(pk=sbs2_id_val)
                    credit_request_form_data['second_business_sponsor_id'] = user_instance_2
                    credit_request_form_data['second_business_sponsor_name'] = user_instance_2.get_full_name() or user_instance_2.username
                except User.DoesNotExist:
                    credit_request_form_data['second_business_sponsor_id'] = None
                    credit_request_form_data['second_business_sponsor_name'] = '' # Ensure name is cleared or set to default
                except ValueError: # Handle cases where sbs2_id_val is not a valid UUID
                    credit_request_form_data['second_business_sponsor_id'] = None
                    credit_request_form_data['second_business_sponsor_name'] = ''
            elif 'second_business_sponsor_id' in credit_request_form_data and credit_request_form_data['second_business_sponsor_id'] is None:
                 credit_request_form_data['second_business_sponsor_id'] = None
                 credit_request_form_data['second_business_sponsor_name'] = '' # Ensure name is also cleared

            # Convert string representations of booleans to actual booleans
            boolean_field_keys = [
                'country_risk_limit_available',
                'kyc_approval_status',
                'positive_legal_opinion',
                'financial_statements_received',
                'interim_statements_available',
            ]
            for field_name in boolean_field_keys:
                if field_name in credit_request_form_data:
                    value = credit_request_form_data[field_name]
                    if isinstance(value, str):
                        if value.lower() in ['yes', 'true']:
                            credit_request_form_data[field_name] = True
                        elif value.lower() in ['no', 'false']:
                            credit_request_form_data[field_name] = False
                        # If not a recognized boolean string, leave as is for Django's validation to handle
                    # If already a bool, it's fine. If other type, Django's validation will handle.

            CreditRequestForm.objects.update_or_create(credit_application=instance, defaults=credit_request_form_data)

        if business_sponsorship_form_data is not None:
            BusinessSponsorshipForm.objects.update_or_create(credit_application=instance, defaults={'form_data': business_sponsorship_form_data})

        if credit_review_form_data is not None:
            CreditReviewForm.objects.update_or_create(credit_application=instance, defaults={'form_data': credit_review_form_data})

        if credit_questionnaire_form_data is not None:
            CreditQuestionnaireForm.objects.update_or_create(credit_application=instance, defaults={'form_data': credit_questionnaire_form_data})

        if legal_review_form_data is not None:
            LegalReviewForm.objects.update_or_create(credit_application=instance, defaults={'form_data': legal_review_form_data})

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
