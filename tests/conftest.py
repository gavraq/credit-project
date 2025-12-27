"""
Root pytest configuration for Credit Risk Workflow tests.

This file contains shared fixtures and configuration used across
all test modules (API and E2E).
"""
import os
import pytest
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "smoke: Quick smoke tests for basic connectivity"
    )
    config.addinivalue_line(
        "markers", "workflow: Full workflow transition tests"
    )
    config.addinivalue_line(
        "markers", "rbac: Role-based access control tests"
    )
    config.addinivalue_line(
        "markers", "phase1: Credit Request phase tests"
    )
    config.addinivalue_line(
        "markers", "phase2: Credit Review phase tests"
    )
    config.addinivalue_line(
        "markers", "phase3: Business Sponsorship phase tests"
    )
    config.addinivalue_line(
        "markers", "phase4: Analysis phase tests (Legal, Questionnaire, Analysis)"
    )
    config.addinivalue_line(
        "markers", "phase5: Credit Compilation phase tests"
    )
    config.addinivalue_line(
        "markers", "phase6: Credit Approval phase tests"
    )


@pytest.fixture(scope='session')
def test_environment() -> dict:
    """
    Provide test environment configuration.

    Returns dict with:
    - api_url: Base URL for API testing
    - is_local: Whether testing against localhost
    """
    api_url = os.getenv('TEST_API_URL', 'https://credit.gavinslater.co.uk')
    return {
        'api_url': api_url,
        'is_local': 'localhost' in api_url or '127.0.0.1' in api_url,
    }
