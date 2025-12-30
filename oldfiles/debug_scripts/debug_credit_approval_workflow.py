#!/usr/bin/env python3
"""
Debug script for Credit Approval Form workflow actions issue.

Issue: Credit Approval Form shows "No workflow actions are currently available"
even when user has correct DA authorization.

Run with: uv run python debug_credit_approval_workflow.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, WorkflowInstance, Transition
from credit_applications.models import CreditApplication, CreditApprovalForm
from django.contrib.auth import get_user_model
import json

User = get_user_model()

def debug_credit_approval_workflow():
    """Check Credit Approval Form workflow setup"""
    print("=" * 60)
    print("DEBUGGING CREDIT APPROVAL FORM WORKFLOW")
    print("=" * 60)
    
    try:
        # Check if CREDIT_APPROVAL workflow exists
        try:
            ca_workflow = Workflow.objects.get(code='CREDIT_APPROVAL')
            print(f"✅ Found CREDIT_APPROVAL workflow: {ca_workflow.name}")
            
            # Check states
            states = State.objects.filter(workflow=ca_workflow).order_by('code')
            print(f"States in CREDIT_APPROVAL workflow:")
            for state in states:
                print(f"  - {state.code}: {state.name} (initial: {state.is_initial}, terminal: {state.is_terminal})")
                
            # Check transitions
            transitions = Transition.objects.filter(workflow=ca_workflow)
            print(f"\nTransitions in CREDIT_APPROVAL workflow:")
            for trans in transitions:
                print(f"  - {trans.code}: {trans.from_state.code} → {trans.to_state.code}")
                print(f"    Name: {trans.name}")
                print(f"    Allowed roles: {trans.allowed_roles}")
                print(f"    System action: {trans.system_action}")
                
        except Workflow.DoesNotExist:
            print("❌ CREDIT_APPROVAL workflow not found!")
            return
            
        # Check a specific Credit Approval Form
        print(f"\n" + "=" * 40)
        print("CHECKING SPECIFIC CREDIT APPROVAL FORM")
        print("=" * 40)
        
        ca_form = CreditApprovalForm.objects.first()
        if not ca_form:
            print("❌ No Credit Approval Forms found in database")
            return
            
        print(f"Found Credit Approval Form: {ca_form.id}")
        print(f"Credit Application: {ca_form.credit_application.reference_number}")
        
        if ca_form.workflow_instance:
            wf_instance = ca_form.workflow_instance
            print(f"✅ Has workflow instance: {wf_instance.id}")
            print(f"Current state: {wf_instance.current_state.code} ({wf_instance.current_state.name})")
            
            # Check available transitions for a Credit Analyst
            credit_analyst = User.objects.filter(role__name='Credit Analyst').first()
            if credit_analyst:
                print(f"\nChecking transitions for {credit_analyst.username} (DA{credit_analyst.da_level}):")
                allowed_transitions = wf_instance.get_allowed_transitions(credit_analyst)
                
                if allowed_transitions:
                    print(f"✅ Available transitions:")
                    for trans in allowed_transitions:
                        print(f"  - {trans.code}: {trans.name}")
                else:
                    print("❌ No transitions available")
                    print("Debugging why no transitions are available...")
                    
                    # Check all possible transitions from current state
                    possible_transitions = Transition.objects.filter(
                        workflow=wf_instance.workflow,
                        from_state=wf_instance.current_state
                    )
                    
                    print(f"All transitions from {wf_instance.current_state.code}:")
                    for trans in possible_transitions:
                        print(f"  - {trans.code}: {trans.name}")
                        print(f"    Allowed roles: {trans.allowed_roles}")
                        print(f"    User role: {credit_analyst.role.name}")
                        
                        # Check role match
                        user_role_norm = credit_analyst.role.name.lower().replace(' ', '_')
                        allowed_roles_norm = [r.lower().replace(' ', '_') for r in (trans.allowed_roles or [])]
                        role_match = user_role_norm in allowed_roles_norm
                        print(f"    Role match: {role_match}")
                        
            else:
                print("❌ No Credit Analyst users found")
        else:
            print("❌ No workflow instance found for this Credit Approval Form")
            print("This might be the issue - let's check auto-initialization...")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def debug_ca_auto_initialization():
    """Check if Credit Approval Forms are being auto-initialized with workflows"""
    print(f"\n" + "=" * 60)
    print("CHECKING CREDIT APPROVAL FORM AUTO-INITIALIZATION")
    print("=" * 60)
    
    try:
        # Get an application that should have a Credit Approval Form
        credit_app = CreditApplication.objects.first()
        if not credit_app:
            print("❌ No Credit Applications found")
            return
            
        print(f"Checking application: {credit_app.reference_number}")
        print(f"Current workflow state: {credit_app.workflow_instance.current_state.code if credit_app.workflow_instance else 'None'}")
        
        # Check if it has a Credit Approval Form
        if hasattr(credit_app, 'credit_approval_form') and credit_app.credit_approval_form:
            ca_form = credit_app.credit_approval_form
            print(f"✅ Has Credit Approval Form: {ca_form.id}")
            
            if ca_form.workflow_instance:
                print(f"✅ Credit Approval Form has workflow instance: {ca_form.workflow_instance.id}")
            else:
                print("❌ Credit Approval Form missing workflow instance")
                print("Attempting to create workflow instance...")
                
                # Try to create workflow instance
                try:
                    from workflow_engine.utils import auto_initialize_forms_for_state
                    
                    # Get current state
                    current_state = credit_app.workflow_instance.current_state.code if credit_app.workflow_instance else None
                    print(f"Auto-initializing for state: {current_state}")
                    
                    if current_state:
                        initialized = auto_initialize_forms_for_state(credit_app, current_state)
                        print(f"Auto-initialization result: {list(initialized.keys()) if initialized else 'No forms initialized'}")
                        
                except Exception as e:
                    print(f"❌ Error during auto-initialization: {e}")
        else:
            print("❌ No Credit Approval Form found for this application")
            print("This might be because it's not needed for the current workflow state")
            
            # Check what forms are relevant for current state
            if credit_app.workflow_instance:
                current_state = credit_app.workflow_instance.current_state.code
                from workflow_engine.utils import get_relevant_sub_processes_for_state
                relevant_forms = get_relevant_sub_processes_for_state(current_state)
                print(f"Relevant forms for state {current_state}: {relevant_forms}")
                
                if 'credit_approval_form' in relevant_forms:
                    print("✅ Credit Approval Form should be relevant for this state")
                    print("But it doesn't exist - this indicates an auto-initialization issue")
                else:
                    print("ℹ️ Credit Approval Form not relevant for current state")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def test_da_authorization_integration():
    """Test DA authorization integration with workflow transitions"""
    print(f"\n" + "=" * 60)
    print("TESTING DA AUTHORIZATION WITH WORKFLOW TRANSITIONS")
    print("=" * 60)
    
    try:
        from workflow_engine.da_authorization import can_user_approve_credit_application
        
        # Get a credit application with approval form
        credit_app = CreditApplication.objects.filter(credit_approval_form__isnull=False).first()
        if not credit_app:
            print("❌ No Credit Application with Credit Approval Form found")
            return
            
        print(f"Testing with application: {credit_app.reference_number}")
        
        # Get required DA level
        required_da = None
        if hasattr(credit_app, 'credit_review_form') and credit_app.credit_review_form:
            required_da = credit_app.credit_review_form.delegated_authority_level
            
        print(f"Required DA level: {required_da}")
        
        # Test with different Credit Analysts
        credit_analysts = User.objects.filter(role__name='Credit Analyst', da_level__isnull=False)
        
        for analyst in credit_analysts:
            print(f"\nTesting {analyst.username} (DA{analyst.da_level}):")
            
            # Test DA authorization
            da_authorized = can_user_approve_credit_application(analyst, credit_app)
            print(f"  DA authorized: {da_authorized}")
            
            # Test workflow transitions
            if credit_app.credit_approval_form and credit_app.credit_approval_form.workflow_instance:
                wf_instance = credit_app.credit_approval_form.workflow_instance
                allowed_transitions = wf_instance.get_allowed_transitions(analyst)
                print(f"  Available transitions: {[t.code for t in allowed_transitions]}")
                
                if da_authorized and not allowed_transitions:
                    print("  ⚠️ DA authorized but no workflow transitions available")
                elif not da_authorized and allowed_transitions:
                    print("  ⚠️ Not DA authorized but workflow transitions available")
                elif da_authorized and allowed_transitions:
                    print("  ✅ Both DA authorization and workflow transitions working")
                else:
                    print("  ℹ️ Neither DA authorized nor workflow transitions available")
            else:
                print("  ❌ No workflow instance to test transitions")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🔍 DEBUGGING CREDIT APPROVAL FORM WORKFLOW ACTIONS")
    print("Investigating why workflow actions are not available...")
    
    debug_credit_approval_workflow()
    debug_ca_auto_initialization()
    test_da_authorization_integration()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print("Check the output above for:")
    print("1. Credit Approval workflow existence and configuration")
    print("2. Workflow instance creation for Credit Approval Forms")
    print("3. Transition availability for Credit Analysts")
    print("4. DA authorization integration with workflow transitions")

if __name__ == '__main__':
    main()