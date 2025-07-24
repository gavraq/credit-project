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

def check_serialization():
    print("="*80)
    print("CHECKING WORKFLOW STATE SERIALIZATION")
    print("="*80)
    
    try:
        # Get the most recent credit application
        app = CreditApplication.objects.order_by('-created_at').first()
        if app:
            print(f"\n📋 Application: {app.reference_number}")
            
            # Create a mock request context
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first()
            
            class MockRequest:
                def __init__(self, user):
                    self.user = user
                    
            request = MockRequest(user)
            
            # Serialize the application
            serializer = CreditApplicationSerializer(app, context={'request': request})
            data = serializer.data
            
            print(f"\n🔍 Serialized Data Keys:")
            for key in sorted(data.keys()):
                print(f"   - {key}")
                
            # Check if workflow_state is in the data
            if 'workflow_state' in data:
                print(f"\n✅ workflow_state found in serialized data:")
                print(f"   {data['workflow_state']}")
            else:
                print(f"\n❌ workflow_state NOT found in serialized data")
                
            # Check workflow_state_name
            if 'workflow_state_name' in data:
                print(f"\n✅ workflow_state_name: {data['workflow_state_name']}")
                
            # Check workflow_instance
            if 'workflow_instance' in data:
                print(f"\n✅ workflow_instance: {data['workflow_instance']}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_serialization()