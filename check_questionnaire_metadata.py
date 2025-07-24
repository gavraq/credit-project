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
from workflow_engine.utils import get_dynamic_form_prefixes

def check_questionnaire_metadata():
    print("="*80)
    print("CHECKING CREDIT QUESTIONNAIRE FORM METADATA")
    print("="*80)
    
    try:
        # Check workflow metadata
        workflow = Workflow.objects.get(code='CREDIT_PAPER')
        
        if workflow.metadata and 'form_metadata' in workflow.metadata:
            form_metadata = workflow.metadata['form_metadata']
            print(f"\nForms in workflow metadata:")
            for form_name in form_metadata.keys():
                print(f"  - {form_name}")
                
            if 'credit_questionnaire_form' in form_metadata:
                print(f"\n✅ Credit Questionnaire Form FOUND in metadata")
                cq_metadata = form_metadata['credit_questionnaire_form']
                print(f"Credit Questionnaire metadata: {cq_metadata}")
            else:
                print(f"\n❌ Credit Questionnaire Form NOT found in metadata")
                
        else:
            print("❌ No form_metadata found in workflow")
            
        # Check dynamic prefix mapping
        print(f"\n" + "-"*50)
        print("DYNAMIC PREFIX MAPPING")
        print("-"*50)
        
        prefixes = get_dynamic_form_prefixes()
        print(f"Available prefixes:")
        for prefix, form_name in prefixes.items():
            print(f"  {prefix} -> {form_name}")
            
        if 'credit_questionnaire_' in prefixes:
            print(f"\n✅ credit_questionnaire_ prefix FOUND")
        else:
            print(f"\n❌ credit_questionnaire_ prefix NOT found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_questionnaire_metadata()