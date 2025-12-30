# Credit Risk Deployment Implementation

This document details the deployment configuration for the Credit Risk Workflow System, covering Docker configuration, environment setup, and deployment to the Raspberry Pi production server.

## Table of Contents
1. [Overview](#1-overview)
2. [Docker Configuration](#2-docker-configuration)
3. [Environment Configuration](#3-environment-configuration)
4. [Development Deployment](#4-development-deployment)
5. [Production Deployment](#5-production-deployment)
6. [Initial Setup & Workflow Metadata](#6-initial-setup--workflow-metadata)
7. [Nginx Proxy Manager](#7-nginx-proxy-manager)
8. [Database Management](#8-database-management)
9. [Troubleshooting](#9-troubleshooting)

## 1. Overview

The Credit Risk Workflow System uses Docker for containerization with separate configurations for development and production environments:

| Environment | Server | URL |
|-------------|--------|-----|
| Development | Local machine | http://localhost:3000 (frontend), http://localhost:8000 (backend) |
| Production | Raspberry Pi | https://credit.gavinslater.co.uk |

### Technology Stack

- **Backend**: Django 5.2 with Django REST Framework
- **Frontend**: React 18 with Material-UI
- **Database**: PostgreSQL 15
- **WSGI Server**: Gunicorn (production), Django runserver (development)
- **Reverse Proxy**: nginx (production)
- **Package Manager**: UV (Python), npm (Node.js)

## 2. Docker Configuration

The project uses separate Docker configurations for development and production:

| File | Environment | Purpose |
|------|-------------|---------|
| `Dockerfile` | Development | Django runserver, Python healthcheck |
| `Dockerfile.prod` | Production | Gunicorn, curl healthcheck |
| `docker-compose.yml` | Development | Hot-reload, bind mounts, DEBUG=True |
| `docker-compose.prod.yml` | Production | Named volumes, environment secrets, restart policies |

### 2.1 Dockerfile Differences

#### Development (`Dockerfile`)

```dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

RUN addgroup --system app && adduser --system --group app
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*
RUN pip install uv

COPY pyproject.toml ./
RUN uv pip install -r pyproject.toml

COPY . .
RUN python manage.py collectstatic --noinput || true
RUN chown -R app:app /app

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health/', timeout=10)" || exit 1

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

**Key features**:
- Uses Django's `runserver` for auto-reload on code changes
- Python-based healthcheck (reuses installed requests library)

#### Production (`Dockerfile.prod`)

```dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

RUN addgroup --system app && adduser --system --group app
RUN apt-get update && apt-get install -y postgresql-client curl && rm -rf /var/lib/apt/lists/*
RUN pip install uv

COPY pyproject.toml ./
RUN uv pip install -r pyproject.toml
RUN uv pip install gunicorn

COPY . .
RUN mkdir -p /app/staticfiles /app/media
RUN python manage.py collectstatic --noinput || true
RUN chown -R app:app /app

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "120", "backend.wsgi:application"]
```

**Key features**:
- Uses Gunicorn for production-grade multi-worker request handling
- Installs curl for lightweight healthchecks
- Creates static/media directories for file serving

### 2.2 Docker Compose Differences

#### Development (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: credit_project
      POSTGRES_USER: credit_user
      POSTGRES_PASSWORD: credit_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U credit_user -d credit_project"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    build: .
    environment:
      - DEBUG=True
      - DATABASE_URL=postgres://credit_user:credit_password@postgres:5432/credit_project
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend
      - CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
      - SECRET_KEY=dev-secret-key-change-in-production
    volumes:
      - .:/app                    # Bind mount for hot-reload
      - /app/__pycache__
      - /app/.venv
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             python manage.py runserver 0.0.0.0:8000"

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:8000
    volumes:
      - ./frontend:/app          # Bind mount for hot-reload
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    command: npm start

volumes:
  postgres_data:
```

**Key development features**:

| Feature | Purpose |
|---------|---------|
| Bind mounts (`- .:/app`) | Local code changes immediately visible in container |
| `DEBUG=True` | Detailed Django error pages |
| Hardcoded secrets | Simplifies local setup |
| `npm start` | React dev server with hot module replacement |
| Port 8000 | Direct backend access |

#### Production (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: credit_project
      POSTGRES_USER: credit_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-credit_password_prod}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U credit_user -d credit_project"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=postgres://credit_user:${POSTGRES_PASSWORD}@postgres:5432/credit_project
      - ALLOWED_HOSTS=credit.gavinslater.co.uk,localhost,127.0.0.1,backend,192.168.5.190
      - CORS_ALLOWED_ORIGINS=https://credit.gavinslater.co.uk
      - SECRET_KEY=${SECRET_KEY:-change-me-in-production}
      - SECURE_PROXY_SSL_HEADER=True
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8001:8000"              # External 8001 -> internal 8000
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 120 backend.wsgi:application"

  frontend:
    build:
      context: ./frontend
      args:
        - REACT_APP_API_BASE_URL=https://credit.gavinslater.co.uk
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  static_volume:
  media_volume:
  postgres_data:
```

**Key production features**:

| Feature | Purpose |
|---------|---------|
| Named volumes | Persistent storage managed by Docker |
| `${SECRET_KEY}` | Secrets from environment variables |
| `DEBUG=False` | Generic error pages for users |
| `restart: unless-stopped` | Auto-restart after crashes/reboots |
| Port 8001 | nginx proxies to this port |
| `SECURE_PROXY_SSL_HEADER` | Trust nginx's SSL termination |
| Gunicorn | Production WSGI server with workers |

### 2.3 Configuration Comparison Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| Dockerfile | `Dockerfile` | `Dockerfile.prod` |
| Server | Django `runserver` | Gunicorn (2 workers, 4 threads) |
| DEBUG | `True` | `False` |
| Secrets | Hardcoded | Environment variables |
| Code mounting | Bind mounts (hot-reload) | Baked into image |
| Volumes | Bind mounts | Named volumes |
| Port (backend) | 8000 | 8001 (nginx proxies) |
| Restart policy | None | `unless-stopped` |
| Healthcheck | Python requests | curl |
| Frontend | `npm start` (dev server) | Built static files |
| SSL | None (http) | Via nginx (https) |

## 3. Environment Configuration

### 3.1 Development Environment

Development uses hardcoded values in `docker-compose.yml`. No `.env` file required.

### 3.2 Production Environment

Production requires environment variables for sensitive configuration. Create a `.env` file on the Raspberry Pi:

```bash
# /home/pi/docker/credit-project/.env

# Django secret key (generate a secure random string)
SECRET_KEY=your-secure-random-secret-key-here

# Database password
POSTGRES_PASSWORD=your-secure-database-password
```

Generate a secure secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 4. Development Deployment

### 4.1 Starting Development Environment

```bash
# Navigate to project directory
cd /Users/gavinslater/projects/credit-project

# Start all services
docker-compose up

# Or start in detached mode
docker-compose up -d

# Rebuild after dependency changes
docker-compose up --build
```

### 4.2 Accessing Development Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
| PostgreSQL | localhost:5432 |

### 4.3 Development Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run Django management commands
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Access container shell
docker-compose exec backend bash

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

## 5. Production Deployment

### 5.1 Raspberry Pi Setup

The production environment runs on a Raspberry Pi at `192.168.5.190`.

**Prerequisites**:
- Docker and Docker Compose installed
- nginx installed and configured
- SSL certificates configured (Let's Encrypt)
- Project cloned to `/home/pi/docker/credit-project`

### 5.2 Deploying Updates

```bash
# SSH to Raspberry Pi
ssh pi@192.168.5.190

# Navigate to project directory
cd ~/docker/credit-project

# Pull latest code
git pull origin main

# Rebuild and restart containers
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 5.3 Production Commands

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build backend

# View running containers
docker-compose -f docker-compose.prod.yml ps

# Run Django management commands
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_workflow_states
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash

# View container resource usage
docker stats
```

### 5.4 Deployment from Local Machine

To deploy updates from your local machine:

```bash
# From local project directory
cd /Users/gavinslater/projects/credit-project

# Copy files to Raspberry Pi (if not using git)
scp -r . pi@192.168.5.190:~/docker/credit-project/

# SSH and rebuild
ssh pi@192.168.5.190 "cd ~/docker/credit-project && docker-compose -f docker-compose.prod.yml up -d --build"
```

## 6. Initial Setup & Workflow Metadata

### 6.1 Required Management Commands

After deploying to a new environment or resetting the database, run these commands in order:

```bash
# 1. Apply database migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 2. Load workflow states and transitions
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_workflow_states

# 3. Load form metadata (permissions, roles, etc.)
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata

# 4. Create admin user
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 6.2 Workflow Metadata

The system uses **metadata-driven** workflow configuration stored in the database. This includes:

| Metadata Type | Purpose | Management Command |
|---------------|---------|-------------------|
| Workflow states | Define workflow steps and transitions | `load_workflow_states` |
| Form metadata | Form permissions, editable roles, ownership rules | `load_form_metadata` |
| State metadata | Step numbers, navigation, system actions | `add_workflow_step_metadata` |

### 6.3 Form Permissions

The `load_form_metadata` command configures which roles can edit each form:

| Form | Editable By | Ownership Required |
|------|-------------|-------------------|
| Credit Request Form | Relationship Manager | Yes (own applications only) |
| Business Sponsorship Form | Business Sponsor | No |
| Credit Questionnaire Form | Relationship Manager | No |
| Legal Review Form | Legal Reviewer | No |
| Credit Review Form | Credit Analyst, Credit Approver | No |
| Credit Analysis Form | Credit Analyst, Credit Approver | No |
| Credit Compilation Form | Credit Analyst | No |
| Credit Approval Form | Credit Analyst | No |

**IMPORTANT**: If form permissions are not loading correctly (e.g., "View" button instead of "Edit"), run:

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata --update-only
```

### 6.4 Syncing Metadata Between Environments

When updating workflow metadata, ensure both development and production databases are synchronized:

```bash
# On production server
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata

# Verify the metadata was applied
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell -c "
from workflow_engine.models import Workflow
import json
w = Workflow.objects.get(code='CREDIT_PAPER')
print(json.dumps(w.metadata.get('form_metadata', {}).get('credit_request_form', {}), indent=2))
"
```

## 7. Nginx Proxy Manager

Production uses Nginx Proxy Manager (NPM) as a reverse proxy to:
- Terminate SSL (HTTPS) with Let's Encrypt certificates
- Route requests to the correct Docker container
- Provide a web UI for configuration

NPM is accessed at `https://manage-proxy.gavinslater.co.uk`.

See [Nginx Proxy Manager Setup](./nginx-proxy-manager-setup.md) for detailed configuration.

### 6.1 Routing Configuration

| Path | Destination | Purpose |
|------|-------------|---------|
| `/` | `192.168.5.190:3000` | React frontend |
| `/api/` | `192.168.5.190:8001` | Django REST API |
| `/admin/` | `192.168.5.190:8001` | Django admin |
| `/static/` | `192.168.5.190:8001` | Static files |

### 6.2 Key Settings

- **SSL**: Let's Encrypt certificate with Force SSL enabled
- **HTTP/2**: Enabled for better performance
- **Proxy Headers**: Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto

## 8. Database Management

### 8.1 Accessing PostgreSQL

```bash
# Development
docker-compose exec postgres psql -U credit_user -d credit_project

# Production
docker-compose -f docker-compose.prod.yml exec postgres psql -U credit_user -d credit_project
```

### 8.2 Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U credit_user credit_project > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20241229.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U credit_user -d credit_project
```

### 8.3 Running Migrations

```bash
# Development
docker-compose exec backend python manage.py migrate

# Production
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## 9. Troubleshooting

### 9.1 Container Won't Start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo lsof -i :8001

# Check Docker daemon status
sudo systemctl status docker
```

### 9.2 Database Connection Issues

```bash
# Check postgres container is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection from backend container
docker-compose -f docker-compose.prod.yml exec backend python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('Connected!')"
```

### 9.3 Static Files Not Loading

```bash
# Collect static files manually
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Check static volume
docker volume inspect credit-project_static_volume
```

### 9.4 Permission Denied Errors

```bash
# Check file ownership in container
docker-compose -f docker-compose.prod.yml exec backend ls -la /app

# Fix permissions (if needed)
docker-compose -f docker-compose.prod.yml exec -u root backend chown -R app:app /app
```

### 9.5 Out of Disk Space (Raspberry Pi)

```bash
# Check disk usage
df -h

# Remove unused Docker resources
docker system prune -a

# Remove old images
docker image prune -a
```

## Architecture Flow

### Development

```
┌─────────────────────────────────────────────────────────┐
│ Local Machine                                           │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Your Code   │───>│ Container   │───>│ Browser     │  │
│  │ (mounted)   │    │ runserver   │    │ localhost   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                   │                            │
│        └── Edit file ──────┴── Auto-reload              │
│                                                         │
│  Ports: backend:8000, frontend:3000, postgres:5432      │
└─────────────────────────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────────────────────┐
│ Raspberry Pi (192.168.5.190)                            │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Code baked  │    │ Container   │    │ nginx       │  │
│  │ into image  │    │ gunicorn    │<───│ (SSL, proxy)│  │
│  │ at build    │    │ port 8001   │    │ port 443    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                               │         │
│                              https://credit.gavinslater.co.uk
└─────────────────────────────────────────────────────────┘
```

## Related Documentation

- [Nginx Proxy Manager Setup](./nginx-proxy-manager-setup.md) - NPM configuration details
- [GCP Deployment Guide](./GCP-Deployment-Guide.md) - Alternative cloud deployment
