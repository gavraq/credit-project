#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/gavinslater/projects/credit-project')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, Transition
from django.contrib.auth import get_user_model

User = get_user_model()

def check_pp_tr_8_permissions():
    """
    Check the permissions for PP_TR_8 transition and find a suitable user.
    """
    try:
        # Find the main workflow
        main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        print(f"Found main workflow: {main_workflow.name}")
        
        # Find PP_TR_8 transition
        pp_tr_8 = Transition.objects.get(workflow=main_workflow, code='PP_TR_8')
        print(f"Found transition: {pp_tr_8.name}")
        print(f"From: {pp_tr_8.from_state.code} -> To: {pp_tr_8.to_state.code}")
        print(f"Allowed roles: {pp_tr_8.allowed_roles}")
        
        # Check what users exist with those roles
        if pp_tr_8.allowed_roles:
            print(f"\nLooking for users with roles: {pp_tr_8.allowed_roles}")
            for role_identifier in pp_tr_8.allowed_roles:
                # Try different approaches to find users with this role
                try:
                    users_with_role_name = User.objects.filter(role__name=role_identifier)
                    print(f"Users with role name '{role_identifier}': {[u.username for u in users_with_role_name]}")
                except:
                    print(f"Could not query by role name '{role_identifier}'")
                
                try:
                    users_with_role_name_contains = User.objects.filter(role__name__icontains=role_identifier.replace('_', ' '))
                    print(f"Users with role name containing '{role_identifier}': {[u.username for u in users_with_role_name_contains]}")
                except:
                    print(f"Could not query by role name containing '{role_identifier}'")
        
        # Check system user
        system_user = User.objects.filter(username='system').first()
        if system_user:
            print(f"\nSystem user role: {system_user.role.name if system_user.role else 'No role'}")
        else:
            print(f"\nNo system user found")
            
        # Show all users and their roles
        print(f"\nAll users and their roles:")
        for user in User.objects.all():
            role_info = user.role.name if user.role else 'No role'
            print(f"  {user.username}: {role_info}")
            
        # Check if we need to add 'system' to allowed roles or create a Credit Approver user
        print(f"\nSuggested fixes:")
        print(f"1. Add 'system' to PP_TR_8 allowed_roles: {pp_tr_8.allowed_roles + ['system']}")
        print(f"2. Create a user with 'Credit Approver' role")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_pp_tr_8_permissions()