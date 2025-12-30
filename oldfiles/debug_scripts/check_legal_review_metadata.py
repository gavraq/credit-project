#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow
from workflow_engine.utils import get_dynamic_field_mappings

print("=" * 80)
print("CHECKING LEGAL REVIEW FORM METADATA")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

print("\nParent workflow metadata:")
if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    if 'legal_review_form' in form_metadata:
        print("\nLegal Review Form metadata:")
        print(json.dumps(form_metadata['legal_review_form'], indent=2))
    else:
        print("\n❌ legal_review_form not found in form_metadata")
else:
    print("\n❌ No form_metadata found in workflow")

# Check dynamic field mappings
print("\n" + "=" * 50)
print("DYNAMIC FIELD MAPPINGS")
print("=" * 50)

field_mappings = get_dynamic_field_mappings()
print("\nBoolean fields mapping:")
if 'legal_review_form' in field_mappings['boolean_fields']:
    print(f"  legal_review_form: {field_mappings['boolean_fields']['legal_review_form']}")
else:
    print("  ❌ legal_review_form has no boolean fields defined in metadata")

# Check the actual model fields
print("\n" + "=" * 50)
print("LEGAL REVIEW FORM MODEL FIELDS")
print("=" * 50)

from credit_applications.models import LegalReviewForm

# Get all fields from the model
all_fields = LegalReviewForm._meta.get_fields()
boolean_fields = []

for field in all_fields:
    if hasattr(field, 'get_internal_type') and field.get_internal_type() == 'BooleanField':
        boolean_fields.append(field.name)
        
print(f"\nBoolean fields in LegalReviewForm model:")
for field in boolean_fields:
    print(f"  - {field}")

print("\n" + "=" * 50)
print("RECOMMENDATION")
print("=" * 50)
print("\nThe boolean fields that need to be added to the workflow metadata:")
print(f"  'field_mappings': {{")
print(f"    'boolean_fields': {boolean_fields}")
print(f"  }}")