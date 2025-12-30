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
import json

def debug_business_sponsorship_navigation():
    print("="*60)
    print("BUSINESS SPONSORSHIP NAVIGATION DEBUG")
    print("="*60)
    
    try:
        # Check Business Sponsorship transitions metadata
        bs_workflow = Workflow.objects.get(code='BUSINESS_SPONSORSHIP')
        transitions = Transition.objects.filter(workflow=bs_workflow)

        print(f"\n📋 Found {transitions.count()} transitions in BUSINESS_SPONSORSHIP workflow")
        
        for t in transitions:
            print(f"\n" + "-"*50)
            print(f"Transition: {t.code} - {t.name}")
            print(f"From: {t.from_state.code} -> To: {t.to_state.code}")
            
            if t.metadata:
                print(f"Metadata:")
                print(json.dumps(t.metadata, indent=2))
                
                # Check specifically for navigation metadata
                ui_behavior = t.metadata.get('ui_behavior', {})
                navigate_on_success = ui_behavior.get('navigate_on_success')
                if navigate_on_success:
                    print(f"✅ Navigation configured: {navigate_on_success}")
                else:
                    print(f"❌ No navigation configured")
            else:
                print("❌ No metadata found")
                
        print(f"\n" + "="*60)
        print("SUMMARY:")
        print("- Check if BS_TR_2 (Submit for In Progress) has navigate_on_success: '/'")
        print("- This should make the form navigate back to dashboard after transition")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_business_sponsorship_navigation()