#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/gavinslater/projects/credit-project')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, Transition

def fix_pp_tr_8_roles():
    """
    Remove 'Credit Approver' role and replace with 'Credit Analyst' + 'system' 
    since we now use DA-level authorization for Credit Analysts.
    """
    try:
        # Find the main workflow
        main_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        
        # Find PP_TR_8 transition (Approve)
        pp_tr_8 = Transition.objects.get(workflow=main_workflow, code='PP_TR_8')
        print(f"Found transition: {pp_tr_8.name}")
        print(f"Current allowed roles: {pp_tr_8.allowed_roles}")
        
        # Replace 'Credit Approver' with 'Credit Analyst' and 'system'
        new_allowed_roles = ['Credit Analyst', 'system']
        if pp_tr_8.allowed_roles != new_allowed_roles:
            pp_tr_8.allowed_roles = new_allowed_roles
            pp_tr_8.save()
            print(f"✅ Updated PP_TR_8 allowed roles to: {new_allowed_roles}")
        else:
            print("✅ PP_TR_8 roles already correct")
            
        # Find PP_TR_9 transition (Reject)
        pp_tr_9 = Transition.objects.get(workflow=main_workflow, code='PP_TR_9')
        print(f"\nFound transition: {pp_tr_9.name}")
        print(f"Current allowed roles: {pp_tr_9.allowed_roles}")
        
        # Replace 'Credit Approver' with 'Credit Analyst' and 'system'
        if pp_tr_9.allowed_roles != new_allowed_roles:
            pp_tr_9.allowed_roles = new_allowed_roles
            pp_tr_9.save()
            print(f"✅ Updated PP_TR_9 allowed roles to: {new_allowed_roles}")
        else:
            print("✅ PP_TR_9 roles already correct")
            
        # Check for any other transitions with 'Credit Approver' role
        print(f"\nChecking for other transitions with 'Credit Approver' role...")
        all_transitions = Transition.objects.filter(workflow=main_workflow)
        for transition in all_transitions:
            if transition.allowed_roles and 'Credit Approver' in transition.allowed_roles:
                print(f"Found transition {transition.code} ({transition.name}) with Credit Approver role")
                # Replace Credit Approver with Credit Analyst in this transition too
                updated_roles = [role if role != 'Credit Approver' else 'Credit Analyst' for role in transition.allowed_roles]
                if 'system' not in updated_roles:
                    updated_roles.append('system')
                transition.allowed_roles = updated_roles
                transition.save()
                print(f"  ✅ Updated {transition.code} roles to: {updated_roles}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_pp_tr_8_roles()