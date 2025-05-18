from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Department, Role, Permission, User

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'can_view_all_applications', 'can_approve_applications')
    search_fields = ('name',)

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'resource_type', 'action')
    search_fields = ('name', 'resource_type', 'action')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('department', 'role', 'employee_id', 'phone_number', 'da_level')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'department', 'role', 'employee_id', 'phone_number', 'da_level'),
        }),
    )
    list_display = BaseUserAdmin.list_display + ('department', 'role', 'employee_id', 'phone_number')
    search_fields = BaseUserAdmin.search_fields + ('employee_id',)
