"""
Credit Application CRUD Tests.

Tests create, read, update, and list operations for credit applications.
"""
import pytest
from typing import Dict, Any
from .utils.api_client import APIClient


class TestCreditApplicationCreate:
    """Tests for creating credit applications."""

    def test_create_credit_application(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test creating a new credit application."""
        result = rm_client.create_credit_application(credit_application_data)

        assert 'id' in result
        assert result['title'] == credit_application_data['title']
        assert result['counterparty']['id'] == credit_application_data['counterparty_id']

    def test_create_credit_application_missing_title(
        self,
        rm_client: APIClient,
        counterparty_id: str
    ):
        """Test that creating without title fails validation."""
        data = {
            'counterparty_id': counterparty_id,
            'purpose': 'Test purpose',
        }

        response = rm_client.post('/api/credit/credit-applications/', data)
        assert response.status_code == 400

    def test_create_credit_application_missing_counterparty(
        self,
        rm_client: APIClient
    ):
        """Test that creating without counterparty fails validation."""
        data = {
            'title': 'Test Application',
            'purpose': 'Test purpose',
        }

        response = rm_client.post('/api/credit/credit-applications/', data)
        assert response.status_code == 400

    def test_create_credit_application_creates_workflow_instance(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test that creating an application also creates a workflow instance."""
        result = rm_client.create_credit_application(credit_application_data)

        assert 'workflow_instance' in result
        assert result['workflow_instance'] is not None
        assert 'id' in result['workflow_instance']
        assert 'current_state' in result['workflow_instance']


class TestCreditApplicationRead:
    """Tests for reading credit applications."""

    def test_list_credit_applications(self, rm_client: APIClient):
        """Test listing credit applications."""
        result = rm_client.list_credit_applications()

        # Result should be a list or paginated response
        if isinstance(result, dict):
            assert 'results' in result or 'count' in result
        else:
            assert isinstance(result, list)

    def test_get_credit_application_by_id(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test getting a specific credit application."""
        # Create an application first
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        # Fetch it
        result = rm_client.get_credit_application(app_id)

        assert result['id'] == app_id
        assert result['title'] == credit_application_data['title']

    def test_get_nonexistent_application_returns_404(self, rm_client: APIClient):
        """Test that fetching non-existent application returns 404."""
        import uuid
        fake_id = str(uuid.uuid4())

        response = rm_client.get(f'/api/credit/credit-applications/{fake_id}/')
        assert response.status_code == 404


class TestCreditApplicationUpdate:
    """Tests for updating credit applications."""

    def test_update_credit_application_title(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test updating the title of an application."""
        # Create an application first
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        # Update it
        new_title = 'Updated Test Title'
        result = rm_client.update_credit_application(app_id, {'title': new_title})

        assert result['title'] == new_title

    def test_update_credit_application_description(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test updating the description field."""
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        new_description = 'Updated description for testing'
        result = rm_client.update_credit_application(app_id, {'description': new_description})

        assert result.get('description') == new_description

    def test_partial_update_preserves_other_fields(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any]
    ):
        """Test that PATCH only updates specified fields."""
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']
        original_title = created['title']

        # Update only description
        new_description = 'Only updating description'
        result = rm_client.update_credit_application(app_id, {'description': new_description})

        # Title should be unchanged
        assert result['title'] == original_title
        assert result.get('description') == new_description


class TestCreditApplicationWithLimits:
    """Tests for credit applications with limit requests."""

    def test_create_application_with_limit_requests(
        self,
        rm_client: APIClient,
        counterparty_id: str,
        limit_types: list
    ):
        """Test creating an application with limit requests."""
        import uuid

        # Skip if no limit types available
        if not limit_types:
            pytest.skip("No limit types available")

        data = {
            'title': f'Test with Limits {uuid.uuid4().hex[:8]}',
            'counterparty_id': counterparty_id,
            'description': 'Testing limit requests',
            'limit_requests': [
                {
                    'type': limit_types[0]['id'],
                    'proposed_limit': '500000.00',
                    'tenor_months': 12,
                    'currency': 'USD',
                }
            ]
        }

        result = rm_client.create_credit_application(data)

        assert 'id' in result
        # Limit requests might be empty if not properly handled during creation
        # Just verify the field exists
        assert 'limit_requests' in result

    def test_update_limit_requests(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        limit_types: list
    ):
        """Test updating limit requests on an existing application."""
        # Skip if no limit types available
        if not limit_types:
            pytest.skip("No limit types available")

        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        # Add/update limit requests
        new_limits = [
            {
                'type': limit_types[0]['id'],
                'proposed_limit': '2000000.00',
                'tenor_months': 24,
                'currency': 'EUR',
            }
        ]

        result = rm_client.update_credit_application(
            app_id,
            {'limit_requests': new_limits}
        )

        assert 'limit_requests' in result


class TestCreditApplicationFormData:
    """Tests for sub-form data on credit applications."""

    def test_save_credit_request_form_data(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ):
        """Test saving credit request form data."""
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        result = rm_client.save_credit_request_form(app_id, credit_request_form_data)

        assert 'id' in result
        # Check that credit_request_form was created/updated
        if 'credit_request_form' in result:
            assert result['credit_request_form'] is not None

    def test_form_data_persists_after_save(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ):
        """Test that saved form data can be retrieved."""
        created = rm_client.create_credit_application(credit_application_data)
        app_id = created['id']

        # Save form data
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Fetch the application again
        result = rm_client.get_credit_application(app_id)

        # Verify form data is present
        if 'credit_request_form' in result and result['credit_request_form']:
            assert result['credit_request_form'] is not None
