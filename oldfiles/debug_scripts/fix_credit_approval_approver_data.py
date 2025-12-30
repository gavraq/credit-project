#!/usr/bin/env python3
"""
Fix Credit Approval Form approver field data.

Issue: Credit Approval Forms may have corrupted approver data (usernames instead of UUIDs)
causing "holmes is not a valid UUID" errors.

Run with: uv run python fix_credit_approval_approver_data.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditApprovalForm
from django.contrib.auth import get_user_model
from django.db import transaction
import uuid

User = get_user_model()

def check_approver_data():
    """Check current state of approver data in Credit Approval Forms"""
    print("=" * 60)
    print("CHECKING CREDIT APPROVAL FORM APPROVER DATA")
    print("=" * 60)
    
    ca_forms = CreditApprovalForm.objects.all()
    print(f"Found {ca_forms.count()} Credit Approval Forms")
    
    corrupted_count = 0
    valid_count = 0
    
    for form in ca_forms:
        print(f"\nCredit Approval Form: {form.id}")
        print(f"  Application: {form.credit_application.reference_number}")
        print(f"  Approver field: '{form.approver}' (type: {type(form.approver)})")
        
        if form.approver:
            # Check if it's a valid UUID
            try:
                if isinstance(form.approver, str):
                    uuid.UUID(form.approver)
                    print(f"  ✅ Valid UUID format")
                    valid_count += 1
                else:
                    # It's a User object
                    print(f"  ✅ Valid User object: {form.approver}")
                    valid_count += 1
            except (ValueError, AttributeError):
                print(f"  ❌ Invalid approver data (not UUID or User)")
                corrupted_count += 1
        else:
            print(f"  ⚠️ No approver set")
            
    print(f"\nSummary:")
    print(f"  Valid approver data: {valid_count}")
    print(f"  Corrupted approver data: {corrupted_count}")
    print(f"  No approver set: {ca_forms.count() - valid_count - corrupted_count}")

def fix_approver_data():
    """Fix corrupted approver data"""
    print("\n" + "=" * 60)
    print("FIXING CORRUPTED APPROVER DATA")
    print("=" * 60)
    
    try:
        with transaction.atomic():
            ca_forms = CreditApprovalForm.objects.all()
            fixed_count = 0
            
            for form in ca_forms:
                needs_fix = False
                original_approver = form.approver
                
                if form.approver:
                    # Check if it's corrupted (not a valid UUID or User)
                    try:
                        if isinstance(form.approver, str):
                            uuid.UUID(form.approver)
                            # It's a valid UUID string, no fix needed
                        else:
                            # It's probably a User object, which is fine
                            pass
                    except ValueError:
                        # It's a corrupted string (like "holmes")
                        needs_fix = True
                        print(f"Found corrupted approver in form {form.id}: '{form.approver}'")
                        
                        # Try to find the right user based on username
                        try:
                            # Extract username from corrupted data
                            username = str(form.approver).strip()
                            user = User.objects.get(username=username)
                            form.approver = user
                            form.save(update_fields=['approver'])
                            fixed_count += 1
                            print(f"  ✅ Fixed: '{original_approver}' → User {user.username} ({user.id})")
                        except User.DoesNotExist:
                            print(f"  ❌ Could not find user with username '{username}'")
                            # Set to None so frontend can set it correctly
                            form.approver = None
                            form.save(update_fields=['approver'])
                            fixed_count += 1
                            print(f"  ⚠️ Set to None, frontend will set current user")
                            
            print(f"\n✅ Fixed {fixed_count} corrupted approver fields")
            
    except Exception as e:
        print(f"❌ Error fixing approver data: {e}")
        import traceback
        traceback.print_exc()

def test_api_payload():
    """Test what the API might be receiving"""
    print("\n" + "=" * 60)
    print("TESTING API PAYLOAD SCENARIOS")
    print("=" * 60)
    
    # Get a test form
    test_form = CreditApprovalForm.objects.first()
    if not test_form:
        print("❌ No Credit Approval Forms to test")
        return
        
    print(f"Testing with form: {test_form.id}")
    print(f"Current approver: {test_form.approver}")
    
    # Simulate what frontend might send
    test_payloads = [
        "holmes",  # Username
        "Jonathan Holmes",  # Full name
        "33e4042c-3b23-467b-8c84-d5b4d2f54060",  # Valid UUID
    ]
    
    for payload in test_payloads:
        print(f"\nTesting payload: '{payload}'")
        try:
            # Try to validate as UUID
            uuid.UUID(payload)
            print(f"  ✅ Valid UUID")
        except ValueError:
            print(f"  ❌ Invalid UUID - this would cause the error")
            
            # Try to find user by username
            try:
                user = User.objects.get(username=payload)
                print(f"    Found user by username: {user.id}")
            except User.DoesNotExist:
                print(f"    No user found with username '{payload}'")

def main():
    print("🔧 FIXING CREDIT APPROVAL FORM APPROVER DATA")
    print("This script will check and fix corrupted approver data that causes UUID errors.")
    
    check_approver_data()
    test_api_payload()
    
    response = input("\nDo you want to fix the corrupted data? (y/N): ").strip().lower()
    if response == 'y':
        fix_approver_data()
        print("\n" + "=" * 60)
        print("VERIFICATION - CHECKING DATA AFTER FIX")
        print("=" * 60)
        check_approver_data()
    else:
        print("No changes made.")
    
    print("\n" + "=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("1. Restart Django server to clear any cached data")
    print("2. Clear browser cache / hard refresh the Credit Approval Form")
    print("3. The frontend should now send correct UUID data")

if __name__ == '__main__':
    main()