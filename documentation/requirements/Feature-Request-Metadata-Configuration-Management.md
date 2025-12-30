# Feature Request: Metadata Configuration Management

## Overview

This feature request covers the implementation of a robust configuration management system for workflow metadata. Currently, metadata changes are managed through management commands without version tracking, audit logging, or automated migration capabilities.

## Current State

### How Metadata is Managed Today

1. **Initial Load**: Metadata is loaded via `load_workflow_states` and `load_form_metadata` management commands
2. **Updates**: Changes are applied via fix commands (e.g., `fix_all_parent_workflow_metadata`, `fix_system_action_fields`)
3. **Validation**: Manual validation via `audit_metadata_step1` and `analyze_all_metadata` commands
4. **No Versioning**: No tracking of metadata versions or change history
5. **No Audit Trail**: No record of who changed what and when

### Pain Points

- **No rollback capability**: If a metadata change causes issues, there's no easy way to revert
- **No change visibility**: Difficult to track what metadata changed between deployments
- **Manual coordination**: Metadata changes require manual execution of management commands
- **Risk of inconsistency**: No validation that metadata across environments matches

---

## Proposed Features

### 1. Metadata Version Tracking

#### Requirements

- Each workflow's metadata should include version information
- Version should auto-increment on changes
- Support semantic versioning (major.minor.patch)

#### Proposed Schema Addition

```python
class WorkflowMetadataVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='metadata_versions')
    version = models.CharField(max_length=20)  # e.g., "1.2.0"
    metadata_snapshot = models.JSONField()  # Full metadata at this version
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    change_description = models.TextField(blank=True)
    is_current = models.BooleanField(default=True)

    class Meta:
        unique_together = ('workflow', 'version')
        ordering = ['-created_at']
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflow/{id}/metadata/versions/` | List all versions |
| GET | `/api/workflow/{id}/metadata/versions/{version}/` | Get specific version |
| POST | `/api/workflow/{id}/metadata/versions/` | Create new version |
| POST | `/api/workflow/{id}/metadata/rollback/{version}/` | Rollback to version |

---

### 2. Metadata Change Audit Log

#### Requirements

- Log all metadata changes with before/after snapshots
- Track user who made the change
- Support filtering by workflow, date range, user
- Integrate with Django Admin for visibility

#### Proposed Schema

```python
class MetadataChangeLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    # What changed
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    field_name = models.CharField(max_length=100)  # 'metadata', 'system_action', etc.

    # Change details
    old_value = models.JSONField(null=True)
    new_value = models.JSONField(null=True)
    change_type = models.CharField(max_length=20, choices=[
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ])

    # Audit info
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    change_source = models.CharField(max_length=50, choices=[
        ('ADMIN', 'Django Admin'),
        ('API', 'API Request'),
        ('COMMAND', 'Management Command'),
        ('MIGRATION', 'Data Migration'),
    ])
    change_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['changed_at']),
        ]
```

#### Implementation Approach

Use Django signals to automatically capture changes:

```python
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(pre_save, sender=Workflow)
def capture_workflow_metadata_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Workflow.objects.get(pk=instance.pk)
            if old_instance.metadata != instance.metadata:
                # Queue change log entry
                instance._metadata_change = {
                    'old': old_instance.metadata,
                    'new': instance.metadata
                }
        except Workflow.DoesNotExist:
            pass

@receiver(post_save, sender=Workflow)
def log_workflow_metadata_change(sender, instance, created, **kwargs):
    if hasattr(instance, '_metadata_change'):
        MetadataChangeLog.objects.create(
            content_object=instance,
            field_name='metadata',
            old_value=instance._metadata_change['old'],
            new_value=instance._metadata_change['new'],
            change_type='CREATE' if created else 'UPDATE',
            # Additional context from thread-local or middleware
        )
```

---

### 3. Automated Migration System

#### Requirements

- Define metadata migrations as code (similar to Django migrations)
- Track which migrations have been applied
- Support forward and backward migrations
- Validate migrations before applying

#### Proposed Structure

```
workflow_engine/
  metadata_migrations/
    __init__.py
    0001_initial_form_metadata.py
    0002_add_business_sponsorship_workflow.py
    0003_update_transition_ui_behavior.py
```

#### Migration File Format

