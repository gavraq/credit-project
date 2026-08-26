from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition
import json

class Command(BaseCommand):
    help = 'Step 2: Show what metadata should exist based on system requirements'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("STEP 2: EXPECTED METADATA CONFIGURATION")
        self.stdout.write("="*80)
        
        # 1. EXPECTED WORKFLOW STRUCTURE
        self.stdout.write("\n📋 EXPECTED WORKFLOWS")
        self.stdout.write("-" * 50)
        
        expected_workflows = {
            'CREDIT_PAPER': 'Main workflow orchestrating the entire credit process',
            'CREDIT_REQUEST': 'Sub-workflow for Credit Request Forms',
            'CREDIT_REVIEW': 'Sub-workflow for Credit Review Forms',
            'BUSINESS_SPONSORSHIP': 'Sub-workflow for Business Sponsorship Forms',
            'LEGAL_REVIEW': 'Sub-workflow for Legal Review Forms',
            'CREDIT_QUESTIONNAIRE': 'Sub-workflow for Credit Questionnaire Forms',
            'CREDIT_ANALYSIS': 'Sub-workflow for Credit Analysis Forms',
            'CREDIT_COMPILATION': 'Sub-workflow for Credit Compilation Forms',
            'CREDIT_APPROVAL': 'Sub-workflow for Credit Approval Forms'
        }
        
        for code, description in expected_workflows.items():
            self.stdout.write(f"🔹 {code}: {description}")
        
        # 2. EXPECTED CREDIT_PAPER STATES
        self.stdout.write("\n\n📋 EXPECTED CREDIT_PAPER STATES")
        self.stdout.write("-" * 50)
        
        expected_states = {
            'CREDIT_PAPER_CREDIT_REQUEST': {
                'relevant_artifacts': ['credit_request_form'],
                'step_number': 1,
                'description': 'Phase 1: Credit Request - Relationship Manager creates initial request'
            },
            'CREDIT_PAPER_CREDIT_REVIEW_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form'],
                'step_number': 2,
                'description': 'Phase 2: Credit Review - Credit Analyst reviews the request'
            },
            'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form'],
                'step_number': 3,
                'description': 'Phase 3: Business Sponsorship - Business Sponsor provides approval'
            },
            'CREDIT_PAPER_ANALYSIS_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form'],
                'step_number': 4,
                'description': 'Phase 4: Analysis - Multiple forms for comprehensive analysis'
            },
            'CREDIT_PAPER_COMPILATION': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form'],
                'step_number': 5,
                'description': 'Phase 5: Compilation - Credit paper compilation'
            },
            'CREDIT_PAPER_APPROVAL_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'step_number': 6,
                'description': 'Phase 6: Approval - Final approval decision'
            },
            'CREDIT_PAPER_APPROVED': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'step_number': 7,
                'description': 'Approved - All forms available for viewing'
            },
            'CREDIT_PAPER_REJECTED': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'step_number': 8,
                'description': 'Rejected - All completed forms available for viewing'
            }
        }
        
        for state_code, metadata in expected_states.items():
            self.stdout.write(f"\n🔸 {state_code}")
            self.stdout.write(f"   Step: {metadata['step_number']}")
            self.stdout.write(f"   Forms: {metadata['relevant_artifacts']}")
            self.stdout.write(f"   Description: {metadata['description']}")
        
        # 3. EXPECTED FORM METADATA
        self.stdout.write("\n\n📋 EXPECTED FORM METADATA")
        self.stdout.write("-" * 50)
        
        expected_form_metadata = {
            'credit_request_form': {
                'title': 'Credit Request Form',
                'form_key': 'credit_request_form',
                'workflow_code': 'CREDIT_REQUEST',
                'editable_by_roles': ['relationship_manager'],
                'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver']
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
        
        for form_name, metadata in expected_form_metadata.items():
            self.stdout.write(f"\n🔹 {form_name}")
            self.stdout.write(f"   Title: {metadata['title']}")
            self.stdout.write(f"   Workflow: {metadata['workflow_code']}")
            self.stdout.write(f"   Editable by: {metadata['editable_by_roles']}")
        
        # 4. CRITICAL REQUIREMENTS FOR ARTIFACT PROVISIONING
        self.stdout.write("\n\n📋 CRITICAL ARTIFACT PROVISIONING REQUIREMENTS")
        self.stdout.write("-" * 50)
        
        self.stdout.write("For artifact provisioning to work properly:")
        self.stdout.write("1. ✅ CREDIT_PAPER workflow must exist")
        self.stdout.write("2. ✅ CREDIT_PAPER workflow must have form_metadata with all 8 forms")
        self.stdout.write("3. ✅ CREDIT_PAPER_CREDIT_REVIEW_PENDING state must exist")
        self.stdout.write("4. ✅ CREDIT_REVIEW_PENDING state must have credit_review_form in relevant_artifacts")
        self.stdout.write("5. ✅ CREDIT_REVIEW sub-workflow must exist")
        self.stdout.write("6. ✅ CREDIT_REVIEW workflow must have an initial state")
        self.stdout.write("7. ✅ provision_artifacts_for_state must be called after transitions")
        self.stdout.write("8. ✅ Dynamic artifact mapping must work correctly")
        
        self.stdout.write("\n\n📊 KEY FOCUS AREAS")
        self.stdout.write("-" * 50)
        
        self.stdout.write("🎯 MOST CRITICAL FOR CREDIT REVIEW ISSUE:")
        self.stdout.write("   - CREDIT_PAPER_CREDIT_REVIEW_PENDING state metadata")
        self.stdout.write("   - CREDIT_REVIEW sub-workflow existence")
        self.stdout.write("   - Dynamic artifact model mapping")
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("STEP 2 COMPLETE - PROCEED TO STEP 3 TO APPLY FIXES")
        self.stdout.write("="*80)
