#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow

class Command(BaseCommand):
    help = 'Fix Credit Analysis Form user field mappings in metadata'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("FIXING CREDIT ANALYSIS USER FIELD MAPPINGS")
        self.stdout.write("="*70)
        
        try:
            # Get the main Credit Paper workflow
            credit_paper_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            
            # Get current metadata
            current_metadata = credit_paper_workflow.metadata or {}
            
            # Ensure form_metadata exists
            if 'form_metadata' not in current_metadata:
                current_metadata['form_metadata'] = {}
            
            # Ensure credit_analysis_form metadata exists
            if 'credit_analysis_form' not in current_metadata['form_metadata']:
                current_metadata['form_metadata']['credit_analysis_form'] = {}
            
            # Get current credit_analysis_form metadata
            ca_metadata = current_metadata['form_metadata']['credit_analysis_form']
            
            self.stdout.write(f"\n📋 Current Credit Analysis Form metadata:")
            self.stdout.write(f"   {ca_metadata}")
            
            # Add field_mappings if not present
            if 'field_mappings' not in ca_metadata:
                ca_metadata['field_mappings'] = {}
            
            # Add user_fields mapping
            ca_metadata['field_mappings']['user_fields'] = ['credit_analyst']
            
            # Ensure other required metadata is present
            ca_metadata.update({
                'form_key': 'credit_analysis_form',
                'model_class': 'CreditAnalysisForm',
                'workflow_code': 'CREDIT_ANALYSIS',
                'title': 'Credit Analysis Form'
            })
            
            # Save the updated metadata
            credit_paper_workflow.metadata = current_metadata
            credit_paper_workflow.save()
            
            self.stdout.write(self.style.SUCCESS(f"\n✅ Updated Credit Analysis Form metadata:"))
            self.stdout.write(f"   field_mappings.user_fields: ['credit_analyst']")
            
            # Verify the update
            updated_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            ca_user_fields = updated_workflow.metadata.get('form_metadata', {}).get('credit_analysis_form', {}).get('field_mappings', {}).get('user_fields', [])
            
            self.stdout.write(f"\n🔍 Verification - user_fields: {ca_user_fields}")
            
            if 'credit_analyst' in ca_user_fields:
                self.stdout.write(self.style.SUCCESS(f"✅ credit_analyst is now properly mapped as user field"))
                
                self.stdout.write(f"\n📋 WHAT THIS FIXES:")
                self.stdout.write("1. Backend will now convert credit_analyst ID string to User object")
                self.stdout.write("2. Credit Analysis Form save operations will work correctly")
                self.stdout.write("3. No more 'must be a User instance' errors")
                self.stdout.write("4. Field data will persist correctly when saved")
            else:
                self.stdout.write(self.style.ERROR(f"❌ Verification failed - credit_analyst not found in user_fields"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    pass