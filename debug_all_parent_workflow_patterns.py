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

def debug_all_parent_workflow_patterns():
    print("="*70)
    print("DEBUGGING ALL PARENT WORKFLOW PATTERNS")
    print("="*70)
    
    try:
        # Define the expected workflow sequence based on the hub page steps
        workflow_sequence = [
            ('CREDIT_REQUEST', 'CREDIT_REQUEST_SUBMITTED', 'PP_TR_1', 'Submit for Credit Review'),
            ('CREDIT_REVIEW', 'CREDIT_REVIEW_SUBMITTED', 'PP_TR_2', 'Submit for Business Sponsorship'),
            ('BUSINESS_SPONSORSHIP', 'BUSINESS_SPONSOR_SUBMITTED', 'PP_TR_3', 'Submit for Analysis'),  # Guessing this exists
            ('CREDIT_ANALYSIS', 'CREDIT_ANALYSIS_SUBMITTED', 'PP_TR_4', 'Submit for Compilation'),   # Guessing this exists
            ('CREDIT_COMPILATION', 'CREDIT_COMPILATION_SUBMITTED', 'PP_TR_5', 'Submit for Approval'), # Guessing this exists
            ('CREDIT_APPROVAL', 'CREDIT_APPROVAL_SUBMITTED', 'PP_TR_6', 'Complete Application'),     # Guessing this exists
        ]
        
        print("📋 CHECKING ALL FORM → PARENT WORKFLOW PATTERNS:")
        print("-" * 70)
        
        for i, (sub_workflow_code, submitted_state_code, parent_transition_code, expected_action) in enumerate(workflow_sequence):
            print(f"\n{i+1}. {sub_workflow_code} → {expected_action}")
            print("=" * 50)
            
            try:
                # Check if sub-workflow exists
                sub_workflow = Workflow.objects.get(code=sub_workflow_code)
                print(f"   ✅ Sub-workflow exists: {sub_workflow.name}")
                
                # Check if submitted state exists
                try:
                    submitted_state = State.objects.get(workflow=sub_workflow, code=submitted_state_code)
                    print(f"   ✅ Submitted state exists: {submitted_state.name}")
                    
                    # Check transitions TO submitted state
                    transitions_to_submitted = Transition.objects.filter(
                        workflow=sub_workflow,
                        to_state=submitted_state
                    )
                    
                    if transitions_to_submitted.exists():
                        for transition in transitions_to_submitted:
                            print(f"   📝 Submit transition: {transition.code} - {transition.name}")
                            
                            # Check for parent_workflow metadata
                            metadata = transition.metadata or {}
                            if 'parent_workflow' in metadata:
                                parent_config = metadata['parent_workflow']
                                print(f"      ✅ HAS parent_workflow metadata:")
                                print(f"         - transition_code: {parent_config.get('transition_code')}")
                                print(f"         - from_state: {parent_config.get('from_state')}")
                                print(f"         - description: {parent_config.get('description')}")
                            else:
                                print(f"      ❌ MISSING parent_workflow metadata")
                                print(f"         Should have: transition_code='{parent_transition_code}'")
                                
                            # Check for system_action
                            if 'system_action' in metadata:
                                print(f"      🤖 System action: {metadata['system_action']}")
                            else:
                                print(f"      ❌ No system_action defined")
                                
                    else:
                        print(f"   ❌ No transitions TO submitted state found")
                        
                except State.DoesNotExist:
                    print(f"   ❌ Submitted state '{submitted_state_code}' not found")
                    
            except Workflow.DoesNotExist:
                print(f"   ❌ Sub-workflow '{sub_workflow_code}' not found")
                
        # Also check main workflow transitions
        print(f"\n📋 MAIN WORKFLOW TRANSITIONS:")
        print("-" * 70)
        
        main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        main_transitions = Transition.objects.filter(workflow=main_workflow).order_by('code')
        
        for transition in main_transitions:
            print(f"✅ {transition.code}: {transition.name}")
            print(f"   From: {transition.from_state.name} ({transition.from_state.code})")
            print(f"   To: {transition.to_state.name} ({transition.to_state.code})")
            print()
            
        print(f"📋 SUMMARY:")
        print("-" * 70)
        print("Forms that need parent_workflow metadata:")
        print("1. Credit Review Form (CR_SUBMIT_COMPLETE → PP_TR_2)")
        print("2. Business Sponsorship Form (likely needs → PP_TR_3)")
        print("3. Analysis Form (likely needs → PP_TR_4)")
        print("4. Compilation Form (likely needs → PP_TR_5)")
        print("5. Approval Form (likely needs → PP_TR_6)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_all_parent_workflow_patterns()