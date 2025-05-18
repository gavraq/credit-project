from rest_framework import permissions
from backend.users.models import Role, Permission

class RolePermission(permissions.BasePermission):
    """
    Custom permission to check user's role and permissions.
    Usage: Attach to any DRF view or viewset for role-based access control.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Superusers always allowed
        if user.is_superuser:
            return True
        # Check for custom attribute on view: required_role or required_permission
        required_role = getattr(view, 'required_role', None)
        required_permission = getattr(view, 'required_permission', None)
        if required_role:
            if not user.role or user.role.name != required_role:
                return False
        if required_permission:
            # Check Permission model for match
            if not user.role:
                return False
            perms = Permission.objects.filter(role=user.role, name=required_permission)
            if not perms.exists():
                return False
        return True

    def has_object_permission(self, request, view, obj):
        # For object-level checks, can extend as needed
        return self.has_permission(request, view)
