#!/usr/bin/env python3
import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditApplication, BusinessSponsorshipForm
from workflow_engine.utils import get_relevant_sub_processes_for_state

def debug_business_sponsorship():
    print("="*60)
    print("DEBUGGING BUSINESS SPONSORSHIP FORM VISIBILITY")
    print("="*60)
    
    # Find the application from the screenshot
    app = CreditApplication.objects.filter(reference_number='CR-2025-0010').first()
    
    if not app:
        print("❌ Application CR-2025-0010 not found")
        return
    
    print(f"📋 Application: {app.reference_number}")
    print(f"   Main Workflow State: {app.workflow_instance.current_state.code if app.workflow_instance else 'No workflow'}")
    print(f"   Main Workflow Name: {app.workflow_instance.current_state.name if app.workflow_instance else 'No workflow'}")
    
    # Check Credit Review Form state
    if hasattr(app, 'credit_review_form'):
        review_form = app.credit_review_form
        print(f"\n📋 Credit Review Form:")
        print(f"   Exists: Yes")
        print(f"   Workflow State: {review_form.workflow_instance.current_state.code if review_form.workflow_instance else 'No workflow'}")
        print(f"   State Name: {review_form.workflow_instance.current_state.name if review_form.workflow_instance else 'No workflow'}")
    else:
        print(f"\n📋 Credit Review Form: Does not exist")
    
    # Check Business Sponsorship Form
    if hasattr(app, 'business_sponsorship_form'):
        bs_form = app.business_sponsorship_form
        print(f"\n📋 Business Sponsorship Form:")
        print(f"   Exists: Yes")
        print(f"   ID: {bs_form.id}")
        print(f"   Workflow State: {bs_form.workflow_instance.current_state.code if bs_form.workflow_instance else 'No workflow'}")
    else:
        print(f"\n📋 Business Sponsorship Form:")
        print(f"   Exists: No")
        print("   ❌ This is why it's not showing on the hub page!")
    
    # Check what forms should be available for current state
    current_state = app.workflow_instance.current_state.code if app.workflow_instance else None
    if current_state:
        relevant_forms = get_relevant_sub_processes_for_state(current_state)
        print(f"\n📋 FORMS THAT SHOULD BE AVAILABLE FOR STATE '{current_state}':")
        print("-" * 40)
        for form_name in relevant_forms:
            print(f"  - {form_name}")
        
        if 'business_sponsorship_form' in relevant_forms:
            print(f"\n✅ Business Sponsorship Form SHOULD be available")
            print("❌ But it doesn't exist - auto-initialization failed")
        else:
            print(f"\n❌ Business Sponsorship Form is NOT expected for this state")
            print("The main workflow might not have transitioned correctly")
    
    print(f"\n📋 NEXT STEPS:")
    print("-" * 40)
    print("1. Check if main workflow transitioned correctly")
    print("2. If yes, run auto-initialization for missing forms")
    print("3. If no, check why parent workflow didn't transition")

if __name__ == '__main__':
    debug_business_sponsorship()