from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, State, Transition
from django.db import transaction
import json

class Command(BaseCommand):
    help = 'Step 3: Apply comprehensive metadata fixes to resolve artifact provisioning issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--fix-workflows',
            action='store_true',
            help='Create missing workflows',
        )
        parser.add_argument(
            '--fix-states',
            action='store_true',
            help='Update state metadata',
        )
        parser.add_argument(
            '--fix-forms',
            action='store_true',
            help='Update form metadata',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Apply all fixes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        fix_workflows = options.get('fix_workflows', False) or options.get('all', False)
        fix_states = options.get('fix_states', False) or options.get('all', False)
        fix_forms = options.get('fix_forms', False) or options.get('all', False)
        
        self.stdout.write("="*80)
        self.stdout.write("STEP 3: APPLYING METADATA FIXES")
        self.stdout.write("="*80)
        
        if dry_run:
            self.stdout.write("🔍 DRY RUN MODE - No changes will be made")
        
        fixes_applied = 0
        
        try:
            with transaction.atomic():
                # 1. FIX MISSING SUB-WORKFLOWS
                if fix_workflows:
                    self.stdout.write("\n🔧 FIXING MISSING SUB-WORKFLOWS")
                    self.stdout.write("-" * 50)
                    fixes_applied += self.fix_missing_workflows(dry_run)
                
                # 2. FIX STATE METADATA
                if fix_states:
                    self.stdout.write("\n🔧 FIXING STATE METADATA")
                    self.stdout.write("-" * 50)
                    fixes_applied += self.fix_state_metadata(dry_run)
                
                # 3. FIX FORM METADATA
                if fix_forms:
                    self.stdout.write("\n🔧 FIXING FORM METADATA")
                    self.stdout.write("-" * 50)
                    fixes_applied += self.fix_form_metadata(dry_run)
                
                if dry_run:
                    # Rollback the transaction in dry run mode
                    transaction.set_rollback(True)
                    self.stdout.write(f"\n🔍 DRY RUN: Would have applied {fixes_applied} fixes")
                else:
                    self.stdout.write(f"\n✅ APPLIED {fixes_applied} FIXES SUCCESSFULLY")
                    
        except Exception as e:
            self.stdout.write(f"\n❌ ERROR APPLYING FIXES: {e}")
            raise
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("STEP 3 COMPLETE")
        self.stdout.write("="*80)
    
    def fix_missing_workflows(self, dry_run):
        """Create missing sub-workflows with initial states"""
        fixes = 0
        
        expected_workflows = [
            ('CREDIT_REQUEST', 'Credit Request Workflow'),
            ('CREDIT_REVIEW', 'Credit Review Workflow'),
            ('BUSINESS_SPONSORSHIP', 'Business Sponsorship Workflow'),
            ('LEGAL_REVIEW', 'Legal Review Workflow'),
            ('CREDIT_QUESTIONNAIRE', 'Credit Questionnaire Workflow'),
            ('CREDIT_ANALYSIS', 'Credit Analysis Workflow'),
            ('CREDIT_COMPILATION', 'Credit Compilation Workflow'),
            ('CREDIT_APPROVAL', 'Credit Approval Workflow')
        ]
        
        for workflow_code, workflow_name in expected_workflows:
            try:
                workflow = Workflow.objects.get(code=workflow_code)
                self.stdout.write(f"✅ {workflow_code} already exists")
                
                # Check if it has an initial state
                initial_states = State.objects.filter(workflow=workflow, is_initial=True)
                if not initial_states.exists():
                    if not dry_run:
                        # Create initial state
                        State.objects.create(
                            workflow=workflow,
                            code=f'{workflow_code}_DRAFT',
                            name='Draft',
                            is_initial=True,
                            is_final=False
                        )
                    self.stdout.write(f"   🔧 Created initial state for {workflow_code}")
                    fixes += 1
                    
            except Workflow.DoesNotExist:
                if not dry_run:
                    # Create workflow
                    workflow = Workflow.objects.create(
                        code=workflow_code,
                        name=workflow_name,
                        description=f'Sub-workflow for {workflow_name} forms'
                    )
                    
                    # Create initial state
                    State.objects.create(
                        workflow=workflow,
                        code=f'{workflow_code}_DRAFT',
                        name='Draft',
                        is_initial=True,
                        is_final=False
                    )
                    
                self.stdout.write(f"   🔧 Created {workflow_code} workflow with initial state")
                fixes += 1
        
        return fixes
    
    def fix_state_metadata(self, dry_run):
        """Update state metadata with proper relevant_artifacts"""
        fixes = 0
        
        try:
            workflow = Workflow.objects.get(code='CREDIT_PAPER')
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_PAPER workflow not found - cannot fix state metadata")
            return 0
        
        expected_state_metadata = {
            'CREDIT_PAPER_CREDIT_REQUEST': {
                'relevant_artifacts': ['credit_request_form'],
                'parent_state': 'CREDIT_PAPER_CREDIT_REQUEST',
                'step_number': 1,
                'description': 'Phase 1: Credit Request - Relationship Manager creates initial request'
            },
            'CREDIT_PAPER_CREDIT_REVIEW_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form'],
                'parent_state': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING',
                'step_number': 2,
                'description': 'Phase 2: Credit Review - Credit Analyst reviews the request'
            },
            'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form'],
                'parent_state': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING',
                'step_number': 3,
                'description': 'Phase 3: Business Sponsorship - Business Sponsor provides approval'
            },
            'CREDIT_PAPER_ANALYSIS_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form'],
                'parent_state': 'CREDIT_PAPER_ANALYSIS_PENDING',
                'step_number': 4,
                'description': 'Phase 4: Analysis - Multiple forms for comprehensive analysis'
            },
            'CREDIT_PAPER_COMPILATION': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form'],
                'parent_state': 'CREDIT_PAPER_COMPILATION',
                'step_number': 5,
                'description': 'Phase 5: Compilation - Credit paper compilation'
            },
            'CREDIT_PAPER_APPROVAL_PENDING': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'parent_state': 'CREDIT_PAPER_APPROVAL_PENDING',
                'step_number': 6,
                'description': 'Phase 6: Approval - Final approval decision'
            },
            'CREDIT_PAPER_APPROVED': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'parent_state': 'CREDIT_PAPER_APPROVED',
                'step_number': 7,
                'description': 'Approved - All forms available for viewing'
            },
            'CREDIT_PAPER_REJECTED': {
                'relevant_artifacts': ['credit_request_form', 'credit_review_form', 'business_sponsorship_form', 'credit_questionnaire_form', 'legal_review_form', 'credit_analysis_form', 'credit_compilation_form', 'credit_approval_form'],
                'parent_state': 'CREDIT_PAPER_REJECTED',
                'step_number': 8,
                'description': 'Rejected - All completed forms available for viewing'
            }
        }
        
        for state_code, metadata in expected_state_metadata.items():
            try:
                state = State.objects.get(workflow=workflow, code=state_code)
                
                current_metadata = state.metadata or {}
                current_relevant = current_metadata.get('relevant_artifacts', [])
                expected_relevant = metadata['relevant_artifacts']
                
                if current_relevant != expected_relevant:
                    if not dry_run:
                        state.metadata = metadata
                        state.save(update_fields=['metadata'])
                    self.stdout.write(f"   🔧 Updated metadata for {state_code}")
                    self.stdout.write(f"      Old: {current_relevant}")
                    self.stdout.write(f"      New: {expected_relevant}")
                    fixes += 1
                else:
                    self.stdout.write(f"   ✅ {state_code} metadata already correct")
                    
            except State.DoesNotExist:
                self.stdout.write(f"   ⚠️  State {state_code} not found - skipping")
        
        return fixes
    
    def fix_form_metadata(self, dry_run):
        """Update workflow form metadata"""
        fixes = 0
        
        try:
            workflow = Workflow.objects.get(code='CREDIT_PAPER')
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_PAPER workflow not found - cannot fix form metadata")
            return 0
        
        expected_form_metadata = {
            'credit_request_form': {
                'title': 'Credit Request Form',
                'form_key': 'credit_request_form',
                'workflow_code': 'CREDIT_REQUEST',
                'editable_by_roles': ['relationship_manager'],
                'viewable_by_roles': ['relationship_manager', 'credit_analyst', 'business_sponsor', 'legal_reviewer', 'credit_approver', 'committee_approver'],
                'ownership_required': True
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
        
        current_metadata = workflow.metadata or {}
        current_form_metadata = current_metadata.get('form_metadata', {})
        
        needs_update = False
        for form_name, expected_data in expected_form_metadata.items():
            if form_name not in current_form_metadata:
                current_form_metadata[form_name] = expected_data
                needs_update = True
                self.stdout.write(f"   🔧 Added metadata for {form_name}")
            else:
                # Check if existing metadata needs updates
                current_data = current_form_metadata[form_name]
                for key, value in expected_data.items():
                    if current_data.get(key) != value:
                        current_data[key] = value
                        needs_update = True
        
        if needs_update:
            if not dry_run:
                if not workflow.metadata:
                    workflow.metadata = {}
                workflow.metadata['form_metadata'] = current_form_metadata
                workflow.save(update_fields=['metadata'])
            self.stdout.write(f"   🔧 Updated form metadata in CREDIT_PAPER workflow")
            fixes += 1
        else:
            self.stdout.write(f"   ✅ Form metadata already complete")
        
        return fixes
