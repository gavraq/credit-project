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

from workflow_engine.utils import get_dynamic_form_prefixes, get_form_metadata

def debug_prefixes():
    print("="*60)
    print("DEBUGGING FORM PREFIXES")
    print("="*60)
    
    # Get dynamic prefix mapping
    prefix_map = get_dynamic_form_prefixes()
    print(f"\n📋 DYNAMIC PREFIX MAPPING:")
    print("-" * 40)
    
    for prefix, form_name in prefix_map.items():
        print(f"  {prefix} -> {form_name}")
    
    # Check specific form metadata for credit_review_form
    print(f"\n📋 CREDIT REVIEW FORM METADATA:")
    print("-" * 40)
    
    try:
        metadata = get_form_metadata('credit_review_form')
        print(f"Form key: {metadata.get('form_key', 'NOT FOUND')}")
        print(f"Model class: {metadata.get('model_class', 'NOT FOUND')}")
        print(f"Expected prefix: {metadata.get('form_key', 'credit_review_form')}_")
    except Exception as e:
        print(f"Error getting metadata: {e}")
    
    print(f"\n📋 FRONTEND PAYLOAD ANALYSIS:")
    print("-" * 40)
    print("Frontend is sending fields like:")
    print("  credit_review_form_credit_reviewer")
    print("  credit_review_form_assigned_credit_analyst")
    print("  credit_review_form_delegated_authority_level")
    print("  etc...")
    
    expected_prefix = "credit_review_form_"
    if expected_prefix in prefix_map:
        print(f"✅ Prefix '{expected_prefix}' is FOUND in mapping")
        print(f"   Maps to form: {prefix_map[expected_prefix]}")
    else:
        print(f"❌ Prefix '{expected_prefix}' is NOT FOUND in mapping")
        print("This explains why the data is not being extracted!")
        
        # Show what the actual prefix should be
        for prefix, form_name in prefix_map.items():
            if form_name == 'credit_review_form':
                print(f"   Actual prefix should be: '{prefix}'")
    
    print(f"\n📋 SOLUTION:")
    print("-" * 40)
    if expected_prefix not in prefix_map:
        print("Either:")
        print("1. Update frontend to use the correct prefix from metadata")
        print("2. Update workflow metadata to use 'credit_review_form' as form_key")
    else:
        print("Prefix mapping looks correct - issue is elsewhere")

if __name__ == '__main__':
    debug_prefixes()