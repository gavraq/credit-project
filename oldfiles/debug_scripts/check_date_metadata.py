#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/gavinslater/projects/credit-project')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow
import pprint

def check_form_metadata():
    try:
        workflow = Workflow.objects.get(code='CREDIT_PAPER')
        form_metadata = workflow.metadata.get('form_metadata', {})
        
        print("=== FORM METADATA ANALYSIS ===")
        print(f"Found {len(form_metadata)} forms in metadata:")
        
        for form_name, form_config in form_metadata.items():
            print(f"\n--- {form_name} ---")
            print(f"Title: {form_config.get('title', 'N/A')}")
            print(f"Form Key: {form_config.get('form_key', 'N/A')}")
            
            # Check for field mappings
            field_mappings = form_config.get('field_mappings', {})
            if field_mappings:
                print("Field mappings found:")
                for field_type, fields in field_mappings.items():
                    print(f"  {field_type}: {fields}")
            else:
                print("No field mappings found")
        
        print("\n=== DATETIME FIELDS SUMMARY ===")
        datetime_forms = {}
        for form_name, form_config in form_metadata.items():
            field_mappings = form_config.get('field_mappings', {})
            if 'datetime_fields' in field_mappings:
                datetime_forms[form_name] = field_mappings['datetime_fields']
                
        if datetime_forms:
            print("Forms with datetime field mappings:")
            pprint.pprint(datetime_forms)
        else:
            print("No forms have datetime field mappings configured")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_form_metadata()