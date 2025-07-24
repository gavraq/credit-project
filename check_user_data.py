#!/usr/bin/env python3
"""
Check user data to see if there are any issues with the user accounts.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def check_user_data():
    """Check user data for any issues"""
    print("=" * 60)
    print("CHECKING USER DATA")
    print("=" * 60)
    
    # Check all users
    users = User.objects.all()
    print(f"Found {users.count()} users")
    
    for user in users:
        print(f"\nUser: {user.username}")
        print(f"  ID: {user.id}")
        print(f"  First name: '{user.first_name}'")
        print(f"  Last name: '{user.last_name}'")
        print(f"  Full name: '{user.first_name} {user.last_name}'")
        print(f"  Role: {user.role.name if user.role else 'None'}")
        print(f"  DA Level: {user.da_level}")
        
        # Check if username contains "holmes"
        if "holmes" in user.username.lower():
            print(f"  🔍 This user has 'holmes' in username!")
            
        if "holmes" in f"{user.first_name} {user.last_name}".lower():
            print(f"  🔍 This user has 'holmes' in name!")

def main():
    check_user_data()

if __name__ == '__main__':
    main()