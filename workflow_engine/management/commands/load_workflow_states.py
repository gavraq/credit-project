import csv
import os
from django.core.management.base import BaseCommand
from workflow_engine.models import WorkflowDefinition, State, Transition
from django.db import transaction

# For simplicity, this version will use hardcoded state/transition data from the Transition State Model doc.
# In the future, you can refactor to load from a CSV or markdown if desired.

WORKFLOWS = [
    {
        'definition': {
            'code': 'CREDIT_PAPER',
            'name': 'Credit Paper Approval Workflow',
            'description': 'Workflow for credit paper approval process',
            'metadata': {},
        },
        'states': [
            {'code': 'CREDIT_PAPER_CREDIT_REQUEST', 'name': 'Credit Request', 'description': 'Initial state when a credit request is created', 'is_initial': True, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING', 'name': 'Credit Review Pending', 'description': 'Credit paper in credit review phase', 'is_initial': False, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING', 'name': 'Business Sponsor Pending', 'description': 'Credit paper in business sponsor phase', 'is_initial': False, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_ANALYSIS_PENDING', 'name': 'Analysis Pending', 'description': 'Credit paper in analysis phase (Credit Questionnaire, Legal Review, Credit Analysis)', 'is_initial': False, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_COMPILATION', 'name': 'Credit Compilation', 'description': 'Credit paper in compilation phase', 'is_initial': False, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_APPROVAL_PENDING', 'name': 'Approval Pending', 'description': 'Credit paper pending approval', 'is_initial': False, 'is_terminal': False},
            {'code': 'CREDIT_PAPER_APPROVED', 'name': 'Approved', 'description': 'Credit paper approved (terminal state)', 'is_initial': False, 'is_terminal': True},
            {'code': 'CREDIT_PAPER_REJECTED', 'name': 'Rejected', 'description': 'Credit paper rejected (terminal state)', 'is_initial': False, 'is_terminal': True},
        ],
        'transitions': [
            {'code': 'PP_TR_1', 'name': 'Submit for Credit Review', 'from_code': 'CREDIT_PAPER_CREDIT_REQUEST', 'to_code': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING', 'allowed_roles': ['relationship_manager'], 'system_action': 'submit_credit_request', 'description': 'Relationship Manager submits Credit Request form', 'conditions': {'subprocess_state': 'CREDIT_REQUEST_SUBMITTED'}},
            {'code': 'PP_TR_2', 'name': 'Submit for Business Sponsorship', 'from_code': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING', 'to_code': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_review', 'description': 'Credit Analyst submits Credit Review form', 'conditions': {'subprocess_state': 'CREDIT_REVIEW_SUBMITTED'}},
            {'code': 'PP_TR_4', 'name': 'Submit for Analysis', 'from_code': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING', 'to_code': 'CREDIT_PAPER_ANALYSIS_PENDING', 'allowed_roles': ['business_sponsor'], 'system_action': 'submit_business_sponsorship', 'description': 'Business Sponsor submits Business Sponsorship form', 'conditions': {'subprocess_state': 'BUSINESS_SPONSOR_SUBMITTED'}},
            {'code': 'PP_TR_5', 'name': 'Move to Compilation', 'from_code': 'CREDIT_PAPER_ANALYSIS_PENDING', 'to_code': 'CREDIT_PAPER_COMPILATION', 'allowed_roles': ['system'], 'system_action': 'submit_credit_analysis', 'description': 'System transition when all analysis sub-processes complete', 'conditions': {'legal_review': 'LEGAL_REVIEW_SUBMITTED', 'credit_analysis': 'CREDIT_ANALYSIS_SUBMITTED', 'credit_questionnaire': 'CREDIT_QUESTIONNAIRE_SUBMITTED'}},
            {'code': 'PP_TR_7', 'name': 'Submit for Approval', 'from_code': 'CREDIT_PAPER_COMPILATION', 'to_code': 'CREDIT_PAPER_APPROVAL_PENDING', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_compilation', 'description': 'Credit Analyst submits Credit Compilation form', 'conditions': {'subprocess_state': 'CREDIT_COMPILATION_SUBMITTED'}},
            {'code': 'PP_TR_8', 'name': 'Approve Credit Paper', 'from_code': 'CREDIT_PAPER_APPROVAL_PENDING', 'to_code': 'CREDIT_PAPER_APPROVED', 'allowed_roles': ['approver'], 'system_action': 'approve_credit_paper', 'description': 'Approver submits approval', 'conditions': {'subprocess_state': 'CREDIT_APPROVAL_SUBMITTED'}},
            {'code': 'PP_TR_9', 'name': 'Reject Credit Paper', 'from_code': 'CREDIT_PAPER_APPROVAL_PENDING', 'to_code': 'CREDIT_PAPER_REJECTED', 'allowed_roles': ['approver'], 'system_action': 'reject_credit_paper', 'description': 'Approver rejects credit paper', 'conditions': {}},
        ]
    },
    # --- Sub-process workflows will be added here in the same format ---
]

# Example for one sub-process (Credit Request). Others should be added similarly.
WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_REQUEST',
        'name': 'Credit Request Sub-Process',
        'description': 'Workflow for Credit Request form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_REQUEST_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Request', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_REQUEST_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Request', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_REQUEST_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Request', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CR_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_REQUEST_DRAFT', 'to_code': 'CREDIT_REQUEST_DRAFT', 'allowed_roles': ['relationship_manager'], 'system_action': 'edit_credit_request', 'description': 'Relationship Manager saves form as draft', 'conditions': {}},
        {'code': 'CR_TR_2', 'name': 'Submit for In Progress', 'from_code': 'CREDIT_REQUEST_DRAFT', 'to_code': 'CREDIT_REQUEST_IN_PROGRESS', 'allowed_roles': ['relationship_manager'], 'system_action': 'submit_credit_request', 'description': 'Relationship Manager submits draft for progress', 'conditions': {}},
        {'code': 'CR_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_REQUEST_IN_PROGRESS', 'to_code': 'CREDIT_REQUEST_DRAFT', 'allowed_roles': ['relationship_manager'], 'system_action': 'edit_credit_request', 'description': 'Relationship Manager saves form as draft from in progress', 'conditions': {}},
        {'code': 'CR_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_REQUEST_IN_PROGRESS', 'to_code': 'CREDIT_REQUEST_SUBMITTED', 'allowed_roles': ['relationship_manager'], 'system_action': 'submit_credit_request', 'description': 'Relationship Manager submits Credit Request', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_REVIEW',
        'name': 'Credit Review Sub-Process',
        'description': 'Workflow for Credit Review form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_REVIEW_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Review', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_REVIEW_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Review', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_REVIEW_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Review', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CRV_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_REVIEW_DRAFT', 'to_code': 'CREDIT_REVIEW_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_review', 'description': 'Credit Analyst saves form as draft', 'conditions': {}},
        {'code': 'CRV_TR_2', 'name': 'Update Credit Paper', 'from_code': 'CREDIT_REVIEW_DRAFT', 'to_code': 'CREDIT_REVIEW_IN_PROGRESS', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_review', 'description': 'Credit Analyst updates Credit Paper', 'conditions': {}},
        {'code': 'CRV_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_REVIEW_IN_PROGRESS', 'to_code': 'CREDIT_REVIEW_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_review', 'description': 'Credit Analyst saves form as draft', 'conditions': {}},
        {'code': 'CRV_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_REVIEW_IN_PROGRESS', 'to_code': 'CREDIT_REVIEW_SUBMITTED', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_review', 'description': 'Credit Analyst submits Credit Review', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'BUSINESS_SPONSORSHIP',
        'name': 'Business Sponsorship Sub-Process',
        'description': 'Workflow for Business Sponsorship form',
        'metadata': {},
    },
    'states': [
        {'code': 'BUSINESS_SPONSOR_DRAFT', 'name': 'Draft', 'description': 'Draft state for Business Sponsorship', 'is_initial': True, 'is_terminal': False},
        {'code': 'BUSINESS_SPONSOR_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Business Sponsorship', 'is_initial': False, 'is_terminal': False},
        {'code': 'BUSINESS_SPONSOR_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Business Sponsorship', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'BS_TR_1', 'name': 'Save as Draft', 'from_code': 'BUSINESS_SPONSOR_DRAFT', 'to_code': 'BUSINESS_SPONSOR_DRAFT', 'allowed_roles': ['business_sponsor'], 'system_action': 'edit_business_sponsorship', 'description': 'Business Sponsor saves form as draft', 'conditions': {}},
        {'code': 'BS_TR_2', 'name': 'Submit for In Progress', 'from_code': 'BUSINESS_SPONSOR_DRAFT', 'to_code': 'BUSINESS_SPONSOR_IN_PROGRESS', 'allowed_roles': ['business_sponsor'], 'system_action': 'submit_business_sponsorship', 'description': 'Business Sponsor submits draft for progress', 'conditions': {}},
        {'code': 'BS_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'BUSINESS_SPONSOR_IN_PROGRESS', 'to_code': 'BUSINESS_SPONSOR_DRAFT', 'allowed_roles': ['business_sponsor'], 'system_action': 'edit_business_sponsorship', 'description': 'Business Sponsor saves form as draft from in progress', 'conditions': {}},
        {'code': 'BS_TR_4', 'name': 'Submit', 'from_code': 'BUSINESS_SPONSOR_IN_PROGRESS', 'to_code': 'BUSINESS_SPONSOR_SUBMITTED', 'allowed_roles': ['business_sponsor'], 'system_action': 'submit_business_sponsorship', 'description': 'Business Sponsor submits Business Sponsorship', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_QUESTIONNAIRE',
        'name': 'Credit Questionnaire Sub-Process',
        'description': 'Workflow for Credit Questionnaire form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_QUESTIONNAIRE_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Questionnaire', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_QUESTIONNAIRE_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Questionnaire', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_QUESTIONNAIRE_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Questionnaire', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CQ_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_QUESTIONNAIRE_DRAFT', 'to_code': 'CREDIT_QUESTIONNAIRE_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'edit_credit_questionnaire', 'description': 'Credit Analyst saves form as draft', 'conditions': {}},
        {'code': 'CQ_TR_2', 'name': 'Submit for In Progress', 'from_code': 'CREDIT_QUESTIONNAIRE_DRAFT', 'to_code': 'CREDIT_QUESTIONNAIRE_IN_PROGRESS', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_questionnaire', 'description': 'Credit Analyst submits draft for progress', 'conditions': {}},
        {'code': 'CQ_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_QUESTIONNAIRE_IN_PROGRESS', 'to_code': 'CREDIT_QUESTIONNAIRE_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'edit_credit_questionnaire', 'description': 'Credit Analyst saves form as draft from in progress', 'conditions': {}},
        {'code': 'CQ_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_QUESTIONNAIRE_IN_PROGRESS', 'to_code': 'CREDIT_QUESTIONNAIRE_SUBMITTED', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_questionnaire', 'description': 'Credit Analyst submits Credit Questionnaire', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'LEGAL_REVIEW',
        'name': 'Legal Review Sub-Process',
        'description': 'Workflow for Legal Review form',
        'metadata': {},
    },
    'states': [
        {'code': 'LEGAL_REVIEW_DRAFT', 'name': 'Draft', 'description': 'Draft state for Legal Review', 'is_initial': True, 'is_terminal': False},
        {'code': 'LEGAL_REVIEW_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Legal Review', 'is_initial': False, 'is_terminal': False},
        {'code': 'LEGAL_REVIEW_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Legal Review', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'LR_TR_1', 'name': 'Save as Draft', 'from_code': 'LEGAL_REVIEW_DRAFT', 'to_code': 'LEGAL_REVIEW_DRAFT', 'allowed_roles': ['legal_reviewer'], 'system_action': 'perform_legal_review', 'description': 'Legal Reviewer saves form as draft', 'conditions': {}},
        {'code': 'LR_TR_2', 'name': 'Submit for In Progress', 'from_code': 'LEGAL_REVIEW_DRAFT', 'to_code': 'LEGAL_REVIEW_IN_PROGRESS', 'allowed_roles': ['legal_reviewer'], 'system_action': 'perform_legal_review', 'description': 'Legal Reviewer submits draft for progress', 'conditions': {}},
        {'code': 'LR_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'LEGAL_REVIEW_IN_PROGRESS', 'to_code': 'LEGAL_REVIEW_DRAFT', 'allowed_roles': ['legal_reviewer'], 'system_action': 'perform_legal_review', 'description': 'Legal Reviewer saves form as draft from in progress', 'conditions': {}},
        {'code': 'LR_TR_4', 'name': 'Submit', 'from_code': 'LEGAL_REVIEW_IN_PROGRESS', 'to_code': 'LEGAL_REVIEW_SUBMITTED', 'allowed_roles': ['legal_reviewer'], 'system_action': 'perform_legal_review', 'description': 'Legal Reviewer submits Legal Review', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_ANALYSIS',
        'name': 'Credit Analysis Sub-Process',
        'description': 'Workflow for Credit Analysis form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_ANALYSIS_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Analysis', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_ANALYSIS_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Analysis', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_ANALYSIS_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Analysis', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CA_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_ANALYSIS_DRAFT', 'to_code': 'CREDIT_ANALYSIS_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_analysis', 'description': 'Credit Analyst saves form as draft', 'conditions': {}},
        {'code': 'CA_TR_2', 'name': 'Submit for In Progress', 'from_code': 'CREDIT_ANALYSIS_DRAFT', 'to_code': 'CREDIT_ANALYSIS_IN_PROGRESS', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_analysis', 'description': 'Credit Analyst submits draft for progress', 'conditions': {}},
        {'code': 'CA_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_ANALYSIS_IN_PROGRESS', 'to_code': 'CREDIT_ANALYSIS_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_analysis', 'description': 'Credit Analyst saves form as draft from in progress', 'conditions': {}},
        {'code': 'CA_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_ANALYSIS_IN_PROGRESS', 'to_code': 'CREDIT_ANALYSIS_SUBMITTED', 'allowed_roles': ['credit_analyst'], 'system_action': 'perform_credit_analysis', 'description': 'Credit Analyst submits Credit Analysis', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_COMPILATION',
        'name': 'Credit Compilation Sub-Process',
        'description': 'Workflow for Credit Compilation form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_COMPILATION_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Compilation', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_COMPILATION_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Compilation', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_COMPILATION_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Compilation', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CC_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_COMPILATION_DRAFT', 'to_code': 'CREDIT_COMPILATION_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'edit_credit_compilation', 'description': 'Credit Analyst saves form as draft', 'conditions': {}},
        {'code': 'CC_TR_2', 'name': 'Submit for In Progress', 'from_code': 'CREDIT_COMPILATION_DRAFT', 'to_code': 'CREDIT_COMPILATION_IN_PROGRESS', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_compilation', 'description': 'Credit Analyst submits draft for progress', 'conditions': {}},
        {'code': 'CC_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_COMPILATION_IN_PROGRESS', 'to_code': 'CREDIT_COMPILATION_DRAFT', 'allowed_roles': ['credit_analyst'], 'system_action': 'edit_credit_compilation', 'description': 'Credit Analyst saves form as draft from in progress', 'conditions': {}},
        {'code': 'CC_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_COMPILATION_IN_PROGRESS', 'to_code': 'CREDIT_COMPILATION_SUBMITTED', 'allowed_roles': ['credit_analyst'], 'system_action': 'submit_credit_compilation', 'description': 'Credit Analyst submits Credit Compilation', 'conditions': {}},
    ]
})

WORKFLOWS.append({
    'definition': {
        'code': 'CREDIT_APPROVAL',
        'name': 'Credit Approval Sub-Process',
        'description': 'Workflow for Credit Approval form',
        'metadata': {},
    },
    'states': [
        {'code': 'CREDIT_APPROVAL_DRAFT', 'name': 'Draft', 'description': 'Draft state for Credit Approval', 'is_initial': True, 'is_terminal': False},
        {'code': 'CREDIT_APPROVAL_IN_PROGRESS', 'name': 'In Progress', 'description': 'In Progress state for Credit Approval', 'is_initial': False, 'is_terminal': False},
        {'code': 'CREDIT_APPROVAL_SUBMITTED', 'name': 'Submitted', 'description': 'Submitted state for Credit Approval', 'is_initial': False, 'is_terminal': True},
    ],
    'transitions': [
        {'code': 'CA_TR_1', 'name': 'Save as Draft', 'from_code': 'CREDIT_APPROVAL_DRAFT', 'to_code': 'CREDIT_APPROVAL_DRAFT', 'allowed_roles': ['approver'], 'system_action': 'edit_credit_approval', 'description': 'Approver saves form as draft', 'conditions': {}},
        {'code': 'CA_TR_2', 'name': 'Submit for In Progress', 'from_code': 'CREDIT_APPROVAL_DRAFT', 'to_code': 'CREDIT_APPROVAL_IN_PROGRESS', 'allowed_roles': ['approver'], 'system_action': 'submit_credit_approval', 'description': 'Approver submits draft for progress', 'conditions': {}},
        {'code': 'CA_TR_3', 'name': 'Save as Draft from In Progress', 'from_code': 'CREDIT_APPROVAL_IN_PROGRESS', 'to_code': 'CREDIT_APPROVAL_DRAFT', 'allowed_roles': ['approver'], 'system_action': 'edit_credit_approval', 'description': 'Approver saves form as draft from in progress', 'conditions': {}},
        {'code': 'CA_TR_4', 'name': 'Submit', 'from_code': 'CREDIT_APPROVAL_IN_PROGRESS', 'to_code': 'CREDIT_APPROVAL_SUBMITTED', 'allowed_roles': ['approver'], 'system_action': 'submit_credit_approval', 'description': 'Approver submits Credit Approval', 'conditions': {}},
    ]
})

class Command(BaseCommand):
    help = 'Load workflow states and transitions for the Credit Risk Workflow'

    @transaction.atomic
    def handle(self, *args, **options):
        for wf in WORKFLOWS:
            definition = wf['definition']
            workflow_def, created = WorkflowDefinition.objects.get_or_create(
                code=definition['code'],
                defaults={
                    'name': definition['name'],
                    'description': definition['description'],
                    'metadata': definition.get('metadata', {})
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"WorkflowDefinition '{workflow_def.code}' created."))
            else:
                self.stdout.write(f"WorkflowDefinition '{workflow_def.code}' loaded.")

            # Load states for this workflow
            state_objs = {}
            for state_data in wf['states']:
                state, _ = State.objects.get_or_create(
                    workflow_definition=workflow_def,
                    code=state_data['code'],
                    defaults={
                        'name': state_data['name'],
                        'description': state_data['description'],
                        'is_initial': state_data['is_initial'],
                        'is_terminal': state_data['is_terminal'],
                        'metadata': state_data.get('metadata', {})
                    }
                )
                state_objs[state.code] = state
                self.stdout.write(f"State '{state.code}' loaded.")

            # Load transitions for this workflow
            for trans_data in wf['transitions']:
                from_state = state_objs[trans_data['from_code']]
                to_state = state_objs[trans_data['to_code']]
                transition, _ = Transition.objects.get_or_create(
                    workflow_definition=workflow_def,
                    code=trans_data['code'],
                    defaults={
                        'name': trans_data['name'],
                        'description': trans_data['description'],
                        'from_state': from_state,
                        'to_state': to_state,
                        'allowed_roles': trans_data.get('allowed_roles', []),
                        'conditions': trans_data.get('conditions', {}),
                        'system_action': trans_data.get('system_action', ''),
                        'metadata': trans_data.get('metadata', {})
                    }
                )
                self.stdout.write(f"Transition '{transition.code}' loaded.")

            self.stdout.write(self.style.SUCCESS(f"Workflow '{workflow_def.code}' states and transitions loaded."))
