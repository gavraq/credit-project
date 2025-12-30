#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from credit_applications.serializers import CreditApplicationSerializer
import inspect

User = get_user_model()

print("=" * 80)
print("FIXING CREDIT COMPILATION FORM COMPILER FIELD IN SERIALIZER")
print("=" * 80)

# Read the current serializer file
serializer_path = "/Users/gavinslater/projects/credit-project/credit_applications/serializers.py"

print(f"Reading serializer file: {serializer_path}")

with open(serializer_path, 'r') as f:
    content = f.read()

print("\n=== CURRENT SERIALIZER ANALYSIS ===")

# Look for CreditCompilationForm handling
if 'credit_compilation_form' in content:
    print("✅ Found credit_compilation_form handling in serializer")
else:
    print("❌ No credit_compilation_form handling found")

# Look for User field handling patterns
if 'User.objects.get' in content:
    print("✅ Found existing User field handling patterns")
else:
    print("❌ No User field handling patterns found")

# Check for the specific compiler field issue
if 'compiler' in content:
    print("✅ Found compiler field references")
    # Find the lines with compiler
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'compiler' in line:
            print(f"  Line {i+1}: {line.strip()}")
else:
    print("❌ No compiler field references found")

print("\n=== APPLYING FIX ===")

# The fix: Add User field handling for compiler in the compilation form section
fix_needed = True

# Look for the _update_sub_form method for CreditCompilationForm
if "elif form_prefix == 'credit_compilation_form':" in content and "if 'compiler' in form_data and form_data['compiler']:" in content:
    print("✅ Compiler field handling already exists")
    fix_needed = False

if fix_needed:
    print("Adding compiler field handling...")
    
    # Find the CreditCompilationForm update section
    pattern_to_find = "elif form_prefix == 'credit_compilation_form':"
    
    if pattern_to_find in content:
        # Find where to insert the User field handling
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if pattern_to_find in line:
                # Look for the next few lines to find where to insert
                insertion_point = i + 1
                while insertion_point < len(lines) and not lines[insertion_point].strip().startswith('form_instance'):
                    insertion_point += 1
                
                # Insert the compiler handling before form_instance creation
                user_handling = """
            # Handle User fields for CreditCompilationForm
            if 'compiler' in form_data and form_data['compiler']:
                try:
                    form_data['compiler'] = User.objects.get(id=form_data['compiler'])
                except User.DoesNotExist:
                    # Keep the original value, let the model validation handle the error
                    pass"""
                
                lines.insert(insertion_point, user_handling)
                
                # Write back to file
                updated_content = '\n'.join(lines)
                
                with open(serializer_path, 'w') as f:
                    f.write(updated_content)
                
                print("✅ Added compiler field handling to serializer")
                break
    else:
        print("❌ Could not find CreditCompilationForm update section")
        print("Manual fix needed - add User field handling for compiler field")
else:
    print("✅ No fix needed - compiler handling already exists")

print("\n✅ Serializer fix complete!")