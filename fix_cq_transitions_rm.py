#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from workflow_engine.models import Workflow, State, Transition

print("=" * 80)
print("FIXING CREDIT QUESTIONNAIRE TRANSITION ROLES FOR RELATIONSHIP MANAGER")
print("=" * 80)

# Get the Credit Questionnaire workflow
cq_workflow = Workflow.objects.get(code='CREDIT_QUESTIONNAIRE')

# Update ALL transitions to be primarily for Relationship Manager
all_transitions = Transition.objects.filter(workflow=cq_workflow)

print(f"\nUpdating all Credit Questionnaire transitions:")
for t in all_transitions:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  From: {t.from_state.name} -> To: {t.to_state.name}")
    print(f"  Current allowed_roles: {t.allowed_roles}")
    
    # Update to Relationship Manager as primary user
    # Credit Analyst can view but RM is the one who fills out the questionnaire
    t.allowed_roles = ['Relationship Manager']
    t.save()
    
    print(f"  Updated allowed_roles: {t.allowed_roles}")

print("\n✅ All transitions updated successfully!")

# Also update the workflow metadata if needed
print("\n" + "=" * 50)
print("UPDATING WORKFLOW METADATA")
print("=" * 50)

# Update the parent workflow metadata to reflect RM as primary editor
from workflow_engine.models import Workflow as ParentWorkflow
parent_workflow = ParentWorkflow.objects.get(name='Credit Paper Approval Workflow')

if 'forms' in parent_workflow.metadata:
    for form in parent_workflow.metadata['forms']:
        if form.get('form_key') == 'credit_questionnaire_form':
            print(f"\nCurrent metadata for credit_questionnaire_form:")
            print(f"  Editable by: {form.get('editable_by_roles', [])}")
            
            # Update to make RM the primary editor
            form['editable_by_roles'] = ['relationship_manager']
            parent_workflow.save()
            
            print(f"  Updated editable_by: {form['editable_by_roles']}")

print("\n" + "=" * 50)
print("FINAL VERIFICATION")
print("=" * 50)

# Verify all changes
all_transitions = Transition.objects.filter(workflow=cq_workflow).order_by('from_state__name', 'name')
print(f"\nAll Credit Questionnaire transitions after update:")
for t in all_transitions:
    print(f"\n{t.name} (code: {t.code})")
    print(f"  From: {t.from_state.name} -> To: {t.to_state.name}")
    print(f"  allowed_roles: {t.allowed_roles}")

# Check parent workflow metadata
parent_workflow.refresh_from_db()
if 'forms' in parent_workflow.metadata:
    for form in parent_workflow.metadata['forms']:
        if form.get('form_key') == 'credit_questionnaire_form':
            print(f"\nParent workflow metadata for credit_questionnaire_form:")
            print(f"  Editable by: {form.get('editable_by_roles', [])}")
            print(f"  Viewable by: {form.get('viewable_by_roles', [])}")