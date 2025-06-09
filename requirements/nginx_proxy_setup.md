# Nginx Proxy Manager Configuration for Credit Project

This document outlines the Nginx Proxy Manager (NPM) setup required to correctly route traffic to the React frontend, Django backend API, and WebSocket services for the Credit Project when accessed via a custom domain (e.g., `https://credit.gavinslater.co.uk`) during local development.

## 1. Prerequisites

*   **Nginx Proxy Manager:** Installed and accessible on your network.
*   **Local Machine IP:** The IP address of the machine running the frontend and backend services (e.g., `192.168.0.45` as used in the examples). This IP must be reachable by the server running Nginx Proxy Manager.
*   **Services Running:** Ensure your frontend and backend services are running.

## 2. Server Startup Commands

The following commands are used to start the necessary services on your development machine:

*   **Frontend (React App):**
    ```bash
    # Navigate to the frontend directory
    cd path/to/your/frontend
    # Start the React development server (e.g., configured to run on port 3000 and bind to 0.0.0.0)
    npm start
    ```
    *(Ensure your `npm start` script or its underlying configuration, like `react-scripts start`, results in the server listening on `0.0.0.0:3000` to be accessible from other devices on your network, including NPM).*

*   **Backend (Django App):**
    ```bash
    # Navigate to the project root directory (where manage.py is)
    cd path/to/your/credit-project
    # Activate your virtual environment (e.g., using uv)
    # uv venv .venv
    # source .venv/bin/activate
    # Start the Django development server (listening on port 8000 and binding to 0.0.0.0)
    python manage.py runserver 0.0.0.0:8000
    ```
    *(If using Daphne for ASGI and WebSocket support, your startup command might differ, e.g., `daphne -b 0.0.0.0 -p 8000 backend.asgi:application`)*

## 3. Nginx Proxy Manager Setup

Log in to your Nginx Proxy Manager instance and follow these steps:

### 3.1. Create/Edit Proxy Host

Navigate to `Hosts` -> `Proxy Hosts` and either "Add Proxy Host" or edit your existing one for `credit.gavinslater.co.uk`.

#### 3.1.1. Details Tab

*   **Domain Names:** `credit.gavinslater.co.uk` (or your chosen domain)
*   **Scheme:** `http` (NPM will handle SSL termination if configured on the SSL tab)
*   **Forward Hostname / IP:** `192.168.0.45` (your development machine's IP)
*   **Forward Port:** `3000` (the port your React frontend development server is running on)
*   **Cache Assets:** Optional, can be enabled.
*   **Block Common Exploits:** Recommended, usually enabled.
*   **Websockets Support:** Keep this **OFF** here. WebSocket support for specific paths will be handled in "Custom locations."

*(Screenshot Reference: User provided `Details_Tab.png`)*

#### 3.1.2. Custom Locations Tab

This is where we differentiate traffic for the API and WebSockets.

*   **Add Location for API:**
    *   Click "Add location".
    *   **Define location:** `/api/`
    *   **Scheme:** `http`
    *   **Forward Hostname / IP:** `192.168.0.45`
    *   **Forward Port:** `8000` (your Django backend port)
    *   **Advanced Configuration (Gear Icon ⚙️):** While often not strictly necessary for basic API proxying if NPM defaults are good, ensure standard proxy headers are passed. If issues arise, or for best practice, you can add these in the custom Nginx configuration for this specific location:
        ```nginx
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        ```

*   **Add Location for WebSockets:**
    *   Click "Add location" again.
    *   **Define location:** `/ws/`
    *   **Scheme:** `http`
    *   **Forward Hostname / IP:** `192.168.0.45`
    *   **Forward Port:** `8000` (assuming Daphne/Django serves WebSockets on the same port as the API)
    *   **Advanced Configuration (Gear Icon ⚙️):** This is **critical** for WebSockets. Add the following to the custom Nginx configuration for this `/ws/` location:
        ```nginx
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        ```
        *(NPM might offer a "Websocket Support" toggle within the location's settings (gear icon), which would achieve the same by adding necessary headers.)*

*(Screenshot Reference: User provided `Custom_Locations_Tab.png`)*

#### 3.1.3. SSL Tab

*   Configure SSL as needed (e.g., "Let's Encrypt"). This ensures `https://` access.

#### 3.1.4. Advanced Tab (Global Custom Nginx Configuration)

The user's screenshot shows the following in the main "Advanced" tab for the proxy host:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
NPM displays a note: *"Please note, that any add_header or set_header directives added here will not be used by nginx. You will have to add a custom location '/' and add the header in the custom config there."*
This implies these global settings might not apply as expected unless a custom location for `/` is also defined and configured with these headers. However, since the API calls started working after setting up the `/api/` custom location, NPM might be applying necessary default headers for custom locations or the specific headers in the "Advanced" tab are being applied to the default proxy pass (to port 3000). For robustness, it's generally better to define necessary headers within each specific custom location's advanced settings if possible.

*(Screenshot Reference: User provided `Advanced_Tab.png`)*

### 3.2. Save Changes

*   Save each custom location.
*   Save the overall Proxy Host configuration.

## 4. Frontend Application Configuration

Ensure your React frontend is configured to use the correct base URL for API calls and the correct WebSocket URL.

*   **API Base URL:** In your `frontend/.env` file:
    ```
    REACT_APP_API_BASE_URL=https://credit.gavinslater.co.uk
    ```
    Your `src/services/api.js` or equivalent should use this environment variable to construct API request URLs (e.g., `axios.create({ baseURL: process.env.REACT_APP_API_BASE_URL })`). API calls would then be made to relative paths like `/api/credit/credit-applications/`.

*   **WebSocket URL:** Your WebSocket client code should connect to:
    ```javascript
    const socket = new WebSocket('wss://credit.gavinslater.co.uk/ws/'); // Note: wss:// and no explicit port
    ```

## 5. Verification

1.  Restart your frontend and backend application servers if you made any changes to their configurations.
2.  Clear your browser cache or use an incognito window to ensure you're getting the latest frontend build.
3.  Access `https://credit.gavinslater.co.uk`.
4.  Navigate to parts of your application that make API calls (e.g., the Request Tracking Dashboard).
5.  Open your browser's Developer Tools -> Network tab.
    *   Verify that API calls to paths like `/api/credit/credit-applications/` are successful (Status 200 OK).
    *   Verify WebSocket connections to `/ws/` are established successfully (Status 101 Switching Protocols).

This setup ensures that Nginx Proxy Manager correctly directs HTTP and WebSocket traffic to the appropriate backend services, enabling your full application to function through a single, SSL-secured domain name.
