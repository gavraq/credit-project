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

def audit_all_navigation_metadata():
    print("="*80)
    print("AUDIT: NAVIGATION METADATA ACROSS ALL WORKFLOWS")
    print("="*80)
    
    try:
        # Get all workflows
        workflows = Workflow.objects.all().order_by('code')
        
        missing_navigation = []
        has_navigation = []
        
        for workflow in workflows:
            print(f"\n🔍 WORKFLOW: {workflow.code} - {workflow.name}")
            print("-" * 60)
            
            transitions = Transition.objects.filter(workflow=workflow).order_by('code')
            
            for transition in transitions:
                print(f"\n   📋 {transition.code} - {transition.name}")
                print(f"      From: {transition.from_state.code} -> To: {transition.to_state.code}")
                
                if transition.metadata:
                    ui_behavior = transition.metadata.get('ui_behavior', {})
                    navigate_on_success = ui_behavior.get('navigate_on_success')
                    
                    if navigate_on_success:
                        print(f"      ✅ Navigation: {navigate_on_success}")
                        has_navigation.append(f"{workflow.code}:{transition.code}")
                    else:
                        print(f"      ❌ No navigation configured")
                        missing_navigation.append(f"{workflow.code}:{transition.code}")
                        
                    # Show other ui_behavior settings
                    button_style = ui_behavior.get('button_style')
                    if button_style:
                        print(f"      🎨 Button style: {button_style}")
                else:
                    print(f"      ❌ No metadata at all")
                    missing_navigation.append(f"{workflow.code}:{transition.code}")
        
        # Summary
        print(f"\n" + "="*80)
        print("SUMMARY REPORT")
        print("="*80)
        
        print(f"\n✅ TRANSITIONS WITH NAVIGATION ({len(has_navigation)}):")
        for item in has_navigation:
            print(f"   {item}")
            
        print(f"\n❌ TRANSITIONS MISSING NAVIGATION ({len(missing_navigation)}):")
        for item in missing_navigation:
            print(f"   {item}")
            
        # Group by workflow
        workflows_missing = {}
        for item in missing_navigation:
            workflow_code = item.split(':')[0]
            if workflow_code not in workflows_missing:
                workflows_missing[workflow_code] = []
            workflows_missing[workflow_code].append(item.split(':')[1])
            
        print(f"\n📊 WORKFLOWS NEEDING NAVIGATION FIXES:")
        for workflow_code, transition_codes in workflows_missing.items():
            print(f"   {workflow_code}: {', '.join(transition_codes)}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    audit_all_navigation_metadata()