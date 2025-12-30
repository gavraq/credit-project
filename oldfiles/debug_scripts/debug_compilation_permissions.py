#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from credit_applications.models import CreditApplication

User = get_user_model()

print("=" * 80)
print("DEBUGGING CREDIT COMPILATION FORM PERMISSIONS")
print("=" * 80)

# Check if the user houserm (relationship manager) can edit the compilation form
app_id = "16526fa2-ff6d-4383-b92b-4780fb46ea46"
credit_app = CreditApplication.objects.get(id=app_id)

print(f"Credit Application: {credit_app.title}")

# Check all users and their roles
print("\n=== ALL USERS AND ROLES ===")
users = User.objects.all()
for user in users:
    role_name = user.role.name if hasattr(user, 'role') and user.role else 'No role'
    role_code = user.role.code if hasattr(user, 'role') and user.role else 'No code'
    print(f"  {user.username}: {role_name} (code: {role_code})")

# Check compilation form metadata permissions
print("\n=== COMPILATION FORM PERMISSIONS ===")
print("Editable by roles: ['credit_analyst', 'credit_compiler']")
print("Viewable by roles: ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']")

# Check if the compilation form exists
if hasattr(credit_app, 'credit_compilation_form'):
    comp_form = credit_app.credit_compilation_form
    print(f"\n✅ Credit Compilation Form exists (ID: {comp_form.id})")
    
    if comp_form.workflow_instance:
        print(f"✅ Workflow instance exists (ID: {comp_form.workflow_instance.id})")
        print(f"Current state: {comp_form.workflow_instance.current_state.name} (code: {comp_form.workflow_instance.current_state.code})")
    else:
        print("❌ No workflow instance found")
else:
    print("\n❌ Credit Compilation Form does not exist")

print("\n=== ISSUE ANALYSIS ===")
print("The user 'houserm' (Relationship Manager) can VIEW the form but cannot EDIT it.")
print("This might cause the form to load in read-only mode or fail to load properly.")
print("For testing purposes, try accessing with 'stonec' (Credit Analyst) who can edit the form.")