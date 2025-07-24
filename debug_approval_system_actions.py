#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition

print("=" * 80)
print("DEBUGGING CREDIT APPROVAL SYSTEM ACTIONS")
print("=" * 80)

# Check Credit Approval workflow transitions
try:
    approval_workflow = Workflow.objects.get(code='CREDIT_APPROVAL')
    print(f"✅ Found Credit Approval workflow: {approval_workflow.name}")
except Workflow.DoesNotExist:
    print("❌ Credit Approval workflow not found")
    approval_workflow = None

if approval_workflow:
    print("\n📋 CREDIT APPROVAL WORKFLOW TRANSITIONS:")
    print("-" * 50)
    approval_transitions = Transition.objects.filter(workflow=approval_workflow)
    for transition in approval_transitions:
        print(f"🔄 {transition.code}: {transition.name}")
        print(f"   From: {transition.from_state.name if transition.from_state else 'Any'}")
        print(f"   To: {transition.to_state.name}")
        print(f"   System Action: {transition.system_action or 'None'}")
        if transition.metadata:
            print(f"   Metadata: {json.dumps(transition.metadata, indent=6)}")
        print()

# Check main workflow transitions that should be triggered by approval
main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
print(f"\n✅ Found Main workflow: {main_workflow.name}")

print("\n📋 MAIN WORKFLOW TRANSITIONS (looking for approval-triggered):")
print("-" * 50)
main_transitions = Transition.objects.filter(workflow=main_workflow)
for transition in main_transitions:
    if transition.system_action and 'approval' in transition.system_action.lower():
        print(f"🔄 {transition.code}: {transition.name}")
        print(f"   From: {transition.from_state.name if transition.from_state else 'Any'}")
        print(f"   To: {transition.to_state.name}")
        print(f"   System Action: {transition.system_action}")
        print(f"   Roles: {transition.allowed_roles}")
        print()

# Check if there are any transitions FROM the approval pending state
approval_pending_states = State.objects.filter(workflow=main_workflow, name__icontains='approval')
if approval_pending_states:
    for state in approval_pending_states:
        print(f"\n📋 TRANSITIONS FROM {state.name}:")
        print("-" * 50)
        transitions_from_approval = Transition.objects.filter(workflow=main_workflow, from_state=state)
        for transition in transitions_from_approval:
            print(f"🔄 {transition.code}: {transition.name}")
            print(f"   To: {transition.to_state.name}")
            print(f"   System Action: {transition.system_action or 'None'}")
            print(f"   Roles: {transition.allowed_roles}")
            print()
else:
    print("\n❌ No approval pending states found in main workflow")

# Check current main workflow state
print(f"\n📋 CURRENT MAIN WORKFLOW STATES:")
print("-" * 50)
all_main_states = State.objects.filter(workflow=main_workflow).order_by('name')
for state in all_main_states:
    print(f"📍 {state.code}: {state.name}")

print("\n=" * 80)
print("ANALYSIS & RECOMMENDATIONS")
print("=" * 80)
print("1. Check if Credit Approval workflow has a 'Submit' transition with system_action")
print("2. Check if main workflow has transition from 'Approval Pending' triggered by approval submission")
print("3. Verify system action exists in workflow_engine/actions.py")
print("4. Compare with analysis phase system actions that work correctly")