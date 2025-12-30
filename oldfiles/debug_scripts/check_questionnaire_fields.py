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

from credit_applications.models import CreditQuestionnaireForm

def check_questionnaire_fields():
    print("="*80)
    print("CREDIT QUESTIONNAIRE FORM MODEL FIELDS")
    print("="*80)
    
    # Get all field names from the model
    fields = CreditQuestionnaireForm._meta.get_fields()
    
    print("All fields in CreditQuestionnaireForm model:")
    for field in fields:
        field_name = field.name
        field_type = type(field).__name__
        
        # Skip system fields
        if field_name not in ['id', 'credit_application', 'workflow_instance']:
            print(f"  {field_name} ({field_type})")
    
    print(f"\nTotal user-editable fields: {len([f for f in fields if f.name not in ['id', 'credit_application', 'workflow_instance']])}")

if __name__ == '__main__':
    check_questionnaire_fields()