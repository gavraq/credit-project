#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition, WorkflowInstance
from credit_applications.models import CreditApplication, CreditQuestionnaireForm
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 80)
print("CHECKING CREDIT QUESTIONNAIRE PERMISSIONS")
print("=" * 80)

# Get the workflow
cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')
print(f"\nWorkflow: {cq_workflow.name}")
print(f"Metadata: {cq_workflow.metadata}")

# Check form metadata
if 'forms' in cq_workflow.metadata:
    for form in cq_workflow.metadata['forms']:
        if form.get('form_key') == 'credit_questionnaire_form':
            print(f"\nCredit Questionnaire Form metadata:")
            print(f"  Editable by roles: {form.get('editable_by_roles', [])}")
            print(f"  Viewable by roles: {form.get('viewable_by_roles', [])}")

# Check each transition's permissions
print("\n" + "=" * 50)
print("TRANSITION PERMISSIONS")
print("=" * 50)

transitions = Transition.objects.filter(from_state__workflow=cq_workflow).order_by('from_state__name', 'name')
for t in transitions:
    print(f"\nTransition: {t.name} (code: {t.code})")
    print(f"  From: {t.from_state.name} -> To: {t.to_state.name}")
    
    # Check direct role associations
    if hasattr(t, 'roles'):
        roles = list(t.roles.values_list('name', flat=True))
        print(f"  Direct roles: {roles if roles else 'None (should be available to all)'}")
    
    # Check metadata for role restrictions
    if hasattr(t, 'metadata') and t.metadata:
        print(f"  Metadata: {t.metadata}")
        if 'allowed_roles' in t.metadata:
            print(f"  Metadata allowed_roles: {t.metadata['allowed_roles']}")
        if 'permissions' in t.metadata:
            print(f"  Metadata permissions: {t.metadata['permissions']}")

# Check get_allowed_transitions logic
print("\n" + "=" * 50)
print("TESTING get_allowed_transitions LOGIC")
print("=" * 50)

# Get the latest CQ form instance
latest_app = CreditApplication.objects.order_by('-created_at').first()
if latest_app and hasattr(latest_app, 'credit_questionnaire_form'):
    cq_form = latest_app.credit_questionnaire_form
    if cq_form.workflow_instance:
        wf_instance = cq_form.workflow_instance
        
        # Test with relationship manager
        from workflow_engine.models import Role
        rm_role = Role.objects.filter(code='relationship_manager').first()
        rm_user = User.objects.filter(role=rm_role).first() if rm_role else None
        if rm_user:
            print(f"\nTesting with Relationship Manager: {rm_user.username}")
            print(f"Current state: {wf_instance.current_state.name}")
            
            # Check if user owns the form
            print(f"Created by: {latest_app.created_by.username if latest_app.created_by else 'None'}")
            print(f"Relationship manager: {latest_app.relationship_manager.username if latest_app.relationship_manager else 'None'}")
            
            # Manual check of transition logic
            from_state_transitions = Transition.objects.filter(from_state=wf_instance.current_state)
            print(f"\nManual transition check for {rm_user.username}:")
            for t in from_state_transitions:
                print(f"  Checking: {t.name}")
                # Check if transition has role restrictions
                if hasattr(t, 'metadata') and t.metadata and 'allowed_roles' in t.metadata:
                    allowed_roles = t.metadata['allowed_roles']
                    user_role = rm_user.role.code if hasattr(rm_user, 'role') and rm_user.role else None
                    print(f"    Allowed roles: {allowed_roles}")
                    print(f"    User role: {user_role}")
                    print(f"    Match: {user_role in allowed_roles if user_role else False}")

# Compare with Business Sponsorship workflow
print("\n" + "=" * 50)
print("COMPARING WITH BUSINESS SPONSORSHIP WORKFLOW")
print("=" * 50)

bs_workflow = Workflow.objects.get(code='BUSINESS_SPONSORSHIP')
bs_transitions = Transition.objects.filter(
    from_state__workflow=bs_workflow,
    from_state__code='BUSINESS_SPONSORSHIP_IN_PROGRESS'
)

print(f"\nBusiness Sponsorship 'In Progress' transitions:")
for t in bs_transitions:
    print(f"  - {t.name} (code: {t.code})")
    if hasattr(t, 'metadata') and t.metadata:
        print(f"    Metadata: {t.metadata}")