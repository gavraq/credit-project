#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow

print("=" * 80)
print("FIXING CREDIT APPROVAL FORM METADATA")
print("=" * 80)

# Get the parent workflow
parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

if parent_workflow.metadata and 'form_metadata' in parent_workflow.metadata:
    form_metadata = parent_workflow.metadata['form_metadata']
    
    if 'credit_approval_form' in form_metadata:
        print("\nCurrent metadata:")
        print(json.dumps(form_metadata['credit_approval_form'], indent=2))
        
        # Add field_mappings for user fields
        form_metadata['credit_approval_form']['field_mappings'] = {
            'user_fields': ['approver']
        }
        
        # Save the updated metadata
        parent_workflow.save()
        
        print("\n✅ Updated metadata:")
        print(json.dumps(form_metadata['credit_approval_form'], indent=2))
    else:
        print("\n❌ credit_approval_form not found in form_metadata")
else:
    print("\n❌ No form_metadata found in workflow")

print("\n✅ Credit Approval Form metadata updated with user field mappings!")