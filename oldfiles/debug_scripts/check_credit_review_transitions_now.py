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

from workflow_engine.models import Workflow, Transition

def check_current_state():
    print("="*60)
    print("CHECKING CURRENT CREDIT_REVIEW TRANSITIONS")
    print("="*60)
    
    try:
        workflow = Workflow.objects.get(code='CREDIT_REVIEW')
        transitions = Transition.objects.filter(workflow=workflow).order_by('code')
        
        print(f"Found {transitions.count()} transitions in CREDIT_REVIEW workflow:\n")
        
        for t in transitions:
            print(f"🔹 {t.code}: {t.name}")
            print(f"   From: {t.from_state.name} → To: {t.to_state.name}")
            print(f"   Allowed roles: {t.allowed_roles}")
            print(f"   Raw allowed_roles data type: {type(t.allowed_roles)}")
            print()
            
    except Workflow.DoesNotExist:
        print("❌ CREDIT_REVIEW workflow not found")
    
    print("="*60)

if __name__ == '__main__':
    check_current_state()