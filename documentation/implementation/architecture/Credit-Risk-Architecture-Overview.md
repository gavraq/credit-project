# Credit Risk Workflow System - Architecture Overview

## 1. Introduction

The Credit Risk Workflow System is a comprehensive application designed to manage the credit request process from submission to approval. It provides a structured workflow for credit applications, supporting various roles and responsibilities throughout the approval lifecycle.

This document provides a high-level overview of the system architecture. Detailed implementation code can be found in the referenced documents.

## 2. System Architecture

### 2.1 Technology Stack

#### Backend
- **Framework**: Django 5.2 with Django REST Framework
- **Database**: PostgreSQL 14
- **Authentication**: JWT (JSON Web Tokens) via djangorestframework-simplejwt
- **Package Management**: UV (instead of pip/virtualenv)
- **File Storage**: Local File System

#### Frontend
- **Framework**: React 18 with React Router v6
- **State Management**: Redux Toolkit
- **UI Components**: Material-UI v7
- **HTTP Client**: Axios with JWT interceptors for authentication

### 2.2 High-Level Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  React        │     │  Django REST  │     │  PostgreSQL   │
│  Frontend     │◄────┤  API Backend  │◄────┤  Database     │
└───────────────┘     └───────────────┘     └───────────────┘
                             │
                             ▼
                      ┌───────────────┐
                      │ Local File    │
                      │ Storage       │
                      └───────────────┘
