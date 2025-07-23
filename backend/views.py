from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.permissions import RolePermission
from django.db import connection
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """
    Health check endpoint for Docker container monitoring
    """
    permission_classes = []  # No authentication required for health checks
    
    def get(self, request):
        try:
            # Check database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return JsonResponse({
                'status': 'healthy',
                'database': 'connected',
                'timestamp': request.META.get('HTTP_DATE')
            })
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return JsonResponse({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }, status=503)

class ProtectedHelloView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    required_role = 'Credit Analyst'  # Example: only users with role 'Manager' can access

    def get(self, request):
        return Response({'message': f'Hello, {request.user.username}! You have access.'})
