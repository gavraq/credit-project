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
        # representation['form_data']['prioritisation_sponsorship']['senior_business_sponsor_id'] = instance.senior_business_sponsor_id_id if instance.senior_business_sponsor_id else None
        # representation['form_data']['prioritisation_sponsorship']['second_business_sponsor_id'] = instance.second_business_sponsor_id_id if instance.second_business_sponsor_id else None
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
        if obj.workflow_instance:
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
                    print(f"Error getting available transitions for CreditRequestForm {obj.id}: {e}")
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
    counterparty = CounterpartySerializer(read_only=True)
    counterparty_id = serializers.PrimaryKeyRelatedField(
        queryset=Counterparty.objects.all(),
        source='counterparty',
        write_only=True
    )
    # Custom field to handle priority capitalization
    priority = serializers.CharField(max_length=20)
    limit_requests = LimitRequestSerializer(many=True)
    workflow_instance_id = serializers.UUIDField(source='workflow_instance.id', read_only=True)
    workflow_state = serializers.SerializerMethodField(read_only=True)
    available_transitions = serializers.SerializerMethodField(read_only=True)
    credit_request_form = CreditRequestFormSerializer(required=False, allow_null=True)
    credit_review_form = CreditReviewFormSerializer(required=False, allow_null=True)
    business_sponsorship_form = BusinessSponsorshipFormSerializer(required=False, allow_null=True)
    legal_review_form = LegalReviewFormSerializer(required=False, allow_null=True)
    credit_questionnaire_form = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    
    def get_credit_questionnaire_form(self, obj):
        if hasattr(obj, 'credit_questionnaire_form'): # Corrected attribute name
            serializer = CreditQuestionnaireFormSerializer(
                obj.credit_questionnaire_form,
                context=self.context
            )
            return serializer.data
        return None

    def get_applicant_name(self, obj):
        # Prioritize the snapshot stored on the model
        if obj.applicant_name:
            return obj.applicant_name

        # Fallback: If applicant_name on model is blank, try to derive from created_by
        user_id = obj.created_by
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                full_name = f"{user.first_name} {user.last_name}".strip()
                # Return current full name or username as fallback
                return full_name if full_name else user.username
            except User.DoesNotExist:
                logging.warning(f"User with ID {user_id} not found for CreditApplication {obj.id} (fallback lookup).")
                return str(user_id) # Return ID if user not found
            except Exception as e:
                logging.error(f"Error fetching user {user_id} for CreditApplication {obj.id} (fallback lookup): {e}")
                return "Error: See Logs"
        
        # If neither applicant_name nor created_by yields a name
        return "N/A"

    def validate_priority(self, value):
        """Normalize priority value to ensure proper capitalization."""
        valid_priorities = ['Low', 'Medium', 'High']
        normalized = value.capitalize()
        
        # Check if the normalized value is in our valid choices
        if normalized not in valid_priorities:
            raise serializers.ValidationError(f"Priority must be one of: {', '.join(valid_priorities)}")
            
        return normalized

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'reference_number', 'title', 'counterparty', 'counterparty_id', 
            'description', 'priority', 'required_by_date', 'applicant_name',
            'created_at', 'updated_at', 'limit_requests', 'workflow_instance_id', 
            'workflow_state', 'available_transitions', 'credit_request_form',
            'credit_review_form', 'business_sponsorship_form', 'legal_review_form', 'credit_questionnaire_form'
        ]

    def create(self, validated_data):
        # Pop other form data first from validated_data as they might be fine with current nested handling
        # or might need similar treatment if they also have strict parent FK requirements.
        # For now, focusing on limit_requests as it's the reported issue.
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        logger = logging.getLogger(__name__)
        logger.error(f"DEBUGGING VIEWSET CREATE - credit_request_form_data after pop: {credit_request_form_data}") # TEMP: Changed to error for visibility
        credit_review_form_data = validated_data.pop('credit_review_form', None)
        business_sponsorship_form_data = validated_data.pop('business_sponsorship_form', None)
        legal_review_form_data = validated_data.pop('legal_review_form', None)
        credit_questionnaire_form_data = validated_data.pop('credit_questionnaire_form', None)

        # Retrieve raw limit_requests data from initial_data because validated_data.pop('limit_requests')
        # would only work if nested validation passed, which it isn't for credit_application.
        # We also remove 'limit_requests' from validated_data if it's there to prevent super().create() from processing it.
        raw_limits_data = self.initial_data.get('limit_requests', [])
        validated_data.pop('limit_requests', None) # Ensure super().create doesn't see it
        
        # Create the credit application instance first
        credit_app = super().create(validated_data)
        
        # Now, create limit requests using the raw data and the created credit_app instance
        if raw_limits_data:
            for i, lr_raw_data in enumerate(raw_limits_data):
                try:
                    limit_type_id_from_raw = lr_raw_data.get('limit_type_id')
                    
                    if not limit_type_id_from_raw:
                        continue

                    limit_request_payload_for_create = {
                        'credit_application': credit_app.id,
                        'limit_type_id': limit_type_id_from_raw,
                        'existing_amount': lr_raw_data.get('existing_amount'),
                        'existing_tenor': lr_raw_data.get('existing_tenor'),
                        'proposed_amount': lr_raw_data.get('proposed_amount'),
                        'proposed_tenor': lr_raw_data.get('proposed_tenor'),
                        'comments': lr_raw_data.get('comments', '')
                    }
                    
                    temp_lr_serializer = LimitRequestSerializer(data=limit_request_payload_for_create)
                    if temp_lr_serializer.is_valid(raise_exception=True):
                        temp_lr_serializer.save()
                except Exception as e_create_limit:
                    continue
        
        # Create credit request form if data provided
        if credit_request_form_data:
            logger.info(f"VIEWSET CREATE - Creating CreditRequestForm with data: {credit_request_form_data}") # ADDED LOGGING
            crf_instance = CreditRequestForm.objects.create(credit_application=credit_app, **credit_request_form_data)
            logger.error(f"[CREATE] CreditRequestForm instance created with ID: {crf_instance.id}") # Existing log
            logger.error(f"[CREATE POST-SAVE] CRF Instance counterparty_cif: {crf_instance.counterparty_cif}")
            logger.error(f"[CREATE POST-SAVE] CRF Instance country_risk_limit_available: {crf_instance.country_risk_limit_available}")
        else:
            logger.info("VIEWSET CREATE - credit_request_form_data is None, creating empty CreditRequestForm.") # Existing log
            crf_instance = CreditRequestForm.objects.create(credit_application=credit_app)
            logger.error(f"[CREATE POST-SAVE - DEFAULT] CRF Instance counterparty_cif: {crf_instance.counterparty_cif}")
            logger.error(f"[CREATE POST-SAVE - DEFAULT] CRF Instance country_risk_limit_available: {crf_instance.country_risk_limit_available}")
        
        # Create credit review form if data provided
        if credit_review_form_data:
            CreditReviewForm.objects.create(credit_application=credit_app, **credit_review_form_data)

        # Handle Business Sponsorship Form Data from initial_data, consistent with update method
        raw_initial_form_data_bs = self.initial_data.get('form_data', {})
        actual_bs_form_data_initial = raw_initial_form_data_bs.get('business_sponsorship_data', None)

        if actual_bs_form_data_initial:
            data_for_bs_serializer_create = {'form_data': actual_bs_form_data_initial}
            bs_create_serializer = BusinessSponsorshipFormSerializer(data=data_for_bs_serializer_create)
            if bs_create_serializer.is_valid(raise_exception=True):
                bs_create_serializer.save(credit_application=credit_app)
        # If no data, BusinessSponsorshipForm is not created, which is fine as it's nullable

        if legal_review_form_data:
            LegalReviewForm.objects.create(credit_application=credit_app, **legal_review_form_data)

        if credit_questionnaire_form_data:
            CreditQuestionnaireForm.objects.create(credit_application=credit_app, **credit_questionnaire_form_data)
            
        return credit_app

    def update(self, instance, validated_data):
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        credit_review_form_data = validated_data.pop('credit_review_form', None) # Already popped in current version, but ensure it's handled
        business_sponsorship_form_data = validated_data.pop('business_sponsorship_form', None)
        legal_review_form_data = validated_data.pop('legal_review_form', None)
        credit_questionnaire_form_data = validated_data.pop('credit_questionnaire_form', None)
        validated_data.pop('limit_requests', None)  # Ensure super().update doesn't process; data will be sourced from initial_data

        model_field_names = {f.name for f in instance._meta.fields}
        # The pop happens earlier, so let's inspect credit_request_form_data directly if it's already available
        # Or, more accurately, let's inspect what's in validated_data for 'credit_request_form' *before* it's used by the nested serializer logic.

        parent_validated_data = {
            key: value for key, value in validated_data.items() if key in model_field_names
        }
        
        super().update(instance, parent_validated_data)
        instance.refresh_from_db() # Refresh the instance from the database

        if credit_request_form_data:
            try:
                crf_instance = instance.credit_request_form  

            except CreditRequestForm.DoesNotExist:
                crf_instance = None

            except AttributeError: 
                crf_instance = None 


            if crf_instance:
                data_for_crf_serializer = credit_request_form_data.copy()
                if isinstance(data_for_crf_serializer.get('senior_business_sponsor_id'), User):
                    data_for_crf_serializer['senior_business_sponsor_id'] = data_for_crf_serializer['senior_business_sponsor_id'].pk
                if isinstance(data_for_crf_serializer.get('second_business_sponsor_id'), User):
                    data_for_crf_serializer['second_business_sponsor_id'] = data_for_crf_serializer['second_business_sponsor_id'].pk
                crf_serializer = CreditRequestFormSerializer(crf_instance, data=data_for_crf_serializer, partial=True)
                if crf_serializer.is_valid(raise_exception=True):
                    crf_serializer.save()
            else:
                data_for_crf_serializer = credit_request_form_data.copy()
                if isinstance(data_for_crf_serializer.get('senior_business_sponsor_id'), User):
                    data_for_crf_serializer['senior_business_sponsor_id'] = data_for_crf_serializer['senior_business_sponsor_id'].pk
                if isinstance(data_for_crf_serializer.get('second_business_sponsor_id'), User):
                    data_for_crf_serializer['second_business_sponsor_id'] = data_for_crf_serializer['second_business_sponsor_id'].pk
                data_for_crf_serializer.pop('credit_application', None) # Ensure this is popped for new instance data
                crf_create_serializer = CreditRequestFormSerializer(data=data_for_crf_serializer)
                if crf_create_serializer.is_valid(raise_exception=True):
                    crf_create_serializer.save(credit_application=instance) # Associate with parent

        raw_credit_review_form_data = self.initial_data.get('credit_review_form', None)
        if raw_credit_review_form_data:
            data_for_review_serializer = {'form_data': raw_credit_review_form_data}
            try:
                review_form_instance = instance.credit_review_form
            except CreditReviewForm.DoesNotExist:
                review_form_instance = None
            except AttributeError: 
                review_form_instance = None

            if review_form_instance:
                review_serializer = CreditReviewFormSerializer(review_form_instance, data=data_for_review_serializer, partial=True)
                if review_serializer.is_valid(raise_exception=True):
                    review_serializer.save()
            else:
                # Create new CreditReviewForm instance
                review_create_serializer = CreditReviewFormSerializer(data=data_for_review_serializer)
                if review_create_serializer.is_valid(raise_exception=True):
                    review_create_serializer.save(credit_application=instance)

        # Handle Business Sponsorship Form Data
        raw_form_data_for_bs = self.initial_data.get('form_data', {})
        actual_bs_form_data = raw_form_data_for_bs.get('business_sponsorship_data', None)

        if actual_bs_form_data:
            data_for_bs_serializer = {'form_data': actual_bs_form_data}
            try:
                bs_form_instance = instance.business_sponsorship_form
            except BusinessSponsorshipForm.DoesNotExist:
                bs_form_instance = None
            except AttributeError:
                bs_form_instance = None

            if bs_form_instance:
                bs_serializer = BusinessSponsorshipFormSerializer(bs_form_instance, data=data_for_bs_serializer, partial=True)
                if bs_serializer.is_valid(raise_exception=True):
                    bs_serializer.save()
            else:
                # Create new BusinessSponsorshipForm instance
                bs_create_serializer = BusinessSponsorshipFormSerializer(data=data_for_bs_serializer)
                if bs_create_serializer.is_valid(raise_exception=True):
                    bs_create_serializer.save(credit_application=instance)

        if 'limit_requests' in self.initial_data:
            # Get the raw limit requests data from the initial submission
            current_limits_data = self.initial_data.get('limit_requests', [])
            
            instance.limit_requests.all().delete() # Delete existing ones
            # Iterate over the raw data from the client, not what might (or might not) have passed full parent validation
            for i, lr_data in enumerate(current_limits_data):
                try:
                    limit_type_id = None
                    limit_type_name = None
                    
                    if 'limit_type_id' in lr_data and lr_data['limit_type_id']:
                        limit_type_id = lr_data['limit_type_id']
                    
                    if not limit_type_id and 'limit_type' in lr_data and lr_data['limit_type']:
                        limit_type_value = lr_data['limit_type']
                        if isinstance(limit_type_value, LimitType):
                            limit_type_id = limit_type_value.id
                        elif isinstance(limit_type_value, str): 
                            try:
                                uuid.UUID(str(limit_type_value)) 
                                limit_type_id = str(limit_type_value)
                            except ValueError:
                                limit_type_name = limit_type_value 
                        elif isinstance(limit_type_value, dict):
                            if 'id' in limit_type_value and limit_type_value['id']:
                                limit_type_id = limit_type_value['id']
                            elif 'name' in limit_type_value and limit_type_value['name']:
                                limit_type_name = limit_type_value['name']
                    
                    if not limit_type_id and limit_type_name:
                        try:
                            limit_type_obj = LimitType.objects.filter(name__iexact=limit_type_name).first()
                            if limit_type_obj:
                                limit_type_id = limit_type_obj.id
                            else:
                                continue 
                        except Exception as e_lookup:
                            continue
                    
                    if not limit_type_id:
                        continue

                    limit_request_payload = {
                        'credit_application': instance.id,
                        'limit_type_id': limit_type_id,
                        'existing_amount': lr_data.get('existing_amount'),
                        'existing_tenor': lr_data.get('existing_tenor'),
                        'proposed_amount': lr_data.get('proposed_amount'),
                        'proposed_tenor': lr_data.get('proposed_tenor'),
                        'comments': lr_data.get('comments', '')
                    }
                    
                    # 6. Use LimitRequestSerializer to create the object
                    print(f"    Attempting to create LimitRequest with payload: {limit_request_payload}")
                    temp_lr_serializer = LimitRequestSerializer(data=limit_request_payload)
                    if temp_lr_serializer.is_valid(raise_exception=True):
                        temp_lr_serializer.save() # Save without arguments as credit_application is in data
                        print(f"    Successfully created LimitRequest {i+1} with ID: {temp_lr_serializer.instance.id}")

                except Exception as e_outer_loop:
                    print(f"  ERROR processing limit request item {i+1} ({lr_data}): {e_outer_loop}")
                    # import traceback # Uncomment for deeper debugging if needed
                    # traceback.print_exc()
                    continue # Continue to next limit item if one fails
        # Handle credit review form data if provided
        if 'credit_review_form' in self.initial_data: 
            credit_review_form_data_local = validated_data.get('credit_review_form', self.initial_data.get('credit_review_form'))
            if credit_review_form_data_local: 
                try:
                    credit_review_form_instance, created = CreditReviewForm.objects.get_or_create(
                        credit_application=instance
                    )
                    crf_serializer = CreditReviewFormSerializer(credit_review_form_instance, data=credit_review_form_data_local, partial=True)
                    if crf_serializer.is_valid(raise_exception=True):
                        crf_serializer.save()
                except Exception as e:
                    print(f"Error updating/creating credit review form: {e}")

        # Handle business sponsorship form data if provided
        if 'business_sponsorship_form' in self.initial_data:
            business_sponsorship_form_data_local = validated_data.get('business_sponsorship_form', self.initial_data.get('business_sponsorship_form'))
            if business_sponsorship_form_data_local:
                try:
                    bs_form_instance, created = BusinessSponsorshipForm.objects.get_or_create(
                        credit_application=instance
                    )
                    bsf_serializer = BusinessSponsorshipFormSerializer(bs_form_instance, data=business_sponsorship_form_data_local, partial=True)
                    if bsf_serializer.is_valid(raise_exception=True):
                        bsf_serializer.save()
                except Exception as e:
                    print(f"Error updating/creating business sponsorship form: {e}")

        # Handle legal review form data if provided
        if 'legal_review_form' in self.initial_data:
            legal_review_form_data_local = validated_data.get('legal_review_form', self.initial_data.get('legal_review_form'))
            if legal_review_form_data_local:
                try:
                    lr_form_instance, created = LegalReviewForm.objects.get_or_create(
                        credit_application=instance
                    )
                    lrf_serializer = LegalReviewFormSerializer(lr_form_instance, data=legal_review_form_data_local, partial=True)
                    if lrf_serializer.is_valid(raise_exception=True):
                        lrf_serializer.save()
                except Exception as e:
                    print(f"Error updating/creating legal review form: {e}")

        # Handle credit questionnaire form data if provided
        if 'credit_questionnaire_form' in self.initial_data:
            credit_questionnaire_form_data_local = validated_data.get('credit_questionnaire_form', self.initial_data.get('credit_questionnaire_form'))
            if credit_questionnaire_form_data_local:
                try:
                    cq_form_instance, created = CreditQuestionnaireForm.objects.get_or_create(
                        credit_application=instance
                    )
                    cqf_serializer = CreditQuestionnaireFormSerializer(cq_form_instance, data=credit_questionnaire_form_data_local, partial=True)
                    if cqf_serializer.is_valid(raise_exception=True):
                        cqf_serializer.save()
                except Exception as e:
                    print(f"Error updating/creating credit questionnaire form: {e}")
            
        return instance

    def get_workflow_state(self, obj):
        print(f"Getting workflow state for credit application {obj.id}")
        if obj.workflow_instance:
            print(f"  Workflow instance: {obj.workflow_instance.id}")
            if obj.workflow_instance.current_state:
                print(f"  Current state: {obj.workflow_instance.current_state.code} ({obj.workflow_instance.current_state.name})")
                return {
                    'id': str(obj.workflow_instance.current_state.id),
                    'code': obj.workflow_instance.current_state.code,
                    'name': obj.workflow_instance.current_state.name
                }
            else:
                print(f"  No current state found for workflow instance {obj.workflow_instance.id}")
        else:
            print(f"  No workflow instance found for credit application {obj.id}")
        return None

    def get_available_transitions(self, obj):
        # This uses the get_allowed_transitions method on workflow_instance
        print(f"Getting available transitions for credit application {obj.id}")
        if obj.workflow_instance:
            print(f"  Workflow instance: {obj.workflow_instance.id}")
            if hasattr(obj.workflow_instance, 'get_allowed_transitions'):
                try:
                    # We need to pass the user to get_allowed_transitions
                    user = self.context.get('request').user if self.context.get('request') else None
                    if user:
                        transitions = obj.workflow_instance.get_allowed_transitions(user)
                        print(f"  Found {len(transitions)} available transitions for user {user.username}")
                        for t in transitions:
                            print(f"    - {t.code}: {t.name} ({t.from_state.code} → {t.to_state.code})")
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
                    else:
                        print("  No user found in context, cannot get available transitions")
                except Exception as e:
                    print(f"  Error getting available transitions: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                print("  Workflow instance does not have get_allowed_transitions method")
        else:
            print(f"  No workflow instance found for credit application {obj.id}")
        return []
        
    # This method is no longer needed as we're using proper nested serialization
    # But we'll keep a version of it for backward compatibility during migration
    def get_legacy_form_data(self, obj):
        try:
            if hasattr(obj, 'credit_request_form'):
                return obj.credit_request_form.form_data
        except Exception as e:
            return {}
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # ALWAYS include limit_requests in the representation
        # This is critical for the frontend to properly display limit data
        from .models import LimitRequest
        limit_requests = LimitRequest.objects.filter(credit_application=instance)
        
        # Force refresh from database to ensure we have the latest data
        if limit_requests.exists():
            limit_serializer = LimitRequestSerializer(limit_requests, many=True)
            representation['limit_requests'] = limit_serializer.data
        else:
            # Even if no limit requests exist, ensure the field is present as an empty list
            representation['limit_requests'] = []
        
        # Generate a reference number if not present
        if not representation.get('reference_number'):
            # Format: CR-YYYY-NNNN where NNNN is a sequential number
            import datetime
            year = datetime.datetime.now().year
            # Get count of applications this year and add 1
            from django.db.models import Count
            count = type(instance).objects.filter(
                created_at__year=year
            ).count() + 1
            representation['reference_number'] = f"CR-{year}-{count:04d}"
            
            # Update the instance with the generated reference number
            instance.reference_number = representation['reference_number']
            instance.save(update_fields=['reference_number'])
        
        return representation
