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

from workflow_engine.models import Transition, State, Workflow
from credit_applications.models import CreditApplication

def debug_in_progress_transitions():
    print("="*60)
    print("DEBUGGING IN PROGRESS STATE TRANSITIONS")
    print("="*60)
    
    try:
        # Find Credit Review workflow
        workflow = Workflow.objects.get(code='CREDIT_REVIEW')
        
        # Find the In Progress state
        in_progress_state = State.objects.get(
            workflow=workflow,
            code='CREDIT_REVIEW_IN_PROGRESS'
        )
        
        print(f"📋 IN PROGRESS STATE: {in_progress_state.name}")
        print(f"   Code: {in_progress_state.code}")
        
        # Get all transitions FROM In Progress state
        from_transitions = Transition.objects.filter(
            workflow=workflow,
            from_state=in_progress_state
        )
        
        print(f"\n📋 AVAILABLE TRANSITIONS FROM IN PROGRESS:")
        print("-" * 40)
        
        for transition in from_transitions:
            print(f"✅ {transition.code}: {transition.name}")
            print(f"   To: {transition.to_state.name}")
            print(f"   Roles: {transition.allowed_roles}")
            print()
            
        # Also check what transitions TO In Progress state exist
        to_transitions = Transition.objects.filter(
            workflow=workflow,
            to_state=in_progress_state
        )
        
        print(f"\n📋 TRANSITIONS TO IN PROGRESS STATE:")
        print("-" * 40)
        
        for transition in to_transitions:
            print(f"➡️  {transition.code}: {transition.name}")
            print(f"   From: {transition.from_state.name}")
            print()
            
        # Check if we need to add a "Save as Draft" transition from In Progress back to Draft
        draft_state = State.objects.get(
            workflow=workflow,
            code='CREDIT_REVIEW_DRAFT'
        )
        
        save_draft_from_progress = Transition.objects.filter(
            workflow=workflow,
            from_state=in_progress_state,
            to_state=draft_state,
            code='CR_SAVE_DRAFT'
        ).exists()
        
        if not save_draft_from_progress:
            print(f"\n❌ MISSING TRANSITION:")
            print("-" * 40)
            print("No 'Save as Draft' transition from In Progress to Draft")
            print("This is why the button doesn't work after first save")
        else:
            print(f"\n✅ Save as Draft transition exists from In Progress")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_in_progress_transitions()