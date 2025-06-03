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
        print(f"Attempting to perform transition on workflow instance with ID: {pk}")
        print(f"Request data: {request.data}")
        
        try:
            instance = WorkflowInstance.objects.get(pk=pk)
            print(f"Found workflow instance: {instance}")
        except WorkflowInstance.DoesNotExist:
            print(f"Workflow instance with ID {pk} does not exist")
            return Response({"error": f"Workflow instance with ID {pk} does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = WorkflowTransitionSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        print(f"Validated data: {data}")
        
        try:
            instance.perform_transition(
                transition_code=data['transition_code'],
                user=request.user,
                comments=data.get('comments', ''),
                system_context=data.get('system_context', {})
            )
            print(f"Transition performed successfully")
            return Response({'detail': 'Transition performed successfully.'}, status=status.HTTP_200_OK)
        except (ValueError, PermissionError) as e:
            print(f"Error performing transition: {e}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error performing transition: {e}")
            import traceback
            traceback.print_exc()
            return Response({'detail': f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkflowInstanceLogListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]

    def get(self, request, pk):
        instance = get_object_or_404(WorkflowInstance, pk=pk)
        logs = StateLog.objects.filter(workflow_instance=instance).order_by('-created_at')
        serializer = StateLogSerializer(logs, many=True)
        return Response(serializer.data)

class WorkflowInstanceListView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    
    def get(self, request):
        # List all workflow instances
        instances = WorkflowInstance.objects.all().select_related('workflow_definition', 'current_state')
        data = [{
            'id': str(instance.id),
            'workflow_definition': instance.workflow_definition.code,
            'current_state': instance.current_state.code,
            'created_at': instance.created_at.isoformat() if instance.created_at else None
        } for instance in instances]
        return Response(data)

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

class WorkflowInstanceDetailView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    
    def get(self, request, pk):
        print(f"Attempting to fetch workflow instance with ID: {pk}")
        try:
            instance = WorkflowInstance.objects.get(pk=pk)
            print(f"Found workflow instance: {instance}")
            serializer = WorkflowInstanceSerializer(instance, context={'request': request})
            return Response(serializer.data)
        except WorkflowInstance.DoesNotExist:
            print(f"Workflow instance with ID {pk} does not exist")
            return Response({"error": f"Workflow instance with ID {pk} does not exist"}, status=status.HTTP_404_NOT_FOUND)
