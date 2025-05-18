# Task 4 Documentation: Design Database Schema & Workflow Engine

## Overview
This document summarizes the implementation work completed for **Task 4: Design Database Schema** in the credit risk workflow project. It covers the design and implementation of all core, workflow, and domain models, the management command for workflow population, and highlights outstanding work.

---

## 1. User and Authentication Models
- **Implemented:**
  - Custom `User` model (extends `AbstractUser`) with employee_id, phone_number, role-based permissions, DA approval level (`da_level`), and profile info.
  - Added `da_level` field (choices: DA1–DA8) to the `User` model to represent Delegated Authority approval level, as required for certain Credit Approvers. This field is optional and only relevant for users assigned the Credit Approver or Committee Approver roles.
  - `Role` model for role hierarchy and permission mapping.
  - `Department` model for user grouping.
  - `Permission` model for resource/action permissions.
- **Admin Registration:** All models are registered in Django admin.
- **Notes:** Group and Session use Django’s built-in models. Token model for API/auth is not yet implemented (not currently required).

### Management Commands Executed
- (If not already present) Create the Django app for user/auth models:
  ```sh
  python manage.py startapp credit_applications
  ```
- Create and activate the Python environment (if not already set up):
  ```sh
  uv venv .venv
  source .venv/bin/activate
  ```
- Install dependencies (if not already done):
  ```sh
  uv pip install -r pyproject.toml
  ```
- Run migrations to create tables for user/auth models:
  ```sh
  python manage.py makemigrations
  python manage.py migrate
  ```
- Create a Django superuser for admin access:
  ```sh
  python manage.py createsuperuser
  ```

---

## 2. Workflow Engine Models
- **Implemented:**
  - `WorkflowDefinition` (defines parent and sub-process workflows)
  - `State` (with metadata: allowed actions, roles, validation, UI hints)
  - `Transition` (with metadata: allowed roles, system actions, conditions)
  - `WorkflowInstance` (generic, supports sub-processes)
  - `StateLog` (audit trail for workflow state changes)
- **Design:**
  - Each sub-process/form has its own workflow instance.
  - States and transitions reference the Transition State Model (v3).
- **Extensibility:**
  - Models use JSONField for flexible metadata.
  - Designed for future analytics, notifications, and integration.

### Management Commands Executed
- (If not already present) Create the Django app for workflow engine:
  ```sh
  python manage.py startapp workflow_engine
  ```

---

## 3. Domain Models
- **Implemented:**
  - `CreditApplication` (parent process)
  - `Counterparty`
  - `LimitRequest`
  - `DocumentType`, `Document` (with GenericForeignKey for flexible attachments)
- **Features:**
  - Relationships between credit application, counterparty, limit, and document.
  - Metadata and audit fields for all models.
  - Document versioning and access control.

---

## 4. Sub-Process/Form Models
- **Implemented:**
  - `CreditRequestForm`
  - `CreditReviewForm`
  - `BusinessSponsorshipForm`
  - `LegalReviewForm`
  - `CreditQuestionnaireForm`
  - `CreditAnalysisForm`
  - `CreditCompilationForm`
  - `CreditApprovalForm`
- **Details:**
  - Each form is linked to the parent application and has its own workflow instance.
  - All forms/sub-processes from the PRD and Transition State Model are implemented.

---

## 5. Management Command: Workflow Population
- **File:** `workflow_engine/management/commands/load_workflow_states.py`
- **Function:**
  - Populates all parent and sub-process workflows, states, and transitions from the Transition State Model.
  - Loops through all workflows, creating states and transitions with correct metadata, roles, and validation logic.
  - Idempotent—can be safely re-run after workflow changes.
- **Alignment:**
  - All codes, names, and transition paths match the Transition State Model (v3) and PRD.

### Management Commands Executed
- To populate the workflow engine models, run:
  ```sh
  python manage.py load_workflow_states
  ```
- This command loads all workflow definitions, states, and transitions (including all sub-processes) into the database.
- **When to run:**
  - After initial setup
  - After any changes to the Transition State Model or workflow definitions
  - To re-sync workflows after migrations or data resets

---

## 6. State Lifecycle & Transition Logic
- **For each state:**
  - Name, description, metadata (timestamps, responsible roles)
  - Allowed transitions (with reference to Transition State Model)
  - Validation rules for entering/exiting the state
- **Documentation:**
  - State lifecycle and transition logic is embedded in the management command and schema.

---

## 7. Audit Trail & Event Logging
- **Implemented:**
  - `StateLog` model records workflow history, state changes, and transition logs.
- **Outstanding:**
  - Further development and testing of audit trail and event logging (user actions, rule execution) is recommended.

---

## 8. Testing & Validation
- **Completed:**
  - Migrations run, tables created, workflows loaded.
  - State/transition logic and document attachment validated.
- **Outstanding:**
  - Tests for CRUD operations on all models and workflows.
  - Further development and test coverage for audit/event logging.

---

## 9. Outstanding Work
- Write and execute tests for CRUD operations.
- Further develop/test audit trail and event logging.
- Implement Token model for API/auth if required by future tasks.
- Ensure the management command (`python manage.py load_workflow_states`) is run after any workflow model changes to keep the database in sync.

---

## References
- Transition State Model (requirements folder)
- PRD (v3).md (requirements folder)
- Entity Relationship Diagram (requirements folder)

---

**This document provides a comprehensive record of Task 4 implementation and is intended for onboarding, review, and future extension.**
