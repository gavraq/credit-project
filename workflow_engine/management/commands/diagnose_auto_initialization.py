from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition, WorkflowInstance
from credit_applications.models import CreditApplication, CreditReviewForm
from workflow_engine.utils import auto_initialize_forms_for_state, get_relevant_sub_processes_for_state, get_dynamic_form_model_map
import json

class Command(BaseCommand):
    help = 'Diagnose auto-initialization issues for Credit Review Forms'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("AUTO-INITIALIZATION DIAGNOSTIC REPORT")
        self.stdout.write("="*80)
        
        # 1. Check CREDIT_PAPER workflow and state metadata
        self.stdout.write("\n1. CHECKING CREDIT_PAPER WORKFLOW")
        self.stdout.write("-" * 50)
        
        try:
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            self.stdout.write(f"✅ Found parent workflow: {parent_workflow.name}")
            
            # Check form metadata
            if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
                form_metadata = parent_workflow.metadata['form_metadata']
                self.stdout.write(f"✅ Form metadata exists with {len(form_metadata)} forms:")
                for form_name in form_metadata.keys():
                    self.stdout.write(f"   - {form_name}")
                    
                if 'credit_review_form' in form_metadata:
                    cr_meta = form_metadata['credit_review_form']
                    self.stdout.write(f"✅ credit_review_form metadata:")
                    self.stdout.write(f"   form_key: {cr_meta.get('form_key')}")
                    self.stdout.write(f"   workflow_code: {cr_meta.get('workflow_code')}")
                else:
                    self.stdout.write("❌ credit_review_form NOT found in form_metadata")
            else:
                self.stdout.write("❌ No form_metadata found in parent workflow")
                
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_PAPER workflow not found")
            return
        
        # 2. Check CREDIT_PAPER_CREDIT_REVIEW_PENDING state
        self.stdout.write("\n2. CHECKING CREDIT_REVIEW_PENDING STATE")
        self.stdout.write("-" * 50)
        
        try:
            credit_review_state = State.objects.get(
                workflow=parent_workflow,
                code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            self.stdout.write(f"✅ Found state: {credit_review_state.name}")
            
            if credit_review_state.metadata:
                self.stdout.write("✅ State has metadata:")
                self.stdout.write(json.dumps(credit_review_state.metadata, indent=2))
                
                if 'relevant_sub_processes' in credit_review_state.metadata:
                    sub_processes = credit_review_state.metadata['relevant_sub_processes']
                    self.stdout.write(f"✅ relevant_sub_processes: {sub_processes}")
                    
                    if 'credit_review_form' in sub_processes:
                        self.stdout.write("✅ credit_review_form is in relevant_sub_processes")
                    else:
                        self.stdout.write("❌ credit_review_form NOT in relevant_sub_processes")
                else:
                    self.stdout.write("❌ No relevant_sub_processes in state metadata")
            else:
                self.stdout.write("❌ State has no metadata")
                
        except State.DoesNotExist:
            self.stdout.write("❌ CREDIT_PAPER_CREDIT_REVIEW_PENDING state not found")
            self.stdout.write("Available states:")
            for state in State.objects.filter(workflow=parent_workflow):
                self.stdout.write(f"   - {state.code}: {state.name}")
            return
        
        # 3. Check CREDIT_REVIEW sub-workflow
        self.stdout.write("\n3. CHECKING CREDIT_REVIEW SUB-WORKFLOW")
        self.stdout.write("-" * 50)
        
        try:
            credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            self.stdout.write(f"✅ Found CREDIT_REVIEW workflow: {credit_review_workflow.name}")
            
            initial_state = State.objects.filter(workflow=credit_review_workflow, is_initial=True).first()
            if initial_state:
                self.stdout.write(f"✅ Initial state: {initial_state.name} ({initial_state.code})")
            else:
                self.stdout.write("❌ No initial state found in CREDIT_REVIEW workflow")
                
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_REVIEW workflow not found")
            self.stdout.write("Available workflows:")
            for wf in Workflow.objects.all():
                self.stdout.write(f"   - {wf.code}: {wf.name}")
        
        # 4. Test dynamic form mapping
        self.stdout.write("\n4. TESTING DYNAMIC FORM MAPPING")
        self.stdout.write("-" * 50)
        
        try:
            form_model_map = get_dynamic_form_model_map()
            self.stdout.write(f"✅ Dynamic form mapping generated: {len(form_model_map)} forms")
            
            if 'credit_review_form' in form_model_map:
                model_class = form_model_map['credit_review_form']
                self.stdout.write(f"✅ credit_review_form maps to: {model_class.__name__}")
            else:
                self.stdout.write("❌ credit_review_form not in dynamic form mapping")
                self.stdout.write(f"Available mappings: {list(form_model_map.keys())}")
                
        except Exception as e:
            self.stdout.write(f"❌ Error with dynamic form mapping: {e}")
        
        # 5. Test auto-initialization function directly
        self.stdout.write("\n5. TESTING AUTO-INITIALIZATION FUNCTION")
        self.stdout.write("-" * 50)
        
        # Find a credit application in CREDIT_REVIEW_PENDING state
        try:
            # Get applications in the credit review state
            review_state_apps = []
            for app in CreditApplication.objects.all():
                if (app.workflow_instance and 
                    app.workflow_instance.current_state.code == 'CREDIT_PAPER_CREDIT_REVIEW_PENDING'):
                    review_state_apps.append(app)
            
            if review_state_apps:
                test_app = review_state_apps[0]
                self.stdout.write(f"✅ Found test application: {test_app.reference_number}")
                
                # Test get_relevant_sub_processes_for_state function
                relevant_forms = get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING')
                self.stdout.write(f"✅ get_relevant_sub_processes_for_state returns: {relevant_forms}")
                
                # Check if credit review form exists
                existing_review_form = CreditReviewForm.objects.filter(credit_application=test_app).first()
                if existing_review_form:
                    self.stdout.write(f"✅ Credit Review Form exists: ID {existing_review_form.id}")
                    if existing_review_form.workflow_instance:
                        self.stdout.write(f"✅ Has workflow instance: {existing_review_form.workflow_instance.id}")
                        self.stdout.write(f"✅ Current state: {existing_review_form.workflow_instance.current_state.name}")
                    else:
                        self.stdout.write("❌ No workflow instance on existing form")
                else:
                    self.stdout.write("❌ No Credit Review Form exists for test application")
                
                # Test auto-initialization
                self.stdout.write("\\nTesting auto_initialize_forms_for_state...")
                try:
                    initialized_forms = auto_initialize_forms_for_state(
                        test_app, 
                        state_code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
                    )
                    self.stdout.write(f"✅ Auto-initialization returned: {list(initialized_forms.keys())}")
                    
                    if 'credit_review_form' in initialized_forms:
                        form_instance = initialized_forms['credit_review_form']
                        self.stdout.write(f"✅ Credit Review Form auto-initialized: ID {form_instance.id}")
                        if form_instance.workflow_instance:
                            self.stdout.write(f"✅ Workflow instance created: {form_instance.workflow_instance.id}")
                        else:
                            self.stdout.write("❌ No workflow instance on auto-initialized form")
                    else:
                        self.stdout.write("❌ credit_review_form not auto-initialized")
                        
                except Exception as e:
                    self.stdout.write(f"❌ Auto-initialization failed: {e}")
                    import traceback
                    self.stdout.write(traceback.format_exc())
            else:
                self.stdout.write("❌ No applications found in CREDIT_PAPER_CREDIT_REVIEW_PENDING state")
                
        except Exception as e:
            self.stdout.write(f"❌ Error testing auto-initialization: {e}")
        
        # 6. Summary and recommendations
        self.stdout.write("\n6. SUMMARY AND RECOMMENDATIONS")
        self.stdout.write("-" * 50)
        
        self.stdout.write("\\nTo fix auto-initialization issues:")
        self.stdout.write("1. Ensure CREDIT_PAPER_CREDIT_REVIEW_PENDING state has credit_review_form in relevant_sub_processes")
        self.stdout.write("2. Ensure CREDIT_REVIEW workflow exists with an initial state")
        self.stdout.write("3. Ensure credit_review_form is in the parent workflow's form_metadata")
        self.stdout.write("4. Check that WorkflowInstanceTransitionView is calling auto_initialize_forms_for_state")
        
        self.stdout.write("\\n" + "="*80)
        self.stdout.write("DIAGNOSTIC COMPLETE")
        self.stdout.write("="*80)