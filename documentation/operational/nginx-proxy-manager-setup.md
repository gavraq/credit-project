# Nginx Proxy Manager Configuration

This document describes the Nginx Proxy Manager (NPM) configuration for routing traffic to the Credit Risk Workflow System at `https://credit.gavinslater.co.uk`.

## Overview

Nginx Proxy Manager is a Docker-based reverse proxy with a web UI that handles:
- SSL termination (Let's Encrypt certificates)
- Routing requests to the correct backend service
- Custom location-based routing for API endpoints

### Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────┐
│  Nginx Proxy Manager            │
│  (manage-proxy.gavinslater.co.uk)│
│  SSL Termination                │
└─────────────────────────────────┘
    │
    ├── /           → 192.168.5.190:3000 (React Frontend)
    ├── /api/       → 192.168.5.190:8001 (Django Backend)
    ├── /admin/     → 192.168.5.190:8001 (Django Admin)
    └── /static/    → 192.168.5.190:8001 (Static Files)
```

## NPM Configuration for credit.gavinslater.co.uk

### 1. Details Tab

| Setting | Value |
|---------|-------|
| Domain Names | `credit.gavinslater.co.uk` |
| Scheme | `http` |
| Forward Hostname/IP | `192.168.5.190` |
| Forward Port | `3000` |
| Cache Assets | OFF |
| Block Common Exploits | ON |
| Websockets Support | OFF |
| Access List | Publicly Accessible |

**Note**: The default forward (port 3000) handles the React frontend. WebSocket support is OFF here because it's configured separately in Custom Locations if needed.

### 2. Custom Locations Tab

Custom locations override the default routing for specific URL paths.

#### Location: `/api/`

Routes all API requests to the Django backend.

| Setting | Value |
|---------|-------|
| Location | `/api/` |
| Scheme | `http` |
| Forward Hostname/IP | `192.168.5.190` |
| Forward Port | `8001` |

#### Location: `/admin/`

Routes Django admin requests to the backend (add if not present).

| Setting | Value |
|---------|-------|
| Location | `/admin/` |
| Scheme | `http` |
| Forward Hostname/IP | `192.168.5.190` |
| Forward Port | `8001` |

#### Location: `/static/`

Routes static file requests to Django's static files (add if not present).

| Setting | Value |
|---------|-------|
| Location | `/static/` |
| Scheme | `http` |
| Forward Hostname/IP | `192.168.5.190` |
| Forward Port | `8001` |

#### Location: `/ws/` (Optional - WebSocket Support)

Only needed if WebSocket functionality is implemented.

| Setting | Value |
|---------|-------|
| Location | `/ws/` |
| Scheme | `http` |
| Forward Hostname/IP | `192.168.5.190` |
| Forward Port | `8001` |

**Advanced config for WebSocket location** (click gear icon):
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

### 3. SSL Tab

| Setting | Value |
|---------|-------|
| SSL Certificate | `credit.gavinslater.co.uk` (Let's Encrypt) |
| Force SSL | ON |
| HTTP/2 Support | ON |
| HSTS Enabled | OFF |
| HSTS Subdomains | OFF |

**Note**: Force SSL ensures all HTTP requests are redirected to HTTPS.

### 4. Advanced Tab

Custom Nginx configuration applied to the proxy host:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

These headers ensure the Django backend receives:
- `Host`: Original hostname requested
- `X-Real-IP`: Client's actual IP address
- `X-Forwarded-For`: Full proxy chain
- `X-Forwarded-Proto`: Original protocol (https)

## Port Reference

| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| Frontend (React) | 3000 | 3000 | Serves React application |
| Backend (Django) | 8000 | 8001 | API and admin endpoints |
| PostgreSQL | 5432 | - | Database (internal only) |

**Note**: The backend container runs on port 8000 internally but is exposed on port 8001 on the host to avoid conflicts.

## Verification

After configuring NPM, verify the setup:

1. **Frontend**: Navigate to `https://credit.gavinslater.co.uk`
   - Should load the React application

2. **API**: Navigate to `https://credit.gavinslater.co.uk/api/health/`
   - Should return `{"status": "ok"}`

3. **Admin**: Navigate to `https://credit.gavinslater.co.uk/admin/`
   - Should show Django admin login

4. **SSL**: Check certificate in browser
   - Should show valid Let's Encrypt certificate

## Troubleshooting

### 502 Bad Gateway

The backend service is not responding:
```bash
# Check if containers are running
ssh pi@192.168.5.190 "docker-compose -f docker-compose.prod.yml ps"

# Check backend logs
ssh pi@192.168.5.190 "docker-compose -f docker-compose.prod.yml logs backend"
```

### 504 Gateway Timeout

Request is taking too long:
- Check if the backend is overloaded
- Increase timeout in NPM advanced config if needed

### Mixed Content Errors

Frontend making HTTP requests instead of HTTPS:
- Ensure `REACT_APP_API_BASE_URL=https://credit.gavinslater.co.uk` in frontend build
- Rebuild frontend with correct environment variable

### Static Files Not Loading (Admin)

Django admin CSS/JS not loading:
- Add `/static/` custom location pointing to backend
- Run `collectstatic` in the backend container:
  ```bash
  docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
  ```

### CSRF Errors

Django rejecting requests due to CSRF:
- Ensure `SECURE_PROXY_SSL_HEADER` is set in Django settings
- Ensure `X-Forwarded-Proto` header is being passed

## Related Documentation

- [Deployment Implementation](./Credit-Risk-Deployment-Implementation.md) - Full deployment guide
- [Nginx Proxy Manager Docs](https://nginxproxymanager.com/guide/) - Official NPM documentation
