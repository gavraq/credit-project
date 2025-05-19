from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from backend.permissions import RolePermission
from workflow_engine.models import WorkflowInstance, StateLog
from .serializers import (
    WorkflowInstanceSerializer,
    StateLogSerializer,
    WorkflowTransitionSerializer,
    UserListSerializer
)
from .models import User

class WorkflowInstanceTransitionView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def post(self, request, pk):
        instance = get_object_or_404(WorkflowInstance, pk=pk)
        serializer = WorkflowTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            instance.perform_transition(
                transition_code=data['transition_code'],
                user=request.user,
                comments=data.get('comments', ''),
                system_context=data.get('system_context', {})
            )
        except (ValueError, PermissionError) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Transition performed successfully.'}, status=status.HTTP_200_OK)

class WorkflowInstanceLogListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request, pk):
        instance = get_object_or_404(WorkflowInstance, pk=pk)
        logs = StateLog.objects.filter(workflow_instance=instance).order_by('-performed_at')
        serializer = StateLogSerializer(logs, many=True)
        return Response(serializer.data)

class UserListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request):
        queryset = User.objects.all().select_related('role', 'department')
        role = request.query_params.get('role')
        if role:
            # Normalize: allow underscores or spaces in role parameter
            normalized_role = role.replace('_', ' ').strip()
            queryset = queryset.filter(role__name__iexact=normalized_role)
        serializer = UserListSerializer(queryset, many=True)
        return Response(serializer.data)
