from django.core.management.base import BaseCommand
from django.db import transaction
from credit_applications.models import CreditApplication
from workflow_engine.models import State
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Initialize ranks for credit applications based on priority and required by date"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        try:
            # Get APPROVED state to exclude from ranking
            try:
                approved_state = State.objects.get(code='CREDIT_PAPER_APPROVED')
                self.stdout.write(f"Found APPROVED state: {approved_state.name}")
            except State.DoesNotExist:
                self.stdout.write(self.style.ERROR('CREDIT_PAPER_APPROVED state not found. Please ensure workflow states are loaded.'))
                return
            
            # Get all open applications (not in APPROVED state)
            open_applications = CreditApplication.objects.exclude(
                workflow_instance__current_state=approved_state
            ).order_by('priority', 'required_by_date', 'created_at')
            
            total_open = open_applications.count()
            self.stdout.write(f"Found {total_open} open applications to rank")
            
            if total_open == 0:
                self.stdout.write(self.style.WARNING('No open applications found to rank'))
                return
            
            # Show ranking logic
            self.stdout.write("Ranking logic:")
            self.stdout.write("1. Priority (ascending - lower priority numbers rank higher)")
            self.stdout.write("2. Required by date (ascending - earlier dates rank higher)")
            self.stdout.write("3. Created at (ascending - older applications rank higher)")
            
            if dry_run:
                self.stdout.write("\nApplications would be ranked as follows:")
                for i, app in enumerate(open_applications[:10], 1):  # Show first 10
                    self.stdout.write(
                        f"Rank {i}: {app.reference_number} - Priority: {app.priority}, "
                        f"Required by: {app.required_by_date}, Current rank: {app.rank}"
                    )
                if total_open > 10:
                    self.stdout.write(f"... and {total_open - 10} more applications")
                return
            
            # Update ranks in a transaction
            with transaction.atomic():
                updated_count = 0
                for i, application in enumerate(open_applications, 1):
                    old_rank = application.rank
                    application.rank = i
                    application.save(update_fields=['rank'])
                    updated_count += 1
                    
                    if old_rank != i:
                        self.stdout.write(
                            f"Updated {application.reference_number}: rank {old_rank} -> {i}"
                        )
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully updated ranks for {updated_count} applications')
                )
                
        except Exception as e:
            logger.error(f"Error initializing application ranks: {e}")
            self.stdout.write(
                self.style.ERROR(f'Error initializing application ranks: {e}')
            )