from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State
import json

class Command(BaseCommand):
    help = 'Fix Credit Review state metadata to include credit_review_form in relevant_sub_processes'

    def handle(self, *args, **options):
        try:
            self.stdout.write('Fixing Credit Review state metadata...')
            
            # Get the parent workflow
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
            self.stdout.write(f'Found parent workflow: {parent_workflow.name}')
            
            # Get the CREDIT_PAPER_CREDIT_REVIEW_PENDING state
            try:
                credit_review_state = State.objects.get(
                    workflow=parent_workflow,
                    code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
                )
                
                self.stdout.write(f'Found state: {credit_review_state.name} ({credit_review_state.code})')
                
                # Display current metadata
                if credit_review_state.metadata:
                    self.stdout.write('Current metadata:', json.dumps(credit_review_state.metadata, indent=2))
                else:
                    self.stdout.write('Current metadata: None')
                
                # Update or create the metadata
                if not credit_review_state.metadata:
                    credit_review_state.metadata = {}
                
                # Add credit_review_form to relevant_sub_processes
                if 'relevant_sub_processes' not in credit_review_state.metadata:
                    credit_review_state.metadata['relevant_sub_processes'] = []
                
                if 'credit_review_form' not in credit_review_state.metadata['relevant_sub_processes']:
                    credit_review_state.metadata['relevant_sub_processes'].append('credit_review_form')
                    
                    # Save the updated state
                    credit_review_state.save(update_fields=['metadata'])
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ Added credit_review_form to relevant_sub_processes for state {credit_review_state.code}'
                    ))
                    
                    # Display updated metadata
                    self.stdout.write('Updated metadata:')
                    self.stdout.write(json.dumps(credit_review_state.metadata, indent=2))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        f'✓ credit_review_form already exists in relevant_sub_processes for state {credit_review_state.code}'
                    ))
                
            except State.DoesNotExist:
                self.stdout.write(self.style.ERROR('State CREDIT_PAPER_CREDIT_REVIEW_PENDING not found'))
                # List all available states
                self.stdout.write('Available states in CREDIT_PAPER workflow:')
                for state in State.objects.filter(workflow=parent_workflow):
                    self.stdout.write(f'  - {state.name} ({state.code})')
                    if state.metadata and 'relevant_sub_processes' in state.metadata:
                        self.stdout.write(f'    Relevant sub-processes: {state.metadata["relevant_sub_processes"]}')
                return
                
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR('Parent workflow CREDIT_PAPER not found'))
            self.stdout.write('Available workflows:')
            for wf in Workflow.objects.all():
                self.stdout.write(f'  - {wf.code}: {wf.name}')
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            return
            
        self.stdout.write(self.style.SUCCESS('Credit Review state metadata fix completed!'))