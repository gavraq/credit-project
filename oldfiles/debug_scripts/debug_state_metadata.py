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
from workflow_engine.models import State

def debug_state_metadata():
    print("="*80)
    print("DEBUGGING STATE METADATA")
    print("="*80)
    
    try:
        # Get the most recent credit application
        app = CreditApplication.objects.order_by('-created_at').first()
        if app:
            print(f"\n📋 Application: {app.reference_number}")
            
            if app.workflow_instance and app.workflow_instance.current_state:
                state = app.workflow_instance.current_state
                print(f"Current State: {state.name}")
                print(f"State Code: {state.code}")
                
                print(f"\n🔍 State Metadata:")
                print(f"Raw metadata: {state.metadata}")
                
                if state.metadata:
                    step_number = state.metadata.get('step_number')
                    print(f"step_number in metadata: {step_number}")
                else:
                    print("❌ No metadata on state!")
            else:
                print("❌ No workflow instance or current state!")
                    
        # Also check all ANALYSIS_PENDING states
        print(f"\n" + "="*80)
        print("CHECKING ALL STATES WITH 'ANALYSIS' IN NAME:")
        
        analysis_states = State.objects.filter(code__contains='ANALYSIS')
        for state in analysis_states:
            print(f"\n📋 State: {state.code}")
            print(f"   Workflow: {state.workflow.code}")
            print(f"   Metadata: {state.metadata}")
            if state.metadata and 'step_number' in state.metadata:
                print(f"   ✅ Has step_number: {state.metadata['step_number']}")
            else:
                print(f"   ❌ Missing step_number in metadata")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_state_metadata()