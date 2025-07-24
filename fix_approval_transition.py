#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, Transition

print("=" * 80)
print("FIXING CREDIT APPROVAL TRANSITION SYSTEM ACTION")
print("=" * 80)

# Get the Credit Approval workflow
approval_workflow = Workflow.objects.get(code='CREDIT_APPROVAL')
print(f"✅ Found Credit Approval workflow: {approval_workflow.name}")

# Find the CA_TR_4 transition that needs to be fixed
ca_tr_4 = Transition.objects.get(workflow=approval_workflow, code='CA_TR_4')
print(f"\n📋 Current CA_TR_4 transition:")
print(f"   Name: {ca_tr_4.name}")
print(f"   From: {ca_tr_4.from_state.name}")
print(f"   To: {ca_tr_4.to_state.name}")
print(f"   Current System Action: {ca_tr_4.system_action}")

# Update the system action
print(f"\n🔄 Updating system action from '{ca_tr_4.system_action}' to 'submit_credit_approval'")
ca_tr_4.system_action = 'submit_credit_approval'
ca_tr_4.save()

print(f"✅ Updated CA_TR_4 transition:")
print(f"   Name: {ca_tr_4.name}")
print(f"   From: {ca_tr_4.from_state.name}")
print(f"   To: {ca_tr_4.to_state.name}")
print(f"   New System Action: {ca_tr_4.system_action}")

print(f"\n🎯 Summary:")
print(f"   ✅ Created handle_submit_credit_approval function")
print(f"   ✅ Added submit_credit_approval to system actions registry")
print(f"   ✅ Updated CA_TR_4 to use submit_credit_approval system action")
print(f"\n🚀 Credit Approval workflow parent transitions are now properly configured!")

print(f"\n📋 Next steps for testing:")
print(f"   1. Navigate to Credit Approval Form for application CR-2025-0003")
print(f"   2. Fill in approval decision (approved/rejected)")
print(f"   3. Submit the form - it should automatically transition parent workflow")
print(f"   4. Check that main workflow moves from 'Approval Pending' to 'Approved' or 'Rejected'")