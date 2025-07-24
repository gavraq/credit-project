#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow

print("=" * 80)
print("UPDATING LEGAL REVIEW FORM METADATA")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

print("\nCurrent metadata for legal_review_form:")
if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    if 'legal_review_form' in form_metadata:
        print(json.dumps(form_metadata['legal_review_form'], indent=2))
        
        # Add field_mappings with boolean_fields
        form_metadata['legal_review_form']['field_mappings'] = {
            'boolean_fields': [
                'positive_netting_opinion', 
                'has_csa', 
                'iosco_compliant', 
                'positive_collateral_opinion'
            ]
        }
        
        # Save the updated metadata
        parent_workflow.metadata['form_metadata'] = form_metadata
        parent_workflow.save()
        
        print("\n✅ Updated metadata for legal_review_form:")
        print(json.dumps(form_metadata['legal_review_form'], indent=2))
    else:
        print("\n❌ legal_review_form not found in form_metadata")
else:
    print("\n❌ No form_metadata found in workflow")

# Verify the update worked
print("\n" + "=" * 50)
print("VERIFICATION")
print("=" * 50)

from workflow_engine.utils import get_dynamic_field_mappings

field_mappings = get_dynamic_field_mappings()
print("\nBoolean fields mapping after update:")
if 'legal_review_form' in field_mappings['boolean_fields']:
    print(f"  legal_review_form: {field_mappings['boolean_fields']['legal_review_form']}")
else:
    print("  ❌ legal_review_form still has no boolean fields defined")

print("\n✅ Legal Review Form metadata updated successfully!")