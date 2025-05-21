from rest_framework import serializers
from workflow_engine.models import WorkflowInstance, StateLog, Transition
from .models import User

class WorkflowInstanceSerializer(serializers.ModelSerializer):
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowInstance
        fields = '__all__'

    def get_allowed_transitions(self, obj):
        user = self.context['request'].user
        transitions = obj.get_allowed_transitions(user)
        return [
            {
                'code': t.code,
                'name': t.name,
                'to_state': t.to_state.code,
                'description': t.description,
            }
            for t in transitions
        ]


class StateLogSerializer(serializers.ModelSerializer):
    transition = serializers.StringRelatedField()
    from_state = serializers.StringRelatedField()
    to_state = serializers.StringRelatedField()
    performed_by = serializers.StringRelatedField()

    class Meta:
        model = StateLog
        fields = '__all__'

class UserListSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField()
    department = serializers.StringRelatedField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'department']

class WorkflowTransitionSerializer(serializers.Serializer):
    transition_code = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    system_context = serializers.JSONField(required=False)
