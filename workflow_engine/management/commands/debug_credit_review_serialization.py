from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition, WorkflowInstance
from credit_applications.models import CreditApplication, CreditReviewForm
from credit_applications.serializers import CreditReviewFormSerializer
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug Credit Review Form serialization and available transitions'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("DEBUGGING CREDIT REVIEW FORM SERIALIZATION & TRANSITIONS")
        self.stdout.write("="*70)
        
        # 1. Find a Credit Review Form with workflow instance
        self.stdout.write("\n🔍 FINDING CREDIT REVIEW FORM WITH WORKFLOW")
        self.stdout.write("-" * 50)
        
        review_forms = CreditReviewForm.objects.filter(workflow_instance__isnull=False)
        if not review_forms.exists():
            self.stdout.write("❌ No Credit Review Forms with workflow instances found")
            return
            
        review_form = review_forms.first()
        self.stdout.write(f"✅ Found Credit Review Form: {review_form.id}")
        self.stdout.write(f"   Credit Application: {review_form.credit_application.reference_number}")
        self.stdout.write(f"   Workflow Instance: {review_form.workflow_instance.id}")
        self.stdout.write(f"   Current State: {review_form.workflow_instance.current_state.name}")
        
        # 2. Check available transitions in CREDIT_REVIEW workflow
        self.stdout.write("\n🔍 CHECKING CREDIT_REVIEW WORKFLOW TRANSITIONS")
        self.stdout.write("-" * 50)
        
        try:
            credit_review_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            current_state = review_form.workflow_instance.current_state
            
            # Find transitions from current state
            available_transitions = Transition.objects.filter(
                workflow=credit_review_workflow,
                from_state=current_state
            )
            
            self.stdout.write(f"Workflow: {credit_review_workflow.name}")
            self.stdout.write(f"Current State: {current_state.name} ({current_state.code})")
            self.stdout.write(f"Available Transitions: {available_transitions.count()}")
            
            if available_transitions.exists():
                for transition in available_transitions:
                    self.stdout.write(f"   - {transition.name} ({transition.code})")
                    self.stdout.write(f"     To: {transition.to_state.name}")
                    self.stdout.write(f"     Roles: {transition.allowed_roles}")
            else:
                self.stdout.write("   ❌ NO TRANSITIONS FOUND!")
                self.stdout.write("   This is likely why no buttons are showing!")
                
                # Show all states in CREDIT_REVIEW workflow
                self.stdout.write("\\n   All states in CREDIT_REVIEW workflow:")
                for state in State.objects.filter(workflow=credit_review_workflow):
                    self.stdout.write(f"     - {state.name} ({state.code}) [Initial: {state.is_initial}]")
                
                # Show all transitions in CREDIT_REVIEW workflow
                self.stdout.write("\\n   All transitions in CREDIT_REVIEW workflow:")
                all_transitions = Transition.objects.filter(workflow=credit_review_workflow)
                if all_transitions.exists():
                    for transition in all_transitions:
                        self.stdout.write(f"     - {transition.name}: {transition.from_state.name} → {transition.to_state.name}")
                else:
                    self.stdout.write("     ❌ NO TRANSITIONS EXIST IN CREDIT_REVIEW WORKFLOW!")
                    
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_REVIEW workflow not found")
            return
        
        # 3. Test serialization with different users
        self.stdout.write("\n🧪 TESTING SERIALIZATION WITH DIFFERENT USER ROLES")
        self.stdout.write("-" * 50)
        
        # Test with different user roles
        test_roles = ['Credit Analyst', 'Credit Approver', 'Relationship Manager']
        
        for role_name in test_roles:
            try:
                users = User.objects.filter(role__name=role_name)
                if users.exists():
                    test_user = users.first()
                    self.stdout.write(f"\\n🧪 Testing with {role_name}: {test_user.username}")
                    
                    # Create a mock request with this user
                    class MockRequest:
                        def __init__(self, user):
                            self.user = user
                    
                    mock_request = MockRequest(test_user)
                    
                    # Serialize the form
                    serializer = CreditReviewFormSerializer(
                        review_form, 
                        context={'request': mock_request}
                    )
                    serialized_data = serializer.data
                    
                    # Check available_transitions
                    available_transitions = serialized_data.get('available_transitions', [])
                    self.stdout.write(f"   Available transitions: {len(available_transitions)}")
                    
                    if available_transitions:
                        for transition in available_transitions:
                            self.stdout.write(f"     - {transition.get('name', 'Unknown')} ({transition.get('code', 'Unknown')})")
                    else:
                        self.stdout.write("     ❌ No available transitions for this user")
                        
                else:
                    self.stdout.write(f"\\n⚠️  No users found with role: {role_name}")
                    
            except Exception as e:
                self.stdout.write(f"\\n❌ Error testing with {role_name}: {e}")
        
        # 4. Check if transitions exist but are being filtered out
        self.stdout.write("\n🔍 CHECKING TRANSITION FILTERING")
        self.stdout.write("-" * 50)
        
        # Test get_allowed_transitions method directly
        try:
            # Find a Credit Analyst user
            analyst_users = User.objects.filter(role__name='Credit Analyst')
            if analyst_users.exists():
                analyst_user = analyst_users.first()
                
                # Test the get_allowed_transitions method if it exists
                if hasattr(review_form.workflow_instance, 'get_allowed_transitions'):
                    allowed_transitions = review_form.workflow_instance.get_allowed_transitions(analyst_user)
                    self.stdout.write(f"get_allowed_transitions for Credit Analyst: {len(allowed_transitions)}")
                    for transition in allowed_transitions:
                        self.stdout.write(f"   - {transition.name} ({transition.code})")
                else:
                    self.stdout.write("get_allowed_transitions method not found on workflow instance")
            else:
                self.stdout.write("No Credit Analyst users found for testing")
                
        except Exception as e:
            self.stdout.write(f"Error testing transition filtering: {e}")
        
        # 5. Summary and recommendations
        self.stdout.write("\n📊 SUMMARY & RECOMMENDATIONS")
        self.stdout.write("-" * 50)
        
        self.stdout.write("Based on this analysis:")
        self.stdout.write("1. If no transitions exist in CREDIT_REVIEW workflow → Run setup_credit_review_transitions command")
        self.stdout.write("2. If transitions exist but aren't showing → Check role permissions")
        self.stdout.write("3. If serializer returns empty available_transitions → Check serializer implementation")
        self.stdout.write("4. Check frontend console for any API errors when loading the form")
        
        self.stdout.write("\n" + "="*70)