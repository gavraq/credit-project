#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 80)
print("CHECKING CREDIT QUESTIONNAIRE WORKFLOW TRANSITIONS")
print("=" * 80)

try:
    # Check Credit Questionnaire workflow
    cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')
    print(f'\nWorkflow: {cq_workflow.name} (code: {cq_workflow.code})')
    
    # Get all states
    states = State.objects.filter(workflow=cq_workflow).order_by('name')
    print(f'\nStates ({len(states)}):')
    for state in states:
        print(f'  - {state.name} (code: {state.code}, initial: {state.is_initial})')
    
    # Get all transitions
    transitions = Transition.objects.filter(from_state__workflow=cq_workflow).order_by('from_state__name', 'name')
    print(f'\nTransitions ({len(transitions)}):')
    
    if not transitions:
        print("  ❌ NO TRANSITIONS FOUND - This is the problem!")
    else:
        for t in transitions:
            print(f'\n  From: {t.from_state.name} -> To: {t.to_state.name}')
            print(f'  Transition: {t.name} (code: {t.code})')
            # Check for roles - the field might be named differently
            if hasattr(t, 'roles') and t.roles.exists():
                roles = list(t.roles.values_list('name', flat=True))
                print(f'  Required roles: {roles}')
            elif hasattr(t, 'required_roles') and t.required_roles.exists():
                roles = list(t.required_roles.values_list('name', flat=True))
                print(f'  Required roles: {roles}')
            else:
                print('  Required roles: None (available to all)')
    
    # Check if other similar workflows have transitions
    print("\n" + "=" * 50)
    print("COMPARING WITH OTHER FORM WORKFLOWS")
    print("=" * 50)
    
    # Check Business Sponsorship workflow as comparison
    bs_workflow = Workflow.objects.get(code='BUSINESS_SPONSORSHIP')
    bs_transitions = Transition.objects.filter(from_state__workflow=bs_workflow)
    print(f'\nBusiness Sponsorship workflow has {len(bs_transitions)} transitions')
    
    # Check Credit Review workflow
    cr_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
    cr_transitions = Transition.objects.filter(from_state__workflow=cr_workflow)
    print(f'Credit Review workflow has {len(cr_transitions)} transitions')
    
    # If CQ has no transitions, show what transitions BS has as a template
    if not transitions and bs_transitions:
        print("\nBusiness Sponsorship transitions (as reference):")
        for t in bs_transitions.order_by('from_state__name', 'name'):
            print(f'  - {t.from_state.name} -> {t.to_state.name}: {t.name} (code: {t.code})')

except Workflow.DoesNotExist as e:
    print(f"❌ Error: Workflow not found - {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()