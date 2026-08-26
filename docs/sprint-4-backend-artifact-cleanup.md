# Sprint 4 - Backend Artifact Terminology Cleanup

## Summary

The backend metadata tooling now speaks the same artifact-native language as the runtime engine.

- All `workflow_engine/management/commands` that referenced `relevant_sub_processes` now read/write `relevant_artifacts`.
- Added `get_state_relevant_artifacts()` in `workflow_engine/utils.py` so the commands share a canonical helper that still tolerates legacy metadata silently.
- The commands `audit_metadata_step1`, `fix_credit_review_state_metadata`, `diagnose_auto_initialization`, `test_auto_initialization_step4`, `debug_credit_review_auto_init`, `analyze_all_metadata`, `check_expected_metadata_step2`, `apply_metadata_fixes_step3`, and `update_state_metadata` were updated accordingly.

## Why This Matters

These commands are the human-facing surface for metadata hygiene, so keeping `relevant_artifacts` as the canonical key prevents new inconsistencies from creeping back in and aligns diagnostics/fixes with the metadata loader/definitions.

## Validation

- `.venv/bin/python manage.py check`
