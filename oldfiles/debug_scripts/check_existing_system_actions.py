#!/usr/bin/env python
import os
import django
import inspect

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.actions import SYSTEM_ACTIONS_REGISTRY

print("=" * 80)
print("CHECKING EXISTING SYSTEM ACTIONS")
print("=" * 80)

print("📋 CURRENTLY REGISTERED SYSTEM ACTIONS:")
print("-" * 50)
for action_name, action_func in SYSTEM_ACTIONS_REGISTRY.items():
    print(f"✅ {action_name}")
    # Get the function signature and docstring
    sig = inspect.signature(action_func)
    doc = action_func.__doc__ or "No documentation"
    print(f"   Signature: {action_name}{sig}")
    print(f"   Description: {doc.strip()}")
    print()

print("\n📋 ANALYSIS:")
print("-" * 50)
if 'submit_credit_analysis' in SYSTEM_ACTIONS_REGISTRY:
    print("✅ Found submit_credit_analysis - handles analysis phase completion")
else:
    print("❌ Missing submit_credit_analysis")

if 'submit_credit_approval' in SYSTEM_ACTIONS_REGISTRY:
    print("✅ Found submit_credit_approval - handles approval phase completion")
else:
    print("❌ Missing submit_credit_approval - NEEDS TO BE CREATED")

print(f"\nTotal system actions registered: {len(SYSTEM_ACTIONS_REGISTRY)}")

print("\n=" * 80)
print("RECOMMENDATION")
print("=" * 80)
print("If submit_credit_approval is missing, we need to:")
print("1. Create handle_submit_credit_approval function in workflow_engine/actions.py")
print("2. Add it to SYSTEM_ACTIONS_REGISTRY")
print("3. Update Credit Approval workflow transitions to use this system action")
print("4. Update main workflow transitions to be triggered by this system action")