#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition

print("=" * 80)
print("FIXING CREDIT QUESTIONNAIRE TRANSITION ROLES")
print("=" * 80)

# Get the Credit Questionnaire workflow
cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')

# Get the transitions that need updating (from In Progress state)
in_progress_state = State.objects.get(workflow=cq_workflow, code='CREDIT_QUESTIONNAIRE_IN_PROGRESS')
transitions_to_update = Transition.objects.filter(workflow=cq_workflow, from_state=in_progress_state)

print(f"\nUpdating transitions from 'In Progress' state:")
for t in transitions_to_update:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  Current allowed_roles: {t.allowed_roles}")
    
    # Update to include both Credit Analyst and Relationship Manager
    t.allowed_roles = ['Credit Analyst', 'Relationship Manager']
    t.save()
    
    print(f"  Updated allowed_roles: {t.allowed_roles}")

print("\n✅ Transitions updated successfully!")

# Verify the changes
print("\n" + "=" * 50)
print("VERIFICATION")
print("=" * 50)

all_transitions = Transition.objects.filter(workflow=cq_workflow).order_by('from_state__name', 'name')
print(f"\nAll Credit Questionnaire transitions:")
for t in all_transitions:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  From: {t.from_state.name} -> To: {t.to_state.name}")
    print(f"  allowed_roles: {t.allowed_roles}")