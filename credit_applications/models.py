import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from workflow_engine.models import WorkflowInstance

class Counterparty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    cif_number = models.CharField(max_length=100, unique=True)
    legal_entity_identifier = models.CharField(max_length=100, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    entity_type = models.CharField(max_length=100, blank=True)
    country_of_incorporation = models.CharField(max_length=100, blank=True)
    industry_sector = models.CharField(max_length=100, blank=True)
    industry_subsector = models.CharField(max_length=100, blank=True)
    business_description = models.TextField(blank=True)
    relationship_since = models.DateField(null=True, blank=True)
    relationship_manager_id = models.UUIDField(null=True, blank=True)
    annual_revenue = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    credit_rating = models.CharField(max_length=100, blank=True)
    kyc_status = models.CharField(max_length=50, blank=True)
    senior_contact = models.CharField(max_length=255, blank=True)
    last_visit_date = models.DateField(null=True, blank=True)
    adaptiv_id = models.CharField(max_length=100, blank=True)
    crs_id = models.CharField(max_length=100, blank=True)
    spreadpac_id = models.CharField(max_length=100, blank=True)
    fitch_id = models.CharField(max_length=100, blank=True)
    last_sync_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class CreditApplication(models.Model):
    # Core identification fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=255)
    
    # Counterparty information
    counterparty = models.ForeignKey(Counterparty, on_delete=models.CASCADE, related_name='applications')
    
    # Core application details
    description = models.TextField(blank=True, help_text="Detailed comments on limits required")
    priority = models.CharField(max_length=20, choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')], default='Medium')
    required_by_date = models.DateField(null=True, blank=True)
    
    # Financial information
    amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    
    # User information
    applicant_name = models.CharField(max_length=255, blank=True)
    applicant_email = models.EmailField(blank=True)
    applicant_phone = models.CharField(max_length=50, blank=True)
    created_by = models.UUIDField(null=True, blank=True)
    assigned_to = models.UUIDField(null=True, blank=True)
    
    # Approval and decision fields
    purpose = models.TextField(blank=True)
    decision_rationale = models.TextField(blank=True)
    conditions = models.TextField(blank=True)
    rank = models.IntegerField(null=True, blank=True)
    
    # Risk assessment
    risk_score = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    risk_assessment_date = models.DateTimeField(null=True, blank=True)
    risk_assessment_reference = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Workflow
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_applications')

    def __str__(self):
        return self.title

class LimitType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class LimitRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='limit_requests')
    limit_type = models.ForeignKey(LimitType, on_delete=models.PROTECT, null=True, blank=True)
    existing_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    existing_tenor = models.IntegerField(null=True, blank=True)
    proposed_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    proposed_tenor = models.IntegerField(null=True, blank=True)
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"{self.limit_type.code} for {self.credit_application.title}"

class DocumentType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    allowed_extensions = models.CharField(max_length=100)
    max_size_mb = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.CharField(max_length=255)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"{self.document_type.name} ({self.file.name})"

class CreditRequestForm(models.Model):
    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_request_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_request_forms')
    
    # Counterparty Information
    guarantor_name = models.CharField(max_length=255, blank=True, null=True)
    guarantor_cif = models.CharField(max_length=50, blank=True, null=True)
    
    # Financial Information
    revenue_last_12m = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    revenue_projected_12m = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    projected_rorwa_percent = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    
    # Risk and Compliance
    country_risk_limit_available = models.BooleanField(default=False)
    kyc_approval_status = models.BooleanField(default=False)
    
    # Relationship Information
    relationship_comments = models.TextField(blank=True)
    most_senior_contact = models.CharField(max_length=255, blank=True)
    last_client_visit_date = models.DateField(blank=True, null=True)
    
    # Documentation
    legal_documentation = models.TextField(blank=True)
    positive_legal_opinion = models.BooleanField(default=False)
    financial_statements_received = models.BooleanField(default=False)
    interim_statements_available = models.BooleanField(default=False)
    
    # Stakeholders
    account_executive = models.CharField(max_length=255, blank=True)
    senior_business_sponsor = models.CharField(max_length=255, blank=True)
    second_business_sponsor = models.CharField(max_length=255, blank=True, null=True)
    
    # Additional Information
    high_priority_justification = models.TextField(blank=True)
    
    # Legacy field for backward compatibility (will be removed after migration)
    form_data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CreditReviewForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_review_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_review_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class BusinessSponsorshipForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='business_sponsorship_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='business_sponsorship_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class LegalReviewForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='legal_review_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='legal_review_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CreditQuestionnaireForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_questionnaire_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_questionnaire_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CreditAnalysisForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='credit_analysis_forms')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_analysis_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CreditCompilationForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='credit_compilation_forms')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_compilation_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CreditApprovalForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='credit_approval_forms')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_approval_forms')
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
