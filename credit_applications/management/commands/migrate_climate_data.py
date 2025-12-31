"""
Management command to migrate climate data from CreditAnalysisForm to ClimateScorecard.

This is a one-time migration command to move existing climate-related fields
from the basic CreditAnalysisForm to the comprehensive ClimateScorecard model.
"""

import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from credit_applications.models import CreditApplication, CreditAnalysisForm, ClimateScorecard

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migrate climate data from CreditAnalysisForm to ClimateScorecard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if ClimateScorecard already exists',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        force = options.get('force', False)

        self.stdout.write("Starting climate data migration...")

        # Get all credit applications with analysis forms
        applications_with_analysis = CreditApplication.objects.filter(
            credit_analysis_form__isnull=False
        ).select_related('credit_analysis_form')

        migrated_count = 0
        skipped_count = 0
        error_count = 0

        for app in applications_with_analysis:
            try:
                result = self.migrate_application(app, dry_run, force)
                if result == 'migrated':
                    migrated_count += 1
                elif result == 'skipped':
                    skipped_count += 1
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"Error migrating application {app.id}: {e}")
                )
                logger.exception(f"Error migrating climate data for application {app.id}")

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(f"Migration complete:")
        self.stdout.write(f"  Migrated: {migrated_count}")
        self.stdout.write(f"  Skipped: {skipped_count}")
        self.stdout.write(f"  Errors: {error_count}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n(Dry run - no changes were made)"))

    @transaction.atomic
    def migrate_application(self, credit_application, dry_run, force):
        """
        Migrate climate data for a single credit application.

        Returns:
            'migrated' if data was migrated
            'skipped' if migration was skipped
        """
        analysis_form = credit_application.credit_analysis_form

        # Check if any climate data exists in the analysis form
        has_climate_data = any([
            analysis_form.climate_risk_score,
            analysis_form.esg_score,
            analysis_form.transition_risk_assessment,
            analysis_form.physical_risk_assessment,
        ])

        if not has_climate_data:
            self.stdout.write(
                f"  Application {credit_application.id}: No climate data to migrate"
            )
            return 'skipped'

        # Check if ClimateScorecard already exists
        try:
            existing_scorecard = credit_application.climate_scorecard
            if not force:
                self.stdout.write(
                    f"  Application {credit_application.id}: ClimateScorecard already exists (use --force to overwrite)"
                )
                return 'skipped'
            else:
                self.stdout.write(
                    f"  Application {credit_application.id}: Overwriting existing ClimateScorecard"
                )
                scorecard = existing_scorecard
        except ClimateScorecard.DoesNotExist:
            scorecard = None

        # Map old values to new fields
        mapped_data = self.map_old_to_new(analysis_form)

        if dry_run:
            self.stdout.write(
                f"  Application {credit_application.id}: Would migrate climate data"
            )
            self.stdout.write(f"    Old climate_risk_score: {analysis_form.climate_risk_score}")
            self.stdout.write(f"    Old esg_score: {analysis_form.esg_score}")
            self.stdout.write(f"    Mapped transition_risk: {mapped_data['overall_transition_risk_score']}")
            self.stdout.write(f"    Mapped physical_risk: {mapped_data['overall_physical_risk_score']}")
            return 'migrated'

        # Create or update ClimateScorecard
        if scorecard is None:
            scorecard = ClimateScorecard(credit_application=credit_application)

        # Apply mapped data
        for field, value in mapped_data.items():
            setattr(scorecard, field, value)

        scorecard.save()

        self.stdout.write(
            self.style.SUCCESS(f"  Application {credit_application.id}: Migrated climate data")
        )
        return 'migrated'

    def map_old_to_new(self, analysis_form):
        """
        Map old climate fields to new ClimateScorecard fields.

        Old fields (Low/Medium/High):
        - climate_risk_score
        - esg_score
        - transition_risk_assessment (text)
        - physical_risk_assessment (text)

        New fields use more granular scoring.
        """
        # Map Low/Medium/High to new risk levels (handle both cases)
        risk_mapping = {
            'Low': 'low', 'low': 'low',
            'Medium': 'medium', 'medium': 'medium',
            'High': 'high', 'high': 'high',
            '': None, None: None,
        }

        # Map Low/Medium/High to A-E rating
        rating_mapping = {
            'Low': 'B', 'low': 'B',       # Low risk = B rating
            'Medium': 'C', 'medium': 'C', # Medium risk = C rating
            'High': 'D', 'high': 'D',     # High risk = D rating
            '': None, None: None,
        }

        # Map risk level to score (1-5)
        score_mapping = {
            'Low': 4, 'low': 4,           # Low risk = good score
            'Medium': 3, 'medium': 3,     # Medium = moderate
            'High': 2, 'high': 2,         # High risk = weak
            '': None, None: None,
        }

        mapped_data = {
            # Overall scores from climate_risk_score
            'overall_transition_risk_score': risk_mapping.get(analysis_form.climate_risk_score),
            'overall_physical_risk_score': risk_mapping.get(analysis_form.climate_risk_score),
            'overall_climate_risk_rating': rating_mapping.get(analysis_form.climate_risk_score),

            # Use text assessments
            'transition_plan_milestones': analysis_form.transition_risk_assessment or '',
            'chronic_exposure_assessment': analysis_form.physical_risk_assessment or '',

            # Set scores based on climate_risk_score
            'net_zero_score': score_mapping.get(analysis_form.climate_risk_score),
            'tcfd_disclosure_score': score_mapping.get(analysis_form.esg_score),
            'climate_governance_score': score_mapping.get(analysis_form.esg_score),

            # Data quality note about migration
            'data_proxies_used': 'Migrated from legacy CreditAnalysisForm climate fields.',
            'data_quality_overall': 'fair',
        }

        return {k: v for k, v in mapped_data.items() if v is not None}
