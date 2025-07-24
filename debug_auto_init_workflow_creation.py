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

from credit_applications.models import CreditApplication, CreditReviewForm
from workflow_engine.models import Workflow, State
from workflow_engine.utils import auto_initialize_forms_for_state

def debug_auto_init():
    print("="*70)
    print("DEBUGGING AUTO-INITIALIZATION WORKFLOW INSTANCE CREATION")
    print("="*70)
    
    try:
        # Test with CR-2025-0008
        app = CreditApplication.objects.get(reference_number='CR-2025-0008')
        review_form = CreditReviewForm.objects.get(credit_application=app)
        
        print(f"📋 Testing with: {app.reference_number}")
        print(f"   Credit Review Form: {review_form.id}")
        print(f"   Has workflow instance: {review_form.workflow_instance is not None}")
        
        # Test the auto-initialization function step by step
        print(f"\\n🧪 TESTING AUTO-INITIALIZATION MANUALLY")
        print("-" * 50)
        
        # Step 1: Check if CREDIT_REVIEW workflow exists
        try:
            credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            print(f"✅ CREDIT_REVIEW workflow exists: {credit_review_workflow.name}")
            
            # Step 2: Check if it has an initial state
            initial_state = State.objects.filter(workflow=credit_review_workflow, is_initial=True).first()
            if initial_state:
                print(f"✅ Initial state exists: {initial_state.name} ({initial_state.code})")
            else:
                print(f"❌ No initial state in CREDIT_REVIEW workflow")
                return
                
        except Workflow.DoesNotExist:
            print(f"❌ CREDIT_REVIEW workflow does not exist")
            return
        
        # Step 3: Test creating workflow instance manually
        print(f"\\n🔧 ATTEMPTING MANUAL WORKFLOW INSTANCE CREATION")
        print("-" * 50)
        
        if not review_form.workflow_instance:
            try:
                from django.contrib.contenttypes.models import ContentType
                from workflow_engine.models import WorkflowInstance
                
                # Create workflow instance manually
                workflow_instance = WorkflowInstance.objects.create(
                    workflow=credit_review_workflow,
                    current_state=initial_state,
                    content_type=ContentType.objects.get_for_model(review_form),
                    object_id=review_form.id
                )
                
                # Link it to the form
                review_form.workflow_instance = workflow_instance
                review_form.save(update_fields=['workflow_instance'])
                
                print(f"✅ Manually created workflow instance: {workflow_instance.id}")
                print(f"✅ Linked to form: {review_form.id}")
                
                # Test transitions
                from workflow_engine.models import Transition
                transitions = Transition.objects.filter(
                    workflow=credit_review_workflow,
                    from_state=initial_state
                )
                print(f"✅ Available transitions: {transitions.count()}")
                for t in transitions:
                    print(f"   - {t.code}: {t.name}")
                
            except Exception as e:
                print(f"❌ Error creating workflow instance manually: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"ℹ️  Form already has workflow instance")
        
        # Step 4: Test auto-initialization function
        print(f"\\n🧪 TESTING AUTO_INITIALIZE_FORMS_FOR_STATE FUNCTION")
        print("-" * 50)
        
        try:
            # Call the function to see what happens
            initialized_forms = auto_initialize_forms_for_state(
                app, 
                state_code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            
            print(f"Function returned: {list(initialized_forms.keys())}")
            
            if 'credit_review_form' in initialized_forms:
                form_instance = initialized_forms['credit_review_form']
                print(f"Credit Review Form: {form_instance.id}")
                print(f"Has workflow instance: {form_instance.workflow_instance is not None}")
                if form_instance.workflow_instance:
                    print(f"Workflow instance: {form_instance.workflow_instance.id}")
                    print(f"Current state: {form_instance.workflow_instance.current_state.name}")
            else:
                print(f"❌ credit_review_form not returned by function")
                
        except Exception as e:
            print(f"❌ Error in auto_initialize_forms_for_state: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\\n" + "="*70)

if __name__ == '__main__':
    debug_auto_init()