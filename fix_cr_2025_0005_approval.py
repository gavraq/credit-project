#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/gavinslater/projects/credit-project')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditApplication
from django.contrib.auth import get_user_model

User = get_user_model()

def fix_cr_2025_0005_approval():
    """
    Manually trigger the parent workflow transition for CR-2025-0005
    since the Credit Approval Form was already submitted but the system action failed.
    """
    try:
        # Find the application
        app = CreditApplication.objects.get(reference_number='CR-2025-0005')
        print(f"Found application: {app.reference_number} (ID: {app.id})")
        
        # Check current parent workflow state
        parent_workflow = app.workflow_instance
        if not parent_workflow:
            print("❌ No parent workflow instance found")
            return
            
        print(f"Current parent workflow state: {parent_workflow.current_state.code}")
        
        # Check if Credit Approval Form exists and get the decision
        if hasattr(app, 'credit_approval_form') and app.credit_approval_form:
            approval_form = app.credit_approval_form
            print(f"Found Credit Approval Form (ID: {approval_form.id})")
            print(f"Approval Decision: {approval_form.approval_decision}")
            print(f"Approval Form Workflow State: {approval_form.workflow_instance.current_state.code if approval_form.workflow_instance else 'No workflow'}")
            
            # Determine which parent transition to trigger based on approval decision
            if approval_form.approval_decision in ['approved', 'approved_with_conditions']:
                parent_transition_code = 'PP_TR_8'  # Approve Credit Paper
                auto_comment = f"Manual fix: Auto-approved after approval decision: {approval_form.approval_decision}"
            elif approval_form.approval_decision == 'rejected':
                parent_transition_code = 'PP_TR_9'  # Reject Credit Paper  
                auto_comment = f"Manual fix: Auto-rejected after approval decision: {approval_form.approval_decision}"
            else:
                print(f"❌ Unhandled approval decision '{approval_form.approval_decision}'. Cannot determine transition.")
                return
                
            # Get system user
            system_user = User.objects.filter(username='system').first()
            if not system_user:
                print("❌ System user not found. Cannot perform transition.")
                return
                
            # Check if parent workflow is in correct state
            if parent_workflow.current_state.code != 'CREDIT_PAPER_APPROVAL_PENDING':
                print(f"❌ Parent workflow is not in CREDIT_PAPER_APPROVAL_PENDING state (current: {parent_workflow.current_state.code})")
                return
                
            # Perform the transition
            print(f"🔄 Performing transition {parent_transition_code} on parent workflow...")
            parent_workflow.perform_transition(
                transition_code=parent_transition_code,
                user=system_user,
                comments=auto_comment
            )
            
            print(f"✅ Successfully transitioned parent workflow to: {parent_workflow.current_state.code}")
            
        else:
            print("❌ No Credit Approval Form found for this application")
            
    except CreditApplication.DoesNotExist:
        print("❌ Application CR-2025-0005 not found")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_cr_2025_0005_approval()