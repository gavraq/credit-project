#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow

print("=" * 80)
print("CHECKING ALL FORM METADATA PATTERNS")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    print("\nAnalyzing metadata structure for all forms:")
    print("-" * 50)
    
    for form_name, form_config in form_metadata.items():
        print(f"\n{form_name}:")
        print(f"  Basic fields: {list(form_config.keys())}")
        
        # Check if field_mappings exists
        if 'field_mappings' in form_config:
            print(f"  ✅ Has field_mappings:")
            field_mappings = form_config['field_mappings']
            if 'boolean_fields' in field_mappings:
                print(f"     - boolean_fields: {field_mappings['boolean_fields']}")
            if 'user_fields' in field_mappings:
                print(f"     - user_fields: {field_mappings['user_fields']}")
            if 'datetime_fields' in field_mappings:
                print(f"     - datetime_fields: {field_mappings['datetime_fields']}")
        else:
            print(f"  ❌ No field_mappings")
    
    # Show a specific example with field_mappings
    print("\n" + "=" * 50)
    print("EXAMPLE OF FORM WITH FIELD_MAPPINGS")
    print("=" * 50)
    
    # Find a form with field_mappings as an example
    for form_name, form_config in form_metadata.items():
        if 'field_mappings' in form_config:
            print(f"\nExample: {form_name}")
            print(json.dumps(form_config, indent=2))
            break
    
else:
    print("\n❌ No form_metadata found in workflow")