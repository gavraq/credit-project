# Credit Risk Application - GCP Deployment Guide

This guide covers the complete deployment process for migrating the Credit Risk Application from local deployment to Google Cloud Platform (GCP) with Docker containerization.

## Overview

The deployment involves:
- Dockerizing the Django + React application
- Migrating from `credit.gavinslater.co.uk` to `credit.risk-agents.com`
- Deploying to GCP VM with Nginx Proxy Manager
- Configuring DNS at 123-Reg
- Integrating with existing landing page

## Prerequisites

1. **GCP VM** with Docker and Docker Compose installed
2. **Nginx Proxy Manager** running on GCP VM
3. **123-Reg domain management** access for `risk-agents.com`
4. **Database backup** of current application data

## Step 1: Environment Setup

### 1.1 Create Production Environment File

Create `.env` file from `.env.example` on your GCP VM:

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
# Database Configuration
DATABASE_URL=postgres://your_db_user:your_db_password@your_db_host:5432/credit_project

# Django Settings
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=credit.risk-agents.com,localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://credit.risk-agents.com

# JWT Configuration
JWT_SECRET_KEY=your-production-jwt-secret-key
```

### 1.2 Database Migration

If migrating from existing deployment:

```bash
# Backup current database
pg_dump your_current_db > credit_backup.sql

# Restore to new database
psql your_new_db < credit_backup.sql
```

## Step 2: Domain Configuration

### 2.1 DNS Setup at 123-Reg

1. Log into 123-Reg control panel
2. Navigate to DNS management for `risk-agents.com`
3. Add subdomain record:
   - **Type**: A Record
   - **Name**: credit
   - **Value**: Your GCP VM IP address
   - **TTL**: 300 (5 minutes)

### 2.2 Verify DNS Propagation

```bash
# Check DNS resolution
nslookup credit.risk-agents.com
dig credit.risk-agents.com
```

## Step 3: Application Deployment

### 3.1 Clone and Prepare Application

```bash
# Clone repository to GCP VM
git clone your-repository-url /opt/credit-risk-app
cd /opt/credit-risk-app

# Set up environment
cp .env.example .env
# Edit .env with production values

# Make deployment script executable
chmod +x deploy.sh
```

### 3.2 Deploy Application

```bash
# Run deployment script
./deploy.sh
```

The deployment script will:
- Stop existing containers
- Build new images
- Start production containers
- Run health checks
- Create systemd service
- Clean up old resources

### 3.3 Verify Deployment

Check application health:

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl http://localhost:8000/api/health/
curl http://localhost:3000/health
```

## Step 4: Nginx Proxy Manager Configuration

### 4.1 Add Proxy Host

1. Access Nginx Proxy Manager admin panel
2. Go to "Proxy Hosts" → "Add Proxy Host"
3. Configure:
   - **Domain Names**: `credit.risk-agents.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `localhost` (or container IP)
   - **Forward Port**: `3000`
   - **Cache Assets**: Enable
   - **Block Common Exploits**: Enable
   - **Websockets Support**: Enable

### 4.2 SSL Certificate

1. In the same proxy host configuration
2. Go to "SSL" tab
3. Configure:
   - **SSL Certificate**: Request a new SSL Certificate with Let's Encrypt
   - **Force SSL**: Enable
   - **HTTP/2 Support**: Enable
   - **HSTS Enabled**: Enable

### 4.3 Advanced Configuration (Optional)

Add custom Nginx configuration if needed:

```nginx
# Custom headers
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## Step 5: Testing and Validation

### 5.1 Functional Testing

1. **Access Application**: https://credit.risk-agents.com
2. **Login Functionality**: Test user authentication
3. **API Endpoints**: Verify all backend services
4. **File Uploads**: Test document management
5. **Workflow Transitions**: Test credit application flow

### 5.2 Performance Testing

```bash
# Load testing with curl
for i in {1..10}; do
  curl -w "@curl-format.txt" -o /dev/null -s https://credit.risk-agents.com
done

# Monitor resource usage
docker stats
```

### 5.3 Security Testing

1. **SSL Configuration**: https://www.ssllabs.com/ssltest/
2. **Security Headers**: https://securityheaders.com/
3. **CORS Settings**: Verify cross-origin restrictions

## Step 6: Landing Page Integration

The landing page at `risk-agents.com` already includes a link to the credit application:

```html
<a href="https://credit.risk-agents.com" class="link-card">
    <span class="link-icon">📊</span>
    <div class="link-title">Credit Risk Workflow</div>
    <div class="link-description">Access our comprehensive credit risk management and workflow application</div>
</a>
```

## Step 7: Monitoring and Maintenance

### 7.1 Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# System logs
journalctl -u credit-risk-app -f

# Deployment logs
tail -f /var/log/credit-risk-app-deploy.log
```

### 7.2 Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/credit_db_$DATE.sql
```

### 7.3 Updates and Scaling

```bash
# Update application
git pull origin main
./deploy.sh

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL and network connectivity
2. **SSL Certificate**: Verify domain DNS and firewall rules
3. **CORS Errors**: Check CORS_ALLOWED_ORIGINS setting
4. **Health Check Failures**: Verify application startup and dependencies

### Debug Commands

```bash
# Check container health
docker inspect credit-risk-app_backend_1 | grep Health

# Network debugging
docker network ls
docker network inspect credit-risk-app_default

# Database connection test
docker exec -it credit-risk-app_backend_1 python manage.py dbshell
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Database Access**: Use strong passwords and limit network access
3. **SSL/TLS**: Ensure all traffic is encrypted
4. **Updates**: Regularly update dependencies and base images
5. **Monitoring**: Set up alerts for security events

## Performance Optimization

1. **Static Files**: Configure CDN for static assets
2. **Database**: Optimize queries and add indexes
3. **Caching**: Implement Redis for session and query caching
4. **Monitoring**: Use tools like Prometheus/Grafana

## Support and Maintenance

- **Logs Location**: `/var/log/credit-risk-app-deploy.log`
- **Service Management**: `sudo systemctl {start|stop|restart|status} credit-risk-app`
- **Container Management**: `docker-compose -f docker-compose.prod.yml {up|down|logs|ps}`
- **Health Checks**: 
  - Backend: `https://credit.risk-agents.com/api/health/`
  - Frontend: `https://credit.risk-agents.com/health`