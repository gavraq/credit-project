FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_SYSTEM_PYTHON=1

# Create and set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system app && adduser --system --group app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install UV
RUN pip install uv

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies using UV
RUN uv pip install -r pyproject.toml

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Change ownership of the app directory to the app user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health/', timeout=10)" || exit 1

# Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]