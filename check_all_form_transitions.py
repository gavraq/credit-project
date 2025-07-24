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

def check_all_forms():
    print("="*80)
    print("CHECKING ALL FORM WORKFLOW TRANSITIONS")
    print("="*80)
    
    # All sub-workflows (excluding CREDIT_PAPER which is the parent)
    sub_workflows = [
        'CREDIT_REQUEST',
        'CREDIT_REVIEW', 
        'BUSINESS_SPONSORSHIP',
        'LEGAL_REVIEW',
        'CREDIT_QUESTIONNAIRE',
        'CREDIT_ANALYSIS',
        'CREDIT_COMPILATION',
        'CREDIT_APPROVAL'
    ]
    
    consistent_workflows = []
    inconsistent_workflows = []
    
    for workflow_code in sub_workflows:
        print(f"\n📋 {workflow_code} WORKFLOW")
        print("-" * 50)
        
        try:
            workflow = Workflow.objects.get(code=workflow_code)
            transitions = Transition.objects.filter(workflow=workflow).order_by('from_state__code', 'code')
            
            print(f"Found {transitions.count()} transitions:")
            
            if transitions.exists():
                transition_names = []
                for t in transitions:
                    print(f"  🔹 {t.code}: {t.name}")
                    print(f"     {t.from_state.name} → {t.to_state.name}")
                    print(f"     Roles: {t.allowed_roles}")
                    transition_names.append(t.name)
                
                # Check if follows standard pattern
                has_save_draft = any('Save as Draft' in name for name in transition_names)
                has_in_progress = any('In Progress' in name or 'Submit' in name for name in transition_names)
                
                if has_save_draft and has_in_progress and len(transitions) >= 3:
                    consistent_workflows.append(workflow_code)
                    print("     ✅ Follows standard pattern")
                else:
                    inconsistent_workflows.append(workflow_code)
                    print("     ⚠️  May need standardization")
            else:
                inconsistent_workflows.append(workflow_code)
                print("  ❌ No transitions found")
                
        except Workflow.DoesNotExist:
            inconsistent_workflows.append(workflow_code)
            print(f"  ❌ Workflow not found")
    
    # Summary
    print(f"\n\n📊 SUMMARY")
    print("-" * 50)
    
    print(f"✅ Workflows with consistent patterns ({len(consistent_workflows)}):")
    for wf in consistent_workflows:
        print(f"   - {wf}")
    
    print(f"\n⚠️  Workflows needing attention ({len(inconsistent_workflows)}):")
    for wf in inconsistent_workflows:
        print(f"   - {wf}")
    
    # Expected pattern for all forms
    print(f"\n📋 RECOMMENDED STANDARD PATTERN FOR ALL FORMS")
    print("-" * 50)
    print("Every sub-workflow should have:")
    print("1. Save as Draft (DRAFT → DRAFT)")
    print("2. Submit to In Progress (DRAFT → IN_PROGRESS)")  
    print("3. Move to Draft (IN_PROGRESS → DRAFT)")
    print("4. Submit/Complete (IN_PROGRESS → SUBMITTED/COMPLETED)")
    print("\nWith appropriate roles for each form type:")
    print("- Credit Request: relationship_manager")
    print("- Credit Review: credit_analyst, credit_approver") 
    print("- Business Sponsorship: business_sponsor")
    print("- Legal Review: legal_reviewer")
    print("- Credit Questionnaire: relationship_manager")
    print("- Credit Analysis: credit_analyst, credit_approver")
    print("- Credit Compilation: credit_analyst, credit_compiler")
    print("- Credit Approval: credit_approver, committee_approver")
    
    if inconsistent_workflows:
        print(f"\n🔧 RECOMMENDED ACTIONS:")
        print("1. Create setup commands for each inconsistent workflow")
        print("2. Run them to ensure all forms have consistent workflow patterns")
        print("3. Test each form to ensure workflow action buttons appear")
        print("\nThis will ensure consistent user experience across all forms.")
    
    print("\n" + "="*80)

if __name__ == '__main__':
    check_all_forms()