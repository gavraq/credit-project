#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow

class Command(BaseCommand):
    help = 'Fix navigation metadata to use / instead of /dashboard'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("FIXING NAVIGATION METADATA")
        self.stdout.write("="*60)
        
        try:
            # Fix Credit Review transition specifically
            cr_workflow = Workflow.objects.get(code='CREDIT_REVIEW')
            submit_transition = Transition.objects.filter(
                workflow=cr_workflow,
                code='CR_SUBMIT_COMPLETE'
            ).first()
            
            if submit_transition:
                self.stdout.write(f"📋 Found transition: {submit_transition.name}")
                
                metadata = submit_transition.metadata or {}
                self.stdout.write(f"Current metadata: {metadata}")
                
                # Update navigation path
                if 'ui_behavior' in metadata and 'navigate_on_success' in metadata['ui_behavior']:
                    current_path = metadata['ui_behavior']['navigate_on_success']
                    self.stdout.write(f"Current navigation: {current_path}")
                    
                    if current_path == '/dashboard':
                        metadata['ui_behavior']['navigate_on_success'] = '/'
                        submit_transition.metadata = metadata
                        submit_transition.save()
                        
                        self.stdout.write(self.style.SUCCESS("✅ Updated navigation from /dashboard to /"))
                    else:
                        self.stdout.write(f"Navigation already set to: {current_path}")
                else:
                    self.stdout.write("No navigation metadata found")
                    
            else:
                self.stdout.write(self.style.ERROR("❌ CR_SUBMIT_COMPLETE transition not found"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))

if __name__ == '__main__':
    pass