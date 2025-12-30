#!/usr/bin/env python
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditApplication

print("=" * 80)
print("DEBUGGING DA LEVEL PRE-POPULATION")
print("=" * 80)

# Check the specific application CR-2025-0003
try:
    app = CreditApplication.objects.get(reference_number='CR-2025-0003')
    print(f"✅ Found application: {app.reference_number} - {app.title}")
    
    # Check Credit Review Form DA level
    if hasattr(app, 'credit_review_form') and app.credit_review_form:
        review_form = app.credit_review_form
        print(f"\n📋 CREDIT REVIEW FORM:")
        print(f"   Delegated Authority Level: '{review_form.delegated_authority_level}'")
        print(f"   Form ID: {review_form.id}")
        print(f"   Workflow state: {review_form.workflow_instance.current_state.name if review_form.workflow_instance else 'No workflow'}")
    else:
        print(f"\n❌ No Credit Review Form found for this application")
    
    # Check Credit Approval Form DA level
    if hasattr(app, 'credit_approval_form') and app.credit_approval_form:
        approval_form = app.credit_approval_form
        print(f"\n📋 CREDIT APPROVAL FORM:")
        print(f"   Delegated Authority Level: '{approval_form.delegated_authority_level}'")
        print(f"   Form ID: {approval_form.id}")
        print(f"   Workflow state: {approval_form.workflow_instance.current_state.name if approval_form.workflow_instance else 'No workflow'}")
    else:
        print(f"\n❌ No Credit Approval Form found for this application")
        
    print(f"\n🔍 ANALYSIS:")
    if hasattr(app, 'credit_review_form') and app.credit_review_form:
        review_da = app.credit_review_form.delegated_authority_level
        if review_da:
            print(f"   ✅ Credit Review has DA level: '{review_da}'")
            
            if hasattr(app, 'credit_approval_form') and app.credit_approval_form:
                approval_da = app.credit_approval_form.delegated_authority_level
                if approval_da:
                    print(f"   ✅ Credit Approval already has DA level: '{approval_da}'")
                    if approval_da != review_da:
                        print(f"   ⚠️  DA levels don't match! Review: '{review_da}', Approval: '{approval_da}'")
                    else:
                        print(f"   ✅ DA levels match!")
                else:
                    print(f"   📝 Credit Approval DA level is empty - should be pre-populated with: '{review_da}'")
            else:
                print(f"   📝 No Credit Approval form exists yet - will be pre-populated when created")
        else:
            print(f"   ❌ Credit Review DA level is empty - nothing to pre-populate")
    
except CreditApplication.DoesNotExist:
    print("❌ Application CR-2025-0003 not found")

print(f"\n💡 RECOMMENDATION:")
print(f"   If the Credit Review form has a DA level but the frontend isn't showing it,")
print(f"   check that the API response includes the credit_review_form data with")
print(f"   the delegated_authority_level field populated.")