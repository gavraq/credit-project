from rest_framework import serializers
from workflow_engine.models import WorkflowInstance, StateLog, Transition

class WorkflowInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowInstance
        fields = '__all__'

class StateLogSerializer(serializers.ModelSerializer):
    transition = serializers.StringRelatedField()
    from_state = serializers.StringRelatedField()
    to_state = serializers.StringRelatedField()
    performed_by = serializers.StringRelatedField()

    class Meta:
        model = StateLog
        fields = '__all__'

class WorkflowTransitionSerializer(serializers.Serializer):
    transition_code = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    system_context = serializers.JSONField(required=False)
