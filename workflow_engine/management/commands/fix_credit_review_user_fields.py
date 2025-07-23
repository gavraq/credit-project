#!/usr/bin/env python3

from django.core.management.base import BaseCommand
from workflow_engine.models import Workflow
import json

class Command(BaseCommand):
    help = 'Add missing user fields to Credit Review Form metadata'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("FIXING CREDIT REVIEW FORM USER FIELDS")
        self.stdout.write("="*60)
        
        try:
            # Get the parent workflow
            workflow = Workflow.objects.get(code='CREDIT_PAPER')
            
            if not workflow.metadata or 'form_metadata' not in workflow.metadata:
                self.stdout.write(self.style.ERROR("No form_metadata found in workflow"))
                return
                
            form_metadata = workflow.metadata['form_metadata']
            
            # Check current credit_review_form metadata
            if 'credit_review_form' not in form_metadata:
                self.stdout.write(self.style.ERROR("credit_review_form not found in metadata"))
                return
                
            credit_review_config = form_metadata['credit_review_form']
            
            # Ensure field_mappings exists
            if 'field_mappings' not in credit_review_config:
                credit_review_config['field_mappings'] = {}
                
            field_mappings = credit_review_config['field_mappings']
            
            # Check current user_fields
            current_user_fields = field_mappings.get('user_fields', [])
            self.stdout.write(f"Current user fields: {current_user_fields}")
            
            # Add missing user fields
            required_user_fields = ['credit_reviewer', 'assigned_credit_analyst']
            missing_fields = [field for field in required_user_fields if field not in current_user_fields]
            
            if missing_fields:
                # Update user_fields list
                updated_user_fields = list(set(current_user_fields + required_user_fields))
                field_mappings['user_fields'] = updated_user_fields
                
                # Save the updated metadata
                workflow.save()
                
                self.stdout.write(self.style.SUCCESS(f"✅ Added missing user fields: {missing_fields}"))
                self.stdout.write(f"Updated user fields: {updated_user_fields}")
            else:
                self.stdout.write(self.style.SUCCESS("✅ All required user fields already present"))
                
            # Also check and add boolean fields if missing
            current_boolean_fields = field_mappings.get('boolean_fields', [])
            required_boolean_fields = ['questionnaire_required']
            missing_boolean_fields = [field for field in required_boolean_fields if field not in current_boolean_fields]
            
            if missing_boolean_fields:
                updated_boolean_fields = list(set(current_boolean_fields + required_boolean_fields))
                field_mappings['boolean_fields'] = updated_boolean_fields
                workflow.save()
                self.stdout.write(self.style.SUCCESS(f"✅ Added missing boolean fields: {missing_boolean_fields}"))
                
        except Workflow.DoesNotExist:
            self.stdout.write(self.style.ERROR("CREDIT_PAPER workflow not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))