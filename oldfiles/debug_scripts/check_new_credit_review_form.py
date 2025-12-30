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
from workflow_engine.models import Transition

def check_new_form():
    print("="*70)
    print("CHECKING NEWLY CREATED CREDIT REVIEW FORM (CR-2025-0008)")
    print("="*70)
    
    try:
        # Find the CR-2025-0008 application
        app = CreditApplication.objects.get(reference_number='CR-2025-0008')
        print(f"✅ Found application: {app.reference_number}")
        print(f"   Title: {app.title}")
        print(f"   Current state: {app.workflow_instance.current_state.name if app.workflow_instance else 'No workflow'}")
        
        # Check if Credit Review Form exists
        review_form = CreditReviewForm.objects.filter(credit_application=app).first()
        
        if review_form:
            print(f"✅ Credit Review Form exists: {review_form.id}")
            
            # Check workflow instance
            if review_form.workflow_instance:
                print(f"✅ Has workflow instance: {review_form.workflow_instance.id}")
                print(f"   Workflow: {review_form.workflow_instance.workflow.name}")
                print(f"   Current state: {review_form.workflow_instance.current_state.name}")
                print(f"   State code: {review_form.workflow_instance.current_state.code}")
                
                # Check available transitions from this state
                current_state = review_form.workflow_instance.current_state
                available_transitions = Transition.objects.filter(
                    workflow=review_form.workflow_instance.workflow,
                    from_state=current_state
                )
                
                print(f"\\n📋 Available transitions from {current_state.name}:")
                if available_transitions.exists():
                    for t in available_transitions:
                        print(f"   ✅ {t.code}: {t.name}")
                        print(f"      To: {t.to_state.name}")
                        print(f"      Roles: {t.allowed_roles}")
                else:
                    print(f"   ❌ NO TRANSITIONS FOUND from state {current_state.code}")
                    
                    # Show all available transitions in the workflow
                    print(f"\\n   All transitions in {review_form.workflow_instance.workflow.code} workflow:")
                    all_transitions = Transition.objects.filter(workflow=review_form.workflow_instance.workflow)
                    for t in all_transitions:
                        print(f"     - {t.code}: {t.from_state.code} → {t.to_state.code}")
                
            else:
                print("❌ No workflow instance")
                print("   This is the problem - auto-initialization didn't create workflow instance")
                
        else:
            print("❌ No Credit Review Form found")
            print("   Auto-initialization failed completely")
        
        # Test serialization with a Credit Analyst user
        print(f"\\n🧪 TESTING SERIALIZATION")
        print("-" * 40)
        
        if review_form:
            from django.contrib.auth import get_user_model
            from credit_applications.serializers import CreditReviewFormSerializer
            
            User = get_user_model()
            
            # Find a Credit Analyst user
            analyst_users = User.objects.filter(role__name='Credit Analyst')
            if analyst_users.exists():
                analyst_user = analyst_users.first()
                print(f"Testing serialization with: {analyst_user.username} ({analyst_user.role.name})")
                
                class MockRequest:
                    def __init__(self, user):
                        self.user = user
                
                mock_request = MockRequest(analyst_user)
                
                # Serialize the form
                serializer = CreditReviewFormSerializer(
                    review_form, 
                    context={'request': mock_request}
                )
                serialized_data = serializer.data
                
                # Check available_transitions
                available_transitions = serialized_data.get('available_transitions', [])
                print(f"   Serializer returned {len(available_transitions)} transitions:")
                
                if available_transitions:
                    for transition in available_transitions:
                        print(f"     ✅ {transition.get('name', 'Unknown')} ({transition.get('code', 'Unknown')})")
                else:
                    print(f"     ❌ No transitions returned by serializer")
                    
            else:
                print("   ⚠️  No Credit Analyst users found for testing")
        
    except CreditApplication.DoesNotExist:
        print("❌ Application CR-2025-0008 not found")
        
        # Show recent applications
        recent_apps = CreditApplication.objects.order_by('-created_at')[:5]
        print("\\nRecent applications:")
        for app in recent_apps:
            print(f"   - {app.reference_number}: {app.workflow_instance.current_state.name if app.workflow_instance else 'No workflow'}")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\\n" + "="*70)

if __name__ == '__main__':
    check_new_form()