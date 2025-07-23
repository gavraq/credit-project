#!/bin/bash

# Credit Risk Application Deployment Script
# Based on the ai-lunch-learn deployment pattern

set -e  # Exit on any error

# Configuration
SERVICE_NAME="credit-risk-app"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/var/log/${SERVICE_NAME}-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    echo "[ERROR] $1" >> "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Ensure required environment variables exist
if [[ ! -f ".env" ]]; then
    error "Environment file .env not found. Please create it from .env.example"
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=("DATABASE_URL" "SECRET_KEY" "JWT_SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required environment variable $var is not set in .env file"
    fi
done

log "Starting deployment of Credit Risk Application..."

# Create log directory if it doesn't exist
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chown "$(whoami):$(whoami)" "$LOG_FILE"

# Stop existing containers if running
log "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down || warn "No existing containers to stop"

# Pull latest images and rebuild
log "Building application images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

# Start the application
log "Starting application containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log "Waiting for services to become healthy..."
sleep 10

# Check health status
log "Checking service health..."
for i in {1..30}; do
    if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
        log "Backend service is healthy"
        break
    fi
    if [[ $i -eq 30 ]]; then
        error "Backend service failed to become healthy after 5 minutes"
    fi
    log "Waiting for backend service... (attempt $i/30)"
    sleep 10
done

for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Frontend service is healthy"
        break
    fi
    if [[ $i -eq 30 ]]; then
        error "Frontend service failed to become healthy after 5 minutes"
    fi
    log "Waiting for frontend service... (attempt $i/30)"
    sleep 10
done

# Create systemd service file if it doesn't exist
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
if [[ ! -f "$SERVICE_FILE" ]]; then
    log "Creating systemd service file..."
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Credit Risk Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker-compose -f $COMPOSE_FILE up -d
ExecStop=/usr/bin/docker-compose -f $COMPOSE_FILE down
TimeoutStartSec=0
User=$(whoami)
Group=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    log "Systemd service created and enabled"
fi

# Clean up old Docker images and containers
log "Cleaning up old Docker resources..."
docker system prune -f

log "Deployment completed successfully!"
log "Application is now running on:"
log "  - Frontend: http://localhost:3000"
log "  - Backend: http://localhost:8000"
log "  - Admin: http://localhost:8000/admin/"

log "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
log "To stop: docker-compose -f $COMPOSE_FILE down"
log "To restart: sudo systemctl restart $SERVICE_NAME"

log "Next steps:"
log "1. Configure Nginx Proxy Manager to point credit.risk-agents.com to localhost:3000"
log "2. Set up SSL certificate in Nginx Proxy Manager"
log "3. Update DNS records at 123-Reg to point to your GCP VM IP"
log "4. Test the application at https://credit.risk-agents.com"