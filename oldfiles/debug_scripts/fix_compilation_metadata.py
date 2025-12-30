#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow

print("=" * 80)
print("FIXING CREDIT COMPILATION FORM METADATA")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    if 'credit_compilation_form' in form_metadata:
        print("\nCurrent metadata:")
        print(json.dumps(form_metadata['credit_compilation_form'], indent=2))
        
        # Add field_mappings
        form_metadata['credit_compilation_form']['field_mappings'] = {
            'boolean_fields': ['all_forms_reviewed', 'ready_for_approval']
        }
        
        # Save the updated metadata
        parent_workflow.save()
        
        print("\n✅ Updated metadata:")
        print(json.dumps(form_metadata['credit_compilation_form'], indent=2))
    else:
        print("\n❌ credit_compilation_form not found in form_metadata")
else:
    print("\n❌ No form_metadata found in workflow")

print("\n✅ Credit Compilation Form metadata updated successfully!")