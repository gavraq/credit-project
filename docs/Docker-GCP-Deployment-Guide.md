# Credit Risk Application - Docker & GCP Deployment Guide

This document provides a comprehensive guide for containerizing and deploying the Credit Risk Workflow System to Google Cloud Platform using Docker.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Docker Configuration](#docker-configuration)
4. [GCP Virtual Machine Setup](#gcp-virtual-machine-setup)
5. [DNS Configuration](#dns-configuration)
6. [Application Deployment](#application-deployment)
7. [SSL & Reverse Proxy Setup](#ssl--reverse-proxy-setup)
8. [Database Migration](#database-migration)
9. [Performance Optimization](#performance-optimization)
10. [Final Configuration](#final-configuration)
11. [Troubleshooting](#troubleshooting)

## Project Overview

The Credit Risk Workflow System is a Django + React application that manages the complete credit application lifecycle. The deployment migrates from a local setup at `credit.gavinslater.co.uk` to a production GCP environment at `credit.risk-agents.com`.

**Technology Stack:**
- **Backend**: Django 5.2 with PostgreSQL
- **Frontend**: React 18 with Material-UI
- **Containerization**: Docker with multi-stage builds
- **Deployment**: Google Cloud Platform (Compute Engine)
- **Reverse Proxy**: Nginx Proxy Manager with SSL

## Prerequisites

### Local Environment
- Docker and Docker Compose installed
- Git repository access
- GCP account with billing enabled
- Domain management access (123-Reg)

### GCP Requirements
- Compute Engine API enabled
- VM instance (minimum 1GB RAM, recommended 2-4GB)
- External IP address
- Firewall rules for HTTP/HTTPS traffic

## Docker Configuration

### 1. Backend Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Backend Dockerfile
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

# Create non-root user
RUN addgroup --system app && adduser --system --group app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
RUN pip install uv

# Install Python dependencies
COPY pyproject.toml ./
RUN uv pip install -r pyproject.toml

# Copy application code
COPY . .
RUN chown -R app:app /app

USER app
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Multi-stage build for React frontend
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

# Change ownership of nginx directories
RUN chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    chown -R app:app /etc/nginx/conf.d && \
    chown -R app:app /usr/share/nginx/html

# Touch pid file and change ownership
RUN touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Frontend Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    environment:
      - DEBUG=False
      - DATABASE_URL=${DATABASE_URL}
      - ALLOWED_HOSTS=credit.risk-agents.com,localhost,127.0.0.1
      - CORS_ALLOWED_ORIGINS=https://credit.risk-agents.com
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/api/health/', timeout=10)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    command: >
      sh -c "
        python manage.py migrate &&
        python manage.py collectstatic --noinput &&
        gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 backend.wsgi:application
      "
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_BASE_URL=https://credit.risk-agents.com
      - REACT_APP_ENVIRONMENT=production
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: credit_project
      POSTGRES_USER: credit_user
      POSTGRES_PASSWORD: credit_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U credit_user -d credit_project"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  static_volume:
  media_volume:
  postgres_data:
```

### 5. Environment Configuration

Create `.env.example` for reference:

```env
# Database
DATABASE_URL=postgresql://credit_user:credit_password_2024@postgres:5432/credit_project

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# CORS
CORS_ALLOWED_ORIGINS=https://credit.risk-agents.com

# Django
DEBUG=False
ALLOWED_HOSTS=credit.risk-agents.com,localhost,127.0.0.1
```

## GCP Virtual Machine Setup

### 1. Create Compute Engine Instance

```bash
# Create VM instance
gcloud compute instances create credit-risk-vm \
    --zone=us-east1-b \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account-scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=credit-risk-vm,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20240319,mode=rw,size=30,type=projects/risk-agents/zones/us-east1-b/disks/credit-risk-vm \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=gce-risk-agents-web \
    --reservation-affinity=any
```

### 2. Configure Firewall Rules

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server

# Allow HTTPS traffic  
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server
```

### 3. Install Docker on VM

```bash
# SSH into VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create swap space (for low memory VMs)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## DNS Configuration

### Configure DNS at Domain Provider (123-Reg)

1. Log into your domain management panel
2. Navigate to DNS settings for `risk-agents.com`
3. Add an A record:
   - **Type**: A
   - **Name**: `credit`
   - **Value**: `35.237.49.38` (your VM's external IP)
   - **TTL**: 300 (5 minutes)

### Verify DNS Propagation

```bash
# Test DNS resolution
nslookup credit.risk-agents.com
dig credit.risk-agents.com

# Wait for propagation (5-15 minutes typically)
```

## Application Deployment

### 1. Clone Repository on VM

```bash
# SSH into VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Clone repository
cd /opt
sudo git clone https://github.com/gavraq/credit-project.git
sudo chown -R $USER:$USER credit-project
cd credit-project
```

### 2. Create Production Environment File

```bash
# Create .env file
cp .env.example .env

# Edit with production values
nano .env
```

### 3. Build and Deploy Containers

```bash
# Build all containers
sudo docker-compose -f docker-compose.prod.yml build

# Start services
sudo docker-compose -f docker-compose.prod.yml up -d

# Verify containers are running
sudo docker-compose -f docker-compose.prod.yml ps
```

## SSL & Reverse Proxy Setup

### 1. Install Nginx Proxy Manager

```bash
# Create nginx proxy manager setup
mkdir -p ~/nginx-proxy-manager
cd ~/nginx-proxy-manager

# Create docker-compose.yml for nginx proxy manager
cat > docker-compose.yml << EOF
version: '3'
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
EOF

# Start nginx proxy manager
docker-compose up -d
```

### 2. Configure Proxy Host

1. Access Nginx Proxy Manager at `http://your-vm-ip:81`
2. Login with default credentials:
   - **Email**: `admin@example.com`
   - **Password**: `changeme`
3. Add new proxy host:
   - **Domain Names**: `credit.risk-agents.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `credit-risk-app-frontend-1`
   - **Forward Port**: `3000`
   - **Block Common Exploits**: Yes
   - **Websockets Support**: Yes

### 3. Configure Custom Locations

Add custom locations for API routing:

**Location 1 - API Endpoints**:
- **Location**: `/api/`
- **Scheme**: `http`
- **Forward Hostname/IP**: `credit-risk-app-backend-1`
- **Forward Port**: `8000`

**Location 2 - Admin Interface**:
- **Location**: `/admin/`
- **Scheme**: `http`
- **Forward Hostname/IP**: `credit-risk-app-backend-1`
- **Forward Port**: `8000`

**Location 3 - Static Files**:
- **Location**: `/static/`
- **Scheme**: `http`
- **Forward Hostname/IP**: `credit-risk-app-frontend-1`
- **Forward Port**: `3000`

### 4. Enable SSL Certificate

1. Go to SSL tab in proxy host configuration
2. Select "Request a new SSL Certificate"
3. Enable "Force SSL"
4. Enable "HTTP/2 Support"
5. Save configuration

## Database Migration

### 1. Export Local Database

```bash
# On local machine
pg_dump -h localhost -U credit_user -d credit_project > credit_backup.sql
```

### 2. Transfer Database to VM

```bash
# Copy database backup to VM
gcloud compute scp credit_backup.sql credit-risk-vm:/tmp/ --zone=us-east1-b
```

### 3. Import Database on VM

```bash
# SSH into VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Import database
cd /opt/credit-project
sudo docker exec -i credit-risk-app-postgres-1 psql -U credit_user -d credit_project < /tmp/credit_backup.sql
```

### 4. Create Superuser

```bash
# Create Django superuser
sudo docker exec -it credit-risk-app-backend-1 python manage.py createsuperuser
```

## Performance Optimization

### 1. Memory Optimization

```bash
# Stop non-essential containers to free memory
sudo docker stop ai-lunch-learn-frontend

# Monitor memory usage
free -h
sudo docker stats --no-stream
```

### 2. Django Configuration

Update `backend/settings.py` for production:

```python
# SSL Configuration
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 31536000
```

### 3. Static File Serving

Add static file serving to `backend/urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path

# Add to end of urlpatterns
urlpatterns += [
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]
```

## Final Configuration

### 1. Update Frontend API Configuration

Ensure frontend environment variables point to production:

```env
REACT_APP_API_BASE_URL=https://credit.risk-agents.com
REACT_APP_ENVIRONMENT=production
```

### 2. Network Configuration

Connect nginx proxy manager to application network:

```bash
# Connect nginx proxy manager to app network
sudo docker network connect credit-risk-app_default nginx-proxy-manager
```

### 3. Container Health Checks

Verify all containers are healthy:

```bash
sudo docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### Common Issues and Solutions

**1. 502 Bad Gateway**
- Check container connectivity
- Verify nginx proxy configuration
- Check container logs: `sudo docker logs container-name`

**2. SSL Certificate Issues**
- Verify DNS propagation
- Check Let's Encrypt rate limits
- Ensure port 80/443 are accessible

**3. Static Files Not Loading**
- Verify nginx proxy custom locations
- Check static file serving configuration
- Ensure correct container routing

**4. Slow Performance**
- Monitor memory usage: `free -h`
- Stop non-essential containers
- Consider upgrading VM memory

**5. Database Connection Errors**
- Check PostgreSQL container status
- Verify connection string in .env
- Check database user permissions

### Performance Monitoring

```bash
# Monitor system resources
htop
free -h
df -h

# Monitor Docker containers
sudo docker stats
sudo docker system df

# Check application logs
sudo docker logs credit-risk-app-backend-1 --tail 50
sudo docker logs credit-risk-app-frontend-1 --tail 50
```

### Backup and Maintenance

```bash
# Regular database backup
sudo docker exec credit-risk-app-postgres-1 pg_dump -U credit_user credit_project > backup_$(date +%Y%m%d).sql

# Update containers
sudo docker-compose -f docker-compose.prod.yml pull
sudo docker-compose -f docker-compose.prod.yml up -d

# Clean unused Docker resources
sudo docker system prune -a
```

## Summary

The Credit Risk Application is now successfully deployed on GCP with:

- ✅ **Containerized Architecture**: Django backend, React frontend, PostgreSQL database
- ✅ **Production Domain**: https://credit.risk-agents.com
- ✅ **SSL Security**: Let's Encrypt certificates with automatic renewal
- ✅ **Reverse Proxy**: Nginx Proxy Manager with custom routing
- ✅ **Database Migration**: Complete data transfer from local environment
- ✅ **Authentication**: JWT-based user authentication system
- ✅ **Static Files**: Proper serving of Django admin and React assets

**Access Points:**
- **Main Application**: https://credit.risk-agents.com/login
- **Django Admin**: https://credit.risk-agents.com/admin/
- **API Endpoints**: https://credit.risk-agents.com/api/

**Default Credentials:**
- **Admin User**: admin / admin123
- **Test User**: houserm / pa$$word123

The application is fully functional with expected response times of 15-30 seconds for authentication due to current VM memory constraints. For optimal performance, consider upgrading to a VM with 2-4GB RAM.