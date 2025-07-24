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

from workflow_engine.models import Transition, Workflow

def debug_credit_request_system_action():
    print("="*60)
    print("HOW DOES CREDIT REQUEST FORM WORK?")
    print("="*60)
    
    try:
        # Check Credit Request transition
        cr_workflow = Workflow.objects.get(code='CREDIT_REQUEST')
        submit_transition = Transition.objects.filter(
            workflow=cr_workflow,
            code='CR_TR_4'
        ).first()
        
        if submit_transition:
            print(f"📋 CREDIT REQUEST SUBMIT TRANSITION:")
            print(f"   Code: {submit_transition.code}")
            print(f"   Name: {submit_transition.name}")
            print(f"   Metadata: {submit_transition.metadata}")
            
            # Check if it has system_action field
            print(f"\n📋 SYSTEM ACTION FIELD CHECK:")
            print(f"   transition.system_action: {getattr(submit_transition, 'system_action', 'FIELD DOES NOT EXIST')}")
            
            # Check metadata
            metadata = submit_transition.metadata or {}
            print(f"   metadata.get('system_action'): {metadata.get('system_action', 'NOT IN METADATA')}")
            
            # Check all fields on transition model
            print(f"\n📋 ALL TRANSITION FIELDS:")
            for field in submit_transition._meta.fields:
                field_value = getattr(submit_transition, field.name)
                print(f"   {field.name}: {field_value}")
                
        else:
            print("❌ CR_TR_4 transition not found!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_credit_request_system_action()