from django.core.management.base import BaseCommand
from workflow_engine.models import State, Workflow
import json

class Command(BaseCommand):
    help = 'Updates workflow state metadata with relevant sub-processes'

    def handle(self, *args, **options):
        try:
            # Get CREDIT_PAPER workflow
            workflow = Workflow.objects.get(code='CREDIT_PAPER')
            
            # Define state metadata mapping based on PRD workflow phases
            state_metadata = {
                'CREDIT_PAPER_CREDIT_REQUEST': {
                    'relevant_sub_processes': ['credit_request_form'],
                    'parent_state': 'CREDIT_PAPER_CREDIT_REQUEST',
                    'step_number': 1,
                    'description': 'Phase 1: Credit Request - Relationship Manager creates initial request'
                },
                'CREDIT_PAPER_CREDIT_REVIEW_PENDING': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form'],
                    'parent_state': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING',
                    'step_number': 2,
                    'description': 'Phase 2: Credit Review - Credit Analyst reviews the request'
                },
                'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form'],
                    'parent_state': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING',
                    'step_number': 3,
                    'description': 'Phase 3: Business Sponsorship - Business Sponsor provides approval'
                },
                'CREDIT_PAPER_ANALYSIS_PENDING': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form'],
                    'parent_state': 'CREDIT_PAPER_ANALYSIS_PENDING',
                    'step_number': 4,
                    'description': 'Phase 4: Analysis - Multiple forms for comprehensive analysis'
                },
                'CREDIT_PAPER_COMPILATION': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form'],
                    'parent_state': 'CREDIT_PAPER_COMPILATION',
                    'step_number': 5,
                    'description': 'Phase 5: Compilation - Credit paper compilation'
                },
                'CREDIT_PAPER_APPROVAL_PENDING': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                    'parent_state': 'CREDIT_PAPER_APPROVAL_PENDING',
                    'step_number': 6,
                    'description': 'Phase 6: Approval - Final approval decision'
                },
                'CREDIT_PAPER_APPROVED': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                    'parent_state': 'CREDIT_PAPER_APPROVED',
                    'step_number': 7,
                    'description': 'Approved - All forms available for viewing'
                },
                'CREDIT_PAPER_REJECTED': {
                    'relevant_sub_processes': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                    'parent_state': 'CREDIT_PAPER_REJECTED',
                    'step_number': 8,
                    'description': 'Rejected - All completed forms available for viewing'
                }
            }
            
            # Update each state's metadata
            updated_count = 0
            for state_code, metadata in state_metadata.items():
                try:
                    state = State.objects.get(workflow=workflow, code=state_code)
                    state.metadata = metadata
                    state.save()
                    self.stdout.write(self.style.SUCCESS(f'Updated metadata for state: {state.name} ({state_code})'))
                    updated_count += 1
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'State not found: {state_code}'))
            
            # Also ensure the workflow has form_metadata
            if not workflow.metadata:
                workflow.metadata = {}
            
            # Update existing form metadata to include role permissions
            current_form_metadata = workflow.metadata.get('form_metadata', {})
            
            # Define role permissions for each form based on PRD
            enhanced_form_metadata = {
                'credit_request_form': {
                    'title': 'Credit Request Form',
                    'form_key': 'credit_request_form',
                    'workflow_code': 'CREDIT_REQUEST',
                    'editable_by_roles': ['relationship_manager'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver'],
                    'ownership_required': True  # Only the RM who created/owns can edit
                },
                'credit_review_form': {
                    'title': 'Credit Review Form',
                    'form_key': 'credit_review_form',
                    'workflow_code': 'CREDIT_REVIEW',
                    'editable_by_roles': ['credit_analyst', 'credit_approver'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'business_sponsorship_form': {
                    'title': 'Business Sponsorship Form',
                    'form_key': 'business_sponsorship_form',
                    'workflow_code': 'BUSINESS_SPONSORSHIP',
                    'editable_by_roles': ['business_sponsor'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'credit_questionnaire_form': {
                    'title': 'Credit Questionnaire Form',
                    'form_key': 'credit_questionnaire_form',
                    'workflow_code': 'CREDIT_QUESTIONNAIRE',
                    'editable_by_roles': ['relationship_manager'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'legal_review_form': {
                    'title': 'Legal Review Form',
                    'form_key': 'legal_review_form',
                    'workflow_code': 'LEGAL_REVIEW',
                    'editable_by_roles': ['legal_reviewer'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'credit_analysis_form': {
                    'title': 'Credit Analysis Form',
                    'form_key': 'credit_analysis_form',
                    'workflow_code': 'CREDIT_ANALYSIS',
                    'editable_by_roles': ['credit_analyst', 'credit_approver'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'credit_compilation_form': {
                    'title': 'Credit Compilation Form',
                    'form_key': 'credit_compilation_form',
                    'workflow_code': 'CREDIT_COMPILATION',
                    'editable_by_roles': ['credit_analyst', 'credit_compiler'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                },
                'credit_approval_form': {
                    'title': 'Credit Approval Form',
                    'form_key': 'credit_approval_form',
                    'workflow_code': 'CREDIT_APPROVAL',
                    'editable_by_roles': ['credit_approver', 'committee_approver'],
                    'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
                }
            }
            
            # Merge existing form metadata with enhanced metadata
            for form_name, enhanced_data in enhanced_form_metadata.items():
                if form_name in current_form_metadata:
                    # Keep existing data and add new fields
                    current_form_metadata[form_name].update(enhanced_data)
                else:
                    # Add new form metadata
                    current_form_metadata[form_name] = enhanced_data
            
            workflow.metadata['form_metadata'] = current_form_metadata
            workflow.save()
            self.stdout.write(self.style.SUCCESS('Updated workflow form_metadata with role permissions'))
            
            self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated {updated_count} states'))
            
            # Display summary of forms visible in each state
            self.stdout.write('\n' + '='*60)
            self.stdout.write('WORKFLOW STATE CONFIGURATION SUMMARY')
            self.stdout.write('='*60)
            
            for state in workflow.states.all().order_by('id'):
                if state.metadata and 'relevant_sub_processes' in state.metadata:
                    forms = state.metadata['relevant_sub_processes']
                    step = state.metadata.get('step_number', '')
                    desc = state.metadata.get('description', '')
                    
                    self.stdout.write(f'\nStep {step}: {state.name}')
                    self.stdout.write(f'Code: {state.code}')
                    if desc:
                        self.stdout.write(f'Description: {desc}')
                    self.stdout.write(f'Visible forms ({len(forms)}):')
                    for form in forms:
                        self.stdout.write(f'  - {form}')
            
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR('CREDIT_PAPER workflow not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error updating metadata: {str(e)}'))