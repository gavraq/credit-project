"""
Pytest fixtures for Credit Risk Workflow API tests.

Provides authenticated API clients for each role plus shared test data fixtures.

Test User Configuration:
Users should be configured via environment variables or .env file:
- TEST_API_URL: Base URL for API (default: https://credit.gavinslater.co.uk)
- TEST_PASSWORD: Default password for all test users (default: testpass123)
- TEST_RM_USER: Relationship Manager username (default: rm_test)
- TEST_CA_USER: Credit Analyst username (default: ca_test)
- TEST_BS_USER: Business Sponsor username (default: bs_test)
- TEST_LR_USER: Legal Reviewer username (default: lr_test)
- TEST_APPROVER_USER: Credit Approver username (default: approver_test)
"""
import os
import pytest
from typing import Dict, Any, Generator
from dotenv import load_dotenv
from .utils.api_client import APIClient

# Load environment variables
load_dotenv()

# =============================================================================
# Configuration
# =============================================================================

TEST_API_URL = os.getenv('TEST_API_URL', 'https://credit.gavinslater.co.uk')
DEFAULT_PASSWORD = os.getenv('TEST_PASSWORD', 'testpass123')

# Test user credentials by role
TEST_USERS = {
    'relationship_manager': {
        'username': os.getenv('TEST_RM_USER', 'rm_test'),
        'password': os.getenv('TEST_RM_PASSWORD', DEFAULT_PASSWORD),
    },
    'credit_analyst': {
        'username': os.getenv('TEST_CA_USER', 'ca_test'),
        'password': os.getenv('TEST_CA_PASSWORD', DEFAULT_PASSWORD),
    },
    'business_sponsor': {
        'username': os.getenv('TEST_BS_USER', 'bs_test'),
        'password': os.getenv('TEST_BS_PASSWORD', DEFAULT_PASSWORD),
    },
    'legal_reviewer': {
        'username': os.getenv('TEST_LR_USER', 'lr_test'),
        'password': os.getenv('TEST_LR_PASSWORD', DEFAULT_PASSWORD),
    },
    'credit_approver': {
        'username': os.getenv('TEST_APPROVER_USER', 'approver_test'),
        'password': os.getenv('TEST_APPROVER_PASSWORD', DEFAULT_PASSWORD),
    },
}


# =============================================================================
# Base Fixtures
# =============================================================================

@pytest.fixture(scope='session')
def api_url() -> str:
    """Get the API base URL for testing."""
    return TEST_API_URL


@pytest.fixture
def api_client() -> Generator[APIClient, None, None]:
    """Create an unauthenticated API client."""
    client = APIClient(TEST_API_URL)
    yield client
    client.logout()


# =============================================================================
# Role-Based Authenticated Clients
# =============================================================================

