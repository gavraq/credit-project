from rest_framework import serializers
from workflow_engine.models import WorkflowArtifact, WorkflowInstance, StateLog, Transition
from workflow_engine.services.artifact_types import get_artifact_actions, get_artifact_capabilities
from .models import User

class WorkflowArtifactSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    capabilities = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowArtifact
        fields = [
            'id',
            'artifact_key',
            'artifact_kind',
            'capabilities',
            'actions',
            'title',
            'content_type',
            'object_id',
            'metadata',
            'created_at',
            'updated_at',
        ]

    def get_content_type(self, obj):
        if not obj.content_type:
            return None
        return {
            'app_label': obj.content_type.app_label,
            'model': obj.content_type.model,
        }

    def get_capabilities(self, obj):
        workflow_instance = getattr(obj, "workflow_instance", None)
        content_type = getattr(workflow_instance, "content_type", None)
        model_name = getattr(content_type, "model", None)
        return get_artifact_capabilities(model_name, obj.artifact_key, obj.artifact_kind)

    def get_actions(self, obj):
        workflow_instance = getattr(obj, "workflow_instance", None)
        content_type = getattr(workflow_instance, "content_type", None)
        model_name = getattr(content_type, "model", None)
        context = {"id": getattr(workflow_instance, "object_id", None)}
        return get_artifact_actions(model_name, obj.artifact_key, context=context)


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    allowed_transitions = serializers.SerializerMethodField()
    artifacts = WorkflowArtifactSerializer(many=True, read_only=True)

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

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed, e.g.:
        # token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user data to the response
        serializer = UserListSerializer(self.user, context=self.context) # Use UserListSerializer
        data['user'] = serializer.data
        return data

class WorkflowTransitionSerializer(serializers.Serializer):
    transition_code = serializers.CharField()
    comments = serializers.CharField(required=False, allow_blank=True)
    system_context = serializers.JSONField(required=False)