```

#### Component Interaction

1. React frontend communicates with Django REST API via HTTP/JSON
2. Django manages database interactions and business logic
3. Files are stored in the local file system
4. Authentication happens via JWT tokens

### 2.3 Project Structure

The system is organized into the following main components:

#### Backend (Django)
- **Users App**: Authentication, authorization, and user management
- **Workflow Engine App**: Generic workflow state management
- **Credit Applications App**: Credit request business logic
- **Documents App**: Document upload and management

```
credit-project/
│
├── manage.py                     # Django management script
├── pyproject.toml                # Dependencies (UV format)
│
├── backend/                      # Django project configuration
│   ├── __init__.py
│   ├── settings.py               # Django settings
│   ├── urls.py                   # Root URL configuration
│   ├── asgi.py
│   ├── wsgi.py
│   │
│   └── users/                    # User authentication and permissions app
│       ├── models.py             # Custom User model with roles
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
│
├── workflow_engine/              # Dedicated workflow management app
│   ├── models.py                 # Workflow, State, Transition, WorkflowInstance
│   ├── serializers.py
│   ├── views.py
│   ├── actions.py                # System actions for workflow transitions
│   ├── utils.py                  # Workflow utilities and helpers
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── management/
│       └── commands/
│           └── load_workflow_states.py
│
├── credit_applications/          # Core domain application
│   ├── models.py                 # CreditApplication + 8 form models
│   ├── serializers.py            # Unified CreditApplicationSerializer
│   ├── views.py                  # ViewSets for applications and reference data
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── management/
│       └── commands/
│           └── seed_roles_departments.py
│
├── documents/                    # Document management app
│   ├── models.py                 # Document, DocumentType models
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── frontend/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # FormPageWrapper, WorkflowActions, etc.
│   │   │   ├── forms/            # Form-specific components
│   │   │   └── dashboard/        # Dashboard components
│   │   │
│   │   ├── pages/                # Page components (forms)
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CreditRequestFormPage.jsx
│   │   │   ├── CreditReviewFormPage.jsx
│   │   │   ├── BusinessSponsorshipFormPage.jsx
│   │   │   ├── CreditQuestionnaireFormPage.jsx
│   │   │   ├── LegalReviewFormPage.jsx
│   │   │   ├── CreditAnalysisFormPage.jsx
│   │   │   ├── CreditCompilationFormPage.jsx
│   │   │   └── CreditApprovalFormPage.jsx
│   │   │
│   │   ├── services/             # API services
│   │   │   └── api.js            # Centralized axios with JWT interceptors
│   │   │
│   │   ├── store/                # Redux Toolkit state management
│   │   │   ├── slices/
│   │   │   └── store.js
│   │   │
│   │   ├── utils/                # Helper functions
│   │   └── hooks/                # Custom React hooks
│   │
│   ├── package.json
│   └── README.md
│
├── documentation/                # Project documentation
│   ├── requirements/             # PRD, design, schema docs
│   ├── implementation/           # Technical implementation guides
│   │   ├── architecture/
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── features/
│   │   └── phase-guides/
│   └── operational/              # Deployment and operations
│
├── tests/                        # Test harness
│   ├── api/                      # API integration tests (pytest)
│   └── e2e/                      # E2E browser tests (Playwright)
│
├── fixtures/                     # Database fixtures
│   └── initial_data.json
│
├── docker-compose.yml            # Docker Compose configuration
└── Dockerfile                    # Docker build configuration
```

#### Frontend (React)
- **Authentication**: Login, token management, and protected routes
- **Dashboard**: Overview of credit requests and analytics
- **Credit Request Form**: Multi-section form for credit applications
- **Workflow Management**: State visualization and transitions
- **Document Management**: Upload and viewing of supporting documents

## 3. Backend Design

### 3.1 Users App

The Users app handles authentication, authorization, and user management.

#### Key Features
- Custom User model with role-based permissions
- JWT authentication with token refresh
- Department and role management
- User profile and preferences

[See Authentication Implementation Details](../backend/Credit-Risk-Authentication-Implementation.md)

### 3.2 Workflow Engine App

The Workflow Engine app provides a flexible state machine for managing application workflows.

#### Key Features
- Configurable workflow definitions
- State transitions with validation
- Transition permissions based on user roles
- Workflow history tracking

[See Workflow Engine Implementation Details](../backend/Credit-Risk-Workflow-Engine-Implementation.md)

### 3.3 Credit Applications App

The Credit Applications app handles the core business logic for credit requests.

#### Key Features
- Credit application creation and management
- Form data storage with JSON fields
- Limit request management
- Application analytics and reporting

[See Serializer Implementation Details](../backend/simplified_serializer_approach.md)

### 3.4 Documents App

The Documents app manages document uploads and storage.

#### Key Features
- Secure document upload and storage
- Document type configuration
- Preview generation
- Document versioning

[See Documents App Implementation Details](../features/Credit-Risk-Documents-Implementation.md)

## 4. Frontend Design

### 4.1 API Service Layer

The frontend communicates with the backend through a centralized API service that handles authentication, requests, and error handling.

#### Key Features
- Consistent API endpoint usage with `/api/` prefix
- Automatic token management and refresh
- Standardized error handling
- Service functions for each API endpoint

[See API Service Implementation Details](../backend/Credit-Risk-API-Service-Implementation.md)

### 4.2 Authentication Components

Authentication components handle user login, session management, and protected routes.

#### Key Features
- Login form with validation
- JWT token storage and management
- Protected route components
- User profile management

[See Authentication Implementation Details](../backend/Credit-Risk-Authentication-Implementation.md)

### 4.3 Form Data Lifecycle

All forms in the application (Credit Request, Business Sponsorship, Credit Questionnaire, Legal Review) follow a unified data lifecycle pattern.

#### Key Features
- Consistent frontend state management with a single `formData` object.
- A flat data payload sent from the frontend to the backend.
- Backend serializer-led orchestration for saving data to multiple related models.
- Dynamic workflow action buttons based on `allowed_transitions`.

[See Form Data Lifecycle Implementation Details](../backend/Credit-Risk-Form-Lifecycle.md)

### 4.4 Dashboard and Reporting

The dashboard provides an overview of credit applications and analytics.

#### Key Features
- Application status summary
- Filtering and sorting
- Analytics visualizations
- Export functionality

[See Dashboard Implementation Details](../features/Credit-Risk-Dashboard-Implementation.md)

## 5. Database Configuration

The system uses PostgreSQL for data storage with environment-specific configurations.

#### Key Features
- Environment-specific database settings
- Connection pooling
- Secure credential management
- Migration management

[See Database Configuration Details](../backend/Credit-Risk-Database-Configuration.md)

## 6. Deployment Architecture

The system is designed to be deployed in various environments with appropriate configurations.

#### Environments
- Development
- Testing
- Production

#### Key Features
- Environment-specific settings
- Static and media file handling
- Security configurations
- Performance optimizations

[See Deployment Configuration Details](../../operational/Credit-Risk-Deployment-Implementation.md)

## 7. Security Considerations

The system implements various security measures to protect data and ensure proper access control.

#### Key Features
- JWT authentication with proper token handling
- Role-based access control
- Object-level permissions
- CSRF protection
- Input validation and sanitization

[See Security Implementation Details](../features/Credit-Risk-Security-Implementation.md)

## 8. Future Integration Points

The system is designed with future integrations in mind, though these will not be implemented in the first version.

#### Planned Future Integrations
- Email notification service - for alerts and notifications
- Reporting and analytics services - for business intelligence

#### Future API Gateway

In future phases, an API Gateway will be implemented to provide a unified entry point for all API requests, with features including authentication, rate limiting, and request routing. This component is not required for the initial implementation with local storage and no external integrations.

[See API Gateway Implementation Details](../backend/Credit-Risk-API-Gateway-Implementation.md) (Planned for future implementation)
