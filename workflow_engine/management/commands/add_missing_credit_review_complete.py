from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition

class Command(BaseCommand):
    help = 'Add the missing CR_SUBMIT_COMPLETE transition for Credit Review'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("ADDING MISSING SUBMIT COMPLETE TRANSITION")
        self.stdout.write("="*60)
        
        try:
            workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            
            # Check if transition already exists
            existing = Transition.objects.filter(
                workflow=workflow,
                code='CR_SUBMIT_COMPLETE'
            ).first()
            
            if existing:
                self.stdout.write("✅ CR_SUBMIT_COMPLETE transition already exists")
                return
            
            # Get states
            in_progress_state = State.objects.get(workflow=workflow, code='CREDIT_REVIEW_IN_PROGRESS')
            
            # Check if COMPLETED state exists, if not, use SUBMITTED
            try:
                completed_state = State.objects.get(workflow=workflow, code='CREDIT_REVIEW_COMPLETED')
                to_state = completed_state
            except State.DoesNotExist:
                completed_state = State.objects.get(workflow=workflow, code='CREDIT_REVIEW_SUBMITTED')
                to_state = completed_state
                self.stdout.write("ℹ️  Using SUBMITTED state instead of COMPLETED")
            
            # Create the transition
            transition = Transition.objects.create(
                workflow=workflow,
                code='CR_SUBMIT_COMPLETE',
                name='Submit for Business Sponsorship',
                description='Complete credit review and submit for business sponsorship',
                from_state=in_progress_state,
                to_state=to_state,
                allowed_roles=['Credit Analyst', 'Credit Approver'],
                metadata={
                    'ui_behavior': {
                        'button_style': 'success',
                        'confirmation_required': True,
                        'navigate_on_success': '/dashboard'
                    }
                }
            )
            
            self.stdout.write(f"✅ Created transition: {transition.name}")
            self.stdout.write(f"   Code: {transition.code}")
            self.stdout.write(f"   From: {transition.from_state.name}")
            self.stdout.write(f"   To: {transition.to_state.name}")
            self.stdout.write(f"   Roles: {transition.allowed_roles}")
            
            # Show final state
            all_transitions = Transition.objects.filter(workflow=workflow).order_by('code')
            self.stdout.write(f"\n📊 FINAL CREDIT_REVIEW TRANSITIONS ({all_transitions.count()}):")
            for t in all_transitions:
                self.stdout.write(f"   ✅ {t.code}: {t.name}")
                self.stdout.write(f"      {t.from_state.name} → {t.to_state.name}")
            
        except Exception as e:
            self.stdout.write(f"❌ Error: {e}")
        
        self.stdout.write("\n" + "="*60)