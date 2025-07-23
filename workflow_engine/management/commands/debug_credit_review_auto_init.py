from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, WorkflowInstance
from credit_applications.models import CreditApplication, CreditReviewForm
from workflow_engine.utils import auto_initialize_forms_for_state, get_relevant_sub_processes_for_state, get_dynamic_form_model_map
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Debug specific credit review auto-initialization issue'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("DEBUGGING CREDIT REVIEW AUTO-INITIALIZATION")
        self.stdout.write("="*60)
        
        # 1. Test the utility functions directly
        self.stdout.write("\n🧪 TESTING UTILITY FUNCTIONS")
        self.stdout.write("-" * 40)
        
        try:
            # Test get_relevant_sub_processes_for_state
            relevant_forms = get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING')
            self.stdout.write(f"✅ get_relevant_sub_processes_for_state:")
            self.stdout.write(f"   Input: 'CREDIT_PAPER_CREDIT_REVIEW_PENDING'")
            self.stdout.write(f"   Output: {relevant_forms}")
            
            if 'credit_review_form' in relevant_forms:
                self.stdout.write("   ✅ credit_review_form is included")
            else:
                self.stdout.write("   ❌ credit_review_form is NOT included")
                return
        except Exception as e:
            self.stdout.write(f"❌ Error in get_relevant_sub_processes_for_state: {e}")
            return
        
        try:
            # Test get_dynamic_form_model_map
            form_model_map = get_dynamic_form_model_map()
            self.stdout.write(f"\\n✅ get_dynamic_form_model_map:")
            self.stdout.write(f"   Found {len(form_model_map)} forms")
            
            if 'credit_review_form' in form_model_map:
                model_class = form_model_map['credit_review_form']
                self.stdout.write(f"   ✅ credit_review_form → {model_class.__name__}")
            else:
                self.stdout.write(f"   ❌ credit_review_form not found")
                self.stdout.write(f"   Available: {list(form_model_map.keys())}")
                return
        except Exception as e:
            self.stdout.write(f"❌ Error in get_dynamic_form_model_map: {e}")
            return
        
        # 2. Find a test application
        self.stdout.write("\n🔍 FINDING TEST APPLICATION")
        self.stdout.write("-" * 40)
        
        try:
            # Find an application in CREDIT_REVIEW_PENDING state
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            review_state = State.objects.get(workflow=parent_workflow, code='CREDIT_PAPER_CREDIT_REVIEW_PENDING')
            
            workflow_instances = WorkflowInstance.objects.filter(
                current_state=review_state,
                content_type=ContentType.objects.get_for_model(CreditApplication)
            )
            
            if workflow_instances.exists():
                test_app = workflow_instances.first().content_object
                self.stdout.write(f"✅ Found test app: {test_app.reference_number}")
            else:
                # Use any application as test
                test_app = CreditApplication.objects.first()
                if test_app:
                    self.stdout.write(f"⚠️  Using any app for test: {test_app.reference_number}")
                    self.stdout.write(f"   Current state: {test_app.workflow_instance.current_state.name if test_app.workflow_instance else 'None'}")
                else:
                    self.stdout.write("❌ No applications found to test")
                    return
        except Exception as e:
            self.stdout.write(f"❌ Error finding test application: {e}")
            return
        
        # 3. Check current Credit Review Form state
        self.stdout.write("\n📋 CHECKING CURRENT CREDIT REVIEW FORM STATE")
        self.stdout.write("-" * 40)
        
        existing_review_form = CreditReviewForm.objects.filter(credit_application=test_app).first()
        if existing_review_form:
            self.stdout.write(f"✅ Credit Review Form exists: ID {existing_review_form.id}")
            if existing_review_form.workflow_instance:
                self.stdout.write(f"✅ Has workflow instance: {existing_review_form.workflow_instance.id}")
                self.stdout.write(f"   Current state: {existing_review_form.workflow_instance.current_state.name}")
            else:
                self.stdout.write("❌ No workflow instance")
        else:
            self.stdout.write("ℹ️  No Credit Review Form exists")
        
        # 4. Test auto-initialization step by step
        self.stdout.write("\n🧪 TESTING AUTO-INITIALIZATION STEP BY STEP")
        self.stdout.write("-" * 40)
        
        try:
            self.stdout.write("Step 1: Calling auto_initialize_forms_for_state...")
            
            # Call the function with debugging
            initialized_forms = auto_initialize_forms_for_state(
                test_app, 
                state_code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            
            self.stdout.write(f"Step 2: Function returned: {list(initialized_forms.keys())}")
            
            if 'credit_review_form' in initialized_forms:
                form_instance = initialized_forms['credit_review_form']
                self.stdout.write(f"Step 3: Credit Review Form instance: ID {form_instance.id}")
                
                # Check if it has a workflow instance
                if form_instance.workflow_instance:
                    self.stdout.write(f"Step 4: ✅ Workflow instance created: {form_instance.workflow_instance.id}")
                    self.stdout.write(f"         Current state: {form_instance.workflow_instance.current_state.name}")
                    self.stdout.write(f"         Workflow: {form_instance.workflow_instance.workflow.name}")
                else:
                    self.stdout.write("Step 4: ❌ No workflow instance created")
                    
                    # Check what went wrong
                    try:
                        credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
                        initial_state = State.objects.get(workflow=credit_review_workflow, is_initial=True)
                        self.stdout.write(f"         CREDIT_REVIEW workflow exists: {credit_review_workflow.name}")
                        self.stdout.write(f"         Initial state exists: {initial_state.name}")
                    except Exception as sub_e:
                        self.stdout.write(f"         Issue with CREDIT_REVIEW workflow: {sub_e}")
            else:
                self.stdout.write("Step 3: ❌ credit_review_form not in initialized forms")
                
        except Exception as e:
            self.stdout.write(f"❌ Auto-initialization failed: {e}")
            import traceback
            self.stdout.write("Full traceback:")
            self.stdout.write(traceback.format_exc())
        
        # 5. Summary
        self.stdout.write("\n📊 SUMMARY")
        self.stdout.write("-" * 40)
        
        self.stdout.write("Based on the audit, the parent workflow metadata is correct.")
        self.stdout.write("If auto-initialization is still failing, the issue is likely:")
        self.stdout.write("1. In the auto_initialize_forms_for_state function implementation")
        self.stdout.write("2. In the WorkflowInstanceTransitionView not calling it properly")
        self.stdout.write("3. In the dynamic form model creation process")
        
        self.stdout.write("\n" + "="*60)