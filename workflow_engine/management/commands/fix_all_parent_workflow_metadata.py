#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow
import json

class Command(BaseCommand):
    help = 'Add parent workflow integration to all form submit transitions'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("FIXING ALL PARENT WORKFLOW METADATA")
        self.stdout.write("="*70)
        
        # Define the mappings based on the debug output
        parent_workflow_mappings = [
            {
                'workflow_code': 'CREDIT_REVIEW',
                'transition_code': 'CR_SUBMIT_COMPLETE',
                'parent_transition': 'PP_TR_2',
                'from_state': 'CREDIT_PAPER_CREDIT_REVIEW_PENDING',
                'description': 'Auto-transition parent to Business Sponsor Pending after Credit Review submission'
            },
            {
                'workflow_code': 'BUSINESS_SPONSORSHIP',
                'transition_code': 'BS_TR_4',
                'parent_transition': 'PP_TR_4',
                'from_state': 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING',
                'description': 'Auto-transition parent to Analysis Pending after Business Sponsorship submission'
            },
            {
                'workflow_code': 'CREDIT_ANALYSIS',
                'transition_code': 'CA_TR_4',
                'parent_transition': 'PP_TR_5',
                'from_state': 'CREDIT_PAPER_ANALYSIS_PENDING',
                'description': 'Auto-transition parent to Credit Compilation after Analysis submission'
            },
            {
                'workflow_code': 'CREDIT_COMPILATION',
                'transition_code': 'CC_TR_4',
                'parent_transition': 'PP_TR_7',
                'from_state': 'CREDIT_PAPER_COMPILATION',
                'description': 'Auto-transition parent to Approval Pending after Compilation submission'
            },
            {
                'workflow_code': 'CREDIT_APPROVAL',
                'transition_code': 'CA_TR_4',  # Note: This might conflict with Credit Analysis
                'parent_transition': 'PP_TR_8',
                'from_state': 'CREDIT_PAPER_APPROVAL_PENDING',
                'description': 'Auto-transition parent to Approved after Approval submission'
            }
        ]
        
        updated_count = 0
        
        for mapping in parent_workflow_mappings:
            try:
                self.stdout.write(f"\n📋 Processing {mapping['workflow_code']}...")
                
                # Find the workflow
                workflow = Workflow.objects.get(code=mapping['workflow_code'])
                self.stdout.write(f"   ✅ Found workflow: {workflow.name}")
                
                # Find the specific transition
                transition = Transition.objects.filter(
                    workflow=workflow,
                    code=mapping['transition_code']
                ).first()
                
                if not transition:
                    self.stdout.write(self.style.WARNING(
                        f"   ⚠️  Transition {mapping['transition_code']} not found"
                    ))
                    continue
                
                self.stdout.write(f"   ✅ Found transition: {transition.name}")
                
                # Check current metadata
                current_metadata = transition.metadata or {}
                
                # Add parent workflow configuration
                parent_workflow_config = {
                    "from_state": mapping['from_state'],
                    "description": mapping['description'],
                    "transition_code": mapping['parent_transition']
                }
                
                # Update metadata
                if 'parent_workflow' not in current_metadata:
                    current_metadata['parent_workflow'] = parent_workflow_config
                    
                    # Also add system_action to ensure the handler is called
                    current_metadata['system_action'] = 'submit_credit_request'  # Reuse existing handler
                    
                    transition.metadata = current_metadata
                    transition.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"   ✅ Added parent workflow metadata: {mapping['parent_transition']}"
                    ))
                    updated_count += 1
                else:
                    self.stdout.write(f"   ℹ️  Parent workflow metadata already exists")
                
            except Workflow.DoesNotExist:
                self.stdout.write(self.style.ERROR(
                    f"   ❌ Workflow {mapping['workflow_code']} not found"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ❌ Error: {e}"))
        
        self.stdout.write(f"\n" + "="*70)
        self.stdout.write(self.style.SUCCESS(f"✅ Updated {updated_count} transitions"))
        self.stdout.write("Now all form submissions should automatically advance the parent workflow!")
        
        if updated_count > 0:
            self.stdout.write(f"\n📋 NEXT STEPS:")
            self.stdout.write("1. Test Credit Review Form → Business Sponsorship transition")
            self.stdout.write("2. Verify other forms follow the same pattern")
            self.stdout.write("3. Check that forms appear on hub page after parent workflow advances")