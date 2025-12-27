"""
API Client for Credit Risk Workflow System Testing

Provides JWT-authenticated HTTP client with convenience methods
for all credit application endpoints.
"""
import os
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class APIClient:
    """HTTP client with JWT authentication for API testing."""

    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the API client.

        Args:
            base_url: API base URL. Defaults to TEST_API_URL env var or localhost.
        """
        self.base_url = base_url or os.getenv('TEST_API_URL', 'https://credit.gavinslater.co.uk')
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """
        Authenticate and store JWT tokens.

        Args:
            username: User's username
            password: User's password

        Returns:
            Token response containing access and refresh tokens

        Raises:
            requests.HTTPError: If authentication fails
        """
        response = self.session.post(
            f"{self.base_url}/api/token/",
            json={"username": username, "password": password}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data.get('access')
        self.refresh_token = data.get('refresh')

        # Update session headers with the token
        self.session.headers.update({
            'Authorization': f'Bearer {self.access_token}'
        })

        return data

    def refresh_access_token(self) -> Dict[str, Any]:
        """
        Refresh the access token using the refresh token.

        Returns:
            Token response with new access token

        Raises:
            requests.HTTPError: If token refresh fails
        """
        if not self.refresh_token:
            raise ValueError("No refresh token available")

        response = self.session.post(
            f"{self.base_url}/api/token/refresh/",
            json={"refresh": self.refresh_token}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data.get('access')

        self.session.headers.update({
            'Authorization': f'Bearer {self.access_token}'
        })

        return data

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """
        Make an authenticated HTTP request with automatic token refresh.

        Args:
            method: HTTP method (GET, POST, PATCH, DELETE)
            endpoint: API endpoint (with leading slash)
            **kwargs: Additional arguments passed to requests

        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)

        # If unauthorized and we have a refresh token, try refreshing
        if response.status_code == 401 and self.refresh_token:
            try:
                self.refresh_access_token()
                response = self.session.request(method, url, **kwargs)
            except requests.HTTPError:
                pass  # Return the original 401 response

        return response

    def get(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a GET request."""
        return self._request('GET', endpoint, **kwargs)

    def post(self, endpoint: str, data: Dict = None, **kwargs) -> requests.Response:
        """Make a POST request."""
        return self._request('POST', endpoint, json=data, **kwargs)

    def patch(self, endpoint: str, data: Dict = None, **kwargs) -> requests.Response:
        """Make a PATCH request."""
        return self._request('PATCH', endpoint, json=data, **kwargs)

    def put(self, endpoint: str, data: Dict = None, **kwargs) -> requests.Response:
        """Make a PUT request."""
        return self._request('PUT', endpoint, json=data, **kwargs)

    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a DELETE request."""
        return self._request('DELETE', endpoint, **kwargs)

    # ==========================================================================
    # Credit Application Endpoints
    # ==========================================================================

    def list_credit_applications(self) -> Dict[str, Any]:
        """List all credit applications the user has access to."""
        response = self.get('/api/credit/credit-applications/')
        response.raise_for_status()
        return response.json()

    def get_credit_application(self, app_id: str) -> Dict[str, Any]:
        """Get a specific credit application by ID."""
        response = self.get(f'/api/credit/credit-applications/{app_id}/')
        response.raise_for_status()
        return response.json()

    def create_credit_application(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new credit application.

        Args:
            data: Application data including title, counterparty_id, etc.

        Returns:
            Created application data
        """
        response = self.post('/api/credit/credit-applications/', data)
        response.raise_for_status()
        return response.json()

    def update_credit_application(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing credit application.

        Args:
            app_id: Application UUID
            data: Fields to update

        Returns:
            Updated application data
        """
        response = self.patch(f'/api/credit/credit-applications/{app_id}/', data)
        response.raise_for_status()
        return response.json()

    # ==========================================================================
    # Workflow Transition Endpoints
    # ==========================================================================

    def perform_transition(
        self,
        workflow_instance_id: str,
        transition_code: str,
        comments: str = ""
    ) -> Dict[str, Any]:
        """
        Perform a workflow transition.

        Args:
            workflow_instance_id: UUID of the workflow instance
            transition_code: Transition code (e.g., 'CR_TR_1', 'PP_TR_2')
            comments: Optional comments for the transition

        Returns:
            Transition result
        """
        response = self.post(
            f'/api/workflow-instances/{workflow_instance_id}/transition/',
            data={'transition_code': transition_code, 'comments': comments}
        )
        response.raise_for_status()
        return response.json()

    def get_allowed_transitions(self, workflow_instance_id: str) -> List[Dict[str, Any]]:
        """
        Get allowed transitions for a workflow instance.

        Args:
            workflow_instance_id: UUID of the workflow instance

        Returns:
            List of allowed transitions
        """
        response = self.get(f'/api/workflow-instances/{workflow_instance_id}/')
        response.raise_for_status()
        data = response.json()
        return data.get('allowed_transitions', [])

    # ==========================================================================
    # Reference Data Endpoints
    # ==========================================================================

    def list_counterparties(self) -> List[Dict[str, Any]]:
        """Get list of all counterparties."""
        response = self.get('/api/credit/counterparties/')
        response.raise_for_status()
        return response.json()

    def list_limit_types(self) -> List[Dict[str, Any]]:
        """Get list of all limit types."""
        response = self.get('/api/credit/limit-types/')
        response.raise_for_status()
        return response.json()

    def list_users_by_role(self, role_name: str) -> List[Dict[str, Any]]:
        """
        Get users filtered by role name.

        Args:
            role_name: Role name (e.g., 'business_sponsor', 'legal_reviewer')

        Returns:
            List of user objects
        """
        response = self.get(f'/api/users/', params={'role': role_name})
        response.raise_for_status()
        data = response.json()
        # Handle paginated response
        if isinstance(data, dict) and 'results' in data:
            return data['results']
        return data

    # ==========================================================================
    # Form-specific Save Methods
    # ==========================================================================

    def save_credit_request_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit request form data (Phase 1)."""
        return self.update_credit_application(app_id, data)

    def save_credit_review_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit review form data (Phase 2)."""
        return self.update_credit_application(app_id, data)

    def save_business_sponsorship_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save business sponsorship form data (Phase 3)."""
        return self.update_credit_application(app_id, data)

    def save_legal_review_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save legal review form data (Phase 4)."""
        return self.update_credit_application(app_id, data)

    def save_credit_questionnaire_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit questionnaire form data (Phase 4)."""
        return self.update_credit_application(app_id, data)

    def save_credit_analysis_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit analysis form data (Phase 4)."""
        return self.update_credit_application(app_id, data)

    def save_credit_compilation_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit compilation form data (Phase 5)."""
        return self.update_credit_application(app_id, data)

    def save_credit_approval_form(self, app_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save credit approval form data (Phase 6)."""
        return self.update_credit_application(app_id, data)

    # ==========================================================================
    # Utility Methods
    # ==========================================================================

    def is_authenticated(self) -> bool:
        """Check if the client has a valid access token."""
        return self.access_token is not None

    def logout(self) -> None:
        """Clear authentication state."""
        self.access_token = None
        self.refresh_token = None
        if 'Authorization' in self.session.headers:
            del self.session.headers['Authorization']
