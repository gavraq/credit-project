#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditReviewForm, CreditApprovalForm

print("=" * 80)
print("CHECKING DELEGATED AUTHORITY LEVEL VALUES")
print("=" * 80)

print("📋 CREDIT REVIEW FORMS - DA LEVEL VALUES:")
print("-" * 50)
review_forms = CreditReviewForm.objects.all()
for form in review_forms:
    da_level = form.delegated_authority_level
    print(f"   ID: {form.id} | DA Level: '{da_level}' | App: {form.credit_application.reference_number}")

print(f"\n📋 CREDIT APPROVAL FORMS - DA LEVEL VALUES:")
print("-" * 50)
approval_forms = CreditApprovalForm.objects.all()
for form in approval_forms:
    da_level = form.delegated_authority_level
    print(f"   ID: {form.id} | DA Level: '{da_level}' | App: {form.credit_application.reference_number}")

print(f"\n🔍 ANALYSIS:")
print("-" * 50)

# Check for inconsistent values
review_values = set(form.delegated_authority_level for form in review_forms if form.delegated_authority_level)
approval_values = set(form.delegated_authority_level for form in approval_forms if form.delegated_authority_level)

print(f"Review form DA values found: {review_values}")
print(f"Approval form DA values found: {approval_values}")

# Check for values that don't match expected format
expected_da_values = {'DA1', 'DA2', 'DA3', 'DA4', 'DA5', 'DA6', 'DA7', 'DA8', 'CC'}
unexpected_review = review_values - expected_da_values
unexpected_approval = approval_values - expected_da_values

if unexpected_review:
    print(f"⚠️  Unexpected DA values in review forms: {unexpected_review}")
    print(f"   These should be in format 'DA1', 'DA2', etc.")
    
if unexpected_approval:
    print(f"⚠️  Unexpected DA values in approval forms: {unexpected_approval}")
    print(f"   These should be in format 'DA1', 'DA2', etc.")

if not unexpected_review and not unexpected_approval:
    print(f"✅ All DA values are in expected format")

print(f"\n💡 RECOMMENDATION:")
if unexpected_review or unexpected_approval:
    print(f"   Need to fix data format - convert numbers to 'DA' + number format")
    if '5' in review_values:
        print(f"   Example: '5' should be 'DA5'")
else:
    print(f"   DA values are correctly formatted - check frontend pre-population logic")