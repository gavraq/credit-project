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

from workflow_engine.models import Transition, Workflow, State

def debug_credit_request_pattern():
    print("="*60)
    print("DEBUGGING CREDIT REQUEST FORM PATTERN")
    print("="*60)
    
    try:
        # Find Credit Request workflow transitions
        cr_workflow = Workflow.objects.get(code='CREDIT_REQUEST')
        
        # Find the submitted state
        submitted_state = State.objects.filter(
            workflow=cr_workflow,
            code__icontains='SUBMITTED'
        ).first()
        
        if submitted_state:
            print(f"📋 CREDIT REQUEST SUBMITTED STATE:")
            print(f"   Code: {submitted_state.code}")
            print(f"   Name: {submitted_state.name}")
            
            # Check transitions TO submitted state
            transitions_to_submitted = Transition.objects.filter(
                workflow=cr_workflow,
                to_state=submitted_state
            )
            
            print(f"\n📋 TRANSITIONS TO SUBMITTED STATE:")
            print("-" * 40)
            for transition in transitions_to_submitted:
                print(f"✅ {transition.code}: {transition.name}")
                print(f"   From: {transition.from_state.name}")
                print(f"   Metadata: {transition.metadata}")
                
                # Check for system actions in metadata
                if transition.metadata:
                    if 'system_action' in transition.metadata:
                        print(f"   🤖 SYSTEM ACTION: {transition.metadata['system_action']}")
                    if 'parent_workflow_action' in transition.metadata:
                        print(f"   👆 PARENT ACTION: {transition.metadata['parent_workflow_action']}")
                print()
                
        # Now check main workflow transitions FROM Credit Request state
        main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        cr_pending_state = State.objects.filter(
            workflow=main_workflow,
            code__icontains='CREDIT_REQUEST'
        ).first()
        
        if cr_pending_state:
            print(f"\n📋 MAIN WORKFLOW CREDIT REQUEST STATE:")
            print(f"   Code: {cr_pending_state.code}")
            print(f"   Name: {cr_pending_state.name}")
            
            # Find transitions FROM this state
            transitions_from_cr = Transition.objects.filter(
                workflow=main_workflow,
                from_state=cr_pending_state
            )
            
            print(f"\n📋 MAIN WORKFLOW TRANSITIONS FROM CREDIT REQUEST:")
            print("-" * 50)
            for transition in transitions_from_cr:
                print(f"✅ {transition.code}: {transition.name}")
                print(f"   To: {transition.to_state.name} ({transition.to_state.code})")
                print(f"   Metadata: {transition.metadata}")
                
                # Check for system actions
                if transition.metadata:
                    if 'system_action' in transition.metadata:
                        print(f"   🤖 SYSTEM ACTION: {transition.metadata['system_action']}")
                    if 'trigger_condition' in transition.metadata:
                        print(f"   🎯 TRIGGER: {transition.metadata['trigger_condition']}")
                print()
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_credit_request_pattern()