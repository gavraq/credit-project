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

from credit_applications.models import CreditApplication
from workflow_engine.utils import auto_initialize_forms_for_state

def test_fixed_auto_init():
    print("="*60)
    print("TESTING FIXED AUTO-INITIALIZATION")
    print("="*60)
    
    try:
        # Test with CR-2025-0009
        app = CreditApplication.objects.get(reference_number='CR-2025-0009')
        print(f"📋 Testing with: {app.reference_number}")
        print(f"   Current state: {app.workflow_instance.current_state.code}")
        
        # Delete the workflow instance from credit review form to test creation
        review_form = app.credit_review_form
        if review_form and review_form.workflow_instance:
            print(f"   Temporarily removing workflow instance for testing...")
            review_form.workflow_instance = None
            review_form.save(update_fields=['workflow_instance'])
        
        # Test auto-initialization
        print(f"\\n🧪 TESTING AUTO-INITIALIZATION WITH FIX")
        print("-" * 40)
        
        initialized_forms = auto_initialize_forms_for_state(
            app, 
            state_code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
        )
        
        print(f"Function returned: {list(initialized_forms.keys())}")
        
        if 'credit_review_form' in initialized_forms:
            form_instance = initialized_forms['credit_review_form']
            print(f"✅ Credit Review Form: {form_instance.id}")
            print(f"✅ Has workflow instance: {form_instance.workflow_instance is not None}")
            
            if form_instance.workflow_instance:
                print(f"✅ Workflow instance: {form_instance.workflow_instance.id}")
                print(f"✅ Workflow: {form_instance.workflow_instance.workflow.code}")
                print(f"✅ Current state: {form_instance.workflow_instance.current_state.name}")
                print(f"\\n🎉 AUTO-INITIALIZATION NOW WORKING!")
            else:
                print(f"❌ Still no workflow instance created")
        else:
            print(f"❌ credit_review_form not returned")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\\n" + "="*60)

if __name__ == '__main__':
    test_fixed_auto_init()