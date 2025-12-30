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

def run_audit():
    print("="*80)
    print("STEP 1: COMPREHENSIVE METADATA AUDIT")
    print("="*80)
    
    # Track issues found
    issues_found = []
    
    # 1. AUDIT ALL WORKFLOWS
    print("\n📋 AUDITING ALL WORKFLOWS")
    print("-" * 50)
    
    workflows = Workflow.objects.all().order_by('code')
    print(f"Found {workflows.count()} workflows:")
    
    for workflow in workflows:
        print(f"\n🔹 {workflow.name} ({workflow.code})")
        
        # Check workflow metadata
        if workflow.metadata:
            if 'form_metadata' in workflow.metadata:
                form_count = len(workflow.metadata['form_metadata'])
                print(f"   ✅ Has form_metadata with {form_count} forms")
                
                # List all forms
                for form_name, form_config in workflow.metadata['form_metadata'].items():
                    form_key = form_config.get('form_key', 'MISSING')
                    workflow_code = form_config.get('workflow_code', 'MISSING')
                    print(f"      - {form_name}: form_key='{form_key}', workflow_code='{workflow_code}'")
            else:
                print("   ⚠️  Has metadata but no form_metadata")
                issues_found.append(f"Workflow {workflow.code}: Missing form_metadata")
        else:
            print("   ❌ No metadata")
            issues_found.append(f"Workflow {workflow.code}: No metadata at all")
    
    # 2. AUDIT ALL STATES
    print("\n\n📋 AUDITING ALL STATES")
    print("-" * 50)
    
    for workflow in workflows:
        states = State.objects.filter(workflow=workflow).order_by('code')
        print(f"\n🔹 States in {workflow.code} ({states.count()} total):")
        
        for state in states:
            print(f"\n   🔸 {state.name} ({state.code})")
            print(f"      Initial: {state.is_initial}, Final: {state.is_final}")
            
            if state.metadata:
                # Check for relevant_sub_processes
                if 'relevant_sub_processes' in state.metadata:
                    sub_processes = state.metadata['relevant_sub_processes']
                    if sub_processes:
                        print(f"      ✅ relevant_sub_processes: {sub_processes}")
                    else:
                        print(f"      ⚠️  relevant_sub_processes is empty list")
                        issues_found.append(f"State {state.code}: Empty relevant_sub_processes")
                else:
                    print(f"      ❌ Missing relevant_sub_processes")
                    issues_found.append(f"State {state.code}: Missing relevant_sub_processes")
                
                # Show other metadata
                other_keys = [k for k in state.metadata.keys() if k != 'relevant_sub_processes']
                if other_keys:
                    print(f"      📝 Other metadata: {other_keys}")
            else:
                print(f"      ❌ No metadata")
                issues_found.append(f"State {state.code}: No metadata")
    
    # 3. AUDIT CRITICAL CREDIT REVIEW STATE
    print("\n\n📋 DETAILED AUDIT: CREDIT_PAPER_CREDIT_REVIEW_PENDING")
    print("-" * 50)
    
    try:
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        try:
            credit_review_state = State.objects.get(
                workflow=parent_workflow,
                code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            
            print(f"✅ Found: {credit_review_state.name}")
            
            if credit_review_state.metadata:
                print("📄 Complete metadata:")
                print(json.dumps(credit_review_state.metadata, indent=4))
                
                sub_processes = credit_review_state.metadata.get('relevant_sub_processes', [])
                if 'credit_review_form' in sub_processes:
                    print("✅ credit_review_form is in relevant_sub_processes")
                else:
                    print("❌ credit_review_form NOT in relevant_sub_processes")
                    issues_found.append("CRITICAL: credit_review_form missing from CREDIT_REVIEW_PENDING state")
            else:
                print("❌ No metadata on critical state")
                issues_found.append("CRITICAL: CREDIT_REVIEW_PENDING state has no metadata")
                
        except State.DoesNotExist:
            print("❌ CREDIT_PAPER_CREDIT_REVIEW_PENDING state not found")
            issues_found.append("CRITICAL: CREDIT_REVIEW_PENDING state does not exist")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_PAPER workflow not found")
        issues_found.append("CRITICAL: CREDIT_PAPER workflow does not exist")
    
    # 4. AUDIT SUB-WORKFLOWS
    print("\n\n📋 AUDITING SUB-WORKFLOWS")
    print("-" * 50)
    
    expected_sub_workflows = [
        'CREDIT_REQUEST', 'CREDIT_REVIEW', 'BUSINESS_SPONSORSHIP',
        'LEGAL_REVIEW', 'CREDIT_QUESTIONNAIRE', 'CREDIT_ANALYSIS',
        'CREDIT_COMPILATION', 'CREDIT_APPROVAL'
    ]
    
    for workflow_code in expected_sub_workflows:
        try:
            sub_workflow = Workflow.objects.get(code=workflow_code)
            initial_states = State.objects.filter(workflow=sub_workflow, is_initial=True)
            
            if initial_states.exists():
                initial_state = initial_states.first()
                print(f"✅ {workflow_code}: Initial state = {initial_state.name}")
            else:
                print(f"⚠️  {workflow_code}: No initial state")
                issues_found.append(f"Sub-workflow {workflow_code}: Missing initial state")
                
        except Workflow.DoesNotExist:
            print(f"❌ {workflow_code}: Workflow missing")
            issues_found.append(f"Sub-workflow {workflow_code}: Does not exist")
    
    # 5. AUDIT TRANSITIONS
    print("\n\n📋 AUDITING TRANSITIONS (SAMPLE)")
    print("-" * 50)
    
    # Check a few key transitions
    try:
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        key_transitions = Transition.objects.filter(
            workflow=parent_workflow,
            to_state__code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
        )
        
        if key_transitions.exists():
            print(f"✅ Found {key_transitions.count()} transition(s) to CREDIT_REVIEW_PENDING:")
            for transition in key_transitions:
                print(f"   - {transition.name} ({transition.code})")
                print(f"     From: {transition.from_state.name}")
                print(f"     Roles: {transition.allowed_roles}")
        else:
            print("⚠️  No transitions found to CREDIT_REVIEW_PENDING state")
            issues_found.append("No transitions to CREDIT_REVIEW_PENDING state")
            
    except Workflow.DoesNotExist:
        pass  # Already reported above
    
    # 6. SUMMARY
    print("\n\n📊 AUDIT SUMMARY")
    print("-" * 50)
    
    if issues_found:
        print(f"❌ FOUND {len(issues_found)} ISSUES:")
        for i, issue in enumerate(issues_found, 1):
            print(f"   {i}. {issue}")
            
        print("\n🔧 RECOMMENDED NEXT STEPS:")
        print("   - Review issues above")
        print("   - Run step 2 to check what metadata should exist")
        print("   - Run step 3 to fix missing metadata")
    else:
        print("✅ NO ISSUES FOUND - Metadata appears complete!")
        print("\n🔍 RECOMMENDED NEXT STEPS:")
        print("   - Check if auto-initialization is working")
        print("   - Test with a real workflow transition")
    
    print("\n" + "="*80)
    print("STEP 1 AUDIT COMPLETE")
    print("="*80)

if __name__ == '__main__':
    run_audit()