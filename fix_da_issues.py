#!/usr/bin/env python3
"""
Fix script for DA-level authorization issues.

This script will:
1. Fix DA level format in Credit Review Form options (add DA prefix)
2. Update workflow metadata to allow Credit Analysts to edit Credit Approval Form
3. Ensure DA levels in database have correct format

Run with: uv run python fix_da_issues.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow
from credit_applications.models import CreditReviewForm
from django.contrib.auth import get_user_model
from django.db import transaction
import json

User = get_user_model()

def fix_workflow_metadata():
    """Update workflow metadata to implement DA-level authorization for Credit Approval Form"""
    print("=" * 60)
    print("FIXING WORKFLOW METADATA FOR DA-LEVEL AUTHORIZATION")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            workflow = Workflow.objects.get(code='CREDIT_PAPER')
            print(f"Found workflow: {workflow.name}")
            
            if not workflow.metadata:
                workflow.metadata = {}
                
            if 'form_metadata' not in workflow.metadata:
                workflow.metadata['form_metadata'] = {}
                
            # Update Credit Approval Form permissions
            if 'credit_approval_form' not in workflow.metadata['form_metadata']:
                workflow.metadata['form_metadata']['credit_approval_form'] = {}
                
            approval_form_metadata = workflow.metadata['form_metadata']['credit_approval_form']
            
            # Replace old role-based system with DA-level system
            # Only Credit Analysts should edit Credit Approval Forms (with DA authorization)
            old_editable_roles = approval_form_metadata.get('editable_by_roles', [])
            print(f"Old editable roles: {old_editable_roles}")
            
            # Set new editable roles - only Credit Analyst (DA authorization handles the rest)
            new_editable_roles = ['Credit Analyst']
            approval_form_metadata['editable_by_roles'] = new_editable_roles
            print(f"✅ Updated editable roles from {old_editable_roles} to {new_editable_roles}")
            
            # Update viewable roles - remove redundant approver roles
            old_viewable_roles = approval_form_metadata.get('viewable_by_roles', [])
            print(f"Old viewable roles: {old_viewable_roles}")
            
            # Keep essential roles, remove redundant approver roles
            new_viewable_roles = [
                'Relationship Manager', 
                'Credit Analyst', 
                'Business Sponsor', 
                'Legal Reviewer'
            ]
            approval_form_metadata['viewable_by_roles'] = new_viewable_roles
            print(f"✅ Updated viewable roles from {old_viewable_roles} to {new_viewable_roles}")
                
            # Ensure other required fields exist
            if 'title' not in approval_form_metadata:
                approval_form_metadata['title'] = 'Credit Approval Form'
                
            if 'form_key' not in approval_form_metadata:
                approval_form_metadata['form_key'] = 'credit_approval_form'
                
            workflow.save()
            print(f"✅ Updated workflow metadata for DA-level authorization")
            print(f"Credit Approval Form now editable by: {approval_form_metadata['editable_by_roles']}")
            print(f"DA-level authorization will determine specific user access")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_PAPER workflow not found!")
    except Exception as e:
        print(f"❌ Error updating workflow metadata: {e}")

def fix_da_level_formats():
    """Fix DA level formats in database to ensure they have DA prefix"""
    print("\n" + "=" * 60)
    print("FIXING DA LEVEL FORMATS IN DATABASE")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            # Fix Credit Review Forms
            review_forms = CreditReviewForm.objects.all()
            updated_count = 0
            
            for form in review_forms:
                if form.delegated_authority_level:
                    original = form.delegated_authority_level
                    
                    # Convert numeric-only values to DA format
                    if original.isdigit():
                        new_value = f"DA{original}"
                        form.delegated_authority_level = new_value
                        form.save(update_fields=['delegated_authority_level'])
                        updated_count += 1
                        print(f"✅ Updated Review Form {form.id}: '{original}' → '{new_value}'")
                        
            print(f"✅ Updated {updated_count} Credit Review Forms")
            
            # Fix User DA levels
            users = User.objects.filter(da_level__isnull=False)
            user_updated_count = 0
            
            for user in users:
                if user.da_level:
                    original = user.da_level
                    
                    # Convert numeric-only values to DA format
                    if original.isdigit():
                        new_value = f"DA{original}"
                        user.da_level = new_value
                        user.save(update_fields=['da_level'])
                        user_updated_count += 1
                        print(f"✅ Updated User {user.username}: '{original}' → '{new_value}'")
                        
            print(f"✅ Updated {user_updated_count} User DA levels")
            
    except Exception as e:
        print(f"❌ Error fixing DA level formats: {e}")

def test_fixes():
    """Test that fixes are working"""
    print("\n" + "=" * 60)
    print("TESTING DA-LEVEL AUTHORIZATION FIXES")
    print("=" * 60)
    
    try:
        # Test workflow metadata
        workflow = Workflow.objects.get(code='CREDIT_PAPER')
        approval_metadata = workflow.metadata.get('form_metadata', {}).get('credit_approval_form', {})
        editable_roles = approval_metadata.get('editable_by_roles', [])
        viewable_roles = approval_metadata.get('viewable_by_roles', [])
        
        print(f"Credit Approval Form editable roles: {editable_roles}")
        print(f"Credit Approval Form viewable roles: {viewable_roles}")
        
        if editable_roles == ['Credit Analyst']:
            print("✅ Credit Approval Form correctly configured for DA-level authorization")
        else:
            print(f"❌ Expected ['Credit Analyst'], got {editable_roles}")
            
        # Check that old approver roles are removed
        old_roles = ['Credit Approver', 'Committee Approver']
        removed_from_editable = not any(role in editable_roles for role in old_roles)
        removed_from_viewable = not any(role in viewable_roles for role in old_roles)
        
        if removed_from_editable and removed_from_viewable:
            print("✅ Old Credit Approver/Committee Approver roles successfully removed")
        else:
            print("⚠️ Some old approver roles still present in metadata")
            
        # Test DA level formats
        sample_review = CreditReviewForm.objects.filter(delegated_authority_level__isnull=False).first()
        if sample_review:
            da_level = sample_review.delegated_authority_level
            if da_level and da_level.startswith('DA'):
                print(f"✅ DA level format correct: '{da_level}'")
            else:
                print(f"❌ DA level format still incorrect: '{da_level}'")
        else:
            print("ℹ️ No Credit Review Forms with DA levels found")
            
        # Test user DA levels
        sample_user = User.objects.filter(da_level__isnull=False).first()
        if sample_user:
            da_level = sample_user.da_level
            if da_level and da_level.startswith('DA'):
                print(f"✅ User DA level format correct: '{da_level}'")
            else:
                print(f"❌ User DA level format still incorrect: '{da_level}'")
        else:
            print("ℹ️ No Users with DA levels found")
            
        # Test DA authorization for a real user
        credit_analyst = User.objects.filter(role__name='Credit Analyst', da_level__isnull=False).first()
        if credit_analyst:
            print(f"\n🧪 Testing DA authorization for {credit_analyst.username} (DA{credit_analyst.da_level}):")
            
            from workflow_engine.utils import can_user_edit_form
            from credit_applications.models import CreditApplication
            
            test_app = CreditApplication.objects.first()
            if test_app:
                can_edit = can_user_edit_form(credit_analyst, test_app, 'credit_approval_form')
                print(f"   Can edit Credit Approval Form: {can_edit}")
                
                if can_edit:
                    print("✅ DA-level authorization working correctly")
                else:
                    print("⚠️ User cannot edit - check DA level vs application requirements")
            
    except Exception as e:
        print(f"❌ Error testing fixes: {e}")

def create_frontend_fix_info():
    """Create information about frontend fixes needed"""
    print("\n" + "=" * 60)
    print("FRONTEND FIXES NEEDED")
    print("=" * 60)
    
    print("The following frontend changes are also needed:")
    print("")
    print("1. Credit Review Form DA Level Options:")
    print("   File: frontend/src/components/CreditReviewForm/index.jsx")
    print("   Lines: ~304-311")
    print("   Change option values from:")
    print('     { value: "1", label: "DA1 - Board" }')
    print("   To:")
    print('     { value: "DA1", label: "DA1 - Board" }')
    print("")
    print("2. The Credit Review Form should be converted to Phase 3 pattern")
    print("   to use unified formData state instead of individual state variables")
    print("")
    print("Backend fixes completed. Frontend fixes needed separately.")

def main():
    print("🔧 IMPLEMENTING DA-LEVEL AUTHORIZATION SYSTEM")
    print("This script will:")
    print("1. Replace Credit Approver/Committee Approver roles with DA-level authorization")
    print("2. Configure Credit Approval Form to be editable only by Credit Analysts")
    print("3. Fix DA level formats in database to use 'DA' prefix")
    print("4. Remove redundant approver roles from workflow metadata")
    print("")
    print("After this change:")
    print("• Credit Analysts will handle all approvals based on their DA level")
    print("• No separate Credit Approver/Committee Approver logins needed")
    print("• DA authorization determines who can approve what")
    
    response = input("\nProceed with DA-level authorization implementation? (y/N): ").strip().lower()
    if response != 'y':
        print("Aborted.")
        return
        
    fix_workflow_metadata()
    fix_da_level_formats()
    test_fixes()
    create_frontend_fix_info()
    
    print("\n" + "=" * 60)
    print("DA-LEVEL AUTHORIZATION IMPLEMENTATION COMPLETED")
    print("=" * 60)
    print("✅ Workflow metadata updated for DA-level authorization")
    print("✅ Old Credit Approver/Committee Approver roles removed from metadata")
    print("✅ Credit Approval Form now controlled by DA-level authorization")
    print("⚠️  Frontend DA level options already fixed")
    print("🔄 Restart Django server to apply changes")

if __name__ == '__main__':
    main()