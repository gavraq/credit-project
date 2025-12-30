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

from credit_applications.models import CreditApplication, CreditQuestionnaireForm

def check_saved_data():
    print("="*80)
    print("CHECKING SAVED CREDIT QUESTIONNAIRE DATA")
    print("="*80)
    
    try:
        # Find the most recent credit application
        latest_app = CreditApplication.objects.filter(
            credit_questionnaire_form__isnull=False
        ).order_by('-created_at').first()
        
        if not latest_app:
            print("❌ No credit applications with questionnaire forms found")
            return
            
        print(f"Found Credit Application: {latest_app.reference_number}")
        
        # Get the questionnaire form
        questionnaire_form = latest_app.credit_questionnaire_form
        print(f"\nCredit Questionnaire Form ID: {questionnaire_form.id}")
        print(f"Form Data Type: {type(questionnaire_form.form_data)}")
        print(f"Form Data Content:")
        
        if questionnaire_form.form_data:
            if isinstance(questionnaire_form.form_data, dict):
                for key, value in questionnaire_form.form_data.items():
                    if value:  # Only show non-empty values
                        print(f"  {key}: {value}")
            else:
                print(f"  Raw form_data: {questionnaire_form.form_data}")
        else:
            print("  ❌ form_data is empty or None")
            
        print(f"\nWorkflow Instance: {questionnaire_form.workflow_instance}")
        if questionnaire_form.workflow_instance:
            print(f"Current State: {questionnaire_form.workflow_instance.current_state}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_saved_data()