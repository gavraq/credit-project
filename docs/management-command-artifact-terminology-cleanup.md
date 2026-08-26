# Management Command Artifact Terminology Cleanup

## Summary

The operational tooling now matches the artifact-native runtime terminology more closely.

This cleanup focused on the management commands and diagnostic scripts under [workflow_engine/management/commands](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands).

## Updated commands

Updated imports, output text, and helper references in:

- [diagnose_auto_initialization.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/diagnose_auto_initialization.py)
- [debug_credit_review_auto_init.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/debug_credit_review_auto_init.py)
- [analyze_all_metadata.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/analyze_all_metadata.py)
- [test_auto_initialization_step4.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/test_auto_initialization_step4.py)
- [check_expected_metadata_step2.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/check_expected_metadata_step2.py)
- [update_state_metadata.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/update_state_metadata.py)
- [audit_metadata_step1.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/audit_metadata_step1.py)
- [apply_metadata_fixes_step3.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/apply_metadata_fixes_step3.py)

## Main changes

- command output now talks about `artifact provisioning` instead of `auto-initialization` where that is the real runtime concept
- dynamic mapping diagnostics now use `artifact` terminology instead of `form` terminology
- active command imports now prefer:
  - `provision_artifacts_for_state()`
  - `get_dynamic_artifact_model_map()`
- state metadata comments now refer to canonical `relevant_artifacts`

## Additional fix

This pass also fixed an indentation error in [diagnose_auto_initialization.py](/Volumes/DockSSD/projects/credit-project/workflow_engine/management/commands/diagnose_auto_initialization.py) that would previously fail bytecode compilation.

## Validation

Passed:

- `./.venv/bin/python manage.py check`
- `./.venv/bin/python -m compileall workflow_engine/management/commands/...`

Also verified:

- no remaining old-name matches in `workflow_engine/management/commands` for:
  - `get_dynamic_form_model_map`
  - `get_dynamic_form_prefixes`
  - `get_dynamic_field_mappings`
  - `auto_initialize_forms_for_state`
  - `can_user_edit_form`
  - `Dynamic form`
  - `auto-initialization`
  - `sub-process`
