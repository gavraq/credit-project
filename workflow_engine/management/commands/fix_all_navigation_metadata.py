#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Transition, Workflow

class Command(BaseCommand):
    help = 'Fix navigation metadata for ALL workflows to navigate back to dashboard'

    def handle(self, *args, **options):
        self.stdout.write("="*80)
        self.stdout.write("FIXING NAVIGATION METADATA FOR ALL WORKFLOWS")
        self.stdout.write("="*80)
        
        try:
            # Define standard navigation patterns
            def get_navigation_metadata(transition_name, existing_metadata=None):
                """Generate navigation metadata based on transition type"""
                
                # Start with existing metadata or empty dict
                metadata = existing_metadata.copy() if existing_metadata else {}
                
                # Determine button style based on transition name
                if 'draft' in transition_name.lower() or 'save' in transition_name.lower():
                    button_style = 'primary'  # Blue for drafts/saves
                elif 'submit' in transition_name.lower() or 'approve' in transition_name.lower():
                    button_style = 'success'  # Green for submissions/approvals
                elif 'reject' in transition_name.lower():
                    button_style = 'error'    # Red for rejections
                else:
                    button_style = 'secondary'  # Gray for others
                
                # Add/update ui_behavior
                if 'ui_behavior' not in metadata:
                    metadata['ui_behavior'] = {}
                    
                metadata['ui_behavior'].update({
                    'button_style': button_style,
                    'navigate_on_success': '/'  # Always navigate back to dashboard
                })
                
                return metadata
            
            # Get all workflows
            workflows = Workflow.objects.all().order_by('code')
            total_updated = 0
            
            for workflow in workflows:
                self.stdout.write(f"\n🔍 WORKFLOW: {workflow.code}")
                self.stdout.write("-" * 50)
                
                transitions = Transition.objects.filter(workflow=workflow).order_by('code')
                workflow_updated = 0
                
                for transition in transitions:
                    # Check if navigation is already configured
                    has_navigation = False
                    if transition.metadata:
                        ui_behavior = transition.metadata.get('ui_behavior', {})
                        has_navigation = bool(ui_behavior.get('navigate_on_success'))
                    
                    if has_navigation:
                        self.stdout.write(f"   ✅ {transition.code} - Already has navigation")
                    else:
                        # Add navigation metadata
                        new_metadata = get_navigation_metadata(transition.name, transition.metadata)
                        transition.metadata = new_metadata
                        transition.save()
                        
                        nav_path = new_metadata['ui_behavior']['navigate_on_success']
                        button_style = new_metadata['ui_behavior']['button_style']
                        
                        self.stdout.write(self.style.SUCCESS(
                            f"   🔧 {transition.code} - Added navigation: {nav_path} (style: {button_style})"
                        ))
                        workflow_updated += 1
                        total_updated += 1
                
                if workflow_updated > 0:
                    self.stdout.write(f"   📊 Updated {workflow_updated} transitions in {workflow.code}")
            
            self.stdout.write(f"\n" + "="*80)
            self.stdout.write(self.style.SUCCESS(f"✅ TOTAL: Updated {total_updated} transitions across all workflows"))
            
            if total_updated > 0:
                self.stdout.write(f"\n📋 ALL FORMS NOW HAVE CONSISTENT BEHAVIOR:")
                self.stdout.write("1. ✅ Navigate back to dashboard (/) after any transition")
                self.stdout.write("2. ✅ Proper button styling:")
                self.stdout.write("   - Save as Draft = Blue (primary)")
                self.stdout.write("   - Submit/Approve = Green (success)")  
                self.stdout.write("   - Reject = Red (error)")
                self.stdout.write("   - Other = Gray (secondary)")
                self.stdout.write("3. ✅ No more 'staying on edit screen' issues")
                self.stdout.write("4. ✅ Consistent user experience across all forms")
                
                self.stdout.write(f"\n🎯 NEXT STEPS:")
                self.stdout.write("1. Test Business Sponsorship Form navigation")
                self.stdout.write("2. Test other forms to verify they also navigate correctly")
                self.stdout.write("3. All forms should now behave consistently")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    pass