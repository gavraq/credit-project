#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow

class Command(BaseCommand):
    help = 'Fix Business Sponsorship navigation metadata to match other forms'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("FIXING BUSINESS SPONSORSHIP NAVIGATION METADATA")
        self.stdout.write("="*70)
        
        try:
            # Get Business Sponsorship workflow
            bs_workflow = Workflow.objects.get(code='BUSINESS_SPONSORSHIP')
            
            # Define navigation metadata for each transition
            navigation_updates = [
                {
                    'code': 'BS_TR_1',  # Save as Draft
                    'name': 'Save as Draft',
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'primary',
                            'navigate_on_success': '/'
                        }
                    }
                },
                {
                    'code': 'BS_TR_2',  # Submit for In Progress  
                    'name': 'Submit for In Progress',
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'success',
                            'navigate_on_success': '/'
                        }
                    }
                },
                {
                    'code': 'BS_TR_3',  # Save as Draft from In Progress
                    'name': 'Save as Draft from In Progress', 
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'primary',
                            'navigate_on_success': '/'
                        }
                    }
                },
                {
                    'code': 'BS_TR_4',  # Submit (keep existing metadata, add navigation)
                    'name': 'Submit',
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'success',
                            'navigate_on_success': '/'
                        },
                        'system_action': 'submit_credit_request',
                        'parent_workflow': {
                            'from_state': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING',
                            'description': 'Auto-transition parent to Analysis Pending after Business Sponsorship submission',
                            'transition_code': 'PP_TR_4'
                        }
                    }
                }
            ]
            
            updated_count = 0
            
            for update in navigation_updates:
                transition = Transition.objects.filter(
                    workflow=bs_workflow,
                    code=update['code']
                ).first()
                
                if transition:
                    self.stdout.write(f"\n📋 Updating {update['code']} - {transition.name}")
                    
                    # For BS_TR_4, merge with existing metadata
                    if update['code'] == 'BS_TR_4' and transition.metadata:
                        existing_metadata = transition.metadata.copy()
                        existing_metadata['ui_behavior'] = update['metadata']['ui_behavior']
                        transition.metadata = existing_metadata
                    else:
                        # For others, use the new metadata
                        transition.metadata = update['metadata']
                    
                    transition.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"   ✅ Added navigation: {update['metadata']['ui_behavior']['navigate_on_success']}"
                    ))
                    updated_count += 1
                else:
                    self.stdout.write(self.style.WARNING(
                        f"   ⚠️  Transition {update['code']} not found"
                    ))
            
            self.stdout.write(f"\n" + "="*70)
            self.stdout.write(self.style.SUCCESS(f"✅ Updated {updated_count} Business Sponsorship transitions"))
            
            if updated_count > 0:
                self.stdout.write(f"\n📋 NOW BUSINESS SPONSORSHIP FORM SHOULD:")
                self.stdout.write("1. Navigate back to dashboard (/) after any transition")
                self.stdout.write("2. Have proper button styling (Save as Draft = blue, Submit = green)")
                self.stdout.write("3. Follow same pattern as Credit Request/Review forms")
                self.stdout.write("4. Prevent the 'staying on edit screen' issue")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))

if __name__ == '__main__':
    pass