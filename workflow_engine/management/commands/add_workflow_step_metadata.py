#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import State, Workflow

class Command(BaseCommand):
    help = 'Add step_number metadata to workflow states for UI progress display'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("ADDING STEP NUMBER METADATA TO WORKFLOW STATES")
        self.stdout.write("="*80)
        
        try:
            # Define step mappings for main workflow states
            step_mappings = {
                # Main Credit Paper workflow states and their corresponding UI steps
                'CREDIT_PAPER_CREDIT_REQUEST': 1,
                'CREDIT_PAPER_CREDIT_REVIEW_PENDING': 2,
                'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': 3,
                'CREDIT_PAPER_ANALYSIS_PENDING': 4,
                'CREDIT_PAPER_COMPILATION': 5,
                'CREDIT_PAPER_APPROVAL_PENDING': 6,
                'CREDIT_PAPER_APPROVED': 6,
                'CREDIT_PAPER_REJECTED': 6,
            }
            
            # Get the main Credit Paper workflow
            credit_paper_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            
            updated_count = 0
            
            for state_code, step_number in step_mappings.items():
                try:
                    state = State.objects.get(
                        workflow=credit_paper_workflow,
                        code=state_code
                    )
                    
                    # Initialize metadata if it doesn't exist
                    if state.metadata is None:
                        state.metadata = {}
                    
                    # Add or update step_number in metadata
                    state.metadata['step_number'] = step_number
                    state.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"✅ {state_code} → Step {step_number}"
                    ))
                    updated_count += 1
                    
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"⚠️  State {state_code} not found"
                    ))
            
            self.stdout.write(f"\n" + "="*80)
            self.stdout.write(self.style.SUCCESS(f"✅ Updated {updated_count} states with step numbers"))
            
            if updated_count > 0:
                self.stdout.write(f"\n📋 WHAT THIS FIXES:")
                self.stdout.write("1. ApplicationDetails (hub page) will now correctly show workflow progress")
                self.stdout.write("2. Step determination will use metadata instead of string matching")
                self.stdout.write("3. Consistent with how form pages determine their step")
                self.stdout.write("4. Future-proof: Easy to update step mappings in metadata")
                
                self.stdout.write(f"\n🎯 WORKFLOW STEP MAPPING:")
                self.stdout.write("Step 1: Credit Request")
                self.stdout.write("Step 2: Credit Review")
                self.stdout.write("Step 3: Business Sponsorship")
                self.stdout.write("Step 4: Analysis (Credit Analysis, Questionnaire, Legal Review)")
                self.stdout.write("Step 5: Credit Paper Compilation")
                self.stdout.write("Step 6: Approval/Rejection")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    pass