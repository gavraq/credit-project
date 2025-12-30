#!/usr/bin/env python3
import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import json
from workflow_engine.models import Workflow, State

def check_state_metadata():
    try:
        # Get the parent workflow
        parent_workflow = Workflow.objects.get(code='CREDIT_PAPER')
        print(f'Parent workflow: {parent_workflow.name}')

        # Get the CREDIT_PAPER_CREDIT_REVIEW_PENDING state
        try:
            credit_review_state = State.objects.get(
                workflow=parent_workflow,
                code='CREDIT_PAPER_CREDIT_REVIEW_PENDING'
            )
            print(f'\nState: {credit_review_state.name} ({credit_review_state.code})')
            
            if credit_review_state.metadata:
                print('Metadata:', json.dumps(credit_review_state.metadata, indent=2))
                
                # Check if relevant_sub_processes includes credit_review_form
                if 'relevant_sub_processes' in credit_review_state.metadata:
                    sub_processes = credit_review_state.metadata['relevant_sub_processes']
                    print(f'\nRelevant sub-processes: {sub_processes}')
                    if 'credit_review_form' in sub_processes:
                        print('✓ credit_review_form is included in relevant_sub_processes')
                    else:
                        print('✗ credit_review_form is NOT included in relevant_sub_processes')
                else:
                    print('\n✗ No relevant_sub_processes found in state metadata')
            else:
                print('Metadata: None')
                print('\n✗ No metadata found for this state')
                
        except State.DoesNotExist:
            print('State CREDIT_PAPER_CREDIT_REVIEW_PENDING not found')
            # List all states to see what's available
            print('\nAvailable states:')
            for state in State.objects.filter(workflow=parent_workflow):
                print(f'  - {state.name} ({state.code})')
                
    except Workflow.DoesNotExist:
        print('Parent workflow CREDIT_PAPER not found')
        print('Available workflows:')
        for wf in Workflow.objects.all():
            print(f'  - {wf.code}: {wf.name}')

if __name__ == '__main__':
    check_state_metadata()