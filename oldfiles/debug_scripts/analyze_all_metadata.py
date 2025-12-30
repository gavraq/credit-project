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

import json
from workflow_engine.models import Workflow, State, Transition

def analyze_all_metadata():
    print("="*80)
    print("COMPREHENSIVE METADATA ANALYSIS")
    print("="*80)
    
    # 1. Analyze all workflows
    print("\n1. WORKFLOWS OVERVIEW")
    print("-" * 50)
    
    all_workflows = Workflow.objects.all().order_by('code')
    for workflow in all_workflows:
        print(f"\nWorkflow: {workflow.name} ({workflow.code})")
        print(f"Description: {workflow.description or 'None'}")
        
        if workflow.metadata:
            print("Workflow Metadata:")
            print(json.dumps(workflow.metadata, indent=2))
            
            # Check for form_metadata specifically
            if 'form_metadata' in workflow.metadata:
                form_metadata = workflow.metadata['form_metadata']
                print(f"\nForms defined in this workflow: {len(form_metadata)}")
                for form_name, form_config in form_metadata.items():
                    print(f"  - {form_name}:")
                    print(f"    form_key: {form_config.get('form_key', 'Not defined')}")
                    print(f"    title: {form_config.get('title', 'Not defined')}")
                    print(f"    editable_by_roles: {form_config.get('editable_by_roles', [])}")
                    print(f"    viewable_by_roles: {form_config.get('viewable_by_roles', [])}")
        else:
            print("Workflow Metadata: None")
    
    # 2. Analyze all states with their metadata
    print("\n\n2. STATES ANALYSIS")
    print("-" * 50)
    
    for workflow in all_workflows:
        print(f"\n--- States in {workflow.name} ({workflow.code}) ---")
        states = State.objects.filter(workflow=workflow).order_by('code')
        
        for state in states:
            print(f"\nState: {state.name} ({state.code})")
            print(f"  Initial: {state.is_initial}")
            print(f"  Final: {state.is_final}")
            
            if state.metadata:
                print("  Metadata:")
                for key, value in state.metadata.items():
                    if key == 'relevant_sub_processes':
                        print(f"    {key}: {value}")
                        # This is critical for auto-initialization
                        if not value:
                            print(f"      ⚠️  WARNING: Empty relevant_sub_processes list!")
                    else:
                        print(f"    {key}: {value}")
            else:
                print("  Metadata: None")
                print("    ⚠️  WARNING: No metadata - auto-initialization may not work!")
    
    # 3. Analyze transitions and their metadata
    print("\n\n3. TRANSITIONS ANALYSIS")
    print("-" * 50)
    
    for workflow in all_workflows:
        print(f"\n--- Transitions in {workflow.name} ({workflow.code}) ---")
        transitions = Transition.objects.filter(workflow=workflow).order_by('code')
        
        for transition in transitions:
            print(f"\nTransition: {transition.name} ({transition.code})")
            print(f"  From: {transition.from_state.name} → To: {transition.to_state.name}")
            print(f"  Allowed roles: {transition.allowed_roles}")
            
            if transition.metadata:
                print("  Metadata:")
                print(json.dumps(transition.metadata, indent=4))
            else:
                print("  Metadata: None")
    
    # 4. Check form auto-initialization compatibility
    print("\n\n4. AUTO-INITIALIZATION COMPATIBILITY CHECK")
    print("-" * 60)
    
    # Get the parent workflow that drives auto-initialization
    try:
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        print(f"Parent workflow for auto-initialization: {parent_workflow.name}")
        
        # Check each state's relevant_sub_processes
        states_with_issues = []
        states = State.objects.filter(workflow=parent_workflow)
        
        for state in states:
            print(f"\nState: {state.name} ({state.code})")
            
            if not state.metadata:
                states_with_issues.append((state, "No metadata"))
                print("  ❌ No metadata - auto-initialization will fail")
                continue
            
            if 'relevant_sub_processes' not in state.metadata:
                states_with_issues.append((state, "Missing relevant_sub_processes"))
                print("  ❌ Missing 'relevant_sub_processes' - will use default ['credit_request_form']")
                continue
            
            sub_processes = state.metadata['relevant_sub_processes']
            if not sub_processes:
                states_with_issues.append((state, "Empty relevant_sub_processes"))
                print("  ⚠️  Empty relevant_sub_processes list")
            else:
                print(f"  ✅ relevant_sub_processes: {sub_processes}")
        
        if states_with_issues:
            print(f"\n⚠️  FOUND {len(states_with_issues)} STATES WITH AUTO-INITIALIZATION ISSUES:")
            for state, issue in states_with_issues:
                print(f"  - {state.name} ({state.code}): {issue}")
        else:
            print("\n✅ All states have proper auto-initialization metadata!")
            
    except Workflow.DoesNotExist:
        print("❌ Parent workflow 'CREDIT_PAPER' not found - auto-initialization system broken!")
    
    # 5. Check dynamic form mapping compatibility
    print("\n\n5. DYNAMIC FORM MAPPING CHECK")
    print("-" * 50)
    
    try:
        from workflow_engine.utils import get_dynamic_form_model_map, get_dynamic_form_prefixes
        
        form_model_map = get_dynamic_form_model_map()
        form_prefixes = get_dynamic_form_prefixes()
        
        print(f"Dynamic form model mappings: {len(form_model_map)}")
        for form_name, model_class in form_model_map.items():
            print(f"  {form_name} → {model_class.__name__}")
        
        print(f"\nDynamic form prefixes: {len(form_prefixes)}")
        for prefix, form_name in form_prefixes.items():
            print(f"  {prefix} → {form_name}")
            
        # Check for consistency
        if len(form_model_map) != len(form_prefixes):
            print("\n⚠️  WARNING: Mismatch between form model map and prefixes!")
            
    except Exception as e:
        print(f"❌ Error checking dynamic mappings: {e}")
    
    # 6. Summary and recommendations
    print("\n\n6. SUMMARY AND RECOMMENDATIONS")
    print("-" * 50)
    
    print("Based on the analysis above:")
    print("1. Check for states missing 'relevant_sub_processes' metadata")
    print("2. Ensure Credit Review forms are included in CREDIT_PAPER_CREDIT_REVIEW_PENDING state")
    print("3. Verify all sub-workflows (CREDIT_REQUEST, CREDIT_REVIEW, etc.) exist")
    print("4. Check that form_metadata in parent workflow matches actual form models")
    print("5. Ensure transitions have proper role-based permissions")
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)

if __name__ == '__main__':
    analyze_all_metadata()