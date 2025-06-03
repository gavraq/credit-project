from rest_framework import serializers
from .models import CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm, CreditReviewForm

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
        required=False # in case null allowed
    )
    class Meta:
        model = LimitRequest
        fields = [
            'id', 'credit_application', 'limit_type', 'limit_type_id',
            'existing_amount', 'existing_tenor', 'proposed_amount', 'proposed_tenor',
            'comments'
        ]

class CreditRequestFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditRequestForm
        fields = [
            'id', 'credit_application', 'workflow_instance',
            'guarantor_name', 'guarantor_cif',
            'revenue_last_12m', 'revenue_projected_12m', 'projected_rorwa_percent',
            'country_risk_limit_available', 'kyc_approval_status',
            'relationship_comments', 'most_senior_contact', 'last_client_visit_date',
            'legal_documentation', 'positive_legal_opinion',
            'financial_statements_received', 'interim_statements_available',
            'account_executive', 'senior_business_sponsor', 'second_business_sponsor',
            'high_priority_justification',
            'form_data', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'credit_application', 'workflow_instance', 'created_at', 'updated_at']

class CreditReviewFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditReviewForm
        exclude = ['credit_application', 'workflow_instance', 'form_data']

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
    credit_request_form = CreditRequestFormSerializer(required=False)
    credit_review_form = CreditReviewFormSerializer(required=False)
    
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
            'credit_review_form'
        ]

    def create(self, validated_data):
        limits_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        credit_review_form_data = validated_data.pop('credit_review_form', None)
        
        # Create the credit application
        credit_app = super().create(validated_data)
        
        # Create limit requests
        # 'limits_data' is correctly defined at the start of the 'create' method as: 
        # limits_data = validated_data.pop('limit_requests', [])
        for limit_data_item in limits_data:
            LimitRequest.objects.create(credit_application=credit_app, **limit_data_item)
        
        # Create credit request form if data provided
        if credit_request_form_data:
            CreditRequestForm.objects.create(credit_application=credit_app, **credit_request_form_data)
        else:
            # Always create an empty credit request form to ensure one-to-one relationship
            CreditRequestForm.objects.create(credit_application=credit_app)
        
        # Create credit review form if data provided
        if credit_review_form_data:
            CreditReviewForm.objects.create(credit_application=credit_app, **credit_review_form_data)
            
        return credit_app

    def update(self, instance, validated_data):
        import json
        print(f"\n\nUPDATE SERIALIZER - initial_data: {json.dumps(self.initial_data, indent=2, default=str)}")
        print(f"UPDATE SERIALIZER - validated_data (before pop): {json.dumps(validated_data, indent=2, default=str)}\n")

        credit_request_form_data = validated_data.pop('credit_request_form', None)
        limit_requests_data = validated_data.pop('limit_requests', [])

        print(f"Extracted credit_request_form_data: {json.dumps(credit_request_form_data, indent=2, default=str)}")
        print(f"Extracted limit_requests_data: {json.dumps(limit_requests_data, indent=2, default=str)}")
        print(f"UPDATE SERIALIZER - validated_data (AFTER pop, before super().update filtering): {json.dumps(validated_data, indent=2, default=str)}\n")

        # Filter validated_data to only include fields belonging to the CreditApplication model
        model_field_names = {f.name for f in instance._meta.fields}
        parent_validated_data = {
            key: value for key, value in validated_data.items() if key in model_field_names
        }
        # Note: This simple filtering might not correctly handle all field types or relationships 
        # (e.g., m2m if not handled by name, or custom field names via 'source').
        # For this case, it should be okay for direct fields.

        print(f"UPDATE SERIALIZER - parent_validated_data (for super().update): {json.dumps(parent_validated_data, indent=2, default=str)}\n")

        # Update the parent instance with its direct fields using the filtered data
        super().update(instance, parent_validated_data)
        instance.refresh_from_db() # Refresh the instance from the database
        print(f"CreditApplication instance {instance.pk} refreshed from DB.")

        # Handle CreditRequestForm update (OneToOne relationship)
        if credit_request_form_data:
            try:
                # Access via the related_name from the refreshed CreditApplication instance
                crf_instance = instance.credit_request_form  # Corrected related name
                print(f"Found existing CreditRequestForm via instance.credit_request_form (ID: {crf_instance.pk}) for CreditApplication: {instance.pk}")
            except CreditRequestForm.DoesNotExist:
                crf_instance = None
                print(f"CreditRequestForm.DoesNotExist when accessing instance.credit_request_form for CA {instance.pk} (after refresh). Will attempt to create.")
            except AttributeError: # Should ideally not be hit now if related_name is correct and instance refreshed
                crf_instance = None 
                print(f"AttributeError when accessing instance.credit_request_form for CA {instance.pk}. This is unexpected. Will attempt to create.")

            if crf_instance:
                crf_serializer = CreditRequestFormSerializer(crf_instance, data=credit_request_form_data, partial=True)
                crf_serializer.is_valid(raise_exception=True)
                crf_serializer.save()
                print(f"Successfully updated CreditRequestForm: {crf_instance.id}")
            else:
                # This implies the CreditRequestForm was not created with the CreditApplication.
                # This could be an issue with the initial creation logic (e.g., in the view's workflow setup).
                # For an update, we'd typically expect it to exist.
                print(f"WARNING: CreditRequestForm (instance.creditrequestform) not found for CreditApplication {instance.id} during update. Attempting to create.")
                # Ensure 'credit_application' is not in credit_request_form_data as it's read_only in serializer
                # and will be provided via save(credit_application=instance)
                credit_request_form_data.pop('credit_application', None) 
                crf_create_serializer = CreditRequestFormSerializer(data=credit_request_form_data)
                if crf_create_serializer.is_valid(raise_exception=True):
                    crf_create_serializer.save(credit_application=instance) # Associate with parent
                    print(f"Successfully CREATED missing CreditRequestForm for CreditApplication {instance.id}")

        # Handle LimitRequests update (ForeignKey relationship from LimitRequest to CreditApplication)
        # Only process if 'limit_requests' was part of the incoming PATCH data.
        if 'limit_requests' in self.initial_data:
            print(f"Processing limit_requests update. Number of items from payload: {len(limit_requests_data)}")
            # Simple strategy: Delete all existing and recreate from payload
            instance.limit_requests.all().delete()
            for lr_data in limit_requests_data:
                # 'credit_application' is read_only in CreditApplicationLimitRequestSerializer,
                # so pass it to save() method.
                lr_data.pop('credit_application', None) # Ensure it's not in lr_data if accidentally included
                lr_serializer = LimitRequestSerializer(data=lr_data)
                if lr_serializer.is_valid(raise_exception=True):
                    lr_serializer.save(credit_application=instance)
                else:
                    print(f"Error validating limit request data: {lr_serializer.errors}")
            print(f"Recreated {len(limit_requests_data)} limit requests for CreditApplication {instance.id}")
        
        # Handle credit review form data if provided
        credit_review_form_data = validated_data.pop('credit_review_form', None)
        if credit_review_form_data:
            try:
                # Get or create the credit review form
                credit_review_form, created = CreditReviewForm.objects.get_or_create(
                    credit_application=instance
                )
                
                # Update the credit review form fields
                for attr, value in credit_review_form_data.items():
                    setattr(credit_review_form, attr, value)
                
                credit_review_form.save()
                print(f"Credit review form {'created' if created else 'updated'}")
            except Exception as e:
                print(f"ERROR handling credit review form: {e}")
                import traceback
                traceback.print_exc()
        
        # Handle limit requests
        # 'limit_requests_data' is defined earlier in the 'update' method by:
        # limit_requests_data = validated_data.pop('limit_requests', [])
        if limit_requests_data: # Corrected variable name
            try:
                # Log existing limits before deletion
                existing_limits = list(instance.limit_requests.all())
                print(f"Existing limits before deletion: {len(existing_limits)}")
                for i, limit in enumerate(existing_limits):
                    print(f"  Limit {i+1}: type={limit.limit_type_id}, existing_amount={limit.existing_amount}, proposed_amount={limit.proposed_amount}")
                
                # Remove all old limits and recreate
                instance.limit_requests.all().delete()
                print(f"Creating {len(limit_requests_data)} new limit requests") # Corrected variable name
                
                # Create new limit requests
                from .models import LimitRequest # This import might be redundant if already at top-level
                for i, limit_data_item in enumerate(limit_requests_data): # Corrected variable name and loop var
                    try:
                        print(f"  Processing limit {i+1}: {json.dumps(limit_data_item, indent=2, default=str)}") # Corrected loop var
                        
                        # Direct approach to handle the limit type
                        limit_type_id = None
                        limit_type_name = None
                        
                        # First, try to get the limit type ID directly
                        if 'limit_type_id' in limit_data:
                            limit_type_id = limit_data['limit_type_id']
                            print(f"  Found limit_type_id directly: {limit_type_id}")
                        
                        # If no ID, try to get the name
                        if not limit_type_id and 'limit_type' in limit_data:
                            # The limit_type could be a string name, a UUID string, or an object
                            if isinstance(limit_data['limit_type'], str):
                                limit_type_name = limit_data['limit_type']
                                print(f"  Found limit_type as string: {limit_type_name}")
                            elif isinstance(limit_data['limit_type'], dict) and 'id' in limit_data['limit_type']:
                                limit_type_id = limit_data['limit_type']['id']
                                print(f"  Found limit_type_id from object: {limit_type_id}")
                            elif isinstance(limit_data['limit_type'], dict) and 'name' in limit_data['limit_type']:
                                limit_type_name = limit_data['limit_type']['name']
                                print(f"  Found limit_type_name from object: {limit_type_name}")
                        
                        # If we have a name but no ID, look up the ID by name
                        if not limit_type_id and limit_type_name:
                            try:
                                # First try to parse as UUID
                                try:
                                    import uuid
                                    uuid.UUID(limit_type_name)
                                    limit_type_id = limit_type_name
                                    print(f"  Parsed limit_type_name as UUID: {limit_type_id}")
                                except ValueError:
                                    # If not a UUID, look up by name
                                    from .models import LimitType
                                    limit_type_obj = LimitType.objects.filter(name=limit_type_name).first()
                                    if limit_type_obj:
                                        limit_type_id = limit_type_obj.id
                                        print(f"  Found limit_type_id {limit_type_id} for name '{limit_type_name}'")
                                    else:
                                        print(f"  ERROR: Could not find limit type with name '{limit_type_name}'")
                            except Exception as e:
                                print(f"  ERROR looking up limit type by name: {e}")
                        
                        # If we still don't have an ID, try to find the first limit type
                        if not limit_type_id:
                            try:
                                from .models import LimitType
                                first_limit_type = LimitType.objects.first()
                                if first_limit_type:
                                    limit_type_id = first_limit_type.id
                                    print(f"  FALLBACK: Using first available limit type: {first_limit_type.name} (ID: {limit_type_id})")
                                else:
                                    print(f"  ERROR: No limit types found in the database")
                                    continue
                            except Exception as e:
                                print(f"  ERROR finding first limit type: {e}")
                                continue
                            
                        # Create the limit request with explicit field mapping
                        limit = LimitRequest(
                            credit_application=instance,
                            limit_type_id=limit_type_id,  # Use the extracted limit_type_id
                            existing_amount=limit_data.get('existing_amount', 0),
                            existing_tenor=limit_data.get('existing_tenor', 0),
                            proposed_amount=limit_data.get('proposed_amount', 0),
                            proposed_tenor=limit_data.get('proposed_tenor', 0),
                            comments=limit_data.get('comments', '')
                        )
                        limit.save()
                        print(f"  Successfully created limit {i+1} with ID: {limit.id}")
                    except Exception as e:
                        print(f"  ERROR creating limit request {i+1}: {e}")
                        import traceback
                        traceback.print_exc()
                
                # Verify limits were created
                new_limits = list(instance.limit_requests.all())
                print(f"Limits after recreation: {len(new_limits)}")
                for i, limit in enumerate(new_limits):
                    print(f"  Limit {i+1}: ID={limit.id}, type={limit.limit_type_id}, existing_amount={limit.existing_amount}, proposed_amount={limit.proposed_amount}")
            except Exception as e:
                print(f"ERROR handling limit requests: {e}")
                import traceback
                traceback.print_exc()
            
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
            print(f"Error retrieving legacy form_data: {e}")
        return {}
        
    def to_representation(self, instance):
        # Get the standard representation
        representation = super().to_representation(instance)
        
        # ALWAYS include limit_requests in the representation
        # This is critical for the frontend to properly display limit data
        from .models import LimitRequest
        limit_requests = LimitRequest.objects.filter(credit_application=instance)
        
        # Force refresh from database to ensure we have the latest data
        if limit_requests.exists():
            limit_serializer = LimitRequestSerializer(limit_requests, many=True)
            representation['limit_requests'] = limit_serializer.data
            print(f"Added {len(limit_requests)} limit requests to representation")
        else:
            # Even if no limit requests exist, ensure the field is present as an empty list
            representation['limit_requests'] = []
            print("No limit requests found for this credit application")
        
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
        
        # Debug: Log what's in the representation
        print(f"Representation includes {len(representation.get('limit_requests', []))} limit requests")
            
        return representation

