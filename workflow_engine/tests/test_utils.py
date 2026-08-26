# Configure Django settings before importing any Django modules
import os
import django
from django.conf import settings

# Configure minimal Django settings to avoid database operations
if not settings.configured:
    settings.configure(
        DEBUG=True,
        USE_TZ=True,
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        INSTALLED_APPS=[
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sites",
            "workflow_engine",
        ],
        SITE_ID=1,
        MIDDLEWARE_CLASSES=(),
    )
    django.setup()

import json
from unittest import TestCase
from unittest.mock import patch, MagicMock

# Now import the functions to test
from workflow_engine.utils import (
    FormMetadataError,
    get_artifact_metadata,
    get_form_metadata,
    get_relevant_artifacts_for_state,
)

class WorkflowUtilsTests(TestCase):
    """Tests for workflow utility functions using unittest with minimal Django settings."""
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    def test_get_artifact_metadata_success(self, mock_get):
        """Test get_artifact_metadata when metadata is found in workflow definition."""
        # Setup mock workflow definition with metadata
        mock_workflow = MagicMock()
        mock_workflow.metadata = {
            'form_metadata': {
                'credit_request_form': {
                    'title': 'Credit Request Form',
                    'form_key': 'credit_request_form'
                }
            }
        }
        mock_get.return_value = mock_workflow
        
        # Call the function
        result = get_artifact_metadata('credit_request_form')
        
        # Assert results
        self.assertEqual(result, {
            'title': 'Credit Request Form',
            'form_key': 'credit_request_form'
        })
        mock_get.assert_called_once_with(code='CREDIT_PAPER')
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    def test_get_artifact_metadata_missing_form(self, mock_get):
        """Test get_artifact_metadata when artifact is not found in metadata."""
        # Setup mock workflow definition with metadata but missing the requested form
        mock_workflow = MagicMock()
        mock_workflow.metadata = {
            'form_metadata': {
                'other_form': {
                    'title': 'Other Form',
                    'form_key': 'other_form'
                }
            }
        }
        mock_get.return_value = mock_workflow
        
        # Call the function and expect an exception
        with self.assertRaises(FormMetadataError) as context:
            get_artifact_metadata('credit_request_form')
        
        # Assert error message
        self.assertIn("Form metadata for 'credit_request_form' not found", str(context.exception))
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    def test_get_artifact_metadata_missing_metadata(self, mock_get):
        """Test get_artifact_metadata when metadata is missing in workflow definition."""
        # Setup mock workflow definition without metadata
        mock_workflow = MagicMock()
        mock_workflow.metadata = {}
        mock_get.return_value = mock_workflow
        
        # Call the function and expect an exception
        with self.assertRaises(FormMetadataError) as context:
            get_artifact_metadata('credit_request_form')
        
        # Assert error message
        self.assertIn("No form_metadata found in workflow definition", str(context.exception))
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    def test_get_artifact_metadata_workflow_not_found(self, mock_get):
        """Test get_artifact_metadata when workflow definition is not found."""
        # Setup mock to raise DoesNotExist
        from django.core.exceptions import ObjectDoesNotExist
        mock_get.side_effect = ObjectDoesNotExist()
        
        # Call the function and expect an exception
        with self.assertRaises(FormMetadataError) as context:
            get_artifact_metadata('credit_request_form')
        
        # Assert error message
        self.assertIn("Parent workflow 'CREDIT_PAPER' not found", str(context.exception))

    @patch('credit_workflow.metadata.Workflow.objects.get')
    @patch('credit_workflow.metadata.State.objects.get')
    def test_get_relevant_artifacts_for_state_with_metadata(self, mock_state_get, mock_wf_get):
        """Test retrieving artifacts for a state with metadata."""
        # Setup mock state with metadata
        mock_state = MagicMock()
        mock_state.metadata = {'relevant_artifacts': ['credit_request_form']}
        mock_state_get.return_value = mock_state
        
        # Test function
        artifacts = get_relevant_artifacts_for_state('CREDIT_PAPER_CREDIT_REQUEST')
        self.assertEqual(artifacts, ['credit_request_form'])
        
        # Verify correct parameters were used
        mock_wf_get.assert_called_once_with(code='CREDIT_PAPER')
        mock_state_get.assert_called_once()
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    @patch('credit_workflow.metadata.State.objects.get')
    def test_get_relevant_artifacts_for_state_with_multiple_forms(self, mock_state_get, mock_wf_get):
        """Test retrieving multiple artifacts for a state."""
        # Setup mock state with metadata containing multiple forms
        mock_state = MagicMock()
        mock_state.metadata = {'relevant_artifacts': [
            'credit_request_form', 
            'business_sponsorship_form', 
            'credit_review_form', 
            'legal_review_form'
        ]}
        mock_state_get.return_value = mock_state
        
        # Test function
        artifacts = get_relevant_artifacts_for_state('CREDIT_PAPER_ANALYSIS_PENDING')
        self.assertEqual(artifacts, [
            'credit_request_form', 
            'business_sponsorship_form', 
            'credit_review_form', 
            'legal_review_form'
        ])
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    @patch('credit_workflow.metadata.State.objects.get')
    def test_get_relevant_artifacts_for_state_without_metadata(self, mock_state_get, mock_wf_get):
        """Test retrieving artifacts for a state without metadata."""
        # Setup mock state without metadata
        mock_state = MagicMock()
        mock_state.metadata = None
        mock_state_get.return_value = mock_state
        
        # Test function
        artifacts = get_relevant_artifacts_for_state('CREDIT_PAPER_DRAFT')
        self.assertEqual(artifacts, ['credit_request_form'])
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    @patch('credit_workflow.metadata.State.objects.get')
    def test_get_relevant_artifacts_for_state_with_empty_metadata(self, mock_state_get, mock_wf_get):
        """Test retrieving artifacts for a state with empty metadata."""
        # Setup mock state with empty metadata
        mock_state = MagicMock()
        mock_state.metadata = {}
        mock_state_get.return_value = mock_state
        
        # Test function
        artifacts = get_relevant_artifacts_for_state('CREDIT_PAPER_DRAFT')
        self.assertEqual(artifacts, ['credit_request_form'])

    @patch('credit_workflow.metadata.Workflow.objects.get')
    @patch('credit_workflow.metadata.State.objects.get')
    def test_get_relevant_artifacts_for_state_with_legacy_metadata_key(self, mock_state_get, mock_wf_get):
        """Test retrieving artifacts from legacy relevant_sub_processes metadata."""
        mock_state = MagicMock()
        mock_state.metadata = {'relevant_sub_processes': ['credit_request_form']}
        mock_state_get.return_value = mock_state

        artifacts = get_relevant_artifacts_for_state('CREDIT_PAPER_CREDIT_REQUEST')
        self.assertEqual(artifacts, ['credit_request_form'])
    
    @patch('credit_workflow.metadata.Workflow.objects.get')
    def test_get_relevant_artifacts_for_nonexistent_state(self, mock_wf_get):
        """Test retrieving artifacts for a state that doesn't exist."""
        # Setup mock to raise Workflow.DoesNotExist exception
        from django.core.exceptions import ObjectDoesNotExist
        # Import the models module to access the exception class
        from workflow_engine.models import Workflow
        mock_wf_get.side_effect = Workflow.DoesNotExist()
        
        # Test function
        artifacts = get_relevant_artifacts_for_state('NONEXISTENT_STATE')
        self.assertEqual(artifacts, ['credit_request_form'])
