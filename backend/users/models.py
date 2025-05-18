import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    can_view_all_applications = models.BooleanField(default=False)
    can_view_department_applications = models.BooleanField(default=False)
    can_approve_applications = models.BooleanField(default=False)
    can_reject_applications = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_export_data = models.BooleanField(default=False)
    visible_fields = models.JSONField(default=dict, blank=True)
    available_dropdown_options = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=100)
    action = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.resource_type}: {self.action}"

class User(AbstractUser):
    DA_LEVEL_CHOICES = [
        (f"DA{i}", f"DA{i}") for i in range(1, 9)
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    role = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    employee_id = models.CharField(max_length=50, blank=True, unique=True)
    phone_number = models.CharField(max_length=30, blank=True)
    da_level = models.CharField(
        max_length=4,
        choices=DA_LEVEL_CHOICES,
        blank=True,
        null=True,
        help_text="Delegated Authority level (DA1–DA8), only for Credit Approvers."
    )
    # username, email, password, first_name, last_name inherited from AbstractUser

    def __str__(self):
        return self.username
