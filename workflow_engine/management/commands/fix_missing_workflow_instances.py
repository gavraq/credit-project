from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from workflow_engine.models import Workflow, State, WorkflowInstance
from credit_applications.models import (
    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm,
    LegalReviewForm, CreditQuestionnaireForm, CreditAnalysisForm,
    CreditCompilationForm, CreditApprovalForm
)
import re

class Command(BaseCommand):
    help = 'Fix forms that are missing workflow instances'

    def handle(self, *args, **options):
        self.stdout.write('Checking for forms missing workflow instances...')
        
        # Define the form models and their corresponding workflow codes
        form_configs = [
            (CreditRequestForm, 'CREDIT_REQUEST'),
            (CreditReviewForm, 'CREDIT_REVIEW'),
            (BusinessSponsorshipForm, 'BUSINESS_SPONSORSHIP'),
            (LegalReviewForm, 'LEGAL_REVIEW'),
            (CreditQuestionnaireForm, 'CREDIT_QUESTIONNAIRE'),
            (CreditAnalysisForm, 'CREDIT_ANALYSIS'),
            (CreditCompilationForm, 'CREDIT_COMPILATION'),
            (CreditApprovalForm, 'CREDIT_APPROVAL'),
        ]
        
        total_fixed = 0
        
        for model_class, workflow_code in form_configs:
            self.stdout.write(f'\nChecking {model_class.__name__}...')
            
            # Find forms without workflow instances
            forms_without_workflow = model_class.objects.filter(workflow_instance__isnull=True)
            count = forms_without_workflow.count()
            
            if count == 0:
                self.stdout.write(f'  ✓ All {model_class.__name__} instances have workflow instances')
                continue
                
            self.stdout.write(f'  Found {count} {model_class.__name__} instances missing workflow instances')
            
            try:
                # Get the workflow definition
                workflow = Workflow.objects.get(code=workflow_code)
                initial_state = State.objects.get(workflow=workflow, is_initial=True)
                
                # Fix each form
                for form_instance in forms_without_workflow:
                    try:
                        # Create workflow instance
                        workflow_instance = WorkflowInstance.objects.create(
                            workflow=workflow,
                            current_state=initial_state,
                            content_type=ContentType.objects.get_for_model(form_instance),
                            object_id=form_instance.id
                        )
                        
                        # Link it to the form
                        form_instance.workflow_instance = workflow_instance
                        form_instance.save(update_fields=['workflow_instance'])
                        
                        self.stdout.write(f'    ✓ Fixed {model_class.__name__} ID: {form_instance.id}')
                        total_fixed += 1
                        
                    except Exception as e:
                        self.stdout.write(f'    ✗ Error fixing {model_class.__name__} ID: {form_instance.id} - {e}')
                        
            except Workflow.DoesNotExist:
                self.stdout.write(f'  ✗ Workflow {workflow_code} not found')
            except State.DoesNotExist:
                self.stdout.write(f'  ✗ Initial state for workflow {workflow_code} not found')
            except Exception as e:
                self.stdout.write(f'  ✗ Error processing {model_class.__name__}: {e}')
        
        self.stdout.write(f'\n{"-"*50}')
        self.stdout.write(f'Total forms fixed: {total_fixed}')
        
        if total_fixed > 0:
            self.stdout.write('\nForms now have workflow instances and should show transitions properly.')
        else:
            self.stdout.write('\nNo fixes needed - all forms already have workflow instances.')