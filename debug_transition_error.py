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

from workflow_engine.models import Transition, WorkflowInstance
from credit_applications.models import CreditApplication

def debug_transition_error():
    print("="*60)
    print("DEBUGGING TRANSITION ERROR")
    print("="*60)
    
    try:
        # Find the most recent Credit Review form with workflow instance
        apps = CreditApplication.objects.filter(
            workflow_instance__current_state__code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
        ).order_by('-created_at')
        
        if not apps.exists():
            print("No applications in Credit Review state found")
            return
            
        app = apps.first()
        review_form = app.credit_review_form
        
        print(f"📋 Application: {app.reference_number}")
        print(f"   Credit Review Form: {review_form.id}")
        print(f"   Workflow Instance: {review_form.workflow_instance.id}")
        print(f"   Current State: {review_form.workflow_instance.current_state.name}")
        
        # Check available transitions
        current_state = review_form.workflow_instance.current_state
        workflow = review_form.workflow_instance.workflow
        
        available_transitions = Transition.objects.filter(
            workflow=workflow,
            from_state=current_state
        )
        
        print(f"\\n📋 AVAILABLE TRANSITIONS FROM {current_state.name}:")
        print("-" * 40)
        
        for transition in available_transitions:
            print(f"✅ {transition.code}: {transition.name}")
            print(f"   To: {transition.to_state.name}")
            print(f"   Roles: {transition.allowed_roles}")
            print(f"   Metadata: {transition.metadata}")
            print()
        
        # Test the specific "Save as Draft" transition
        save_draft_transition = available_transitions.filter(
            code='CR_SAVE_DRAFT'
        ).first()
        
        if save_draft_transition:
            print(f"🧪 TESTING SAVE AS DRAFT TRANSITION")
            print("-" * 40)
            print(f"Transition Code: {save_draft_transition.code}")
            print(f"From State: {save_draft_transition.from_state.code}")
            print(f"To State: {save_draft_transition.to_state.code}")
            
            # Test if the transition can be performed
            try:
                # Get a Credit Analyst user for testing
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                analyst_users = User.objects.filter(role__name='Credit Analyst')
                if analyst_users.exists():
                    test_user = analyst_users.first()
                    print(f"Testing with user: {test_user.username} ({test_user.role.name})")
                    
                    # Check if user has permission
                    user_role = test_user.role.name
                    allowed_roles = save_draft_transition.allowed_roles
                    
                    print(f"User role: {user_role}")
                    print(f"Allowed roles: {allowed_roles}")
                    
                    if user_role in allowed_roles:
                        print("✅ User has permission for this transition")
                        
                        # Test the transition (dry run)
                        print("\\n🧪 TESTING TRANSITION EXECUTION (DRY RUN)")
                        print("-" * 40)
                        
                        # This would be the actual API call
                        print(f"API would call:")
                        print(f"  POST /api/workflow-instances/{review_form.workflow_instance.id}/transition/")
                        print(f"  Body: {{")
                        print(f"    'transition_code': '{save_draft_transition.code}',")
                        print(f"    'comments': 'Test comment'")
                        print(f"  }}")
                        
                    else:
                        print(f"❌ User does not have permission for this transition")
                else:
                    print("No Credit Analyst users found for testing")
                    
            except Exception as e:
                print(f"❌ Error testing transition: {e}")
        else:
            print("❌ CR_SAVE_DRAFT transition not found")
            
        # Check the serializer response format
        print(f"\\n📋 CHECKING SERIALIZER RESPONSE FORMAT")
        print("-" * 40)
        
        from credit_applications.serializers import CreditReviewFormSerializer
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        analyst_users = User.objects.filter(role__name='Credit Analyst')
        
        if analyst_users.exists():
            test_user = analyst_users.first()
            
            class MockRequest:
                def __init__(self, user):
                    self.user = user
            
            mock_request = MockRequest(test_user)
            
            serializer = CreditReviewFormSerializer(
                review_form, 
                context={'request': mock_request}
            )
            
            available_transitions = serializer.data.get('available_transitions', [])
            print(f"Serializer returns {len(available_transitions)} transitions:")
            
            for transition in available_transitions:
                print(f"  - Code: {transition.get('code')}")
                print(f"    Name: {transition.get('name')}")
                print(f"    Structure: {list(transition.keys())}")
                print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\\n" + "="*60)

if __name__ == '__main__':
    debug_transition_error()