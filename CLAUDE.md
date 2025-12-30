# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Credit Risk Workflow System built with Django (backend) and React (frontend). It manages the complete credit application lifecycle from submission to approval using a robust workflow engine.

## Technology Stack

### Backend
- **Django 5.2** with Django REST Framework
- **PostgreSQL** database  
- **JWT authentication** (djangorestframework-simplejwt)
- **UV** for Python dependency management (NOT pip/poetry)
- **Workflow Engine** for state management and transitions

### Frontend  
- **React 18** with Material-UI v7
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Axios** with JWT interceptors for API calls

## Essential Commands

### Backend Development
```bash
# Environment setup (ALWAYS use UV, never pip)
uv venv
source .venv/bin/activate
uv pip install -r pyproject.toml

# Database operations
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver 0.0.0.0:8000

# Load initial data
uv run python manage.py loaddata fixtures/initial_data.json

# Run specific management commands
uv run python manage.py load_workflow_states
uv run python manage.py seed_roles_departments

# Create migrations
uv run python manage.py makemigrations
```

### Frontend Development
```bash
cd frontend
npm install
npm start                # Development server
npm run build           # Production build
npm test               # Run tests
npm run lint           # ESLint
npm run format         # Prettier formatting
```

## Architecture Overview

### Database Schema
The system uses a multi-app Django architecture:

- **users/** - Custom User model with role-based permissions
- **workflow_engine/** - Centralized workflow state management  
- **credit_applications/** - Core credit application business logic
- **documents/** - Document upload and management

### Key Models
- **CreditApplication** - Main application with workflow_instance FK
- **CreditRequestForm, BusinessSponsorshipForm, etc.** - Sub-forms with their own workflow instances
- **WorkflowInstance** - Links applications to workflow states
- **LimitRequest** - Credit limits associated with applications
- **Counterparty** - Client/counterparty master data

### Form Data Lifecycle Pattern
The system uses a **unified form handling pattern**:

1. **Frontend**: Single `formData` state object with flat structure
2. **API Layer**: Flat JSON payload sent to backend
3. **Backend Serializer**: `CreditApplicationSerializer.update()` orchestrates data distribution
4. **Sub-form Handling**: Uses `_extract_form_data()` and `_update_sub_form()` helper methods

Critical implementation details:
- Form fields are prefixed (e.g., `credit_request_`, `business_sponsorship_`)
- Serializer automatically extracts and routes data to appropriate sub-models
- Each sub-form can have its own workflow instance for granular state management

### API Endpoints Structure
```
/api/token/                          # JWT auth
/api/credit/credit-applications/     # Main CRUD operations
/api/credit/counterparties/          # Counterparty data
/api/credit/limit-types/             # Limit type reference data
/api/workflow-instances/             # Workflow operations
/api/documents/                      # Document management
/api/users/                          # User management
```

### Frontend Component Architecture
- **FormPageWrapper** - Common wrapper for all forms with workflow actions
- **WorkflowActions** - Dynamic button rendering based on `allowed_transitions`
- **Protected Routes** - JWT-based route protection
- **API Service Layer** - Centralized axios instance with token refresh logic

## Critical Development Notes

### Form Data Handling
When working with credit forms, remember:
- Use `limit.type?.id` to extract UUID from limit type objects (NOT the full object)
- Boolean fields require conversion between strings ('Yes'/'No') and booleans
- DateTime fields need timezone-aware handling in serializers
- Always use the flat payload structure defined in the form lifecycle documentation

### Workflow Engine
- Each application has a main workflow instance
- Sub-forms (CreditRequestForm, etc.) can have their own workflow instances
- State transitions are role-based and defined in database metadata
- Use `get_allowed_transitions()` to get valid transitions for current user/state
- **CRITICAL**: Never hardcode workflow states, transitions, forms, or codes anywhere in the system
  - Always use dynamic lookups like `get_dynamic_form_model_map()` and `get_form_metadata()`
  - Form lists must come from workflow metadata, never hardcoded arrays
  - State codes and transitions must be retrieved from the database
  - Parent workflow transitions must use metadata-driven system actions
  - No hardcoded state names like 'CREDIT_REQUEST_SUBMITTED' or transition codes like 'PP_TR_2'
  - All workflow behavior must be configurable through database metadata
  - This ensures the system remains completely metadata-driven and flexible

### Authentication Flow
- JWT tokens stored in localStorage
- Automatic token refresh via axios interceptors
- Role-based permissions enforced at API level
- Protected routes redirect to /login when unauthenticated

### Database Migrations
- Uses UUID primary keys for most models
- Workflow engine was migrated from users app to dedicated workflow_engine app
- Always test migrations against realistic data volumes

### Environment Configuration
- Backend uses PostgreSQL (connection via .env)
- Frontend API base URL configurable via REACT_APP_API_BASE_URL
- CORS configured for local development (restrict in production)

## Testing Approach
- Backend: Django's test framework with DRF test client
- Frontend: React Testing Library with Jest
- API testing covers authentication, permissions, and workflow transitions
- Focus on form data serialization/deserialization edge cases

## Deployment Notes
- UV lock files should be committed for reproducible builds
- Static files served by Django in development
- Frontend build artifacts in frontend/build/
- Database requires proper timezone configuration for datetime fields

## Key File Locations

### Documentation Structure
```
documentation/
├── requirements/           # Business requirements & design
│   ├── PRD (v3).md
│   ├── Credit Workflow Design Brief.md
│   └── Feature-Request-*.md
│
├── implementation/
│   ├── architecture/       # System architecture
│   │   ├── Credit-Risk-Architecture-Overview.md
│   │   ├── metadata-driven-workflow-system.md
│   │   └── transition-workflow-process.md
│   │
│   ├── backend/            # Backend implementation
│   │   ├── Credit-Risk-Form-Lifecycle.md
│   │   ├── Credit-Risk-Serializer-Implementation.md
│   │   ├── Frontend-Backend-Integration-Patterns.md
│   │   └── Credit-Risk-Workflow-Engine-Implementation.md
│   │
│   └── frontend/           # UI implementation
│       ├── UI-Implementation-Guide.md
│       ├── UI-Developer-Quick-Reference.md
│       └── UI-Component-Visual-Guide.md
│
└── operational/            # Deployment & operations
    ├── GCP-Deployment-Guide.md
    └── nginx-proxy-manager-setup.md

oldfiles/documentation/     # Archived/obsolete docs
```

### Key Documentation Files
| Purpose | File |
|---------|------|
| Product requirements | `documentation/requirements/PRD (v3).md` |
| Architecture overview | `documentation/implementation/architecture/Credit-Risk-Architecture-Overview.md` |
| Workflow metadata system | `documentation/implementation/architecture/metadata-driven-workflow-system.md` |
| Form data lifecycle | `documentation/implementation/backend/Credit-Risk-Form-Lifecycle.md` |
| Serializer patterns | `documentation/implementation/backend/Credit-Risk-Serializer-Implementation.md` |
| Frontend-backend integration | `documentation/implementation/backend/Frontend-Backend-Integration-Patterns.md` |
| UI components guide | `documentation/implementation/frontend/UI-Implementation-Guide.md` |
| UI quick reference | `documentation/implementation/frontend/UI-Developer-Quick-Reference.md` |

### Code
- Backend settings: `backend/settings.py`
- Main serializer: `credit_applications/serializers.py`
- API service: `frontend/src/services/api.js`
- Workflow utilities: `workflow_engine/utils.py`

### Tests
- E2E tests: `tests/e2e/`
- API tests: `tests/api/`