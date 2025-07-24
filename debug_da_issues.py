#!/usr/bin/env python3
"""
Debug script for DA-level authorization issues.

Issues to investigate:
1. Credit Review Form DA level field not displaying saved values
2. Credit Approval Form button showing "View" instead of "Edit" for authorized users

Run with: uv run python debug_da_issues.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow
from credit_applications.models import CreditApplication, CreditReviewForm
from django.contrib.auth import get_user_model
import json

User = get_user_model()

def debug_workflow_metadata():
    """Check workflow metadata for Credit Approval Form permissions"""
    print("=" * 60)
    print("CHECKING WORKFLOW METADATA")
    print("=" * 60)
    
    try:
        workflow = Workflow.objects.get(code='CREDIT_PAPER')
        print(f"Found workflow: {workflow.name}")
        
        if workflow.metadata and 'form_metadata' in workflow.metadata:
            form_metadata = workflow.metadata['form_metadata']
            print(f"\nFound {len(form_metadata)} forms in metadata:")
            
            for form_name, metadata in form_metadata.items():
                print(f"\n{form_name}:")
                print(f"  Title: {metadata.get('title', 'N/A')}")
                print(f"  Editable by roles: {metadata.get('editable_by_roles', [])}")
                print(f"  Viewable by roles: {metadata.get('viewable_by_roles', [])}")
                print(f"  Ownership required: {metadata.get('ownership_required', False)}")
                
                if form_name == 'credit_approval_form':
                    print(f"  ⭐ CREDIT APPROVAL FORM PERMISSIONS:")
                    print(f"     Editable by: {metadata.get('editable_by_roles', [])}")
        else:
            print("❌ No form_metadata found in workflow!")
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_PAPER workflow not found!")
    except Exception as e:
        print(f"❌ Error: {e}")

def debug_da_level_data():
    """Check DA level data format in database"""
    print("\n" + "=" * 60)
    print("CHECKING DA LEVEL DATA IN DATABASE")
    print("=" * 60)
    
    # Check a few Credit Review Forms
    review_forms = CreditReviewForm.objects.all()[:5]
    
    print(f"Found {review_forms.count()} Credit Review Forms (showing first 5):")
    
    for form in review_forms:
        print(f"\nCredit Review Form ID: {form.id}")
        print(f"  Application: {form.credit_application.reference_number if form.credit_application else 'N/A'}")
        print(f"  DA Level: '{form.delegated_authority_level}' (type: {type(form.delegated_authority_level)})")
        print(f"  DA Level repr: {repr(form.delegated_authority_level)}")

def debug_user_permissions():
    """Check user roles and DA levels"""
    print("\n" + "=" * 60)
    print("CHECKING USER ROLES AND DA LEVELS")
    print("=" * 60)
    
    # Get users with roles
    users_with_roles = User.objects.filter(role__isnull=False)[:10]
    
    print(f"Found {users_with_roles.count()} users with roles (showing first 10):")
    
    for user in users_with_roles:
        print(f"\nUser: {user.username} ({user.first_name} {user.last_name})")
        print(f"  Role: {user.role.name if user.role else 'None'}")
        print(f"  DA Level: '{user.da_level}' (type: {type(user.da_level)})")
        print(f"  Is Credit Analyst: {user.role.name == 'Credit Analyst' if user.role else False}")

def test_da_authorization():
    """Test DA authorization logic"""
    print("\n" + "=" * 60)
    print("TESTING DA AUTHORIZATION LOGIC")
    print("=" * 60)
    
    try:
        from workflow_engine.da_authorization import can_user_approve_at_da_level, extract_da_level_number
        
        # Test cases
        test_cases = [
            ('DA5', 'DA5', True),   # Same level
            ('DA3', 'DA5', True),   # Higher authority (3 < 5)
            ('DA7', 'DA5', False),  # Lower authority (7 > 5)
            ('5', 'DA5', True),     # Different format, same level
            ('DA3', '5', True),     # Mixed formats
        ]
        
        # Create a mock user for testing
        test_user = type('MockUser', (), {
            'role': type('MockRole', (), {'name': 'Credit Analyst'})(),
            'da_level': None,
            'username': 'test_user'
        })()
        
        print("Testing DA level authorization logic:")
        for user_da, required_da, expected in test_cases:
            test_user.da_level = user_da
            result = can_user_approve_at_da_level(test_user, required_da)
            status = "✅ PASS" if result == expected else "❌ FAIL"
            print(f"  User DA{extract_da_level_number(user_da)} vs Required DA{extract_da_level_number(required_da)}: {status} (expected: {expected}, got: {result})")
            
    except ImportError as e:
        print(f"❌ Cannot import DA authorization module: {e}")
    except Exception as e:
        print(f"❌ Error testing DA authorization: {e}")

def check_credit_approval_form_access():
    """Check specific Credit Approval Form access"""
    print("\n" + "=" * 60)
    print("CHECKING CREDIT APPROVAL FORM ACCESS")
    print("=" * 60)
    
    try:
        from workflow_engine.utils import can_user_edit_form
        
        # Get a Credit Analyst user
        credit_analyst = User.objects.filter(role__name='Credit Analyst').first()
        if not credit_analyst:
            print("❌ No Credit Analyst user found")
            return
            
        print(f"Testing access for user: {credit_analyst.username}")
        print(f"  Role: {credit_analyst.role.name}")
        print(f"  DA Level: {credit_analyst.da_level}")
        
        # Get a credit application
        credit_app = CreditApplication.objects.first()
        if not credit_app:
            print("❌ No Credit Applications found")
            return
            
        print(f"Testing with application: {credit_app.reference_number}")
        
        # Test can_user_edit_form
        can_edit = can_user_edit_form(credit_analyst, credit_app, 'credit_approval_form')
        print(f"Can edit Credit Approval Form: {can_edit}")
        
        # Check form permissions directly
        from workflow_engine.utils import get_form_permissions
        permissions = get_form_permissions('credit_approval_form')
        print(f"Form permissions: {permissions}")
        
    except Exception as e:
        print(f"❌ Error checking form access: {e}")

def main():
    print("🔍 DEBUGGING DA-LEVEL AUTHORIZATION ISSUES")
    print("This script will help identify why:")
    print("1. Credit Review Form DA level field is not displaying")
    print("2. Credit Approval Form shows 'View' instead of 'Edit'")
    
    debug_workflow_metadata()
    debug_da_level_data()
    debug_user_permissions()
    test_da_authorization()
    check_credit_approval_form_access()
    
    print("\n" + "=" * 60)
    print("SUMMARY AND RECOMMENDATIONS")
    print("=" * 60)
    print("Check the output above for:")
    print("1. DA level format inconsistencies (should be 'DA1', 'DA2', etc.)")
    print("2. Credit Approval Form editable_by_roles configuration")
    print("3. User role and DA level assignments")
    print("4. DA authorization logic test results")

if __name__ == '__main__':
    main()