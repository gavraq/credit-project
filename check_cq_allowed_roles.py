#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition
from credit_applications.models import CreditApplication
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 80)
print("CHECKING CREDIT QUESTIONNAIRE TRANSITION ALLOWED_ROLES")
print("=" * 80)

# Get the Credit Questionnaire workflow
cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')

# Get all transitions
transitions = Transition.objects.filter(workflow=cq_workflow).order_by('from_state__name', 'name')

print(f"\nCredit Questionnaire Transitions:")
for t in transitions:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  From: {t.from_state.name} -> To: {t.to_state.name}")
    print(f"  allowed_roles field value: {t.allowed_roles}")
    print(f"  Type: {type(t.allowed_roles)}")
    print(f"  Is None: {t.allowed_roles is None}")
    print(f"  Is empty list: {t.allowed_roles == []}")
    print(f"  Boolean evaluation: {bool(t.allowed_roles)}")

# Compare with Business Sponsorship
print("\n" + "=" * 50)
print("COMPARING WITH BUSINESS SPONSORSHIP")
print("=" * 50)

bs_workflow = Workflow.objects.get(code='BUSINESS_SPONSORSHIP')
bs_transitions = Transition.objects.filter(
    workflow=bs_workflow,
    from_state__code='BUSINESS_SPONSORSHIP_IN_PROGRESS'
).order_by('name')

print(f"\nBusiness Sponsorship 'In Progress' Transitions:")
for t in bs_transitions:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  allowed_roles: {t.allowed_roles}")
    print(f"  Type: {type(t.allowed_roles)}")

# Test the logic manually
print("\n" + "=" * 50)
print("TESTING TRANSITION LOGIC")
print("=" * 50)

# Get a relationship manager user
rm_user = User.objects.filter(username='houserm').first()
if rm_user:
    print(f"\nUser: {rm_user.username}")
    print(f"Role: {rm_user.role.name if hasattr(rm_user, 'role') and rm_user.role else 'No role'}")
    
    # Get In Progress state
    in_progress_state = State.objects.get(workflow=cq_workflow, code='CREDIT_QUESTIONNAIRE_IN_PROGRESS')
    
    # Get transitions from In Progress
    from_in_progress = Transition.objects.filter(workflow=cq_workflow, from_state=in_progress_state)
    
    for t in from_in_progress:
        print(f"\nChecking transition: {t.name}")
        print(f"  allowed_roles: {t.allowed_roles}")
        
        # Simulate the check
        role_permits = False
        user_role_name = getattr(rm_user.role, "name", None) if hasattr(rm_user, 'role') else None
        
        if not t.allowed_roles:
            role_permits = True
            print(f"  Role check: PASS (no role restrictions)")
        elif user_role_name:
            allowed_roles_norm = [r.strip().lower().replace(" ", "_") for r in t.allowed_roles]
            user_role_norm = user_role_name.strip().lower().replace(" ", "_")
            print(f"  Normalized allowed roles: {allowed_roles_norm}")
            print(f"  Normalized user role: {user_role_norm}")
            if user_role_norm in allowed_roles_norm:
                role_permits = True
                print(f"  Role check: PASS (user role matches)")
            else:
                print(f"  Role check: FAIL (user role not in allowed roles)")
        else:
            print(f"  Role check: FAIL (user has no role)")
            
        print(f"  Final result: {'ALLOWED' if role_permits else 'NOT ALLOWED'}")