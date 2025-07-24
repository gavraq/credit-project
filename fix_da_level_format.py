#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditReviewForm, CreditApprovalForm

print("=" * 80)
print("FIXING DELEGATED AUTHORITY LEVEL FORMAT")
print("=" * 80)

print("🔄 Fixing Credit Review Forms...")
review_forms = CreditReviewForm.objects.all()
fixed_count = 0

for form in review_forms:
    da_level = form.delegated_authority_level
    if da_level and not da_level.startswith('DA') and da_level.isdigit():
        old_value = da_level
        new_value = f'DA{da_level}'
        form.delegated_authority_level = new_value
        form.save()
        print(f"   ✅ Fixed {form.credit_application.reference_number}: '{old_value}' -> '{new_value}'")
        fixed_count += 1
    elif da_level:
        print(f"   ⏭️  Skipped {form.credit_application.reference_number}: already correct format '{da_level}'")

print(f"\n📊 Summary:")
print(f"   Fixed {fixed_count} Credit Review Form(s)")

print(f"\n🔄 Checking Credit Approval Forms...")
approval_forms = CreditApprovalForm.objects.all()
approval_fixed_count = 0

for form in approval_forms:
    da_level = form.delegated_authority_level
    if da_level and not da_level.startswith('DA') and da_level.isdigit():
        old_value = da_level
        new_value = f'DA{da_level}'
        form.delegated_authority_level = new_value
        form.save()
        print(f"   ✅ Fixed {form.credit_application.reference_number}: '{old_value}' -> '{new_value}'")
        approval_fixed_count += 1
    elif da_level:
        print(f"   ⏭️  Skipped {form.credit_application.reference_number}: already correct format '{da_level}'")
    else:
        print(f"   ⏭️  Skipped {form.credit_application.reference_number}: no DA level set")

print(f"\n📊 Final Summary:")
print(f"   Fixed {fixed_count} Credit Review Form(s)")
print(f"   Fixed {approval_fixed_count} Credit Approval Form(s)")

print(f"\n✅ All DA levels are now in proper 'DA' + number format!")
print(f"   You can now test the Credit Approval Form pre-population.")