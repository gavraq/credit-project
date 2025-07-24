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

from workflow_engine.utils import get_dynamic_field_mappings, get_form_metadata

def debug_user_fields():
    print("="*60)
    print("DEBUGGING USER FIELD MAPPINGS")
    print("="*60)
    
    # Get dynamic field mappings
    field_mappings = get_dynamic_field_mappings()
    user_fields_map = field_mappings['user_fields']
    
    print(f"\n📋 CURRENT USER FIELD MAPPINGS:")
    print("-" * 40)
    
    for form_name, user_fields in user_fields_map.items():
        print(f"  {form_name}: {user_fields}")
    
    # Check specific form metadata for credit_review_form
    print(f"\n📋 CREDIT REVIEW FORM USER FIELDS:")
    print("-" * 40)
    
    credit_review_user_fields = user_fields_map.get('credit_review_form', [])
    print(f"Current user fields: {credit_review_user_fields}")
    
    if 'credit_reviewer' not in credit_review_user_fields:
        print("❌ 'credit_reviewer' is NOT in the user fields list!")
        print("This is why the UUID string isn't being converted to a User object")
    else:
        print("✅ 'credit_reviewer' is in the user fields list")
    
    if 'assigned_credit_analyst' not in credit_review_user_fields:
        print("❌ 'assigned_credit_analyst' is NOT in the user fields list!")
    else:
        print("✅ 'assigned_credit_analyst' is in the user fields list")
    
    print(f"\n📋 SOLUTION:")
    print("-" * 40)
    print("Need to add 'credit_reviewer' and 'assigned_credit_analyst' to the")
    print("user_fields list in the workflow metadata for credit_review_form")

if __name__ == '__main__':
    debug_user_fields()