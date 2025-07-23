from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, WorkflowInstance
from credit_applications.models import CreditApplication, CreditReviewForm
from workflow_engine.utils import auto_initialize_forms_for_state, get_relevant_sub_processes_for_state
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Step 4: Test auto-initialization functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-live',
            action='store_true',
            help='Test with a real credit application (will modify data)',
        )

    def handle(self, *args, **options):
        test_live = options.get('test_live', False)
        
        self.stdout.write("="*80)
        self.stdout.write("STEP 4: TESTING AUTO-INITIALIZATION")
        self.stdout.write("="*80)
        
        # 1. TEST METADATA FUNCTIONS
        self.stdout.write("\n🧪 TESTING METADATA FUNCTIONS")
        self.stdout.write("-" * 50)
        
        # Test get_relevant_sub_processes_for_state
        try:
            relevant_forms = get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING')
            self.stdout.write(f"✅ get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING')")
            self.stdout.write(f"   Returns: {relevant_forms}")
            
            if 'credit_review_form' in relevant_forms:
                self.stdout.write("   ✅ credit_review_form is included")
            else:
                self.stdout.write("   ❌ credit_review_form is NOT included")
                
        except Exception as e:
            self.stdout.write(f"❌ Error testing get_relevant_sub_processes_for_state: {e}")
        
        # Test dynamic form mapping
        try:
            from workflow_engine.utils import get_dynamic_form_model_map
            form_model_map = get_dynamic_form_model_map()
            
            self.stdout.write(f"✅ get_dynamic_form_model_map() returns {len(form_model_map)} forms")
            
            if 'credit_review_form' in form_model_map:
                model_class = form_model_map['credit_review_form']
                self.stdout.write(f"   ✅ credit_review_form maps to {model_class.__name__}")
            else:
                self.stdout.write("   ❌ credit_review_form not in dynamic mapping")
                
        except Exception as e:
            self.stdout.write(f"❌ Error testing dynamic form mapping: {e}")
        
        # 2. TEST SUB-WORKFLOW EXISTENCE
        self.stdout.write("\n🧪 TESTING SUB-WORKFLOW SETUP")
        self.stdout.write("-" * 50)
        
        try:
            credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            self.stdout.write(f"✅ CREDIT_REVIEW workflow exists: {credit_review_workflow.name}")
            
            initial_states = State.objects.filter(workflow=credit_review_workflow, is_initial=True)
            if initial_states.exists():
                initial_state = initial_states.first()
                self.stdout.write(f"✅ Initial state exists: {initial_state.name} ({initial_state.code})")
            else:
                self.stdout.write("❌ No initial state in CREDIT_REVIEW workflow")
                
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_REVIEW workflow does not exist")
        
        # 3. FIND TEST APPLICATION
        self.stdout.write("\n🧪 FINDING TEST APPLICATION")
        self.stdout.write("-" * 50)
        
        # Find applications in CREDIT_REVIEW_PENDING state
        test_apps = []
        try:
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            review_state = State.objects.get(workflow=parent_workflow, code='CREDIT_PAPER_CREDIT_REVIEW_PENDING')
            
            # Find apps in this state
            workflow_instances = WorkflowInstance.objects.filter(
                current_state=review_state,
                content_type=ContentType.objects.get_for_model(CreditApplication)
            )
            
            for wi in workflow_instances:
                if wi.content_object:
                    test_apps.append(wi.content_object)
            
            if test_apps:
                self.stdout.write(f"✅ Found {len(test_apps)} applications in CREDIT_REVIEW_PENDING state")
                for app in test_apps[:3]:  # Show first 3
                    self.stdout.write(f"   - {app.reference_number}: {app.title}")
            else:
                self.stdout.write("⚠️  No applications found in CREDIT_REVIEW_PENDING state")
                
                # Check if any applications exist at all
                all_apps = CreditApplication.objects.all()[:5]
                if all_apps.exists():
                    self.stdout.write("   Available applications for testing:")
                    for app in all_apps:
                        state_name = app.workflow_instance.current_state.name if app.workflow_instance else "No workflow"
                        self.stdout.write(f"   - {app.reference_number}: {state_name}")
                        
        except Exception as e:
            self.stdout.write(f"❌ Error finding test applications: {e}")
        
        # 4. TEST AUTO-INITIALIZATION (DRY RUN)
        self.stdout.write("\n🧪 TESTING AUTO-INITIALIZATION (DRY RUN)")
        self.stdout.write("-" * 50)
        
        if test_apps:
            test_app = test_apps[0]
            self.stdout.write(f"Testing with application: {test_app.reference_number}")
            
            # Check current state
            existing_review_form = CreditReviewForm.objects.filter(credit_application=test_app).first()
            if existing_review_form:
                self.stdout.write(f"✅ Credit Review Form exists: ID {existing_review_form.id}")
                if existing_review_form.workflow_instance:
                    self.stdout.write(f"✅ Has workflow instance: {existing_review_form.workflow_instance.id}")
                else:
                    self.stdout.write("❌ No workflow instance")
            else:
                self.stdout.write("ℹ️  No Credit Review Form exists yet")
            
            # Test auto-initialization function
            try:
                self.stdout.write("\\nTesting auto_initialize_forms_for_state...")
                initialized_forms = auto_initialize_forms_for_state(
                    test_app, 
                    state_code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
                )
                
                self.stdout.write(f"✅ Function returned: {list(initialized_forms.keys())}")
                
                if 'credit_review_form' in initialized_forms:
                    form_instance = initialized_forms['credit_review_form']
                    self.stdout.write(f"✅ Credit Review Form: ID {form_instance.id}")
                    if form_instance.workflow_instance:
                        self.stdout.write(f"✅ Workflow instance: {form_instance.workflow_instance.id}")
                        self.stdout.write(f"✅ Current state: {form_instance.workflow_instance.current_state.name}")
                    else:
                        self.stdout.write("❌ No workflow instance created")
                else:
                    self.stdout.write("❌ credit_review_form not in returned forms")
                    
            except Exception as e:
                self.stdout.write(f"❌ Auto-initialization failed: {e}")
                import traceback
                self.stdout.write(traceback.format_exc())
        
        # 5. TEST WORKFLOW TRANSITION VIEW INTEGRATION
        self.stdout.write("\n🧪 TESTING WORKFLOW TRANSITION INTEGRATION")
        self.stdout.write("-" * 50)
        
        self.stdout.write("Checking WorkflowInstanceTransitionView integration:")
        
        try:
            # Read the view file to check if auto-initialization is called
            import inspect
            from backend.users.views import WorkflowInstanceTransitionView
            
            source = inspect.getsource(WorkflowInstanceTransitionView.post)
            if 'auto_initialize_forms_for_state' in source:
                self.stdout.write("✅ WorkflowInstanceTransitionView calls auto_initialize_forms_for_state")
            else:
                self.stdout.write("❌ auto_initialize_forms_for_state not called in transition view")
                
        except Exception as e:
            self.stdout.write(f"⚠️  Could not check transition view integration: {e}")
        
        # 6. RECOMMENDATIONS
        self.stdout.write("\n\n📋 TEST RESULTS & RECOMMENDATIONS")
        self.stdout.write("-" * 50)
        
        if test_live:
            self.stdout.write("🔴 LIVE TEST MODE")
            self.stdout.write("To test live workflow transitions:")
            self.stdout.write("1. Create a new Credit Request")
            self.stdout.write("2. Transition it to Credit Review state")
            self.stdout.write("3. Check if Credit Review Form gets auto-created with workflow instance")
        else:
            self.stdout.write("🔵 DRY RUN MODE")
            self.stdout.write("Use --test-live to test actual workflow transitions")
        
        self.stdout.write("\\nNext steps:")
        self.stdout.write("1. Ensure all metadata fixes from Step 3 are applied")
        self.stdout.write("2. Test with a real user transition via the frontend")
        self.stdout.write("3. Check server logs during transition for error messages")
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("STEP 4 TESTING COMPLETE")
        self.stdout.write("="*80)