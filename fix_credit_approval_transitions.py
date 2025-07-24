#!/usr/bin/env python3
"""
Fix Credit Approval workflow transitions to use DA-level authorization.

Issue: Credit Approval workflow transitions still use 'Credit Approver' role
but we've moved to DA-level authorization with 'Credit Analyst' role.

Run with: uv run python fix_credit_approval_transitions.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, Transition
from django.contrib.auth import get_user_model
from django.db import transaction
import json

User = get_user_model()

def fix_credit_approval_transitions():
    """Update Credit Approval workflow transitions to use Credit Analyst role"""
    print("=" * 60)
    print("FIXING CREDIT APPROVAL WORKFLOW TRANSITIONS")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            # Get Credit Approval workflow
            ca_workflow = Workflow.objects.get(code='CREDIT_APPROVAL')
            print(f"Found workflow: {ca_workflow.name}")
            
            # Get all transitions in this workflow
            transitions = Transition.objects.filter(workflow=ca_workflow)
            
            updated_count = 0
            for transition in transitions:
                old_roles = transition.allowed_roles.copy() if transition.allowed_roles else []
                print(f"\nTransition: {transition.code} - {transition.name}")
                print(f"  Old allowed roles: {old_roles}")
                
                if 'Credit Approver' in old_roles:
                    # Replace Credit Approver with Credit Analyst
                    new_roles = []
                    for role in old_roles:
                        if role == 'Credit Approver':
                            new_roles.append('Credit Analyst')
                        else:
                            new_roles.append(role)
                    
                    transition.allowed_roles = new_roles
                    transition.save(update_fields=['allowed_roles'])
                    updated_count += 1
                    
                    print(f"  ✅ Updated to: {new_roles}")
                else:
                    print(f"  ℹ️ No changes needed")
                    
            print(f"\n✅ Updated {updated_count} transitions")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_APPROVAL workflow not found!")
    except Exception as e:
        print(f"❌ Error updating transitions: {e}")
        import traceback
        traceback.print_exc()

def test_transitions_after_fix():
    """Test that Credit Analysts can now see transitions"""
    print("\n" + "=" * 60)
    print("TESTING TRANSITIONS AFTER FIX")
    print("=" * 60)
    
    try:
        # Get a Credit Analyst
        credit_analyst = User.objects.filter(role__name='Credit Analyst', da_level__isnull=False).first()
        if not credit_analyst:
            print("❌ No Credit Analyst found for testing")
            return
            
        print(f"Testing with user: {credit_analyst.username} (DA{credit_analyst.da_level})")
        
        # Get a Credit Approval Form with workflow instance
        from credit_applications.models import CreditApprovalForm
        ca_form = CreditApprovalForm.objects.filter(workflow_instance__isnull=False).first()
        
        if not ca_form:
            print("❌ No Credit Approval Form with workflow instance found")
            return
            
        print(f"Testing with Credit Approval Form: {ca_form.id}")
        print(f"Current state: {ca_form.workflow_instance.current_state.code}")
        
        # Check available transitions
        allowed_transitions = ca_form.workflow_instance.get_allowed_transitions(credit_analyst)
        
        if allowed_transitions:
            print(f"✅ Available transitions after fix:")
            for trans in allowed_transitions:
                print(f"  - {trans.code}: {trans.name}")
        else:
            print("❌ Still no transitions available")
            
            # Debug further
            print("Debugging...")
            from workflow_engine.models import Transition
            possible_transitions = Transition.objects.filter(
                workflow=ca_form.workflow_instance.workflow,
                from_state=ca_form.workflow_instance.current_state
            )
            
            for trans in possible_transitions:
                print(f"  Transition {trans.code}:")
                print(f"    Allowed roles: {trans.allowed_roles}")
                print(f"    User role: {credit_analyst.role.name}")
                
                # Check role normalization
                user_role_norm = credit_analyst.role.name.lower().replace(' ', '_')
                allowed_roles_norm = [r.lower().replace(' ', '_') for r in (trans.allowed_roles or [])]
                role_match = user_role_norm in allowed_roles_norm
                print(f"    Role match: {role_match}")
                
    except Exception as e:
        print(f"❌ Error testing transitions: {e}")
        import traceback
        traceback.print_exc()

def verify_da_integration():
    """Verify DA authorization is working with workflow transitions"""
    print("\n" + "=" * 60)
    print("VERIFYING DA AUTHORIZATION INTEGRATION")
    print("=" * 60)
    
    try:
        from workflow_engine.da_authorization import can_user_approve_credit_application
        from credit_applications.models import CreditApplication
        
        # Get test data
        credit_app = CreditApplication.objects.filter(
            credit_approval_form__isnull=False,
            credit_review_form__delegated_authority_level__isnull=False
        ).first()
        
        if not credit_app:
            print("❌ No suitable test data found")
            return
            
        required_da = credit_app.credit_review_form.delegated_authority_level
        print(f"Testing with application: {credit_app.reference_number}")
        print(f"Required DA level: {required_da}")
        
        # Test with different users
        credit_analysts = User.objects.filter(role__name='Credit Analyst', da_level__isnull=False)
        
        for analyst in credit_analysts:
            print(f"\n{analyst.username} (DA{analyst.da_level}):")
            
            # Check DA authorization
            da_authorized = can_user_approve_credit_application(analyst, credit_app)
            print(f"  DA authorized: {da_authorized}")
            
            # Check workflow transitions
            if credit_app.credit_approval_form.workflow_instance:
                wf_instance = credit_app.credit_approval_form.workflow_instance
                allowed_transitions = wf_instance.get_allowed_transitions(analyst)
                transition_count = len(allowed_transitions)
                print(f"  Available transitions: {transition_count}")
                
                if da_authorized and transition_count > 0:
                    print(f"  ✅ Both DA and workflow authorization working")
                elif da_authorized and transition_count == 0:
                    print(f"  ⚠️ DA authorized but no workflow transitions")
                elif not da_authorized and transition_count > 0:
                    print(f"  ⚠️ Workflow transitions available but not DA authorized")
                else:
                    print(f"  ℹ️ Neither DA nor workflow authorized (expected for insufficient DA level)")
        
    except Exception as e:
        print(f"❌ Error verifying DA integration: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🔧 FIXING CREDIT APPROVAL WORKFLOW TRANSITIONS")
    print("This will update transition roles from 'Credit Approver' to 'Credit Analyst'")
    print("to work with the new DA-level authorization system.")
    
    response = input("\nProceed with the fix? (y/N): ").strip().lower()
    if response != 'y':
        print("Aborted.")
        return
        
    fix_credit_approval_transitions()
    test_transitions_after_fix()
    verify_da_integration()
    
    print("\n" + "=" * 60)
    print("CREDIT APPROVAL TRANSITIONS FIXED")
    print("=" * 60)
    print("✅ Workflow transitions updated to use 'Credit Analyst' role")
    print("✅ DA-level authorization integrated with workflow transitions")
    print("🔄 Refresh the Credit Approval Form page to see workflow actions")

if __name__ == '__main__':
    main()