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

def debug_parent_workflow_transitions():
    print("="*60)
    print("DEBUGGING PARENT WORKFLOW TRANSITIONS")
    print("="*60)
    
    try:
        # Find the main CREDIT_PAPER workflow
        main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        
        # Find the current state (Credit Review Pending)
        current_state = State.objects.get(
            workflow=main_workflow,
            code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
        )
        
        print(f"📋 CURRENT MAIN WORKFLOW STATE:")
        print(f"   Code: {current_state.code}")
        print(f"   Name: {current_state.name}")
        
        # Find transitions FROM Credit Review Pending
        transitions_from_current = Transition.objects.filter(
            workflow=main_workflow,
            from_state=current_state
        )
        
        print(f"\n📋 AVAILABLE TRANSITIONS FROM CURRENT STATE:")
        print("-" * 50)
        
        for transition in transitions_from_current:
            print(f"✅ {transition.code}: {transition.name}")
            print(f"   To: {transition.to_state.name} ({transition.to_state.code})")
            print(f"   Metadata: {transition.metadata}")
            
            # Check if this is an automatic transition
            if transition.metadata and 'system_action' in transition.metadata:
                print(f"   🤖 SYSTEM ACTION: {transition.metadata['system_action']}")
            print()
            
        # Check specifically for Business Sponsorship state
        try:
            bs_state = State.objects.get(
                workflow=main_workflow,
                code='CREDIT_PAPER_BUSINESS_SPONSORSHIP_PENDING'
            )
            print(f"📋 TARGET STATE (Business Sponsorship):")
            print(f"   Code: {bs_state.code}")
            print(f"   Name: {bs_state.name}")
            
            # Check if there's a transition to Business Sponsorship
            transition_to_bs = transitions_from_current.filter(to_state=bs_state).first()
            if transition_to_bs:
                print(f"   ✅ Transition exists: {transition_to_bs.code}")
                print(f"   System Action: {transition_to_bs.metadata.get('system_action', 'None')}")
            else:
                print(f"   ❌ No direct transition to Business Sponsorship found")
                
        except State.DoesNotExist:
            print(f"❌ Business Sponsorship state not found in main workflow")
            
        print(f"\n📋 SOLUTION:")
        print("-" * 50)
        print("The main workflow should have a system-triggered transition")
        print("that activates when Credit Review Form reaches 'Submitted' state")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_parent_workflow_transitions()