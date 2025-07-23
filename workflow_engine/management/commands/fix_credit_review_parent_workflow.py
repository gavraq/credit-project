#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow
import json

class Command(BaseCommand):
    help = 'Add parent workflow integration to Credit Review Form transitions'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("FIXING CREDIT REVIEW PARENT WORKFLOW INTEGRATION")
        self.stdout.write("="*60)
        
        try:
            # Find the Credit Review workflow
            cr_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            
            # Find the transition that submits for Business Sponsorship
            # This should be the transition TO "Submitted" state
            submit_transition = Transition.objects.filter(
                workflow=cr_workflow,
                to_state__code='CREDIT_REVIEW_SUBMITTED'
            ).first()
            
            if not submit_transition:
                self.stdout.write(self.style.ERROR("❌ Credit Review submit transition not found"))
                return
                
            self.stdout.write(f"📋 Found transition: {submit_transition.code} - {submit_transition.name}")
            self.stdout.write(f"   From: {submit_transition.from_state.name}")
            self.stdout.write(f"   To: {submit_transition.to_state.name}")
            
            # Check current metadata
            current_metadata = submit_transition.metadata or {}
            self.stdout.write(f"   Current metadata: {current_metadata}")
            
            # Add parent workflow integration (same pattern as Credit Request)
            parent_workflow_config = {
                "from_state": "CREDIT_PAPER_CREDIT_REVIEW_PENDING",
                "description": "Auto-transition parent to Business Sponsor Pending after Credit Review submission",
                "transition_code": "PP_TR_2"
            }
            
            # Update metadata
            if 'parent_workflow' not in current_metadata:
                current_metadata['parent_workflow'] = parent_workflow_config
                submit_transition.metadata = current_metadata
                submit_transition.save()
                
                self.stdout.write(self.style.SUCCESS("✅ Added parent workflow integration"))
                self.stdout.write(f"   Parent transition: PP_TR_2 (Submit for Business Sponsorship)")
                self.stdout.write(f"   Updated metadata: {current_metadata}")
            else:
                self.stdout.write(self.style.SUCCESS("✅ Parent workflow integration already exists"))
                
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR("❌ CREDIT_REVIEW workflow not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))