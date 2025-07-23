from django.core.management.base import BaseCommand
from workflow_engine.models import Transition
from django.db import transaction

class Command(BaseCommand):
    help = 'Fix all transition role names to match database exactly'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        self.stdout.write("="*60)
        self.stdout.write("FIXING TRANSITION ROLE NAMES")
        self.stdout.write("="*60)
        
        # Define the correct mappings
        role_mappings = {
            # Lowercase/underscore versions to correct Title Case versions
            'credit_analyst': 'Credit Analyst',
            'credit_approver': 'Credit Approver',
            'relationship_manager': 'Relationship Manager',
            'business_sponsor': 'Business Sponsor',
            'legal_reviewer': 'Legal Reviewer',
            'committee_approver': 'Committee Approver',
            'approver': 'Credit Approver',  # Generic 'approver' should be Credit Approver
            
            # These are already correct but included for completeness
            'Credit Analyst': 'Credit Analyst',
            'Credit Approver': 'Credit Approver',
            'Relationship Manager': 'Relationship Manager',
            'Business Sponsor': 'Business Sponsor',
            'Legal Reviewer': 'Legal Reviewer',
            'Committee Approver': 'Committee Approver',
            'system': 'system',  # System role stays lowercase
        }
        
        # Get all transitions
        all_transitions = Transition.objects.all().order_by('workflow__code', 'code')
        
        fixes_needed = 0
        fixes_applied = 0
        
        try:
            with transaction.atomic():
                for transition in all_transitions:
                    if not transition.allowed_roles:
                        continue
                    
                    original_roles = transition.allowed_roles.copy()
                    updated_roles = []
                    needs_update = False
                    
                    for role in original_roles:
                        if role in role_mappings and role != role_mappings[role]:
                            updated_roles.append(role_mappings[role])
                            needs_update = True
                            fixes_needed += 1
                        else:
                            updated_roles.append(role)
                    
                    if needs_update:
                        self.stdout.write(f"\n🔧 {transition.workflow.code} - {transition.code}: {transition.name}")
                        self.stdout.write(f"   OLD: {original_roles}")
                        self.stdout.write(f"   NEW: {updated_roles}")
                        
                        if not dry_run:
                            transition.allowed_roles = updated_roles
                            transition.save(update_fields=['allowed_roles'])
                            fixes_applied += 1
                
                if dry_run:
                    transaction.set_rollback(True)
                    self.stdout.write(f"\n🔍 DRY RUN: Would fix {fixes_needed} role references")
                else:
                    self.stdout.write(f"\n✅ APPLIED {fixes_applied} fixes")
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ ERROR: {e}"))
            return
        
        # Summary by workflow
        self.stdout.write("\n📊 SUMMARY BY WORKFLOW")
        self.stdout.write("-" * 40)
        
        workflow_codes = ['CREDIT_REQUEST', 'CREDIT_REVIEW', 'BUSINESS_SPONSORSHIP', 
                         'LEGAL_REVIEW', 'CREDIT_QUESTIONNAIRE', 'CREDIT_ANALYSIS',
                         'CREDIT_COMPILATION', 'CREDIT_APPROVAL']
        
        for workflow_code in workflow_codes:
            transitions = Transition.objects.filter(workflow__code=workflow_code)
            if transitions.exists():
                roles = set()
                for t in transitions:
                    if t.allowed_roles:
                        roles.update(t.allowed_roles)
                self.stdout.write(f"{workflow_code}: {', '.join(sorted(roles))}")
        
        if not dry_run and fixes_applied > 0:
            self.stdout.write("\n✅ All transition roles have been fixed!")
            self.stdout.write("Users should now see workflow action buttons based on their roles.")
        
        self.stdout.write("\n" + "="*60)