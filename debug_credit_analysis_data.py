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

from credit_applications.models import CreditApplication, CreditAnalysisForm

def debug_credit_analysis_data():
    print("="*80)
    print("DEBUGGING CREDIT ANALYSIS DATA SAVING")
    print("="*80)
    
    try:
        # Get the most recent credit application
        app = CreditApplication.objects.order_by('-created_at').first()
        if app:
            print(f"\n📋 Application: {app.reference_number}")
            
            # Check if credit analysis form exists
            try:
                analysis_form = app.credit_analysis_form
                print(f"\n✅ CreditAnalysisForm exists:")
                print(f"   ID: {analysis_form.id}")
                print(f"   Credit Analyst: {analysis_form.credit_analyst}")
                print(f"   Industry Analysis: '{analysis_form.industry_analysis}'")
                print(f"   Business Model Assessment: '{analysis_form.business_model_assessment}'")
                print(f"   Management Quality: '{analysis_form.management_quality}'")
                print(f"   Executive Summary: '{analysis_form.executive_summary}'")
                print(f"   Recommendation: '{analysis_form.recommendation}'")
                print(f"   Created: {analysis_form.created_at}")
                print(f"   Updated: {analysis_form.updated_at}")
                print(f"   Last Saved: {analysis_form.form_last_saved_at}")
                
                # Check if it has a workflow instance
                if analysis_form.workflow_instance:
                    print(f"\n✅ Workflow Instance:")
                    print(f"   ID: {analysis_form.workflow_instance.id}")
                    print(f"   Current State: {analysis_form.workflow_instance.current_state}")
                else:
                    print(f"\n❌ No workflow instance attached")
                    
            except CreditAnalysisForm.DoesNotExist:
                print(f"\n❌ No CreditAnalysisForm found for this application")
                
        # Check form metadata prefix
        from workflow_engine.utils import get_form_metadata
        try:
            metadata = get_form_metadata('credit_analysis_form')
            print(f"\n📋 Form Metadata:")
            print(f"   Form Key: {metadata.get('form_key')}")
            print(f"   Expected Prefix: {metadata.get('form_key')}_")
        except Exception as e:
            print(f"\n❌ Error getting form metadata: {e}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_credit_analysis_data()