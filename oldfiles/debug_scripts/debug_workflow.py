#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State
from workflow_engine.utils import get_relevant_sub_processes_for_state, get_dynamic_form_model_map

def main():
    print("=== DEBUGGING WORKFLOW AUTO-INITIALIZATION SYSTEM ===\n")
    
    print("1. CHECKING WORKFLOW DEFINITIONS")
    print("-" * 40)
    try:
        credit_paper = Workflow.objects.get(code='CREDIT_PAPER')
        print(f"✓ Found CREDIT_PAPER workflow: {credit_paper.name}")
        
        if credit_paper.metadata:
            print(f"✓ CREDIT_PAPER has metadata with keys: {list(credit_paper.metadata.keys())}")
            if 'form_metadata' in credit_paper.metadata:
                forms = list(credit_paper.metadata['form_metadata'].keys())
                print(f"✓ Form metadata exists for: {forms}")
                if 'credit_review_form' in credit_paper.metadata['form_metadata']:
                    crform_meta = credit_paper.metadata['form_metadata']['credit_review_form']
                    print(f"✓ Credit Review Form metadata: {crform_meta}")
                else:
                    print("✗ credit_review_form NOT found in form metadata")
            else:
                print("✗ No form_metadata found in CREDIT_PAPER workflow")
        else:
            print("✗ CREDIT_PAPER workflow has no metadata")
            
    except Workflow.DoesNotExist:
        print("✗ CREDIT_PAPER workflow not found")
        return

    print("\n2. CHECKING CREDIT_REVIEW_PENDING STATE")
    print("-" * 40)
    try:
        pending_state = State.objects.get(code='CREDIT_PAPER_CREDIT_REVIEW_PENDING')
        print(f"✓ Found state: {pending_state.name} ({pending_state.code})")
        print(f"✓ Belongs to workflow: {pending_state.workflow.code}")
        
        if pending_state.metadata:
            print(f"✓ State has metadata: {pending_state.metadata}")
            if 'relevant_sub_processes' in pending_state.metadata:
                forms = pending_state.metadata['relevant_sub_processes']
                print(f"✓ Relevant forms for this state: {forms}")
                if 'credit_review_form' in forms:
                    print("✓ credit_review_form is configured for this state")
                else:
                    print("✗ credit_review_form NOT in relevant forms list")
            else:
                print("✗ No relevant_sub_processes in state metadata")
        else:
            print("✗ State has no metadata")
            
    except State.DoesNotExist:
        print("✗ CREDIT_PAPER_CREDIT_REVIEW_PENDING state not found")
        return

    print("\n3. CHECKING CREDIT_REVIEW SUB-WORKFLOW")
    print("-" * 40)
    try:
        credit_review_wf = Workflow.objects.get(code='CREDIT_REVIEW')
        print(f"✓ Found CREDIT_REVIEW workflow: {credit_review_wf.name}")
        
        initial_states = State.objects.filter(workflow=credit_review_wf, is_initial=True)
        print(f"✓ Initial states: {[s.code for s in initial_states]}")
        
    except Workflow.DoesNotExist:
        print("✗ CREDIT_REVIEW workflow not found")
        print("Available workflows:")
        for wf in Workflow.objects.all():
            print(f"  - {wf.code}: {wf.name}")

    print("\n4. TESTING AUTO-INITIALIZATION FUNCTIONS")
    print("-" * 40)
    
    # Test get_relevant_sub_processes_for_state function
    print("Testing get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING'):")
    try:
        relevant_forms = get_relevant_sub_processes_for_state('CREDIT_PAPER_CREDIT_REVIEW_PENDING')
        print(f"✓ Returned forms: {relevant_forms}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test get_dynamic_form_model_map function
    print("Testing get_dynamic_form_model_map():")
    try:
        form_map = get_dynamic_form_model_map()
        print(f"✓ Form model mapping has {len(form_map)} entries:")
        for form_name, model_class in form_map.items():
            print(f"  - {form_name}: {model_class.__name__}")
    except Exception as e:
        print(f"✗ Error: {e}")

    print("\n5. SUMMARY")
    print("-" * 40)
    print("Key things to check:")
    print("- Does CREDIT_PAPER_CREDIT_REVIEW_PENDING state have 'credit_review_form' in relevant_sub_processes?")
    print("- Does CREDIT_REVIEW workflow exist with initial state?")
    print("- Does the form model mapping include CreditReviewForm?")
    print("- Are there any exceptions in the auto_initialize_forms_for_state function?")

if __name__ == "__main__":
    main()