from rest_framework import serializers
from .models import CreditApplication, Counterparty, LimitRequest, LimitType, CreditRequestForm

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
            'workflow_state', 'available_transitions', 'credit_request_form'
        ]

    def create(self, validated_data):
        limits_data = validated_data.pop('limit_requests', [])
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        
        # Create the credit application
        credit_app = super().create(validated_data)
        
        # Create limit requests
        for limit_data in limits_data:
            limit_type = limit_data.pop('limit_type', None)
            LimitRequest.objects.create(credit_application=credit_app, **limit_data)
        
        # Create credit request form if data provided
        if credit_request_form_data:
            CreditRequestForm.objects.create(credit_application=credit_app, **credit_request_form_data)
        else:
            # Always create an empty credit request form to ensure one-to-one relationship
            CreditRequestForm.objects.create(credit_application=credit_app)
            
        return credit_app

    def update(self, instance, validated_data):
        import json
        print(f"\n\nUPDATE SERIALIZER - validated_data: {json.dumps(validated_data, indent=2, default=str)}\n")
        
        # Extract limit requests data
        limits_data = validated_data.pop('limit_requests', [])
        print(f"Extracted limits_data: {json.dumps(limits_data, indent=2, default=str)}")
        
        # Extract credit request form data
        credit_request_form_data = validated_data.pop('credit_request_form', None)
        
        # Update the credit application
        instance = super().update(instance, validated_data)
        
        # Update credit request form if data provided
        if credit_request_form_data:
            try:
                # Get or create the credit request form
                credit_request_form, created = CreditRequestForm.objects.get_or_create(
                    credit_application=instance
                )
                
                # Update each field individually to handle partial updates
                for attr, value in credit_request_form_data.items():
                    setattr(credit_request_form, attr, value)
                    
                credit_request_form.save()
            except Exception as e:
                print(f"Error updating credit_request_form: {e}")
                import traceback
                traceback.print_exc()
        
        # Handle limit requests
        if limits_data:
            try:
                # Log existing limits before deletion
                existing_limits = list(instance.limit_requests.all())
                print(f"Existing limits before deletion: {len(existing_limits)}")
                for i, limit in enumerate(existing_limits):
                    print(f"  Limit {i+1}: type={limit.limit_type_id}, existing_amount={limit.existing_amount}, proposed_amount={limit.proposed_amount}")
                
                # Remove all old limits and recreate
                instance.limit_requests.all().delete()
                print(f"Creating {len(limits_data)} new limit requests")
                
                # Create new limit requests
                from .models import LimitRequest
                for i, limit_data in enumerate(limits_data):
                    try:
                        print(f"  Processing limit {i+1}: {json.dumps(limit_data, indent=2, default=str)}")
                        
                        # Ensure we have the required fields
                        if 'limit_type_id' not in limit_data:
                            print(f"  ERROR: limit_type_id missing for limit {i+1}")
                            continue
                            
                        # Create the limit request with explicit field mapping
                        limit = LimitRequest(
                            credit_application=instance,
                            limit_type_id=limit_data.get('limit_type_id'),
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
        if obj.workflow_instance and obj.workflow_instance.current_state:
            return {
                'id': str(obj.workflow_instance.current_state.id),
                'code': obj.workflow_instance.current_state.code,
                'name': obj.workflow_instance.current_state.name
            }
        return None

    def get_available_transitions(self, obj):
        # This assumes a method or property on workflow_instance to get allowed transitions
        if obj.workflow_instance and hasattr(obj.workflow_instance, 'get_available_transitions'):
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
                } for t in obj.workflow_instance.get_available_transitions()
            ]
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
        
        # Ensure limit_requests are properly included in the representation
        # This is important when the serializer is used in a nested context
        if 'limit_requests' not in representation or not representation['limit_requests']:
            # Explicitly query and serialize limit requests
            from .models import LimitRequest
            limit_requests = LimitRequest.objects.filter(credit_application=instance)
            if limit_requests.exists():
                limit_serializer = LimitRequestSerializer(limit_requests, many=True)
                representation['limit_requests'] = limit_serializer.data
                print(f"Added {len(limit_requests)} limit requests to representation")
        
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

