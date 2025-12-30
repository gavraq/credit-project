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

from workflow_engine.utils import get_dynamic_field_mappings

def check_user_fields():
    print("="*80)
    print("CHECKING USER FIELD MAPPINGS")
    print("="*80)
    
    try:
        field_mappings = get_dynamic_field_mappings()
        
        print("User fields for all forms:")
        for form_name, user_fields in field_mappings['user_fields'].items():
            print(f"  {form_name}: {user_fields}")
            
        credit_analysis_user_fields = field_mappings['user_fields'].get('credit_analysis_form', [])
        print(f"\nCredit Analysis Form user fields: {credit_analysis_user_fields}")
        
        if 'credit_analyst' in credit_analysis_user_fields:
            print("✅ credit_analyst is properly mapped as user field")
        else:
            print("❌ credit_analyst is NOT mapped as user field - this is the problem!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_user_fields()