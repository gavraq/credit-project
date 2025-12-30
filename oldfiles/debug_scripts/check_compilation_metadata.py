#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow
from credit_applications.models import CreditCompilationForm

print("=" * 80)
print("CHECKING CREDIT COMPILATION FORM METADATA")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    if 'credit_compilation_form' in form_metadata:
        print("\nCredit Compilation Form metadata:")
        print(json.dumps(form_metadata['credit_compilation_form'], indent=2))
    else:
        print("\n❌ credit_compilation_form not found in form_metadata")
else:
    print("\n❌ No form_metadata found in workflow")

# Check the actual model fields for boolean types
print("\n" + "=" * 50)
print("CREDIT COMPILATION FORM MODEL FIELDS")
print("=" * 50)

# Get all fields from the model
all_fields = CreditCompilationForm._meta.get_fields()
boolean_fields = []

for field in all_fields:
    if hasattr(field, 'get_internal_type') and field.get_internal_type() == 'BooleanField':
        boolean_fields.append(field.name)
        
print(f"\nBoolean fields in CreditCompilationForm model:")
for field in boolean_fields:
    print(f"  - {field}")

if boolean_fields:
    print(f"\n=== RECOMMENDATION ===")
    print(f"Add to workflow metadata:")
    print(f"  'field_mappings': {{")
    print(f"    'boolean_fields': {boolean_fields}")
    print(f"  }}")
else:
    print("\n✅ No boolean fields found - no metadata update needed")