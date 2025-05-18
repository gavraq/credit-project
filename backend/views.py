from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from backend.permissions import RolePermission

class ProtectedHelloView(APIView):
    permission_classes = [IsAuthenticated, RolePermission]
    required_role = 'Credit Analyst'  # Example: only users with role 'Manager' can access

    def get(self, request):
        return Response({'message': f'Hello, {request.user.username}! You have access.'})
