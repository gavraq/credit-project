# Credit Risk Application - GCP Deployment Guide

This document provides a comprehensive guide for deploying the Credit Risk Workflow System to Google Cloud Platform using Docker and Nginx Proxy Manager.

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [GCP Virtual Machine Setup](#3-gcp-virtual-machine-setup)
4. [Docker Configuration](#4-docker-configuration)
5. [DNS Configuration](#5-dns-configuration)
6. [Application Deployment](#6-application-deployment)
7. [Nginx Proxy Manager Setup](#7-nginx-proxy-manager-setup)
8. [Database Migration](#8-database-migration)
9. [Testing and Validation](#9-testing-and-validation)
10. [Monitoring and Maintenance](#10-monitoring-and-maintenance)
11. [Troubleshooting](#11-troubleshooting)

## 1. Overview

The Credit Risk Workflow System can be deployed to GCP as an alternative to the Raspberry Pi deployment. This guide covers migration from `credit.gavinslater.co.uk` to a GCP-hosted environment.

### Technology Stack

- **Backend**: Django 5.2 with PostgreSQL
- **Frontend**: React 18 with Material-UI
- **Containerization**: Docker with Docker Compose
- **Deployment**: Google Cloud Platform (Compute Engine)
- **Reverse Proxy**: Nginx Proxy Manager with Let's Encrypt SSL

### Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────┐
│  Nginx Proxy Manager            │
│  (Port 80/443)                  │
│  SSL Termination                │
└─────────────────────────────────┘
    │
    ├── /           → Frontend Container (Port 3000)
    ├── /api/       → Backend Container (Port 8000)
    ├── /admin/     → Backend Container (Port 8000)
    └── /static/    → Backend Container (Port 8000)
```

## 2. Prerequisites

### Local Environment

- Docker and Docker Compose installed
- Git repository access
- GCP account with billing enabled
- Domain management access (e.g., 123-Reg)

### GCP Requirements

- Compute Engine API enabled
- VM instance (minimum 1GB RAM, recommended 2-4GB)
- External static IP address
- Firewall rules for HTTP/HTTPS traffic

## 3. GCP Virtual Machine Setup

### 3.1 Create Compute Engine Instance

```bash
# Create VM instance
gcloud compute instances create credit-risk-vm \
    --zone=us-east1-b \
    --machine-type=e2-small \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=credit-risk-vm,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20240319,mode=rw,size=30 \
    --shielded-vtpm \
    --shielded-integrity-monitoring
```

### 3.2 Configure Firewall Rules

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

### 3.3 Reserve Static IP

```bash
# Reserve external IP
gcloud compute addresses create credit-risk-ip --region=us-east1

# Get the IP address
gcloud compute addresses describe credit-risk-ip --region=us-east1
```

### 3.4 Install Docker on VM

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
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

### 3.5 Create Swap Space (for low memory VMs)

```bash
# SSH back into VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Create swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Docker Configuration

The project includes Docker configuration files for production deployment. See the main [Deployment Implementation](./Credit-Risk-Deployment-Implementation.md) for details on the Docker setup.

### 4.1 Key Files

| File | Purpose |
|------|---------|
| `Dockerfile.prod` | Production backend image with Gunicorn |
| `docker-compose.prod.yml` | Production container orchestration |
| `frontend/Dockerfile` | Frontend image with nginx |
| `.env` | Environment variables (secrets) |

### 4.2 Environment Configuration

Create `.env` file on the GCP VM with production values:

```bash
# Copy example and edit
cp .env.example .env
nano .env
```

Required environment variables:

```env
# Database - use strong passwords
DATABASE_URL=postgresql://credit_user:YOUR_DB_PASSWORD@postgres:5432/credit_project
POSTGRES_PASSWORD=YOUR_DB_PASSWORD

# Django Security - generate unique keys
SECRET_KEY=YOUR_UNIQUE_SECRET_KEY
DEBUG=False

# Domain Configuration
ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

Generate a secure secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 5. DNS Configuration

### 5.1 Configure DNS at Domain Provider

1. Log into your domain management panel (e.g., 123-Reg)
2. Navigate to DNS settings for your domain
3. Add an A record:
   - **Type**: A
   - **Name**: `credit` (or your chosen subdomain)
   - **Value**: Your GCP VM's external IP address
   - **TTL**: 300 (5 minutes)

### 5.2 Verify DNS Propagation

```bash
# Check DNS resolution
nslookup credit.your-domain.com
dig credit.your-domain.com

# Wait for propagation (typically 5-15 minutes)
```

## 6. Application Deployment

### 6.1 Clone Repository

```bash
# SSH into VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Clone repository
cd /opt
sudo git clone https://github.com/your-repo/credit-project.git
sudo chown -R $USER:$USER credit-project
cd credit-project
```

### 6.2 Configure Environment

```bash
# Create production environment file
cp .env.example .env

# Edit with your production values
nano .env
```

### 6.3 Build and Start Containers

```bash
# Build containers
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6.4 Initialize Application

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Load workflow states and transitions
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_workflow_states

# Load form metadata (permissions, roles, etc.)
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 6.5 Workflow Metadata

The system uses **metadata-driven** workflow configuration. After deployment, ensure all metadata is loaded:

| Command | Purpose |
|---------|---------|
| `load_workflow_states` | Load workflow states and transitions |
| `load_form_metadata` | Load form permissions (editable roles, ownership rules) |
| `add_workflow_step_metadata` | Load step numbers and navigation metadata |

**Form Permissions**: The `load_form_metadata` command configures which roles can edit each form:

| Form | Editable By | Ownership Required |
|------|-------------|-------------------|
| Credit Request Form | Relationship Manager | Yes |
| Business Sponsorship Form | Business Sponsor | No |
| Credit Questionnaire Form | Relationship Manager | No |
| Legal Review Form | Legal Reviewer | No |
| Credit Review Form | Credit Analyst, Credit Approver | No |
| Credit Analysis Form | Credit Analyst, Credit Approver | No |
| Credit Compilation Form | Credit Analyst | No |
| Credit Approval Form | Credit Analyst | No |

**IMPORTANT**: If form buttons show "View" instead of "Edit" for users who should be able to edit, run:

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_form_metadata --update-only
```

## 7. Nginx Proxy Manager Setup

### 7.1 Install Nginx Proxy Manager

```bash
# Create NPM directory
mkdir -p ~/nginx-proxy-manager
cd ~/nginx-proxy-manager

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
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

# Start NPM
docker-compose up -d
```

### 7.2 Initial NPM Configuration

1. Access NPM admin panel at `http://YOUR_VM_IP:81`
2. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
3. **Immediately change the default password**

### 7.3 Connect NPM to Application Network

```bash
# Connect NPM to the application network
docker network connect credit-project_default nginx-proxy-manager
```

### 7.4 Configure Proxy Host

In NPM admin panel, add a new Proxy Host:

**Details Tab:**

| Setting | Value |
|---------|-------|
| Domain Names | `credit.your-domain.com` |
| Scheme | `http` |
| Forward Hostname/IP | `backend` (container name) |
| Forward Port | `8000` |
| Block Common Exploits | ON |
| Websockets Support | OFF |

**Custom Locations Tab:**

Add these custom locations:

| Location | Forward Host | Forward Port |
|----------|--------------|--------------|
| `/` | `frontend` | `3000` |
| `/api/` | `backend` | `8000` |
| `/admin/` | `backend` | `8000` |
| `/static/` | `backend` | `8000` |

**SSL Tab:**

| Setting | Value |
|---------|-------|
| SSL Certificate | Request new Let's Encrypt certificate |
| Force SSL | ON |
| HTTP/2 Support | ON |
| HSTS Enabled | Optional |

**Advanced Tab:**

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## 8. Database Migration

### 8.1 Export from Current Environment

```bash
# On current server (e.g., Raspberry Pi)
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U credit_user credit_project > credit_backup.sql
```

### 8.2 Transfer to GCP

```bash
# Copy backup to GCP VM
gcloud compute scp credit_backup.sql credit-risk-vm:/tmp/ --zone=us-east1-b
```

### 8.3 Import on GCP

```bash
# SSH into GCP VM
gcloud compute ssh credit-risk-vm --zone=us-east1-b

# Import database
cd /opt/credit-project
cat /tmp/credit_backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U credit_user -d credit_project
```

## 9. Testing and Validation

### 9.1 Health Checks

```bash
# Test backend health
curl http://localhost:8000/api/health/

# Test frontend
curl http://localhost:3000/

# Test through proxy (after SSL setup)
curl https://credit.your-domain.com/api/health/
```

### 9.2 Functional Testing

1. **Access Application**: Navigate to `https://credit.your-domain.com`
2. **Login**: Test user authentication
3. **API**: Verify backend endpoints respond
4. **Admin**: Access Django admin at `/admin/`
5. **Workflow**: Test credit application flow

### 9.3 SSL Verification

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/

## 10. Monitoring and Maintenance

### 10.1 View Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# All container logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 10.2 Monitor Resources

```bash
# System resources
htop
free -h
df -h

# Docker container stats
docker stats
```

### 10.3 Regular Backups

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U credit_user credit_project > backup_$(date +%Y%m%d).sql

# Consider setting up automated backups with cron
```

### 10.4 Updates

```bash
# Pull latest code
cd /opt/credit-project
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### 10.5 Cleanup

```bash
# Remove unused Docker resources
docker system prune -a

# Remove old images
docker image prune -a
```

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check container connectivity and logs |
| SSL Certificate Error | Verify DNS propagation, check Let's Encrypt rate limits |
| Static Files Not Loading | Check custom locations in NPM, run collectstatic |
| Slow Performance | Monitor memory, consider upgrading VM |
| Database Connection Error | Check DATABASE_URL in .env, verify postgres container |
| CORS Errors | Verify CORS_ALLOWED_ORIGINS matches your domain |

### 11.2 Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View container logs
docker-compose -f docker-compose.prod.yml logs backend --tail 100

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash

# Check network connectivity
docker network ls
docker network inspect credit-project_default

# Test database connection
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### 11.3 Restart Services

```bash
# Restart all containers
docker-compose -f docker-compose.prod.yml restart

# Restart specific container
docker-compose -f docker-compose.prod.yml restart backend

# Full rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Security Reminders

1. **Never commit `.env` files** to version control
2. **Use strong, unique passwords** for database and Django secret key
3. **Keep Docker images updated** for security patches
4. **Enable firewall** - only allow necessary ports (80, 443)
5. **Regular backups** - automate database backups
6. **Monitor logs** for suspicious activity

## Related Documentation

- [Deployment Implementation](./Credit-Risk-Deployment-Implementation.md) - Raspberry Pi deployment (current production)
- [Nginx Proxy Manager Setup](./nginx-proxy-manager-setup.md) - Detailed NPM configuration
