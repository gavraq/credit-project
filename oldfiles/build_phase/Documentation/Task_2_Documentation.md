# Task 2 Documentation: Configure Backend Environment

This document details all steps performed to complete Task 2: Configure Backend Environment for the credit-project.

## Overview
Set up Django and Django REST Framework (DRF) backend with a PostgreSQL database, including environment variable management and local development best practices.

---

## Steps Performed

### 1. Install Python Packages
- Used `uv add` to install:
  - `django`
  - `djangorestframework`
  - `psycopg2-binary` (PostgreSQL adapter)
  - `python-dotenv` (for environment variable management)

### 2. Initialize Django Project
- Created a new Django project in the project root using:
  ```sh
  .venv/bin/django-admin startproject backend .
  ```

### 3. Configure Environment Variables
- Added PostgreSQL connection variables to `.env.example` and `.env`:
  ```env
  POSTGRES_DB=credit_project_db
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=postgres
  POSTGRES_HOST=localhost
  POSTGRES_PORT=5432
  ```

### 4. Update Django Settings
- Updated `backend/settings.py`:
  - Switched database engine to PostgreSQL (`django.db.backends.postgresql_psycopg2`).
  - Loaded credentials from environment variables using `python-dotenv`.

### 5. Set Up PostgreSQL User and Database
- Created a PostgreSQL superuser and database:
  ```sql
  -- In psql prompt:
  CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
  CREATE DATABASE credit_project_db OWNER postgres;
  ```
- Troubleshooted macOS Homebrew PostgreSQL setup:
  - Used `createdb <username>` and connected with `psql -U <username>` as needed.

### 6. Run Django Migrations
- Applied initial Django migrations to set up the database schema:
  ```sh
  .venv/bin/python manage.py migrate
  ```

### 7. Start Django Development Server
- Started the server:
  ```sh
  .venv/bin/python manage.py runserver 0.0.0.0:8000
  ```
- Verified the Django success page at [http://localhost:8000](http://localhost:8000).

---

## Notes
- All sensitive credentials are managed via `.env` and not committed to version control.
- If you encounter database connection errors, confirm that the PostgreSQL user and database exist and that your `.env` is correct.
- For further development, you can now scaffold Django apps, set up DRF, and implement your backend features.

---

**Task 2 is now fully documented.**
