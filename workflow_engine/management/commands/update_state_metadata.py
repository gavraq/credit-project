from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State
from django.db import transaction

class Command(BaseCommand):
    help = 'Updates the metadata of State records with relevant sub-processes'

    @transaction.atomic
    def handle(self, *args, **options):
        # Define the mapping of state codes to relevant sub-processes
        state_to_sub_processes = {
            'CREDIT_PAPER_CREDIT_REQUEST': ['credit_request_form'],
            'CREDIT_PAPER_CREDIT_REVIEW_PENDING': ['credit_request_form', 'business_sponsorship_form'],
            'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': ['credit_request_form', 'business_sponsorship_form'],
            'CREDIT_PAPER_ANALYSIS_PENDING': ['credit_request_form', 'business_sponsorship_form', 'credit_review_form', 'legal_review_form'],
            'CREDIT_PAPER_COMPILATION': ['credit_request_form', 'business_sponsorship_form', 'credit_review_form', 'legal_review_form', 'credit_questionnaire_form'],
            'CREDIT_PAPER_APPROVAL_PENDING': ['credit_request_form', 'business_sponsorship_form', 'credit_review_form', 'legal_review_form', 'credit_questionnaire_form'],
            'CREDIT_PAPER_APPROVED': ['credit_request_form', 'business_sponsorship_form', 'credit_review_form', 'legal_review_form', 'credit_questionnaire_form'],
            'CREDIT_PAPER_REJECTED': ['credit_request_form', 'business_sponsorship_form', 'credit_review_form', 'legal_review_form', 'credit_questionnaire_form'],
        }

        try:
            # Get the parent workflow definition
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            
            # Update each state's metadata
            for state_code, sub_processes in state_to_sub_processes.items():
                try:
                    state = State.objects.get(
                        workflow_definition=parent_workflow,
                        code=state_code
                    )
                    
                    # Initialize metadata if it doesn't exist
                    if not state.metadata:
                        state.metadata = {}
                    
                    # Add relevant_sub_processes to metadata
                    state.metadata['relevant_sub_processes'] = sub_processes
                    state.save()
                    
                    self.stdout.write(self.style.SUCCESS(f"Updated metadata for state '{state_code}'"))
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"State '{state_code}' not found"))
                    
            self.stdout.write(self.style.SUCCESS("State metadata update completed"))
            
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR("CREDIT_PAPER workflow definition not found"))
