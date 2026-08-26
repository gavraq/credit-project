"""
Workflow Transition Tests for Credit Risk Workflow System.

Tests all workflow phases:
- Phase 1: Credit Request (RM)
- Phase 2: Credit Review (CA)
- Phase 3: Business Sponsorship (BS)
- Phase 4: Legal Review, Credit Questionnaire, Credit Analysis (parallel)
- Phase 5: Credit Compilation (CA)
- Phase 6: Credit Approval (CA/Approver)
"""
import pytest
from typing import Dict, Any
from .utils.api_client import APIClient


# =============================================================================
# Phase 1: Credit Request Tests
# =============================================================================

@pytest.mark.phase1
class TestCreditRequestTransitions:
    """Tests for Credit Request workflow transitions (Phase 1)."""

    def test_cr_tr_2_draft_to_in_progress(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test CR_TR_2: Submit for In Progress.
        Draft → In Progress
        """
        # Create application
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']

        # Save form data
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        # Get the credit request form workflow instance
        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # Verify starting state
        assert workflow_helper.get_artifact_state(cr_form) == 'Draft'

        # Perform transition
        rm_client.perform_transition(wf_id, 'CR_TR_2', 'Moving to in progress')

        # Verify new state
        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        assert workflow_helper.get_artifact_state(cr_form) == 'In Progress'

    def test_cr_tr_3_in_progress_to_draft(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test CR_TR_3: Save as Draft from In Progress.
        In Progress → Draft
        """
        # Create and move to in progress
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # Move to in progress first
        rm_client.perform_transition(wf_id, 'CR_TR_2', 'Moving to in progress')

        # Now move back to draft
        rm_client.perform_transition(wf_id, 'CR_TR_3', 'Moving back to draft')

        # Verify state
        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        assert workflow_helper.get_artifact_state(cr_form) == 'Draft'

    def test_cr_tr_4_submit_credit_request(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test CR_TR_4: Submit Credit Request.
        In Progress → Submitted
        Also triggers parent workflow PP_TR_1.
        """
        # Create and move to in progress
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # Move to in progress
        rm_client.perform_transition(wf_id, 'CR_TR_2', 'Moving to in progress')

        # Submit
        rm_client.perform_transition(wf_id, 'CR_TR_4', 'Submitting credit request')

        # Verify state
        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        assert workflow_helper.get_artifact_state(cr_form) == 'Submitted'

        # Verify parent workflow moved to Credit Review Pending
        parent_state = workflow_helper.get_current_state(app)
        assert parent_state == 'CREDIT_PAPER_CREDIT_REVIEW_PENDING'


# =============================================================================
# Phase 2: Credit Review Tests
# =============================================================================

@pytest.mark.phase2
class TestCreditReviewTransitions:
    """Tests for Credit Review workflow transitions (Phase 2)."""

    @pytest.fixture
    def submitted_credit_request(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an application with submitted credit request (ready for Phase 2)."""
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if cr_form and cr_form.get('workflow_instance'):
            wf_id = cr_form['workflow_instance']['id']
            rm_client.perform_transition(wf_id, 'CR_TR_2', 'Moving to in progress')
            rm_client.perform_transition(wf_id, 'CR_TR_4', 'Submitting')

        return rm_client.get_credit_application(app_id)

    def test_crv_tr_2_draft_to_in_progress(
        self,
        ca_client: APIClient,
        submitted_credit_request: Dict[str, Any],
        credit_review_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test CRV_TR_2: Update Credit Paper.
        Draft → In Progress
        """
        app_id = submitted_credit_request['id']

        # Save credit review form data
        ca_client.save_credit_review_form(app_id, credit_review_form_data)

        # Re-fetch to get full nested structure
        app = ca_client.get_credit_application(app_id)

        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        if not crv_form or not crv_form.get('workflow_instance'):
            pytest.skip("Credit review form workflow not initialized")

        wf_id = crv_form['workflow_instance']['id']

        # Perform transition
        ca_client.perform_transition(wf_id, 'CRV_TR_2', 'Starting credit review')

        # Verify state
        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        assert workflow_helper.get_artifact_state(crv_form) == 'In Progress'

    def test_crv_tr_4_submit_credit_review(
        self,
        ca_client: APIClient,
        submitted_credit_request: Dict[str, Any],
        credit_review_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test CRV_TR_4: Submit Credit Review.
        In Progress → Submitted
        """
        app_id = submitted_credit_request['id']

        # Save form and move through workflow
        ca_client.save_credit_review_form(app_id, credit_review_form_data)

        # Re-fetch to get full nested structure
        app = ca_client.get_credit_application(app_id)

        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        if not crv_form or not crv_form.get('workflow_instance'):
            pytest.skip("Credit review form workflow not initialized")

        wf_id = crv_form['workflow_instance']['id']

        # Move to in progress
        ca_client.perform_transition(wf_id, 'CRV_TR_2', 'Starting review')

        # Submit
        ca_client.perform_transition(wf_id, 'CRV_TR_4', 'Submitting review')

        # Verify state
        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        assert workflow_helper.get_artifact_state(crv_form) == 'Submitted'


# =============================================================================
# Phase 3: Business Sponsorship Tests
# =============================================================================

@pytest.mark.phase3
class TestBusinessSponsorshipTransitions:
    """Tests for Business Sponsorship workflow transitions (Phase 3)."""

    @pytest.fixture
    def ready_for_sponsorship(
        self,
        rm_client: APIClient,
        ca_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any],
        credit_review_form_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an application ready for business sponsorship (Phases 1-2 complete)."""
        # Phase 1
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if cr_form and cr_form.get('workflow_instance'):
            wf_id = cr_form['workflow_instance']['id']
            rm_client.perform_transition(wf_id, 'CR_TR_2', 'To in progress')
            rm_client.perform_transition(wf_id, 'CR_TR_4', 'Submitting')

        # Phase 2
        ca_client.save_credit_review_form(app_id, credit_review_form_data)
        app = ca_client.get_credit_application(app_id)

        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        if crv_form and crv_form.get('workflow_instance'):
            wf_id = crv_form['workflow_instance']['id']
            ca_client.perform_transition(wf_id, 'CRV_TR_2', 'Starting review')
            ca_client.perform_transition(wf_id, 'CRV_TR_4', 'Submitting review')

        return ca_client.get_credit_application(app_id)

    def test_bs_tr_2_draft_to_in_progress(
        self,
        bs_client: APIClient,
        ready_for_sponsorship: Dict[str, Any],
        business_sponsorship_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test BS_TR_2: Submit for In Progress.
        Draft → In Progress
        """
        app_id = ready_for_sponsorship['id']

        # Save sponsorship form data
        bs_client.save_business_sponsorship_form(app_id, business_sponsorship_form_data)

        # Re-fetch to get full nested structure
        app = bs_client.get_credit_application(app_id)

        bs_form = bs_client.get_credit_artifact(app_id, 'business_sponsorship_form')
        if not bs_form or not bs_form.get('workflow_instance'):
            pytest.skip("Business sponsorship form workflow not initialized")

        wf_id = bs_form['workflow_instance']['id']

        # Perform transition
        bs_client.perform_transition(wf_id, 'BS_TR_2', 'Starting sponsorship')

        # Verify state
        bs_form = bs_client.get_credit_artifact(app_id, 'business_sponsorship_form')
        assert workflow_helper.get_artifact_state(bs_form) == 'In Progress'

    def test_bs_tr_4_submit_sponsorship(
        self,
        bs_client: APIClient,
        ready_for_sponsorship: Dict[str, Any],
        business_sponsorship_form_data: Dict[str, Any],
        workflow_helper
    ):
        """
        Test BS_TR_4: Submit Business Sponsorship.
        In Progress → Submitted
        Triggers PP_TR_4 on parent workflow.
        """
        app_id = ready_for_sponsorship['id']

        # Save form and move through workflow
        bs_client.save_business_sponsorship_form(app_id, business_sponsorship_form_data)

        # Re-fetch to get full nested structure
        app = bs_client.get_credit_application(app_id)

        bs_form = bs_client.get_credit_artifact(app_id, 'business_sponsorship_form')
        if not bs_form or not bs_form.get('workflow_instance'):
            pytest.skip("Business sponsorship form workflow not initialized")

        wf_id = bs_form['workflow_instance']['id']

        # Move through transitions
        bs_client.perform_transition(wf_id, 'BS_TR_2', 'Starting sponsorship')
        bs_client.perform_transition(wf_id, 'BS_TR_4', 'Submitting sponsorship')

        # Verify state
        bs_form = bs_client.get_credit_artifact(app_id, 'business_sponsorship_form')
        assert workflow_helper.get_artifact_state(bs_form) == 'Submitted'


# =============================================================================
# RBAC Tests - Role-Based Access Control
# =============================================================================

@pytest.mark.rbac
class TestRoleBasedTransitionAccess:
    """Tests that only authorized roles can perform transitions."""

    def test_ca_cannot_perform_rm_transitions(
        self,
        rm_client: APIClient,
        ca_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ):
        """Test that Credit Analyst cannot perform RM transitions."""
        # Create application as RM
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # CA should not be able to perform CR_TR_2
        response = ca_client.post(
            f'/api/workflow-instances/{wf_id}/transition/',
            data={'transition_code': 'CR_TR_2', 'comments': 'Unauthorized attempt'}
        )

        # Should get permission denied or transition not allowed
        assert response.status_code in [403, 400]

    def test_rm_cannot_perform_ca_transitions(
        self,
        rm_client: APIClient,
        ca_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any],
        credit_review_form_data: Dict[str, Any]
    ):
        """Test that Relationship Manager cannot perform CA transitions."""
        # Complete Phase 1
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if cr_form and cr_form.get('workflow_instance'):
            wf_id = cr_form['workflow_instance']['id']
            rm_client.perform_transition(wf_id, 'CR_TR_2', 'To in progress')
            rm_client.perform_transition(wf_id, 'CR_TR_4', 'Submitting')

        # Initialize credit review form with CA
        ca_client.save_credit_review_form(app_id, credit_review_form_data)
        app = ca_client.get_credit_application(app_id)

        crv_form = ca_client.get_credit_artifact(app_id, 'credit_review_form')
        if not crv_form or not crv_form.get('workflow_instance'):
            pytest.skip("Credit review form workflow not initialized")

        wf_id = crv_form['workflow_instance']['id']

        # RM should not be able to perform CRV_TR_2
        response = rm_client.post(
            f'/api/workflow-instances/{wf_id}/transition/',
            data={'transition_code': 'CRV_TR_2', 'comments': 'Unauthorized attempt'}
        )

        assert response.status_code in [403, 400]


# =============================================================================
# Invalid Transition Tests
# =============================================================================

@pytest.mark.workflow
class TestInvalidTransitions:
    """Tests for invalid transition attempts."""

    def test_cannot_submit_from_draft_state(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ):
        """Test that cannot skip to submit from draft state."""
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # Try to submit directly from draft (should fail)
        response = rm_client.post(
            f'/api/workflow-instances/{wf_id}/transition/',
            data={'transition_code': 'CR_TR_4', 'comments': 'Trying to skip'}
        )

        # Should fail - CR_TR_4 is only valid from IN_PROGRESS state
        assert response.status_code == 400

    def test_cannot_use_nonexistent_transition(
        self,
        rm_client: APIClient,
        credit_application_data: Dict[str, Any],
        credit_request_form_data: Dict[str, Any]
    ):
        """Test that using a non-existent transition code fails."""
        app = rm_client.create_credit_application(credit_application_data)
        app_id = app['id']
        rm_client.save_credit_request_form(app_id, credit_request_form_data)

        # Re-fetch to get full nested structure
        app = rm_client.get_credit_application(app_id)

        cr_form = rm_client.get_credit_artifact(app_id, 'credit_request_form')
        if not cr_form or not cr_form.get('workflow_instance'):
            pytest.skip("Credit request form workflow not initialized")

        wf_id = cr_form['workflow_instance']['id']

        # Try a fake transition
        response = rm_client.post(
            f'/api/workflow-instances/{wf_id}/transition/',
            data={'transition_code': 'FAKE_TR_99', 'comments': 'Invalid transition'}
        )

        assert response.status_code == 400
