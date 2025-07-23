from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow, Transition
from django.db import transaction

class Command(BaseCommand):
    help = 'Clean up duplicate Credit Review transitions, keep only the new CR_* ones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        self.stdout.write("="*60)
        self.stdout.write("CLEANING UP CREDIT REVIEW TRANSITIONS")
        self.stdout.write("="*60)
        
        try:
            workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            
            # Find old CRV_TR_* transitions to remove
            old_transitions = Transition.objects.filter(
                workflow=workflow,
                code__startswith='CRV_TR_'
            ).order_by('code')
            
            # Find new CR_* transitions to keep
            new_transitions = Transition.objects.filter(
                workflow=workflow,
                code__startswith='CR_'
            ).order_by('code')
            
            self.stdout.write(f"📋 TRANSITIONS TO REMOVE ({old_transitions.count()}):")
            self.stdout.write("-" * 40)
            for t in old_transitions:
                self.stdout.write(f"❌ {t.code}: {t.name}")
                self.stdout.write(f"   {t.from_state.name} → {t.to_state.name}")
                self.stdout.write(f"   Roles: {t.allowed_roles}")
                self.stdout.write()
            
            self.stdout.write(f"📋 TRANSITIONS TO KEEP ({new_transitions.count()}):")
            self.stdout.write("-" * 40)
            for t in new_transitions:
                self.stdout.write(f"✅ {t.code}: {t.name}")
                self.stdout.write(f"   {t.from_state.name} → {t.to_state.name}")
                self.stdout.write(f"   Roles: {t.allowed_roles}")
                self.stdout.write()
            
            if old_transitions.exists():
                if not dry_run:
                    with transaction.atomic():
                        deleted_count = old_transitions.count()
                        old_transitions.delete()
                        self.stdout.write(f"✅ DELETED {deleted_count} old transitions")
                else:
                    self.stdout.write(f"🔍 DRY RUN: Would delete {old_transitions.count()} old transitions")
            else:
                self.stdout.write("✅ No old transitions to remove")
            
            # Verify final state
            if not dry_run:
                final_transitions = Transition.objects.filter(workflow=workflow).order_by('code')
                self.stdout.write(f"\n📊 FINAL STATE: {final_transitions.count()} transitions remain")
                for t in final_transitions:
                    self.stdout.write(f"   ✅ {t.code}: {t.name}")
            
        except Workflow.DoesNotExist:
            self.stdout.write("❌ CREDIT_REVIEW workflow not found")
        except Exception as e:
            self.stdout.write(f"❌ Error: {e}")
        
        self.stdout.write("\n" + "="*60)