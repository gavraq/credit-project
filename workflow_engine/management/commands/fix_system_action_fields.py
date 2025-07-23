#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow

class Command(BaseCommand):
    help = 'Fix system_action fields on transitions (not just metadata)'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("FIXING SYSTEM ACTION FIELDS")
        self.stdout.write("="*70)
        
        # Define the transitions that need system_action field updates
        transitions_to_fix = [
            ('CREDIT_REVIEW', 'CR_SUBMIT_COMPLETE', 'submit_credit_request'),
            ('BUSINESS_SPONSORSHIP', 'BS_TR_4', 'submit_credit_request'),
            ('CREDIT_ANALYSIS', 'CA_TR_4', 'submit_credit_request'),
            ('CREDIT_COMPILATION', 'CC_TR_4', 'submit_credit_request'),
            ('CREDIT_APPROVAL', 'CA_TR_4', 'submit_credit_request'),
        ]
        
        updated_count = 0
        
        for workflow_code, transition_code, system_action in transitions_to_fix:
            try:
                self.stdout.write(f"\n📋 Processing {workflow_code} - {transition_code}...")
                
                # Find the workflow
                workflow = Workflow.objects.get(code=workflow_code)
                
                # Find the specific transition
                transition = Transition.objects.filter(
                    workflow=workflow,
                    code=transition_code
                ).first()
                
                if not transition:
                    self.stdout.write(self.style.WARNING(
                        f"   ⚠️  Transition {transition_code} not found"
                    ))
                    continue
                
                self.stdout.write(f"   ✅ Found transition: {transition.name}")
                self.stdout.write(f"   Current system_action field: '{transition.system_action}'")
                
                # Update the system_action field
                if transition.system_action != system_action:
                    transition.system_action = system_action
                    transition.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"   ✅ Updated system_action field to: '{system_action}'"
                    ))
                    updated_count += 1
                else:
                    self.stdout.write(f"   ℹ️  system_action field already correct")
                
            except Workflow.DoesNotExist:
                self.stdout.write(self.style.ERROR(
                    f"   ❌ Workflow {workflow_code} not found"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ❌ Error: {e}"))
        
        self.stdout.write(f"\n" + "="*70)
        self.stdout.write(self.style.SUCCESS(f"✅ Updated {updated_count} transition system_action fields"))
        
        if updated_count > 0:
            self.stdout.write(f"\n📋 NOW SYSTEM ACTIONS SHOULD WORK:")
            self.stdout.write("1. Form submission triggers transition")
            self.stdout.write("2. perform_transition() checks transition.system_action field")
            self.stdout.write("3. Calls handle_submit_credit_request() function")
            self.stdout.write("4. Handler reads parent_workflow metadata")
            self.stdout.write("5. Handler triggers parent workflow transition")
            self.stdout.write("6. Parent workflow advances to next state")
            self.stdout.write("7. Next form becomes available on hub page")