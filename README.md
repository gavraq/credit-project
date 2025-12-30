# Credit Risk Workflow System

A comprehensive credit application management system built with Django REST Framework and React. The system manages the complete credit application lifecycle from submission through approval using a metadata-driven workflow engine.

## Technology Stack

### Backend
- **Django 5.2** with Django REST Framework
- **PostgreSQL** database
- **JWT authentication** (djangorestframework-simplejwt)
- **UV** for Python dependency management
- **Gunicorn** for production serving

### Frontend
- **React 18** with Material-UI v7
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Axios** with JWT interceptors

### Deployment
- **Docker & Docker Compose** for containerization
- **nginx** reverse proxy for production
- **WhiteNoise** for static file serving

## Project Structure

```
credit-project/
├── backend/                 # Django project settings
├── credit_applications/     # Core credit application logic
├── workflow_engine/         # Metadata-driven workflow system
├── documents/               # Document management app
├── frontend/                # React application
├── documentation/           # Project documentation
│   ├── requirements/        # PRD, design specs, schemas
│   ├── implementation/      # Technical implementation guides
│   │   ├── architecture/    # System architecture docs
│   │   ├── backend/         # API, serializers, auth docs
│   │   └── frontend/        # UI implementation guides
│   └── operational/         # Deployment and operations
├── fixtures/                # Initial data fixtures
├── tests/                   # E2E and integration tests
└── oldfiles/                # Archived files and scripts
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- UV package manager

### Backend Setup

```bash
# Create and activate virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r pyproject.toml

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
uv run python manage.py migrate

# Load initial data (workflow states, roles, etc.)
uv run python manage.py loaddata fixtures/initial_data.json

# Create superuser
uv run python manage.py createsuperuser

# Start development server
uv run python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend runs on http://localhost:3000 and proxies API requests to the backend on port 8000.

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
POSTGRES_DB=credit_project_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Development
DEBUG=true
```

## Key Features

### Workflow Engine
- **Metadata-driven architecture** - All workflow states, transitions, and forms configured in database
- **Role-based access control** - Transitions restricted by user roles
- **Sub-workflow support** - Each form can have its own workflow instance
- **Audit logging** - Complete history of all state transitions

### Credit Application Forms
- Credit Request Form
- Business Sponsorship Form
- Credit Questionnaire Form
- Legal Review Form
- Credit Review Form
- Credit Analysis Form
- Credit Compilation Form
- Credit Approval Form

### Authentication & Security
- JWT-based authentication with token refresh
- Role-based permissions (Relationship Manager, Credit Analyst, Legal Reviewer, etc.)
- Protected routes on frontend

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/token/` | JWT authentication |
| `/api/token/refresh/` | Token refresh |
| `/api/credit/credit-applications/` | Credit application CRUD |
| `/api/credit/counterparties/` | Counterparty data |
| `/api/credit/limit-types/` | Limit type reference data |
| `/api/workflow-instances/` | Workflow operations |
| `/api/workflow-instances/{id}/transition/` | Perform state transitions |
| `/api/documents/` | Document management |
| `/api/users/` | User management |
| `/admin/` | Django admin interface |

## Production Deployment

The system is deployed using Docker Compose with nginx as a reverse proxy.

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build
```

See `documentation/operational/` for detailed deployment guides.

## Documentation

| Document | Location | Description |
|----------|----------|-------------|
| PRD | `documentation/requirements/PRD (v3).md` | Product requirements |
| Design Brief | `documentation/requirements/Credit Workflow Design Brief.md` | UI/UX design system |
| Database Schema | `documentation/requirements/Credit Risk Workflow System Database Schema (v3).md` | Data model |
| Architecture | `documentation/implementation/architecture/` | System architecture |
| Backend Guides | `documentation/implementation/backend/` | API, serializers, auth |
| Frontend Guides | `documentation/implementation/frontend/` | UI implementation |
| Deployment | `documentation/operational/` | Deployment guides |

## Development Notes

### Form Data Lifecycle
The system uses a unified form handling pattern:
1. Frontend sends flat, prefixed JSON payloads
2. Backend serializer routes fields to appropriate sub-forms based on prefix
3. Each sub-form can have its own workflow instance

See `documentation/implementation/backend/Frontend-Backend-Integration-Patterns.md` for details.

### Workflow Configuration
All workflow behavior is metadata-driven:
- Never hardcode workflow states or transitions
- Use `get_dynamic_form_model_map()` and `get_form_metadata()` for dynamic lookups
- Form lists come from workflow metadata, not hardcoded arrays

See `CLAUDE.md` for detailed development guidelines.

## Testing

```bash
# Backend tests
uv run python manage.py test

# Frontend tests
cd frontend && npm test

# E2E tests (Playwright)
cd tests/e2e && npx playwright test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
