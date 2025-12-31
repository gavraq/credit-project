import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from workflow_engine.models import Workflow

logger = logging.getLogger(__name__)


# Form permission configuration - defines who can edit/view each form
# This is the source of truth for form permissions
FORM_PERMISSIONS = {
    'credit_request_form': {
        'editable_by_roles': ['relationship_manager'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': True,  # Only RM who owns the application can edit
        'workflow_code': 'CREDIT_REQUEST',
        'model_name': 'CreditRequestForm',
    },
    'business_sponsorship_form': {
        'editable_by_roles': ['business_sponsor'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'BUSINESS_SPONSORSHIP',
        'model_name': 'BusinessSponsorshipForm',
    },
    'credit_questionnaire_form': {
        'editable_by_roles': ['relationship_manager'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CREDIT_QUESTIONNAIRE',
        'model_name': 'CreditQuestionnaireForm',
    },
    'legal_review_form': {
        'editable_by_roles': ['legal_reviewer'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'LEGAL_REVIEW',
        'model_name': 'LegalReviewForm',
    },
    'credit_review_form': {
        'editable_by_roles': ['credit_analyst', 'credit_approver'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CREDIT_REVIEW',
        'model_name': 'CreditReviewForm',
    },
    'credit_analysis_form': {
        'editable_by_roles': ['credit_analyst', 'credit_approver'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CREDIT_ANALYSIS',
        'model_name': 'CreditAnalysisForm',
    },
    'credit_compilation_form': {
        'editable_by_roles': ['credit_analyst'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CREDIT_COMPILATION',
        'model_name': 'CreditCompilationForm',
    },
    'credit_approval_form': {
        'editable_by_roles': ['credit_analyst'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CREDIT_APPROVAL',
        'model_name': 'CreditApprovalForm',
    },
    'climate_scorecard': {
        'editable_by_roles': ['credit_analyst'],
        'viewable_by_roles': [
            'relationship_manager', 'credit_analyst', 'business_sponsor',
            'legal_reviewer', 'credit_approver', 'committee_approver'
        ],
        'ownership_required': False,
        'workflow_code': 'CLIMATE_SCORECARD',
        'model_name': 'ClimateScorecard',
    },
}


class Command(BaseCommand):
    help = 'Load form metadata including permissions into workflow definitions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--update-only',
            action='store_true',
            help='Only update existing metadata, do not overwrite',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        update_only = options.get('update_only', False)

        try:
            # Get the parent workflow definition
            parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')

            # Initialize metadata if it doesn't exist
            if not parent_workflow.metadata:
                parent_workflow.metadata = {}

            # Get existing form_metadata or create new
            existing_metadata = parent_workflow.metadata.get('form_metadata', {})

            # Build complete form metadata
            form_metadata = self.build_form_metadata(existing_metadata, update_only)

            # Print what will be done
            self.stdout.write(f"\nForm metadata to be {'updated' if update_only else 'loaded'}:")
            for form_name, metadata in form_metadata.items():
                perms = metadata.get('editable_by_roles', [])
                ownership = metadata.get('ownership_required', False)
                self.stdout.write(
                    f"  - {metadata['title']} ({form_name})\n"
                    f"      editable_by: {perms}\n"
                    f"      ownership_required: {ownership}"
                )

            if not dry_run:
                # Add form metadata to workflow definition
                parent_workflow.metadata['form_metadata'] = form_metadata

                # Save the workflow definition
                parent_workflow.save()

                self.stdout.write(self.style.SUCCESS(
                    f'\nSuccessfully loaded metadata for {len(form_metadata)} forms '
                    f'into workflow definition {parent_workflow.code}'
                ))
            else:
                self.stdout.write(self.style.WARNING('\nDry run - no changes made'))

        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR("Parent workflow 'CREDIT_PAPER' not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading form metadata: {e}'))
            logger.exception('Error loading form metadata')

    def build_form_metadata(self, existing_metadata, update_only):
        """Build complete form metadata with permissions"""
        form_metadata = {}

        # Start with existing metadata if update_only
        if update_only:
            form_metadata = existing_metadata.copy()

        # Add/update each form from the permission configuration
        for form_name, config in FORM_PERMISSIONS.items():
            if update_only and form_name in form_metadata:
                # Only update permission fields, keep other existing fields
                form_metadata[form_name].update({
                    'editable_by_roles': config['editable_by_roles'],
                    'viewable_by_roles': config['viewable_by_roles'],
                    'ownership_required': config['ownership_required'],
                })
            else:
                # Create complete metadata entry
                form_metadata[form_name] = {
                    'title': self.get_form_title(config['model_name']),
                    'form_key': form_name,
                    'model_name': config['model_name'],
                    'workflow_code': config['workflow_code'],
                    'editable_by_roles': config['editable_by_roles'],
                    'viewable_by_roles': config['viewable_by_roles'],
                    'ownership_required': config['ownership_required'],
                }

        return form_metadata

    def get_form_title(self, model_name):
        """Generate a human-readable title from model name"""
        # Insert spaces before capital letters
        title = ''.join([' ' + c if c.isupper() else c for c in model_name]).strip()
        return title
