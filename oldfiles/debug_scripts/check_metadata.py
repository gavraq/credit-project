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

from workflow_engine.models import Workflow
import json

def check_metadata():
    print("="*60)
    print("CHECKING WORKFLOW METADATA")
    print("="*60)
    
    try:
        workflow = Workflow.objects.get(code='CREDIT_PAPER')
        form_metadata = workflow.metadata.get('form_metadata', {})
        
        credit_review_metadata = form_metadata.get('credit_review_form', {})
        print(f"\n📋 CREDIT REVIEW FORM METADATA:")
        print("-" * 40)
        print(json.dumps(credit_review_metadata, indent=2))
        
        field_mappings = credit_review_metadata.get('field_mappings', {})
        user_fields = field_mappings.get('user_fields', [])
        
        print(f"\n📋 CURRENT USER FIELDS: {user_fields}")
        print("-" * 40)
        
        if 'credit_reviewer' not in user_fields:
            print("❌ 'credit_reviewer' missing from user_fields")
        if 'assigned_credit_analyst' not in user_fields:
            print("❌ 'assigned_credit_analyst' missing from user_fields")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_metadata()