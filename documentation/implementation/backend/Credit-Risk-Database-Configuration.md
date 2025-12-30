# Credit Risk Database Configuration

This document details the database configuration for the Credit Risk Workflow application, including schema design, relationships, and optimization strategies.

## Table of Contents
1. [Overview](#1-overview)
2. [Database Engine](#2-database-engine)
3. [Schema Design](#3-schema-design)
4. [Migrations and Version Control](#4-migrations-and-version-control)
5. [Environment Configuration](#5-environment-configuration)
6. [Performance Optimization](#6-performance-optimization)

## 1. Overview

The Credit Risk Workflow application uses a relational database to store all application data, including user information, credit applications, workflow states, and document metadata. The database is designed to support the complex relationships between these entities while maintaining data integrity and performance.

## 2. Database Engine

### 2.1 PostgreSQL Configuration

The application uses PostgreSQL 14 as its primary database engine due to its robust support for:
- JSON data types (for flexible form data storage)
- Advanced indexing capabilities
- Transaction support
- Concurrency control
- Full-text search

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'credit_risk_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Persistent connections
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

### 2.2 Connection Pooling

For production environments, connection pooling is implemented using PgBouncer to manage database connections efficiently:

```yaml
# docker-compose.yml (excerpt)
services:
  pgbouncer:
    image: edoburu/pgbouncer:1.16.0
    environment:
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - DB_NAME=${DB_NAME}
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=100
      - DEFAULT_POOL_SIZE=20
    ports:
      - "6432:5432"
    restart: always
```

## 3. Schema Design

### 3.1 Core Tables

The database schema is organized around the following core tables:

#### Users and Authentication

```python
# users/models.py
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict)
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['department_id']),
            models.Index(fields=['role_id']),
        ]
```

#### Workflow Engine

```python
# workflow/models.py
class WorkflowDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_definition'

class State(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_initial = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)
    role_permissions = models.JSONField(default=list)
    department_permissions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_state'
        unique_together = [['workflow', 'name']]
        indexes = [
            models.Index(fields=['workflow', 'is_initial']),
            models.Index(fields=['workflow', 'is_terminal']),
        ]

class Transition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='transitions')
    from_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='outgoing_transitions')
    to_state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='incoming_transitions')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    role_permissions = models.JSONField(default=list)
    department_permissions = models.JSONField(default=list)
    conditions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_transition'
        unique_together = [['workflow', 'from_state', 'to_state']]
        indexes = [
            models.Index(fields=['workflow']),
            models.Index(fields=['from_state']),
            models.Index(fields=['to_state']),
        ]

class WorkflowInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_definition = models.ForeignKey(WorkflowDefinition, on_delete=models.PROTECT)
    current_state = models.ForeignKey(State, on_delete=models.PROTECT)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflow_instance'
        indexes = [
            models.Index(fields=['workflow_definition']),
            models.Index(fields=['current_state']),
            models.Index(fields=['content_type', 'object_id']),
        ]

class TransitionLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='transitions')
    from_state = models.ForeignKey(State, on_delete=models.PROTECT, related_name='from_transitions')
    to_state = models.ForeignKey(State, on_delete=models.PROTECT, related_name='to_transitions')
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    comments = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'workflow_transition_log'
        indexes = [
            models.Index(fields=['workflow_instance']),
            models.Index(fields=['performed_by']),
            models.Index(fields=['timestamp']),
        ]
```

#### Credit Applications

```python
# credit_applications/models.py
class Counterparty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    cid = models.CharField(max_length=50, unique=True, verbose_name="CIF/CID")
    industry = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'counterparty'
        verbose_name_plural = 'counterparties'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['cid']),
        ]

class LimitType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'limit_type'

class CreditApplication(models.Model):
    APPLICATION_TYPES = (
        ('new_credit', 'New Credit'),
        ('credit_review', 'Credit Review'),
        ('limit_increase', 'Limit Increase'),
        ('limit_extension', 'Limit Extension'),
        ('limit_reduction', 'Limit Reduction'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField(max_length=50, unique=True)
    application_type = models.CharField(max_length=20, choices=APPLICATION_TYPES)
    counterparty = models.ForeignKey(Counterparty, on_delete=models.PROTECT)
    workflow_instance = models.OneToOneField(
        'workflow.WorkflowInstance', 
        on_delete=models.PROTECT, 
        related_name='credit_application',
        null=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='created_applications'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_applications'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'credit_application'
        indexes = [
            models.Index(fields=['reference_number']),
            models.Index(fields=['application_type']),
            models.Index(fields=['counterparty']),
            models.Index(fields=['created_by']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['created_at']),
        ]

class CreditRequestForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(
        CreditApplication, 
        on_delete=models.CASCADE, 
        related_name='request_form'
    )
    form_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'credit_request_form'

class LimitRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.ForeignKey(
        CreditApplication, 
        on_delete=models.CASCADE, 
        related_name='limit_requests'
    )
    limit_type = models.ForeignKey(LimitType, on_delete=models.PROTECT)
    existing_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    existing_tenor = models.IntegerField(default=0)  # In days
    proposed_amount = models.DecimalField(max_digits=20, decimal_places=2)
    proposed_tenor = models.IntegerField()  # In days
    approved_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    approved_tenor = models.IntegerField(null=True, blank=True)  # In days
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'limit_request'
        indexes = [
            models.Index(fields=['credit_application']),
            models.Index(fields=['limit_type']),
        ]
```

#### Documents

```python
# documents/models.py
class DocumentType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    required = models.BooleanField(default=False)
    allowed_extensions = models.JSONField(default=list)
    max_size_mb = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'document_type'

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    credit_application = models.ForeignKey(
        'credit_applications.CreditApplication', 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField()  # In bytes
    content_type = models.CharField(max_length=100)
    has_preview = models.BooleanField(default=False)
    preview_path = models.CharField(max_length=500, blank=True)
    version = models.IntegerField(default=1)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'document'
        indexes = [
            models.Index(fields=['document_type']),
            models.Index(fields=['credit_application']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['created_at']),
        ]
```

### 3.2 Database Relationships Diagram

```
+----------------+       +-------------------+       +------------------+
| User           |       | WorkflowDefinition|       | Counterparty     |
+----------------+       +-------------------+       +------------------+
| id (PK)        |       | id (PK)           |       | id (PK)          |
| username       |       | name              |       | name             |
| email          |       | description       |       | cid              |
| department_id  |       | is_active         |       | industry         |
| role_id        |       +-------------------+       | country          |
+----------------+               |                   +------------------+
       |                         |                           |
       |                         |                           |
       v                         v                           v
+----------------+       +-------------------+       +------------------+
| TransitionLog  |       | State             |       | CreditApplication|
+----------------+       +-------------------+       +------------------+
| id (PK)        |       | id (PK)           |       | id (PK)          |
| workflow_inst  |<------| workflow_id (FK)  |       | reference_number |
| from_state_id  |       | name              |       | application_type |
| to_state_id    |       | is_initial        |<------| counterparty_id  |
| performed_by   |       | is_terminal       |       | workflow_inst_id |
| comments       |       +-------------------+       | created_by_id    |
+----------------+               |                   | assigned_to_id   |
                                 |                   +------------------+
                                 v                           |
                        +-------------------+               |
                        | Transition        |               |
                        +-------------------+               |
                        | id (PK)           |               |
                        | workflow_id (FK)  |               |
                        | from_state_id (FK)|               |
                        | to_state_id (FK)  |               |
                        | name              |               |
                        +-------------------+               |
                                                           |
                                                           v
                        +-------------------+       +------------------+
                        | LimitType         |       | CreditRequestForm|
                        +-------------------+       +------------------+
                        | id (PK)           |       | id (PK)          |
                        | name              |       | credit_app_id    |
                        | code              |       | form_data (JSON) |
                        | description       |       +------------------+
                        +-------------------+               |
                                 |                          |
                                 v                          v
                        +-------------------+       +------------------+
                        | LimitRequest      |       | Document         |
                        +-------------------+       +------------------+
                        | id (PK)           |       | id (PK)          |
                        | credit_app_id (FK)|<------| credit_app_id    |
                        | limit_type_id (FK)|       | document_type_id |
                        | existing_amount   |       | filename         |
                        | existing_tenor    |       | file_path        |
                        | proposed_amount   |       | version          |
                        | proposed_tenor    |       | uploaded_by_id   |
                        +-------------------+       +------------------+
```

## 4. Migrations and Version Control

### 4.1 Django Migrations

Database schema changes are managed through Django's migration system:

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Create a specific app migration
python manage.py makemigrations app_name
```

### 4.2 Migration Strategy

For production environments, the following migration strategy is employed:

1. **Zero-downtime migrations**: Schema changes are designed to be backward compatible
2. **Database backups**: Full backups are taken before applying migrations
3. **Staged rollout**: Migrations are tested in development and staging environments before production
4. **Rollback plan**: Each migration has a corresponding rollback plan

```python
# Example of a safe, reversible migration
# migrations/0002_add_field_with_default.py

operations = [
    # Step 1: Add the field as nullable first
    migrations.AddField(
        model_name='mymodel',
        name='new_field',
        field=models.CharField(max_length=100, null=True, blank=True),
    ),
    # Step 2: Run data migration to populate the field
    migrations.RunPython(
        code=populate_new_field,
        reverse_code=migrations.RunPython.noop,
    ),
    # Step 3: Make the field required
    migrations.AlterField(
        model_name='mymodel',
        name='new_field',
        field=models.CharField(max_length=100),
    ),
]
```

## 5. Environment Configuration

### 5.1 Environment Variables

Database configuration is managed through environment variables to maintain security and flexibility across different environments:

```bash
# .env.example
DB_ENGINE=django.db.backends.postgresql
DB_NAME=credit_risk_db
DB_USER=db_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432

# For read replicas
USE_DB_REPLICAS=False
DB_REPLICA_HOST=replica.example.com
DB_REPLICA_PORT=5432
```

### 5.2 Environment-Specific Settings

Different database configurations are used for development, testing, and production environments:

```python
# settings/base.py
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.environ.get('DB_NAME', 'credit_risk_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# settings/production.py
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': 'require',
        }
    }
}

# Add read replicas if configured
if os.environ.get('USE_DB_REPLICAS', 'False').lower() == 'true':
    DATABASES['replica'] = {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_REPLICA_HOST'),
        'PORT': os.environ.get('DB_REPLICA_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': 'require',
        }
    }
    
    DATABASE_ROUTERS = ['core.db_routers.PrimaryReplicaRouter']
```

### 5.3 Database Router for Read Replicas

```python
# core/db_routers.py
class PrimaryReplicaRouter:
    """
    A router to control database operations, sending reads to replicas
    and writes to the primary database.
    """
    
    def db_for_read(self, model, **hints):
        """
        Reads go to the replica if available.
        """
        if 'replica' in settings.DATABASES:
            return 'replica'
        return 'default'
    
    def db_for_write(self, model, **hints):
        """
        Writes always go to primary.
        """
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """
        Relations between objects are allowed if both objects are
        in the primary/replica pool.
        """
        db_set = {'default', 'replica'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        All migrations go to the primary database.
        """
        return db == 'default'
```

## 6. Performance Optimization

### 6.1 Indexing Strategy

Indexes are strategically placed on frequently queried fields:

```python
# Example from CreditApplication model
class Meta:
    db_table = 'credit_application'
    indexes = [
        models.Index(fields=['reference_number']),
        models.Index(fields=['application_type']),
        models.Index(fields=['counterparty']),
        models.Index(fields=['created_by']),
        models.Index(fields=['assigned_to']),
        models.Index(fields=['created_at']),
    ]
```

### 6.2 Query Optimization

Efficient querying practices are employed throughout the application:

```python
# Using select_related for foreign keys
applications = CreditApplication.objects.select_related(
    'counterparty', 
    'workflow_instance', 
    'workflow_instance__current_state'
).all()

# Using prefetch_related for reverse relationships
applications = CreditApplication.objects.prefetch_related(
    'limit_requests', 
    'documents'
).all()

# Using only() to select specific fields
users = User.objects.only('id', 'username', 'email').filter(is_active=True)

# Using defer() to exclude large fields
documents = Document.objects.defer('file_path', 'preview_path').all()
```

### 6.3 Database-Level Optimizations

PostgreSQL-specific optimizations are configured:

```python
# settings/production.py
DATABASES = {
    'default': {
        # ... other settings
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': 'require',
            'application_name': 'credit_risk_app',
            'client_min_messages': 'notice',
            'autocommit': True,
            'options': '-c statement_timeout=30000'  # 30 seconds timeout
        }
    }
}
```

### 6.4 Database Maintenance

Regular maintenance tasks are scheduled:

```python
# management/commands/database_maintenance.py
class Command(BaseCommand):
    help = 'Perform database maintenance tasks'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Analyze tables to update statistics
            cursor.execute("VACUUM ANALYZE")
            
            # Reindex tables
            cursor.execute("REINDEX DATABASE %s", [connection.settings_dict['NAME']])
            
            # Log maintenance completion
            self.stdout.write(self.style.SUCCESS('Database maintenance completed successfully'))
```

### 6.5 Caching Strategy

Django's caching framework is used to reduce database load:

```python
# settings/production.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Example of model-level caching
from django.core.cache import cache

def get_active_workflows():
    cache_key = 'active_workflows'
    cached_result = cache.get(cache_key)
    
    if cached_result is None:
        result = WorkflowDefinition.objects.filter(is_active=True).select_related().all()
        cache.set(cache_key, result, 3600)  # Cache for 1 hour
        return result
    
    return cached_result
```

This database configuration provides a solid foundation for the Credit Risk Workflow application, with considerations for performance, scalability, and maintainability across different environments.
