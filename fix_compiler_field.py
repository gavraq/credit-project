#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from credit_applications.models import CreditCompilationForm
from credit_applications.serializers import CreditApplicationSerializer
import json

print("=" * 80)
print("DEBUGGING CREDIT COMPILATION FORM COMPILER FIELD")
print("=" * 80)

# Check the CreditCompilationForm model
print("\n=== CREDIT COMPILATION FORM MODEL ===")
print("Model fields:")
for field in CreditCompilationForm._meta.fields:
    print(f"  {field.name}: {field.__class__.__name__}")
    if field.name == 'compiler':
        print(f"    Related model: {field.related_model}")
        print(f"    Null allowed: {field.null}")
        print(f"    Blank allowed: {field.blank}")

# Check if there's any special handling in the serializer
print("\n=== SERIALIZER ANALYSIS ===")
serializer = CreditApplicationSerializer()

print("Looking for compiler field handling in serializer methods...")

# Check _extract_form_data method
if hasattr(serializer, '_extract_form_data'):
    print("Found _extract_form_data method")

# Check _update_sub_form method  
if hasattr(serializer, '_update_sub_form'):
    print("Found _update_sub_form method")

# Check if there's special handling for User fields
print("\nLooking for User field handling patterns...")

# Check existing credit compilation form instance
print("\n=== EXISTING FORM ANALYSIS ===")
try:
    existing_form = CreditCompilationForm.objects.first()
    if existing_form:
        print(f"Found existing form with compiler: {existing_form.compiler}")
        print(f"Compiler type: {type(existing_form.compiler)}")
        if existing_form.compiler:
            print(f"Compiler ID: {existing_form.compiler.id}")
    else:
        print("No existing compilation forms found")
except Exception as e:
    print(f"Error checking existing forms: {e}")

print("\n=== RECOMMENDED FIX ===")
print("The compiler field needs special handling in the serializer's _update_sub_form method.")
print("Similar to how other User ForeignKey fields are handled, we need to:")
print("1. Check if 'compiler' field is being passed as UUID string")
print("2. Convert it to User instance before saving")
print("3. Add this handling to the CreditCompilationForm update logic")