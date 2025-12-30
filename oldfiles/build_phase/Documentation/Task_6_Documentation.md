# Task 6 Documentation: Implement Workflow Engine Core

## Subtask 6.1 – Review Workflow Models

**Status:** Complete  
**Summary:**
The existing workflow models were reviewed to ensure readiness for implementing the workflow engine core. The following models were examined:
- `WorkflowDefinition`
- `State`
- `Transition`
- `WorkflowInstance`
- `StateLog`

### Review Findings
- **Coverage:** All required entities for a workflow engine are present and well-structured.
- **Extensibility:** Use of `metadata`, `allowed_roles`, and `conditions` fields allows for future extensibility without schema changes.
- **Auditability:** The `StateLog` model provides a complete audit trail for transitions.
- **Integration:** Models are ready to be used for implementing transition logic, permission checks, and audit logging.
- **No Obvious Issues:** All relationships and constraints are appropriate; naming and structure are clear.

### Conclusion
The workflow models are confirmed to be complete and ready for the next phase: implementing the transition logic and workflow engine core. No changes to the models are required at this stage.

---

## Subtask 6.2 – Implement Transition Logic

**Status:** In Progress  
**Summary:**
A core method, `perform_transition`, was added to the `WorkflowInstance` model to handle workflow state transitions. This method ensures that transitions are validated, performed atomically, and logged for audit purposes. Permission checks will be implemented in the next subtask.

### Implementation Details
- **Location:** Implemented in `backend/users/workflow_models.py` (`WorkflowInstance.perform_transition`)
- **Method:** `WorkflowInstance.perform_transition(transition_code, user, comments="", system_context=None)`
- **Logic:**
    1. Locates the `Transition` object for the current workflow and state.
    2. Validates that the transition is allowed from the current state.
    3. (Permission checks to be implemented in subtask 6.3)
    4. Updates `current_state` to the transition's `to_state`.
    5. Saves the instance atomically.
    6. Creates a `StateLog` entry for the transition, including user, comments, and system context.
- **Atomicity:** Uses Django's transaction management to ensure state changes and logs are committed together.
- **Error Handling:** Raises a `ValueError` for invalid or disallowed transitions.

### Next Steps
- Implement permission checks for transitions (subtask 6.3).
- Add comprehensive tests for transition logic and error handling.

---

## Subtask 6.3 – Integrate Permission Checks

**Status:** Complete  
**Summary:**
Role-based permission checks were integrated into the `perform_transition` method. Now, only users whose role name matches one of the values in `Transition.allowed_roles` may perform a given transition. If the user does not have the required role, a `PermissionError` is raised and the transition is not performed.

### Implementation Details
- **Location:** Implemented in `backend/users/workflow_models.py` within `WorkflowInstance.perform_transition`.
- **Logic:**
    - Before performing the transition, the method checks if `transition.allowed_roles` is set.
    - It compares the user's role name (`user.role.name`) to the entries in `allowed_roles`.
    - If the user does not have a matching role, a `PermissionError` is raised.
    - This ensures only authorized users can perform state transitions.
- **Design Note:**
    - The implementation uses `role.name` for clarity and admin readability.
    - **Potential Future Enhancement:** For greater robustness (e.g., if role names can change), consider using `role.id` (UUID) in `allowed_roles` and for permission checks.

### Next Steps
- Add comprehensive tests for permission enforcement and transition logic.
- Continue with audit logging and API integration as per the task breakdown.

---

## Subtask 6.4 – Implement Audit Logging

**Status:** Complete  
**Summary:**
Audit logging for workflow state transitions is fully implemented. Every successful transition through `perform_transition` creates a `StateLog` entry, ensuring a complete and tamper-evident audit trail for all workflow actions.

### Implementation Details
- **Location:** Implemented in `backend/users/workflow_models.py` within `WorkflowInstance.perform_transition`.
- **Logic:**
    - After a successful state change, a `StateLog` record is created with:
        - The workflow instance
        - Transition performed
        - From/to states
        - User performing the transition
        - Comments and system context
        - Timestamp (auto-generated)
    - Logging occurs atomically with the state change, ensuring consistency and integrity.
- **Extensibility:**
    - The `system_context` and `comments` fields allow for additional metadata (e.g., reasons, system events, external references).
    - The design supports future integration with external audit or compliance systems if required.

### Review
- The audit trail captures all essential information for compliance, traceability, and debugging.
- No further changes are needed unless additional metadata or hooks are required.

### Next Steps
- Proceed to API integration or add comprehensive tests for transition and audit logging, as per the task breakdown.

---

## Subtask 6.5 – Expose API Endpoints

**Status:** Complete  
**Summary:**
API endpoints for workflow state transitions and audit log retrieval are implemented using Django REST Framework. Endpoints are protected by JWT authentication and role-based permission checks. All business and security logic is enforced in the service/model layer, ensuring DRY and robust design.

### API Endpoints
- **POST** `/api/workflow-instances/<uuid:pk>/transition/`
  - Triggers a transition on a workflow instance.
  - Requires: JWT access token, `transition_code`, optional `comments` and `system_context`.
  - Permission checks and audit logging are enforced.
- **GET** `/api/workflow-instances/<uuid:pk>/logs/`
  - Retrieves the audit log for a workflow instance.
  - Requires: JWT access token.

### Implementation Details
- **Views:** Implemented in `backend/users/views.py`.
- **Serializers:** Implemented in `backend/users/serializers.py`.
- **URLs:** Registered in `backend/urls.py`.
- **Security:**
  - All endpoints require authentication (`IsAuthenticated`).
  - Role-based permission checks are enforced via `RolePermission` and model logic.

### Next Steps
- Test endpoints with real workflow data.
- Document example requests/responses after data is available.
- Add automated API tests.

---

## Subtask 6.6 – Testing & Validation

**Status:** Pending  
**Summary:**
API endpoints, permission logic, and audit logging are ready for comprehensive testing. Automated tests and real workflow data are needed to validate the full workflow engine.

### Next Steps
- Add real or test `WorkflowInstance` records.
- Test all API endpoints (transition, logs) with valid tokens and data.
- Write automated tests for:
  - Permission enforcement
  - Transition logic
  - Audit logging
- Document test results and coverage.

---

## Architectural Note: Workflow Engine Model Migration

During this and previous tasks, workflow engine models were initially implemented in the `users` app (see Task 4). As the architecture matured, all workflow logic was migrated and consolidated into the dedicated `workflow_engine` app to improve modularity and maintainability. The original models in `users` were removed to avoid duplication and system check errors. Task 6 builds on this now-centralized workflow engine architecture, ensuring a single source of truth for all workflow logic.

---

**Task 6 is nearly complete. The only outstanding work is to test and validate the endpoints with real data, and to finalize documentation with usage examples and test results.**
