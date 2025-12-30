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
print("DEBUGGING CREDIT QUESTIONNAIRE FORM TRANSITIONS")
print("=" * 80)

# Get a specific credit application ID from command line or use a default
import sys
if len(sys.argv) > 1:
    app_id = sys.argv[1]
else:
    # Get the most recent credit application
    latest_app = CreditApplication.objects.order_by('-created_at').first()
    if latest_app:
        app_id = str(latest_app.id)
        print(f"\nUsing latest application: {app_id}")
    else:
        print("No credit applications found")
        exit(1)

try:
    # Get the credit application and questionnaire form
    credit_app = CreditApplication.objects.get(id=app_id)
    print(f"\nCredit Application: {credit_app.title} (ID: {credit_app.id})")
    
    # Check if questionnaire form exists
    if hasattr(credit_app, 'credit_questionnaire_form'):
        cq_form = credit_app.credit_questionnaire_form
        print(f"Credit Questionnaire Form found (ID: {cq_form.id})")
        
        # Check workflow instance
        if hasattr(cq_form, 'workflow_instance') and cq_form.workflow_instance:
            wf_instance = cq_form.workflow_instance
            print(f"\nWorkflow Instance: {wf_instance.id}")
            print(f"Current State: {wf_instance.current_state.name} (code: {wf_instance.current_state.code})")
            
            # Get all users to test with
            users = User.objects.all()
            print(f"\nTesting transitions for all users ({len(users)}):")
            
            for user in users:
                print(f"\n  User: {user.username} (Role: {user.role.name if hasattr(user, 'role') and user.role else 'No role'})")
                
                # Try to get transitions using the workflow instance method
                try:
                    transitions = wf_instance.get_allowed_transitions(user)
                    if transitions:
                        print(f"    Available transitions ({len(transitions)}):")
                        for t in transitions:
                            print(f"      - {t.name} (code: {t.code}) -> {t.to_state.name}")
                    else:
                        print("    ❌ No transitions available")
                        
                        # Debug: Check all transitions from current state
                        all_transitions = Transition.objects.filter(from_state=wf_instance.current_state)
                        print(f"    All transitions from {wf_instance.current_state.name}: {len(all_transitions)}")
                        for t in all_transitions:
                            print(f"      - {t.name} -> {t.to_state.name}")
                            
                except Exception as e:
                    print(f"    ❌ Error getting transitions: {e}")
                    import traceback
                    traceback.print_exc()
        else:
            print("❌ No workflow instance found for Credit Questionnaire Form")
    else:
        print("❌ No Credit Questionnaire Form found for this application")
        
    # Additional debug: Check the transition codes
    print("\n" + "=" * 50)
    print("CHECKING TRANSITION CODES")
    print("=" * 50)
    
    # Get the In Progress state
    cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')
    in_progress_state = State.objects.get(workflow=cq_workflow, code='CREDIT_QUESTIONNAIRE_IN_PROGRESS')
    
    transitions_from_in_progress = Transition.objects.filter(from_state=in_progress_state)
    print(f"\nTransitions from 'In Progress' state:")
    for t in transitions_from_in_progress:
        print(f"  - {t.name} (code: {t.code}) -> {t.to_state.name}")
        print(f"    Metadata: {t.metadata if hasattr(t, 'metadata') else 'None'}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()