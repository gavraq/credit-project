from django.test import SimpleTestCase

from credit_workflow.loaders import (
    WorkflowConfigError,
    normalize_state_metadata,
    validate_credit_workflow_config,
)


class CreditWorkflowLoaderTests(SimpleTestCase):
    def test_normalize_state_metadata_promotes_legacy_subprocess_key(self):
        metadata = normalize_state_metadata(
            {"relevant_sub_processes": ["credit_request_form"], "step_number": 1}
        )

        self.assertEqual(metadata["relevant_artifacts"], ["credit_request_form"])
        self.assertEqual(metadata["step_number"], 1)
        self.assertNotIn("relevant_sub_processes", metadata)

    def test_normalize_state_metadata_prefers_canonical_artifact_key(self):
        metadata = normalize_state_metadata(
            {
                "relevant_artifacts": ["credit_review_form"],
                "relevant_sub_processes": ["credit_request_form"],
            }
        )

        self.assertEqual(metadata["relevant_artifacts"], ["credit_review_form"])
        self.assertNotIn("relevant_sub_processes", metadata)

    def test_validate_credit_workflow_config_accepts_credit_paper_artifacts_key(self):
        workflows = [
            {
                "definition": {
                    "code": "CREDIT_PAPER",
                    "name": "Credit Paper Approval Workflow",
                },
                "states": [
                    {
                        "code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "name": "Credit Request",
                        "is_initial": True,
                        "metadata": {"relevant_artifacts": ["credit_request_form"]},
                    },
                    {
                        "code": "CREDIT_PAPER_APPROVED",
                        "name": "Approved",
                        "is_terminal": True,
                        "metadata": {"relevant_artifacts": ["credit_request_form"]},
                    },
                ],
                "transitions": [
                    {
                        "code": "PP_TR_1",
                        "name": "Approve",
                        "from_code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "to_code": "CREDIT_PAPER_APPROVED",
                    }
                ],
            }
        ]

        validate_credit_workflow_config(workflows)

    def test_validate_credit_workflow_config_accepts_legacy_credit_paper_key(self):
        workflows = [
            {
                "definition": {
                    "code": "CREDIT_PAPER",
                    "name": "Credit Paper Approval Workflow",
                },
                "states": [
                    {
                        "code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "name": "Credit Request",
                        "is_initial": True,
                        "metadata": {"relevant_sub_processes": ["credit_request_form"]},
                    },
                    {
                        "code": "CREDIT_PAPER_APPROVED",
                        "name": "Approved",
                        "is_terminal": True,
                        "metadata": {"relevant_sub_processes": ["credit_request_form"]},
                    },
                ],
                "transitions": [
                    {
                        "code": "PP_TR_1",
                        "name": "Approve",
                        "from_code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "to_code": "CREDIT_PAPER_APPROVED",
                    }
                ],
            }
        ]

        validate_credit_workflow_config(workflows)

    def test_validate_credit_workflow_config_rejects_missing_credit_paper_artifacts(self):
        workflows = [
            {
                "definition": {
                    "code": "CREDIT_PAPER",
                    "name": "Credit Paper Approval Workflow",
                },
                "states": [
                    {
                        "code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "name": "Credit Request",
                        "is_initial": True,
                        "metadata": {},
                    },
                    {
                        "code": "CREDIT_PAPER_APPROVED",
                        "name": "Approved",
                        "is_terminal": True,
                        "metadata": {"relevant_artifacts": ["credit_request_form"]},
                    },
                ],
                "transitions": [
                    {
                        "code": "PP_TR_1",
                        "name": "Approve",
                        "from_code": "CREDIT_PAPER_CREDIT_REQUEST",
                        "to_code": "CREDIT_PAPER_APPROVED",
                    }
                ],
            }
        ]

        with self.assertRaises(WorkflowConfigError):
            validate_credit_workflow_config(workflows)
