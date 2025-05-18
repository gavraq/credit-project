# Task 5 Documentation: Implement User Authentication

## Overview
This document summarizes the work completed for **Task 5: Implement User Authentication** in the credit risk workflow project. The goal was to ensure secure, role-based access to the API using JWT authentication and custom permissions.

---

## 1. Implementation Summary
- **JWT Authentication:**
  - Integrated `djangorestframework-simplejwt` for secure, stateless authentication.
  - Configured `/api/token/` and `/api/token/refresh/` endpoints for obtaining and refreshing tokens.
- **Role-Based Permissions:**
  - Developed a custom `RolePermission` class to enforce access control based on user roles and permissions.
  - Permissions are checked via `required_role` or `required_permission` attributes on DRF views.
- **Admin Management:**
  - All user, role, and permission management is handled via the Django admin interface.
- **Endpoint Protection:**
  - Demonstrated endpoint protection with `ProtectedHelloView`, which restricts access based on user role.

---

## 2. API Example: What Does `/api/hello/` Do?

- **Purpose:**
  - Serves as a demonstration and test endpoint for verifying JWT authentication and role-based access control.

---

## 3. Example curl Commands and Responses

### 1. Obtain a JWT Token
```sh
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "stonec", "password": "pa$$word123"}'
```
**Response:**
```json
{"refresh":"<refresh-token>","access":"<access-token>"}
```

### 2. Access Protected Endpoint with Access Token
```sh
curl http://localhost:8000/api/hello/ \
  -H "Authorization: Bearer <access-token>"
```
**Success Response (role matches):**
```json
{"message":"Hello, stonec! You have access."}
```
**Failure Response (wrong role):**
```json
{"detail":"You do not have permission to perform this action."}
```
**Failure Response (invalid/expired token):**
```json
{"detail":"Given token not valid for any token type","code":"token_not_valid","messages":[{"token_class":"AccessToken","token_type":"access","message":"Token is invalid"}]}
```

### 3. Refresh the Access Token
```sh
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh-token>"}'
```
**Response:**
```json
{"access":"<new-access-token>"}
```

  - Not intended for production data; used to confirm that permissions are enforced correctly.
- **How it works:**
  - Requires a valid JWT access token (user must be authenticated).
  - Requires the user to have a specific role (e.g., `Credit Analyst`), as set by the `required_role` attribute on the view.
  - If both checks pass, returns a greeting with the username. Otherwise, returns 401 (unauthorized) or 403 (forbidden).

---

## 3. Manual Testing Performed
- Created users with various roles in Django admin.
- Obtained JWT tokens via `/api/token/`.
- Accessed `/api/hello/` with and without correct roles to verify permission enforcement.
- Confirmed correct responses for allowed and denied users.

---

## 4. Next Steps (Optional)
- Apply the same permission logic to all business-critical endpoints.
- Write automated tests for authentication and permissions.
- Document the workflow for future developers.

---

## 5. References
- [Django REST Framework Simple JWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/)
- Project PRD and internal documentation.
