from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition

class Command(BaseCommand):
    help = 'Set up Credit Review workflow transitions (Save as Draft, Submit to In Progress, etc.)'

    def handle(self, *args, **options):
        try:
            # Get the CREDIT_REVIEW workflow
            workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            self.stdout.write(f'Found CREDIT_REVIEW workflow: {workflow.name}')
            
            # Get all states for this workflow
            states = workflow.states.all()
            self.stdout.write(f'Workflow has {states.count()} states:')
            for state in states:
                self.stdout.write(f'  - {state.name} ({state.code}) [Initial: {state.is_initial}]')
            
            # Define the transitions we need (similar to Credit Request Form pattern)
            transitions_to_create = [
                {
                    'code': 'CR_SAVE_DRAFT',
                    'name': 'Save as Draft',
                    'description': 'Save the credit review form as draft',
                    'from_state_code': 'CREDIT_REVIEW_DRAFT',
                    'to_state_code': 'CREDIT_REVIEW_DRAFT',
                    'allowed_roles': ['Credit Analyst', 'Credit Approver'],
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'secondary',
                            'confirmation_required': False
                        }
                    }
                },
                {
                    'code': 'CR_SUBMIT_IN_PROGRESS', 
                    'name': 'Submit to In Progress',
                    'description': 'Submit credit review to in progress status',
                    'from_state_code': 'CREDIT_REVIEW_DRAFT',
                    'to_state_code': 'CREDIT_REVIEW_IN_PROGRESS',
                    'allowed_roles': ['Credit Analyst', 'Credit Approver'],
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'primary',
                            'confirmation_required': False
                        }
                    }
                },
                {
                    'code': 'CR_BACK_TO_DRAFT',
                    'name': 'Move to Draft',
                    'description': 'Move credit review back to draft',
                    'from_state_code': 'CREDIT_REVIEW_IN_PROGRESS',
                    'to_state_code': 'CREDIT_REVIEW_DRAFT',
                    'allowed_roles': ['Credit Analyst', 'Credit Approver'],
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'secondary',
                            'confirmation_required': False
                        }
                    }
                },
                {
                    'code': 'CR_SUBMIT_COMPLETE',
                    'name': 'Submit for Business Sponsorship',
                    'description': 'Complete credit review and submit for business sponsorship',
                    'from_state_code': 'CREDIT_REVIEW_IN_PROGRESS',
                    'to_state_code': 'CREDIT_REVIEW_COMPLETED',
                    'allowed_roles': ['Credit Analyst', 'Credit Approver'],
                    'metadata': {
                        'ui_behavior': {
                            'button_style': 'success',
                            'confirmation_required': True,
                            'navigate_on_success': '/dashboard'
                        }
                    }
                }
            ]
            
            created_count = 0
            
            for transition_data in transitions_to_create:
                try:
                    # Get from and to states
                    from_state = State.objects.get(workflow=workflow, code=transition_data['from_state_code'])
                    to_state = State.objects.get(workflow=workflow, code=transition_data['to_state_code'])
                    
                    # Check if transition already exists
                    existing = Transition.objects.filter(
                        workflow=workflow,
                        code=transition_data['code']
                    ).first()
                    
                    if existing:
                        self.stdout.write(f'  ✓ Transition {transition_data["code"]} already exists')
                        continue
                    
                    # Create the transition
                    transition = Transition.objects.create(
                        workflow=workflow,
                        code=transition_data['code'],
                        name=transition_data['name'],
                        description=transition_data['description'],
                        from_state=from_state,
                        to_state=to_state,
                        allowed_roles=transition_data['allowed_roles'],
                        metadata=transition_data['metadata']
                    )
                    
                    self.stdout.write(f'  ✓ Created transition: {transition.name} ({transition.code})')
                    created_count += 1
                    
                except State.DoesNotExist as e:
                    self.stdout.write(f'  ✗ State not found for transition {transition_data["code"]}: {e}')
                except Exception as e:
                    self.stdout.write(f'  ✗ Error creating transition {transition_data["code"]}: {e}')
            
            self.stdout.write(f'\n{"-"*50}')
            self.stdout.write(f'Created {created_count} new transitions')
            
            # Show summary of all transitions
            all_transitions = Transition.objects.filter(workflow=workflow)
            self.stdout.write(f'\nCREDIT_REVIEW workflow now has {all_transitions.count()} transitions:')
            for t in all_transitions:
                self.stdout.write(f'  {t.name} ({t.code}): {t.from_state.name} → {t.to_state.name}')
                self.stdout.write(f'    Allowed roles: {t.allowed_roles}')
            
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR('CREDIT_REVIEW workflow not found'))
            self.stdout.write('Available workflows:')
            for wf in Workflow.objects.all():
                self.stdout.write(f'  - {wf.code}: {wf.name}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))