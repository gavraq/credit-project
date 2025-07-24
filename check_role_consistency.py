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

from django.contrib.auth import get_user_model
from workflow_engine.models import Transition

User = get_user_model()

def check_role_consistency():
    print("="*60)
    print("CHECKING ROLE CONSISTENCY")
    print("="*60)
    
    # Get all roles from User model
    print("📋 ROLES IN DATABASE:")
    print("-" * 30)
    
    try:
        if hasattr(User, 'role'):
            # Get the role model
            role_model = User._meta.get_field('role').related_model
            actual_roles = role_model.objects.all()
            
            actual_role_names = []
            for role in actual_roles:
                print(f"  - {role.name}")
                actual_role_names.append(role.name)
        else:
            print("  No role field found on User model")
            return
            
    except Exception as e:
        print(f"  Error getting roles: {e}")
        return
    
    # Get all roles used in transitions
    print(f"\n📋 ROLES USED IN TRANSITIONS:")
    print("-" * 30)
    
    transition_roles = set()
    transitions = Transition.objects.all()
    
    for transition in transitions:
        if transition.allowed_roles:
            for role in transition.allowed_roles:
                transition_roles.add(role)
    
    for role in sorted(transition_roles):
        print(f"  - '{role}'")
    
    # Check for mismatches
    print(f"\n📊 ROLE CONSISTENCY CHECK:")
    print("-" * 30)
    
    mismatches = []
    for trans_role in transition_roles:
        # Check for exact match
        if trans_role not in actual_role_names:
            # Check for case-insensitive match
            case_match = None
            for actual_role in actual_role_names:
                if trans_role.lower() == actual_role.lower():
                    case_match = actual_role
                    break
            
            if case_match:
                mismatches.append(f"Case mismatch: '{trans_role}' should be '{case_match}'")
            else:
                mismatches.append(f"Role not found: '{trans_role}' doesn't exist in database")
    
    if mismatches:
        print("❌ ISSUES FOUND:")
        for issue in mismatches:
            print(f"  - {issue}")
            
        print(f"\n🔧 RECOMMENDED FIXES:")
        print("1. Update transition role names to match database exactly")
        print("2. Ensure role names are consistent (case-sensitive)")
        print("3. Consider creating missing roles if they should exist")
    else:
        print("✅ All transition roles match database roles!")
    
    print("\n" + "="*60)

if __name__ == '__main__':
    check_role_consistency()