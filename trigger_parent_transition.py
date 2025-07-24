#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditApplication
from workflow_engine.actions import handle_submit_credit_analysis
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 80)
print("TRIGGERING PARENT WORKFLOW TRANSITION")
print("=" * 80)

# Get the specific application
app_id = "16526fa2-ff6d-4383-b92b-4780fb46ea46"
try:
    credit_app = CreditApplication.objects.get(id=app_id)
    print(f"\nCredit Application: {credit_app.title} (ID: {credit_app.id})")
    
    # Check current parent state
    if credit_app.workflow_instance:
        parent_wf = credit_app.workflow_instance
        print(f"Current Parent State: {parent_wf.current_state.name} (code: {parent_wf.current_state.code})")
        
        # Get any user to perform the action (we'll use a credit analyst)
        user = User.objects.filter(username='stonec').first()  # Credit Analyst from debug output
        if not user:
            user = User.objects.first()  # Fallback to any user
        
        print(f"Using user: {user.username}")
        
        # Get one of the analysis form workflow instances to simulate the trigger
        # We'll use the Credit Analysis form since it was the last submitted
        ca_form = credit_app.credit_analysis_form
        if ca_form and ca_form.workflow_instance:
            print(f"Using Credit Analysis workflow instance: {ca_form.workflow_instance.id}")
            
            # Create a mock transition object (we just need it for the function signature)
            class MockTransition:
                def __init__(self):
                    self.code = 'CA_TR_4'
                    self.name = 'Submit'
            
            mock_transition = MockTransition()
            
            print(f"\nTriggering submit_credit_analysis system action...")
            
            # Call the system action
            handle_submit_credit_analysis(ca_form.workflow_instance, user, mock_transition)
            
            # Check if parent state changed
            parent_wf.refresh_from_db()
            print(f"New Parent State: {parent_wf.current_state.name} (code: {parent_wf.current_state.code})")
            
            if parent_wf.current_state.code == 'CREDIT_PAPER_COMPILATION':
                print("✅ SUCCESS: Parent workflow transitioned to Compilation!")
            else:
                print("❌ Parent workflow did not transition as expected")
        else:
            print("❌ Credit Analysis form or workflow instance not found")
    else:
        print("❌ No parent workflow instance found")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()