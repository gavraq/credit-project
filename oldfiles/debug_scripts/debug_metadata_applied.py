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

def debug_metadata_applied():
    print("="*60)
    print("CHECKING IF METADATA WAS APPLIED")
    print("="*60)
    
    try:
        # Check Credit Review transition specifically
        cr_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
        submit_transition = Transition.objects.filter(
            workflow=cr_workflow,
            code='CR_SUBMIT_COMPLETE'
        ).first()
        
        if submit_transition:
            print(f"📋 CREDIT REVIEW SUBMIT TRANSITION:")
            print(f"   Code: {submit_transition.code}")
            print(f"   Name: {submit_transition.name}")
            print(f"   Metadata: {submit_transition.metadata}")
            
            metadata = submit_transition.metadata or {}
            
            if 'parent_workflow' in metadata:
                parent_config = metadata['parent_workflow']
                print(f"\n✅ PARENT WORKFLOW CONFIG:")
                print(f"   transition_code: {parent_config.get('transition_code')}")
                print(f"   from_state: {parent_config.get('from_state')}")
                print(f"   description: {parent_config.get('description')}")
            else:
                print(f"\n❌ NO parent_workflow in metadata!")
                
            if 'system_action' in metadata:
                print(f"\n✅ SYSTEM ACTION: {metadata['system_action']}")
            else:
                print(f"\n❌ NO system_action in metadata!")
                
        else:
            print("❌ CR_SUBMIT_COMPLETE transition not found!")
            
        # Also check if the system action handler exists
        from workflow_engine.actions import get_system_action_handler
        
        handler = get_system_action_handler('submit_credit_request')
        if handler:
            print(f"\n✅ SYSTEM ACTION HANDLER EXISTS: {handler.__name__}")
        else:
            print(f"\n❌ SYSTEM ACTION HANDLER NOT FOUND!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_metadata_applied()