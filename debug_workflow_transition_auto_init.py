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
from workflow_engine.models import WorkflowInstance, State
from django.contrib.contenttypes.models import ContentType

def debug_transition_auto_init():
    print("="*70)
    print("DEBUGGING WHY AUTO-INITIALIZATION FAILS FOR NEW FORMS")
    print("="*70)
    
    try:
        # Check CR-2025-0009
        app = CreditApplication.objects.get(reference_number='CR-2025-0009')
        print(f"📋 Application: {app.reference_number}")
        print(f"   Current state: {app.workflow_instance.current_state.name if app.workflow_instance else 'No workflow'}")
        print(f"   State code: {app.workflow_instance.current_state.code if app.workflow_instance else 'N/A'}")
        
        # Check Credit Review Form
        review_form = CreditReviewForm.objects.filter(credit_application=app).first()
        if review_form:
            print(f"✅ Credit Review Form exists: {review_form.id}")
            print(f"❌ Workflow instance: {review_form.workflow_instance}")
        else:
            print(f"❌ No Credit Review Form found")
            return
        
        # Check when the form was created vs when transitions happen
        print(f"\\n🕐 TIMING ANALYSIS")
        print("-" * 40)
        print(f"App created: {app.created_at}")
        print(f"Form created: {review_form.form_started_at}")
        print(f"App updated: {app.updated_at}")
        
        # Check if WorkflowInstanceTransitionView is being called properly
        print(f"\\n🔍 CHECKING WORKFLOW TRANSITION INTEGRATION")
        print("-" * 40)
        
        # Let's check the WorkflowInstanceTransitionView code
        from backend.users.views import WorkflowInstanceTransitionView
        import inspect
        
        # Get the source code
        source_lines = inspect.getsource(WorkflowInstanceTransitionView.post).split('\\n')
        
        # Look for auto-initialization calls
        auto_init_found = False
        for i, line in enumerate(source_lines):
            if 'auto_initialize_forms_for_state' in line:
                auto_init_found = True
                print(f"✅ Found auto-initialization call at line {i+1}")
                print(f"   Code: {line.strip()}")
                break
        
        if not auto_init_found:
            print(f"❌ auto_initialize_forms_for_state not found in WorkflowInstanceTransitionView")
            print(f"   This might be why new forms don't get workflow instances")
        
        # Test the auto-initialization manually
        print(f"\\n🧪 MANUAL AUTO-INITIALIZATION TEST")
        print("-" * 40)
        
        if not review_form.workflow_instance:
            try:
                from workflow_engine.utils import auto_initialize_forms_for_state
                
                print(f"Testing auto_initialize_forms_for_state with:")
                print(f"  - Application: {app.reference_number}")
                print(f"  - State: {app.workflow_instance.current_state.code}")
                
                initialized_forms = auto_initialize_forms_for_state(
                    app, 
                    state_code=app.workflow_instance.current_state.code
                )
                
                print(f"\\nFunction returned: {list(initialized_forms.keys())}")
                
                if 'credit_review_form' in initialized_forms:
                    form_instance = initialized_forms['credit_review_form']
                    print(f"✅ Credit Review Form: {form_instance.id}")
                    print(f"✅ Has workflow instance: {form_instance.workflow_instance is not None}")
                    
                    if form_instance.workflow_instance:
                        print(f"✅ Workflow instance: {form_instance.workflow_instance.id}")
                        print(f"✅ Current state: {form_instance.workflow_instance.current_state.name}")
                    else:
                        print(f"❌ Workflow instance creation failed in auto-initialization")
                        
                        # Let's try to create it manually to see what fails
                        print(f"\\n🔧 TRYING MANUAL WORKFLOW INSTANCE CREATION")
                        print("-" * 40)
                        
                        from workflow_engine.models import Workflow
                        
                        try:
                            credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
                            initial_state = State.objects.get(workflow=credit_review_workflow, is_initial=True)
                            
                            workflow_instance = WorkflowInstance.objects.create(
                                workflow=credit_review_workflow,
                                current_state=initial_state,
                                content_type=ContentType.objects.get_for_model(form_instance),
                                object_id=form_instance.id
                            )
                            
                            form_instance.workflow_instance = workflow_instance
                            form_instance.save(update_fields=['workflow_instance'])
                            
                            print(f"✅ Manually created workflow instance: {workflow_instance.id}")
                            
                        except Exception as manual_e:
                            print(f"❌ Manual creation also failed: {manual_e}")
                            import traceback
                            traceback.print_exc()
                
            except Exception as e:
                print(f"❌ Auto-initialization failed: {e}")
                import traceback
                traceback.print_exc()
        
        # Check if there are any error logs we should look at
        print(f"\\n📋 RECOMMENDATIONS")
        print("-" * 40)
        print("1. Check if WorkflowInstanceTransitionView is calling auto_initialize_forms_for_state")
        print("2. Check server logs during transition for any errors")
        print("3. Verify the transition is actually calling the auto-initialization")
        print("4. Consider running fix_missing_workflow_instances after each transition")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\\n" + "="*70)

if __name__ == '__main__':
    debug_transition_auto_init()