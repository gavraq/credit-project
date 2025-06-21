import logging
import inspect
import importlib
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import models
from workflow_engine.models import WorkflowDefinition

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Dynamically discover form models and load metadata into workflow definitions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        try:
            # Get the parent workflow definition
            parent_workflow = WorkflowDefinition.objects.get(code='CREDIT_PAPER')
            
            # Initialize metadata if it doesn't exist
            if not parent_workflow.metadata:
                parent_workflow.metadata = {}
            
            # Discover all form models
            form_metadata = self.discover_form_models()
            
            # Print discovered forms
            self.stdout.write(f"Discovered {len(form_metadata)} form models:")
            for form_name, metadata in form_metadata.items():
                self.stdout.write(f"  - {metadata['title']} ({form_name})")
            
            if not dry_run:
                # Add form metadata to workflow definition
                parent_workflow.metadata['form_metadata'] = form_metadata
                
                # Save the workflow definition
                parent_workflow.save()
                
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully loaded metadata for {len(form_metadata)} forms into workflow definition {parent_workflow.code}'
                ))
            else:
                self.stdout.write(self.style.WARNING('Dry run - no changes made'))
            
        except WorkflowDefinition.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Parent workflow 'CREDIT_PAPER' not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading form metadata: {e}'))
    
    def discover_form_models(self):
        """Dynamically discover all form models in the project"""
        form_metadata = {}
        
        # Look for models in credit_applications app
        credit_app_models = apps.get_app_config('credit_applications').get_models()
        
        # Find models that are likely form models
        for model in credit_app_models:
            model_name = model.__name__.lower()
            
            # Check if the model name ends with 'form'
            if model_name.endswith('form'):
                form_name = model_name
                
                # Convert CamelCase to snake_case if needed
                if not '_' in form_name:
                    form_name = ''.join(['_' + c.lower() if c.isupper() else c for c in model.__name__])
                    form_name = form_name.lstrip('_').lower()
                
                # Generate metadata for this form
                form_metadata[form_name] = {
                    'title': self.get_form_title(model),
                    'form_key': form_name
                }
        
        return form_metadata
    
    def get_form_title(self, model):
        """Generate a human-readable title for a form model"""
        # Try to get verbose_name from Meta
        if hasattr(model._meta, 'verbose_name') and model._meta.verbose_name:
            return model._meta.verbose_name
        
        # Otherwise, convert the model name to a title
        name = model.__name__
        # Insert spaces before capital letters
        title = ''.join([' ' + c if c.isupper() else c for c in name]).strip()
        # Add 'Form' if it's not already there
        if not title.endswith(' Form'):
            title += ' Form'
        return title