```python
# 0002_add_business_sponsorship_workflow.py

class MetadataMigration:
    dependencies = ['0001_initial_form_metadata']

    def forward(self, workflow_manager):
        """Apply the migration."""
        workflow = workflow_manager.get_workflow('CREDIT_PAPER')

        # Add new form metadata
        workflow.add_form_metadata('business_sponsorship_form', {
            'title': 'Business Sponsorship Form',
            'form_key': 'business_sponsorship_form',
            'workflow_code': 'BUSINESS_SPONSORSHIP',
            'field_mappings': {
                'boolean_fields': ['sponsor_approved'],
                'user_fields': ['senior_business_sponsor', 'second_business_sponsor'],
                'datetime_fields': ['form_started_at', 'form_completed_at']
            }
        })

    def backward(self, workflow_manager):
        """Reverse the migration."""
        workflow = workflow_manager.get_workflow('CREDIT_PAPER')
        workflow.remove_form_metadata('business_sponsorship_form')

    def validate(self, workflow_manager):
        """Validate migration can be applied."""
        workflow = workflow_manager.get_workflow('CREDIT_PAPER')
        if 'business_sponsorship_form' in workflow.get_form_names():
            raise ValidationError("Form already exists")
```

#### Migration Tracking Model

```python
class MetadataMigrationRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255, unique=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    applied_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

#### Management Commands

```bash
# Show migration status
python manage.py showmetadatamigrations

# Apply pending migrations
python manage.py migratemetadata

# Apply specific migration
python manage.py migratemetadata 0002_add_business_sponsorship_workflow

# Rollback last migration
python manage.py migratemetadata --rollback

# Generate migration from current state
python manage.py makemetadatamigration --name "add_new_form"
```

---

### 4. Environment Comparison Tool

#### Requirements

- Compare metadata between environments (dev, staging, prod)
- Identify differences in workflow configuration
- Generate sync scripts

#### Management Command

```bash
# Compare local to production
python manage.py comparemetadata --source=local --target=prod

# Output diff report
python manage.py comparemetadata --source=staging --target=prod --output=diff.json

# Generate sync script
python manage.py comparemetadata --source=staging --target=prod --generate-sync
```

#### Sample Output

```
Metadata Comparison: staging vs prod
====================================

Workflow: CREDIT_PAPER
  form_metadata:
    + credit_analysis_form.field_mappings.user_fields: ['credit_analyst'] (staging only)
    ~ credit_review_form.field_mappings.boolean_fields:
      - prod: ['questionnaire_required']
      - staging: ['questionnaire_required', 'expedited_review']

Transition: CR_TR_1 (Credit Review)
  ~ metadata.ui_behavior.button_style:
    - prod: 'primary'
    - staging: 'success'

State: CREDIT_PAPER_ANALYSIS_PENDING
  (no differences)

Summary: 2 workflows differ, 1 transition differs, 0 states differ
```

---

## Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| 1 | Metadata Change Audit Log | Medium | High - provides visibility |
| 2 | Metadata Version Tracking | Medium | High - enables rollback |
| 3 | Environment Comparison Tool | Low | Medium - aids deployment |
| 4 | Automated Migration System | High | Medium - long-term maintainability |

---

## Acceptance Criteria

### Audit Log
- [ ] All metadata changes are logged automatically
- [ ] Logs include before/after values, user, timestamp
- [ ] Logs are viewable in Django Admin
- [ ] Logs can be filtered by workflow, date, user

### Version Tracking
- [ ] Metadata versions are tracked per workflow
- [ ] Rollback to previous version works correctly
- [ ] Version history is accessible via API
- [ ] Creating a version requires change description

### Migration System
- [ ] Migrations can be defined as Python files
- [ ] `showmetadatamigrations` shows applied/pending status
- [ ] `migratemetadata` applies pending migrations
- [ ] Rollback support for reversible migrations

### Environment Comparison
- [ ] Can compare metadata between two environments
- [ ] Differences are displayed clearly
- [ ] Sync scripts can be generated

---

## Related Documentation

- [Metadata-Driven Workflow System](../implementation/architecture/metadata-driven-workflow-system.md) - Current architecture
- [Workflow Engine Implementation](../implementation/backend/Credit-Risk-Workflow-Engine-Implementation.md) - Workflow engine details

---

## Notes

This feature would significantly improve the maintainability and reliability of the metadata-driven workflow system, especially as the system scales and more workflows are added. The audit log should be implemented first as it provides immediate value with relatively low effort.
