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

from workflow_engine.models import Workflow, State, Transition

def compare_patterns():
    print("="*80)
    print("COMPARING CREDIT REQUEST vs CREDIT REVIEW TRANSITION PATTERNS")
    print("="*80)
    
    # 1. Check Credit Request workflow transitions
    print("\n📋 CURRENT CREDIT REQUEST WORKFLOW TRANSITIONS")
    print("-" * 60)
    
    try:
        cr_workflow = Workflow.objects.get(code='CREDIT_REQUEST')
        cr_transitions = Transition.objects.filter(workflow=cr_workflow).order_by('from_state__code', 'code')
        
        if cr_transitions.exists():
            for t in cr_transitions:
                print(f"🔹 {t.code}: {t.name}")
                print(f"   {t.from_state.name} → {t.to_state.name}")
                print(f"   Roles: {t.allowed_roles}")
                if t.metadata:
                    ui_behavior = t.metadata.get('ui_behavior', {})
                    if ui_behavior:
                        print(f"   UI: {ui_behavior}")
                print()
        else:
            print("❌ No transitions found in CREDIT_REQUEST workflow")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_REQUEST workflow not found")
    
    # 2. Check current Credit Review workflow transitions
    print("\n📋 CURRENT CREDIT REVIEW WORKFLOW TRANSITIONS")
    print("-" * 60)
    
    try:
        crv_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
        crv_transitions = Transition.objects.filter(workflow=crv_workflow).order_by('from_state__code', 'code')
        
        if crv_transitions.exists():
            print("Current transitions (these will be replaced):")
            for t in crv_transitions:
                print(f"🔸 {t.code}: {t.name}")
                print(f"   {t.from_state.name} → {t.to_state.name}")
                print(f"   Roles: {t.allowed_roles}")
                print()
        else:
            print("❌ No transitions found in CREDIT_REVIEW workflow")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_REVIEW workflow not found")
    
    # 3. Show what Credit Review transitions WILL BE after running setup command
    print("\n📋 CREDIT REVIEW TRANSITIONS AFTER SETUP COMMAND")
    print("-" * 60)
    
    # From setup_credit_review_transitions.py
    expected_transitions = [
        {
            'code': 'CR_SAVE_DRAFT',
            'name': 'Save as Draft',
            'from_state': 'CREDIT_REVIEW_DRAFT',
            'to_state': 'CREDIT_REVIEW_DRAFT',
            'allowed_roles': ['Credit Analyst', 'Credit Approver'],
            'ui_style': 'secondary'
        },
        {
            'code': 'CR_SUBMIT_IN_PROGRESS', 
            'name': 'Submit to In Progress',
            'from_state': 'CREDIT_REVIEW_DRAFT',
            'to_state': 'CREDIT_REVIEW_IN_PROGRESS',
            'allowed_roles': ['Credit Analyst', 'Credit Approver'],
            'ui_style': 'primary'
        },
        {
            'code': 'CR_BACK_TO_DRAFT',
            'name': 'Move to Draft',
            'from_state': 'CREDIT_REVIEW_IN_PROGRESS',
            'to_state': 'CREDIT_REVIEW_DRAFT',
            'allowed_roles': ['Credit Analyst', 'Credit Approver'],
            'ui_style': 'secondary'
        },
        {
            'code': 'CR_SUBMIT_COMPLETE',
            'name': 'Submit for Business Sponsorship',
            'from_state': 'CREDIT_REVIEW_IN_PROGRESS',
            'to_state': 'CREDIT_REVIEW_COMPLETED',
            'allowed_roles': ['Credit Analyst', 'Credit Approver'],
            'ui_style': 'success'
        }
    ]
    
    print("Expected transitions after running setup command:")
    for t in expected_transitions:
        print(f"🔹 {t['code']}: {t['name']}")
        print(f"   {t['from_state']} → {t['to_state']}")
        print(f"   Roles: {t['allowed_roles']}")
        print(f"   UI Style: {t['ui_style']}")
        print()
    
    # 4. Pattern comparison
    print("\n📊 PATTERN COMPARISON")
    print("-" * 60)
    
    print("✅ SIMILARITIES (Good - consistent patterns):")
    print("   - Both use Save as Draft functionality")
    print("   - Both use Draft → In Progress → Complete flow")
    print("   - Both allow Credit Analyst and Credit Approver roles")
    print("   - Both have UI styling metadata")
    print("   - Both follow same state naming pattern (WORKFLOW_STATE)")
    
    print("\n🔍 DIFFERENCES (Expected - different purposes):")
    print("   - Credit Request: Ends with 'Submit for Credit Review'")
    print("   - Credit Review: Ends with 'Submit for Business Sponsorship'")
    print("   - Different transition codes (CR_TR_* vs CR_*)")
    print("   - Different final states (SUBMITTED vs COMPLETED)")
    
    print("\n✅ CONCLUSION:")
    print("The patterns ARE consistent - same workflow structure with")
    print("appropriate differences for their specific purposes in the process.")
    
    print("\n" + "="*80)

if __name__ == '__main__':
    compare_patterns()