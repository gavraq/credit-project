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
from credit_applications.serializers import CreditApplicationSerializer
from django.contrib.auth import get_user_model

def test_credit_review_save():
    print("="*60)
    print("TESTING CREDIT REVIEW FORM SAVE")
    print("="*60)
    
    # Get a test application
    app = CreditApplication.objects.filter(
        workflow_instance__current_state__code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
    ).first()
    
    if not app:
        print("❌ No application in Credit Review state found")
        return
    
    print(f"📋 Testing with application: {app.reference_number}")
    
    # Get a test user
    User = get_user_model()
    user = User.objects.filter(role__name='Credit Analyst').first()
    
    if not user:
        print("❌ No Credit Analyst user found")
        return
    
    print(f"👤 Testing with user: {user.username}")
    
    # Test payload similar to what frontend sends
    test_payload = {
        'credit_review_form_credit_reviewer': 'Test Reviewer',
        'credit_review_form_assigned_credit_analyst': str(user.id),
        'credit_review_form_delegated_authority_level': '3',
        'credit_review_form_questionnaire_required': True,
        'credit_review_form_additional_information_request': 'Test additional info',
        'credit_review_form_rejection_reason': '',
        'credit_review_form_form_started_at': '2025-06-27T12:00:00',
        'credit_review_form_form_completed_at': '2025-06-27T12:30:00',
    }
    
    print(f"\n📋 TEST PAYLOAD:")
    print("-" * 40)
    for key, value in test_payload.items():
        print(f"  {key}: {value}")
    
    # Test serialization
    try:
        # Create a mock request for context
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        request = MockRequest(user)
        
        serializer = CreditApplicationSerializer(
            instance=app,
            data=test_payload,
            partial=True,
            context={'request': request}
        )
        
        print(f"\n🧪 TESTING SERIALIZER VALIDATION:")
        print("-" * 40)
        
        if serializer.is_valid():
            print("✅ Serializer validation passed")
            
            # Test the actual save
            print(f"\n🧪 TESTING SERIALIZER SAVE:")
            print("-" * 40)
            
            try:
                updated_app = serializer.save()
                print("✅ Serializer save successful")
                
                # Check if Credit Review Form was updated
                if hasattr(updated_app, 'credit_review_form'):
                    review_form = updated_app.credit_review_form
                    print(f"✅ Credit Review Form updated:")
                    print(f"   Credit Reviewer: {review_form.credit_reviewer}")
                    print(f"   Assigned Analyst: {review_form.assigned_credit_analyst}")
                    print(f"   DA Level: {review_form.delegated_authority_level}")
                else:
                    print("❌ No Credit Review Form found after save")
                    
            except Exception as save_error:
                print(f"❌ Serializer save failed: {save_error}")
                import traceback
                traceback.print_exc()
                
        else:
            print(f"❌ Serializer validation failed:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
                
    except Exception as e:
        print(f"❌ Error during serialization test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_credit_review_save()