@pytest.fixture
def rm_client() -> Generator[APIClient, None, None]:
    """
    Authenticated API client for Relationship Manager role.

    Use for:
    - Creating credit applications
    - Submitting credit requests (Phase 1)
    - Completing credit questionnaires (Phase 4)
    """
    client = APIClient(TEST_API_URL)
    credentials = TEST_USERS['relationship_manager']
    client.login(credentials['username'], credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def ca_client() -> Generator[APIClient, None, None]:
    """
    Authenticated API client for Credit Analyst role.

    Use for:
    - Credit review (Phase 2)
    - Credit analysis (Phase 4)
    - Credit compilation (Phase 5)
    - Credit approval (Phase 6)
    """
    client = APIClient(TEST_API_URL)
    credentials = TEST_USERS['credit_analyst']
    client.login(credentials['username'], credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def bs_client() -> Generator[APIClient, None, None]:
    """
    Authenticated API client for Business Sponsor role.

    Use for:
    - Business sponsorship form (Phase 3)
    """
    client = APIClient(TEST_API_URL)
    credentials = TEST_USERS['business_sponsor']
    client.login(credentials['username'], credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def lr_client() -> Generator[APIClient, None, None]:
    """
    Authenticated API client for Legal Reviewer role.

    Use for:
    - Legal review form (Phase 4)
    """
    client = APIClient(TEST_API_URL)
    credentials = TEST_USERS['legal_reviewer']
    client.login(credentials['username'], credentials['password'])
    yield client
    client.logout()


@pytest.fixture
def approver_client() -> Generator[APIClient, None, None]:
    """
    Authenticated API client for Credit Approver role.

    Use for:
    - Final credit approval (Phase 6)
    """
    client = APIClient(TEST_API_URL)
    credentials = TEST_USERS['credit_approver']
    client.login(credentials['username'], credentials['password'])
    yield client
    client.logout()


# =============================================================================
# Reference Data Fixtures
# =============================================================================

@pytest.fixture(scope='session')
def counterparty_id(api_url: str) -> str:
    """
    Get a valid counterparty ID for testing.

    Creates a temporary client to fetch counterparties.
    Returns the first available counterparty ID.
    """
    client = APIClient(api_url)
    credentials = TEST_USERS['relationship_manager']
    client.login(credentials['username'], credentials['password'])

    counterparties = client.list_counterparties()
    client.logout()

    if not counterparties:
        pytest.skip("No counterparties available in the system")

    # Handle paginated response
    if isinstance(counterparties, dict) and 'results' in counterparties:
        counterparties = counterparties['results']

    return counterparties[0]['id']


@pytest.fixture(scope='session')
def limit_types(api_url: str) -> list:
    """
    Get available limit types for testing.

    Returns list of limit type objects.
    """
    client = APIClient(api_url)
    credentials = TEST_USERS['relationship_manager']
    client.login(credentials['username'], credentials['password'])

    limit_types = client.list_limit_types()
    client.logout()

    if not limit_types:
        pytest.skip("No limit types available in the system")

    # Handle paginated response
    if isinstance(limit_types, dict) and 'results' in limit_types:
        limit_types = limit_types['results']

    return limit_types


@pytest.fixture(scope='session')
def business_sponsors(api_url: str) -> list:
    """
    Get available business sponsors for testing.

    Returns list of user objects with Business Sponsor role.
    """
    client = APIClient(api_url)
    credentials = TEST_USERS['relationship_manager']
    client.login(credentials['username'], credentials['password'])

    sponsors = client.list_users_by_role('business_sponsor')
    client.logout()

    if not sponsors:
        pytest.skip("No business sponsors available in the system")

    return sponsors


# =============================================================================
# Test Data Factories
# =============================================================================

@pytest.fixture
def credit_application_data(counterparty_id: str, limit_types: list) -> Dict[str, Any]:
    """
    Factory fixture for creating credit application test data.

    Returns a valid payload for creating a new credit application.
    """
    import uuid

    # Get first limit type ID
    limit_type_id = limit_types[0]['id'] if limit_types else None

    return {
        'title': f'Test Credit Application {uuid.uuid4().hex[:8]}',
        'counterparty_id': counterparty_id,
        'purpose': 'API test - automated workflow testing',
        'limit_requests': [
            {
                'type': limit_type_id,
                'proposed_limit': '1000000.00',
                'tenor_months': 12,
                'currency': 'USD',
            }
        ] if limit_type_id else [],
    }


@pytest.fixture
def credit_request_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit request form (Phase 1) test data.

    Returns payload with credit_request_ prefixed fields.
    """
    return {
        'credit_request_form_start_date': '2025-01-01',
        'credit_request_form_requested_by': 'API Test User',
        'credit_request_form_business_rationale': 'Testing workflow transitions via API',
    }


@pytest.fixture
def credit_review_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit review form (Phase 2) test data.

    Returns payload with credit_review_ prefixed fields.
    """
    return {
        'credit_review_form_start_date': '2025-01-02',
        'credit_review_form_risk_rating': 'Medium',
        'credit_review_form_analyst_comments': 'API test credit review',
        'credit_review_form_recommendation': 'approve',
    }


@pytest.fixture
def business_sponsorship_form_data(business_sponsors: list) -> Dict[str, Any]:
    """
    Factory fixture for business sponsorship form (Phase 3) test data.

    Returns payload with business_sponsorship_ prefixed fields.
    """
    senior_sponsor_id = business_sponsors[0]['id'] if business_sponsors else None
    second_sponsor_id = business_sponsors[1]['id'] if len(business_sponsors) > 1 else senior_sponsor_id

    return {
        'business_sponsorship_form_start_date': '2025-01-03',
        'business_sponsorship_form_senior_business_sponsor': senior_sponsor_id,
        'business_sponsorship_form_second_business_sponsor': second_sponsor_id,
        'business_sponsorship_form_business_justification': 'API test business justification',
        'business_sponsorship_form_expected_revenue': '100000.00',
    }


@pytest.fixture
def legal_review_form_data() -> Dict[str, Any]:
    """
    Factory fixture for legal review form (Phase 4) test data.

    Returns payload with legal_review_ prefixed fields.
    """
    return {
        'legal_review_form_start_date': '2025-01-04',
        'legal_review_form_agreement_template': 'ISDA',
        'legal_review_form_governing_law': 'English Law',
        'legal_review_form_positive_netting_opinion': True,
        'legal_review_form_positive_collateral_opinion': True,
        'legal_review_form_has_csa': True,
    }


@pytest.fixture
def credit_questionnaire_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit questionnaire form (Phase 4) test data.

    Returns payload with credit_questionnaire_ prefixed fields.
    """
    return {
        'credit_questionnaire_form_start_date': '2025-01-04',
        'credit_questionnaire_form_counterparty_type': 'Corporate',
        'credit_questionnaire_form_country_of_incorporation': 'United Kingdom',
        'credit_questionnaire_form_regulatory_status': 'Regulated',
    }


@pytest.fixture
def credit_analysis_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit analysis form (Phase 4) test data.

    Returns payload with credit_analysis_ prefixed fields.
    """
    return {
        'credit_analysis_form_start_date': '2025-01-04',
        'credit_analysis_form_financial_analysis': 'API test financial analysis',
        'credit_analysis_form_risk_assessment': 'API test risk assessment',
        'credit_analysis_form_recommendation': 'approve',
    }


@pytest.fixture
def credit_compilation_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit compilation form (Phase 5) test data.

    Returns payload with credit_compilation_ prefixed fields.
    """
    return {
        'credit_compilation_form_start_date': '2025-01-05',
        'credit_compilation_form_all_forms_reviewed': True,
        'credit_compilation_form_ready_for_approval': True,
        'credit_compilation_form_compilation_notes': 'API test compilation complete',
    }


@pytest.fixture
def credit_approval_form_data() -> Dict[str, Any]:
    """
    Factory fixture for credit approval form (Phase 6) test data.

    Returns payload with credit_approval_ prefixed fields.
    """
    return {
        'credit_approval_form_start_date': '2025-01-06',
        'credit_approval_form_approval_decision': 'approved',
        'credit_approval_form_approval_comments': 'API test approval granted',
        'credit_approval_form_conditions': '',
    }


# =============================================================================
# Workflow State Tracking Fixture
# =============================================================================

@pytest.fixture
def workflow_helper():
    """
    Helper class for common workflow operations.

    Provides utility methods for workflow testing.
    """
    class WorkflowHelper:
        @staticmethod
        def get_artifact(app_data: Dict, artifact_key: str) -> Dict:
            """Extract an artifact descriptor from the application artifact list."""
            artifacts = app_data.get('artifacts', []) or []
            for artifact in artifacts:
                if artifact.get('key') == artifact_key:
                    return artifact
            return {}

        @staticmethod
        def get_form_workflow_id(app_data: Dict, form_key: str) -> str:
            """Deprecated for reference-only artifact lists; use the artifact detail endpoint instead."""
            return None

        @staticmethod
        def get_parent_workflow_id(app_data: Dict) -> str:
            """Extract parent workflow instance ID from application."""
            if 'workflow_instance' in app_data:
                wf = app_data['workflow_instance']
                # Handle both string (UUID) and dict formats
                if isinstance(wf, str):
                    return wf
                elif isinstance(wf, dict):
                    return wf.get('id')
            return None

        @staticmethod
        def get_current_state(app_data: Dict) -> str:
            """Get current workflow state code from application.

            Tries to get the code from workflow_state first (has full object),
            then falls back to workflow_instance.current_state (just name).
            """
            # First try workflow_state which has the code
            if 'workflow_state' in app_data and app_data['workflow_state']:
                ws = app_data['workflow_state']
                if isinstance(ws, dict):
                    return ws.get('code')

            # Fallback to workflow_instance.current_state
            if 'workflow_instance' in app_data:
                wf = app_data['workflow_instance']
                if isinstance(wf, str):
                    return None
                elif isinstance(wf, dict):
                    state = wf.get('current_state')
                    if isinstance(state, str):
                        return state
                    elif isinstance(state, dict):
                        return state.get('code')
            return None

        @staticmethod
        def get_form_state(app_data: Dict, form_key: str) -> str:
            """Deprecated for reference-only artifact lists; use artifact detail payloads instead."""
            return None

        @staticmethod
        def get_artifact_state(artifact_data: Dict) -> str:
            """Get current workflow state from an artifact detail payload."""
            wf = artifact_data.get('workflow_instance')
            if isinstance(wf, str):
                return None
            if isinstance(wf, dict):
                state = wf.get('current_state')
                if isinstance(state, str):
                    return state
                if isinstance(state, dict):
                    return state.get('code') or state.get('name')
            return None

    return WorkflowHelper()
