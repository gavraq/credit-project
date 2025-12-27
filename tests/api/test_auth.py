"""
Authentication Tests for Credit Risk Workflow System.

Tests JWT authentication, token refresh, and role-based access.
"""
import pytest
import requests
from .utils.api_client import APIClient


class TestSmoke:
    """Quick smoke tests to verify API connectivity."""

    @pytest.mark.smoke
    def test_api_health_check(self, api_url: str):
        """Test that the API is reachable."""
        response = requests.get(f"{api_url}/api/", timeout=10)
        # API might return 404 for root, but should respond
        assert response.status_code in [200, 404, 301, 302]

    @pytest.mark.smoke
    def test_token_endpoint_exists(self, api_url: str):
        """Test that the token endpoint is available."""
        response = requests.post(
            f"{api_url}/api/token/",
            json={"username": "invalid", "password": "invalid"},
            timeout=10
        )
        # Should return 401 for invalid credentials, not 404
        assert response.status_code == 401

    @pytest.mark.smoke
    def test_credit_applications_endpoint_requires_auth(self, api_url: str):
        """Test that credit applications endpoint requires authentication."""
        response = requests.get(
            f"{api_url}/api/credit/credit-applications/",
            timeout=10
        )
        assert response.status_code == 401

    @pytest.mark.smoke
    def test_counterparties_endpoint_exists(self, rm_client: APIClient):
        """Test that counterparties endpoint is accessible when authenticated."""
        response = rm_client.get('/api/credit/counterparties/')
        assert response.status_code == 200

    @pytest.mark.smoke
    def test_limit_types_endpoint_exists(self, rm_client: APIClient):
        """Test that limit types endpoint is accessible when authenticated."""
        response = rm_client.get('/api/credit/limit-types/')
        assert response.status_code == 200


class TestAuthentication:
    """Tests for JWT authentication flow."""

    def test_login_with_valid_credentials(self, api_client: APIClient):
        """Test successful login returns access and refresh tokens."""
        # This test uses credentials from environment/conftest
        from .conftest import TEST_USERS

        credentials = TEST_USERS['relationship_manager']
        result = api_client.login(credentials['username'], credentials['password'])

        assert 'access' in result
        assert 'refresh' in result
        assert api_client.access_token is not None
        assert api_client.refresh_token is not None

    def test_login_with_invalid_credentials(self, api_client: APIClient):
        """Test login with invalid credentials raises error."""
        with pytest.raises(requests.HTTPError) as exc_info:
            api_client.login('invalid_user', 'invalid_password')

        assert exc_info.value.response.status_code == 401

    def test_access_protected_endpoint_after_login(self, rm_client: APIClient):
        """Test that authenticated client can access protected endpoints."""
        response = rm_client.get('/api/credit/credit-applications/')
        assert response.status_code == 200

    def test_access_protected_endpoint_without_login(self, api_client: APIClient):
        """Test that unauthenticated client cannot access protected endpoints."""
        response = api_client.get('/api/credit/credit-applications/')
        assert response.status_code == 401

    def test_token_refresh(self, api_client: APIClient):
        """Test that refresh token can be used to get new access token."""
        from .conftest import TEST_USERS

        credentials = TEST_USERS['relationship_manager']
        api_client.login(credentials['username'], credentials['password'])

        original_access_token = api_client.access_token

        # Refresh the token
        result = api_client.refresh_access_token()

        assert 'access' in result
        # New access token should be different (usually)
        assert api_client.access_token is not None

    def test_logout_clears_tokens(self, api_client: APIClient):
        """Test that logout clears stored tokens."""
        from .conftest import TEST_USERS

        credentials = TEST_USERS['relationship_manager']
        api_client.login(credentials['username'], credentials['password'])

        assert api_client.is_authenticated()

        api_client.logout()

        assert not api_client.is_authenticated()
        assert api_client.access_token is None
        assert api_client.refresh_token is None


class TestRoleAuthentication:
    """Tests for role-based authentication."""

    def test_relationship_manager_can_authenticate(self, rm_client: APIClient):
        """Test RM role can authenticate and access API."""
        assert rm_client.is_authenticated()
        response = rm_client.get('/api/credit/credit-applications/')
        assert response.status_code == 200

    def test_credit_analyst_can_authenticate(self, ca_client: APIClient):
        """Test CA role can authenticate and access API."""
        assert ca_client.is_authenticated()
        response = ca_client.get('/api/credit/credit-applications/')
        assert response.status_code == 200

    def test_business_sponsor_can_authenticate(self, bs_client: APIClient):
        """Test BS role can authenticate and access API."""
        assert bs_client.is_authenticated()
        response = bs_client.get('/api/credit/credit-applications/')
        assert response.status_code == 200

    def test_legal_reviewer_can_authenticate(self, lr_client: APIClient):
        """Test LR role can authenticate and access API."""
        assert lr_client.is_authenticated()
        response = lr_client.get('/api/credit/credit-applications/')
        assert response.status_code == 200

    def test_each_role_has_different_user(
        self,
        rm_client: APIClient,
        ca_client: APIClient,
        bs_client: APIClient,
        lr_client: APIClient
    ):
        """Test that each role fixture uses a different user."""
        from .conftest import TEST_USERS

        # These should all be different users
        assert TEST_USERS['relationship_manager']['username'] != TEST_USERS['credit_analyst']['username']
        assert TEST_USERS['credit_analyst']['username'] != TEST_USERS['business_sponsor']['username']
        assert TEST_USERS['business_sponsor']['username'] != TEST_USERS['legal_reviewer']['username']
