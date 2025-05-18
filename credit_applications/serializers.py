from rest_framework import serializers
from .models import CreditApplication, Counterparty, LimitRequest, LimitType

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
            'requested_amount', 'approved_amount', 'status',
            'created_at', 'updated_at'
        ]

class CreditApplicationSerializer(serializers.ModelSerializer):
    counterparty = CounterpartySerializer(read_only=True)
    counterparty_id = serializers.PrimaryKeyRelatedField(
        queryset=Counterparty.objects.all(),
        source='counterparty',
        write_only=True
    )
    limit_requests = LimitRequestSerializer(many=True, read_only=True)
    workflow_instance_id = serializers.UUIDField(source='workflow_instance.id', read_only=True)
    workflow_state = serializers.SerializerMethodField(read_only=True)
    available_transitions = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CreditApplication
        fields = [
            'id', 'counterparty', 'counterparty_id', 'applicant_name',
            'application_date', 'status', 'created_at', 'updated_at',
            'limit_requests', 'workflow_instance_id', 'workflow_state', 'available_transitions'
        ]

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

