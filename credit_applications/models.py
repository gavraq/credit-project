import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from workflow_engine.models import WorkflowInstance
from django.conf import settings

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
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_credit_applications',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_credit_applications',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    relationship_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='managed_credit_applications',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Relationship manager responsible for this credit application'
    )
    
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
    counterparty_cif = models.CharField(max_length=50, blank=True, null=True) # Added field
    counterparty_name = models.CharField(max_length=255, blank=True, null=True, help_text='Denormalized field for counterparty name')
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
    relationship_manager_name = models.CharField(max_length=255, blank=True, null=True, help_text='Denormalized field for relationship manager name')
    most_senior_contact = models.CharField(max_length=255, blank=True)
    last_client_visit_date = models.DateField(blank=True, null=True)
    
    # Documentation
    legal_documentation = models.TextField(blank=True)
    positive_legal_opinion = models.BooleanField(default=False)
    financial_statements_received = models.BooleanField(default=False)
    interim_statements_available = models.BooleanField(default=False)
    detailed_limit_comments = models.TextField(blank=True, null=True, help_text='Denormalized field for detailed limit comments')
    
    # Stakeholders
    account_executive = models.CharField(max_length=255, blank=True)
    senior_business_sponsor_name = models.CharField(max_length=255, blank=True, null=True) # Renamed, was senior_business_sponsor
    senior_business_sponsor_id = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='crf_senior_sponsors')
    second_business_sponsor_name = models.CharField(max_length=255, blank=True, null=True) # Renamed, was second_business_sponsor
    second_business_sponsor_id = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='crf_second_sponsors')
    
    # Additional Information
    high_priority_justification = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Auto-populate denormalized fields before saving
        if self.credit_application:
            # Populate counterparty_name
            if self.credit_application.counterparty:
                self.counterparty_name = self.credit_application.counterparty.name
                
                # Get relationship manager from credit application if available
                if self.credit_application.relationship_manager:
                    user = self.credit_application.relationship_manager
                    self.relationship_manager_name = f"{user.first_name} {user.last_name}".strip()
                # Fallback to counterparty relationship manager if application's is not set
                elif hasattr(self.credit_application.counterparty, 'relationship_manager_id') and self.credit_application.counterparty.relationship_manager_id:
                    # Try to get the user from the User model
                    User = settings.AUTH_USER_MODEL
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        user = User.objects.get(id=self.credit_application.counterparty.relationship_manager_id)
                        self.relationship_manager_name = f"{user.first_name} {user.last_name}".strip()
                    except Exception:
                        # If user can't be found, just leave as is
                        pass
                
            # Populate detailed_limit_comments
            if self.credit_application.description:
                self.detailed_limit_comments = self.credit_application.description
                
        # Populate sponsor names if they have IDs but no names
        if self.senior_business_sponsor_id and not self.senior_business_sponsor_name:
            user = self.senior_business_sponsor_id
            self.senior_business_sponsor_name = f"{user.first_name} {user.last_name}".strip()
            
        if self.second_business_sponsor_id and not self.second_business_sponsor_name:
            user = self.second_business_sponsor_id
            self.second_business_sponsor_name = f"{user.first_name} {user.last_name}".strip()
            
        super().save(*args, **kwargs)

class CreditReviewForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_review_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_review_forms')
    
    # Credit Review specific fields
    credit_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_credit_applications',
        help_text='Credit Analyst responsible for this review'
    )
    assigned_credit_analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_for_analysis',
        help_text='Credit Analyst assigned to perform the analysis'
    )
    delegated_authority_level = models.CharField(
        max_length=10,
        choices=[
            ('DA1', 'DA1'), ('DA2', 'DA2'), ('DA3', 'DA3'), ('DA4', 'DA4'),
            ('DA5', 'DA5'), ('DA6', 'DA6'), ('DA7', 'DA7'), ('DA8', 'DA8')
        ],
        null=True,
        blank=True,
        help_text='Required delegated authority level for approval'
    )
    questionnaire_required = models.BooleanField(
        default=False,
        help_text='Whether additional Credit Questionnaire is required'
    )
    additional_information_request = models.TextField(
        null=True,
        blank=True,
        help_text='Request for additional information from Front Office'
    )
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        help_text='Reason for rejection if application is rejected'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)

class BusinessSponsorshipForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='business_sponsorship_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='business_sponsorship_forms')
    
    # Business Sponsorship specific fields
    senior_business_sponsor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sponsored_applications',
        help_text='Senior Business Sponsor (from Credit Request)'
    )
    senior_business_sponsor_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Denormalized name of senior business sponsor'
    )
    senior_sponsor_approval = models.CharField(
        max_length=10,
        choices=[('approved', 'Approved'), ('rejected', 'Rejected')],
        null=True,
        blank=True,
        help_text='Senior sponsor approval decision'
    )
    senior_sponsor_comments = models.TextField(
        null=True,
        blank=True,
        help_text='Senior sponsor comments on their decision'
    )
    
    # Second Business Sponsor (optional)
    second_business_sponsor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='second_sponsored_applications',
        help_text='Optional second Business Sponsor'
    )
    second_business_sponsor_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Denormalized name of second business sponsor'
    )
    second_sponsor_approval = models.CharField(
        max_length=10,
        choices=[('approved', 'Approved'), ('rejected', 'Rejected')],
        null=True,
        blank=True,
        help_text='Second sponsor approval decision'
    )
    second_sponsor_comments = models.TextField(
        null=True,
        blank=True,
        help_text='Second sponsor comments on their decision'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Auto-populate denormalized names
        if self.senior_business_sponsor and not self.senior_business_sponsor_name:
            user = self.senior_business_sponsor
            self.senior_business_sponsor_name = f"{user.first_name} {user.last_name}".strip()
            
        if self.second_business_sponsor and not self.second_business_sponsor_name:
            user = self.second_business_sponsor
            self.second_business_sponsor_name = f"{user.first_name} {user.last_name}".strip()
            
        super().save(*args, **kwargs)

class LegalReviewForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='legal_review_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='legal_review_forms')
    
    # Legal Review specific fields
    legal_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='legal_reviews',
        help_text='Legal Reviewer responsible for this review'
    )
    agreement_template = models.CharField(
        max_length=100,
        blank=True,
        help_text='Agreement template used (e.g., ISDA, CSA)'
    )
    governing_law = models.CharField(
        max_length=100,
        blank=True,
        help_text='Governing law for the agreement'
    )
    counterparty_events_of_default = models.TextField(
        blank=True,
        help_text='Counterparty events of default provisions'
    )
    grace_period = models.CharField(
        max_length=100,
        blank=True,
        help_text='Grace period for defaults'
    )
    non_standard_provisions = models.TextField(
        blank=True,
        help_text='Any non-standard provisions in the agreement'
    )
    positive_netting_opinion = models.BooleanField(
        null=True,
        blank=True,
        help_text='Positive netting opinion received'
    )
    
    # CSA (Credit Support Annex) fields
    has_csa = models.BooleanField(
        null=True,
        blank=True,
        help_text='Whether CSA is in place'
    )
    csa_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='Type of CSA agreement'
    )
    iosco_compliant = models.BooleanField(
        null=True,
        blank=True,
        help_text='IOSCO compliance status'
    )
    csa_threshold = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='CSA threshold amount'
    )
    csa_minimum_transfer = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='CSA minimum transfer amount'
    )
    csa_independent_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='CSA independent amount'
    )
    positive_collateral_opinion = models.BooleanField(
        null=True,
        blank=True,
        help_text='Positive collateral opinion received'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)

class CreditQuestionnaireForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_questionnaire_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_questionnaire_forms')
    
    # Credit Questionnaire specific fields
    questionnaire_completor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_questionnaires',
        help_text='Relationship Manager who completed the questionnaire'
    )
    
    # Tab 1: Business Model
    business_model_description = models.TextField(
        null=True,
        blank=True,
        help_text='Basic details of counterparty business model (what do they do, how do they make money?)'
    )
    key_suppliers_customers = models.TextField(
        null=True,
        blank=True,
        help_text='Key suppliers and/or customers, typical terms of trade or credit provided to customers'
    )
    
    # Tab 2: Trading Activities - Core Trading Section
    primary_products = models.TextField(
        null=True,
        blank=True,
        help_text='What metals/products do they trade primarily (e.g., LME outrights, OTC averages, loco London gold)?'
    )
    trading_flow_drivers = models.TextField(
        null=True,
        blank=True,
        help_text='What is that trading flow driven by (e.g., hedging inventory or OPs, their own clients\' trading flows)?'
    )
    position_size_drivers = models.TextField(
        null=True,
        blank=True,
        help_text='What determines the size/type of positions taken?'
    )
    typical_max_tenor = models.TextField(
        null=True,
        blank=True,
        help_text='Typical and maximum expected tenor of trades and/or hedges for each metal?'
    )
    strategic_vs_proprietary = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Does the counterparty engage in strategic hedging or proprietary trading?',
        choices=[
            ('', 'Select option'),
            ('strategic', 'Strategic Hedging'),
            ('proprietary', 'Proprietary Trading'),
            ('both', 'Both'),
        ]
    )
    
    # Tab 2: Trading Activities - Physical Positions Section
    icbcs_financing = models.TextField(
        null=True,
        blank=True,
        help_text='Size ($ and equivalent volume) of ICBCS financing line?'
    )
    total_counterparty_financing_lines = models.TextField(
        null=True,
        blank=True,
        help_text='Size ($ and volume) of client\'s total metal financing lines with all counterparties?'
    )
    repo_hedging_management = models.TextField(
        null=True,
        blank=True,
        help_text='How does the facility basis close the client and ICBCS manage hedging of the metal financed under repo?'
    )
    location_grade_details = models.TextField(
        null=True,
        blank=True,
        help_text='Metal, material grade (e.g., LGD) and financing locus for each transit?'
    )
    exit_risk_limits = models.TextField(
        null=True,
        blank=True,
        help_text='Size of exit risk limits in place and assumed exit tenor?'
    )
    other_secured_trade_finance = models.TextField(
        null=True,
        blank=True,
        help_text='Any other secured trade finance used by client?'
    )
    repo_balance_sheet_treatment = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Balance sheet treatment of repos',
        choices=[
            ('', 'Select option'),
            ('on_balance_sheet', 'On balance sheet secured financing'),
            ('off_balance_sheet', 'Off balance sheet'),
        ]
    )
    
    # Tab 2: Trading Activities - Notional Positions Section
    notional_value_requested = models.TextField(
        null=True,
        blank=True,
        help_text='What notional value do the requested IMPL or PFE lines rise to at current prices?'
    )
    icbcs_proportion_total_book = models.TextField(
        null=True,
        blank=True,
        help_text='Approximately what proportion of their total metals trading or hedge book could ICBCS account for?'
    )
    total_position_capacity = models.TextField(
        null=True,
        blank=True,
        help_text='Including limits at other banks or brokers, what is the total size of position in oz/tonnes and USD they can run?'
    )
    position_business_context = models.TextField(
        null=True,
        blank=True,
        help_text='Does that make sense in context of their underlying business?'
    )
    
    # Tab 3: Risk Management - Hedge Effectiveness Section
    material_basis_risk = models.TextField(
        null=True,
        blank=True,
        help_text='What is the volume/value of any material basis risk that the counterparty cannot hedge?'
    )
    hedge_accounting = models.TextField(
        null=True,
        blank=True,
        help_text='Is hedge accounting (IFRS 9 or ASC 815) applied to the metal hedges? Cash flow or fair value hedges?'
    )
    
    # Tab 3: Risk Management - Stress Testing Section
    market_stress_tests = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text='Does the counterparty run market stress tests?',
        choices=[
            ('', 'Select option'),
            ('yes', 'Yes'),
            ('no', 'No'),
        ]
    )
    stress_management = models.TextField(
        null=True,
        blank=True,
        help_text='How do the results inform cash/liquid assets or risk management actions?'
    )
    stress_governance = models.TextField(
        null=True,
        blank=True,
        help_text='Who sets/governs the stress/VaR levels?'
    )
    stress_assumptions = models.TextField(
        null=True,
        blank=True,
        help_text='What are the stress assumptions?'
    )
    
    # Tab 3: Risk Management - Policies & Governance Section
    trading_policy_governance = models.TextField(
        null=True,
        blank=True,
        help_text='Who determines trading/hedge policies (e.g., Board)?'
    )
    
    # Tab 4: Funding & Liquidity - Liquidity Management Section
    other_counterparties_count = models.IntegerField(
        null=True,
        blank=True,
        help_text='How many other counterparties does the client use?'
    )
    available_derivative_lines = models.TextField(
        null=True,
        blank=True,
        help_text='What are their total available derivative lines?'
    )
    cash_banking_lines = models.TextField(
        null=True,
        blank=True,
        help_text='What available cash and banking lines (committed & uncommitted) does the client have available? How much is unutilized?'
    )
    treasury_management_structure = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='For groups with multiple entities, treasury and liquidity management structure',
        choices=[
            ('', 'Select option'),
            ('centralized', 'Centralized'),
            ('entity_level', 'At entity level'),
        ]
    )
    usd_cash_location = models.TextField(
        null=True,
        blank=True,
        help_text='Where is USD cash available for margin calls held and managed from?'
    )
    china_parent_restrictions = models.TextField(
        null=True,
        blank=True,
        help_text='For entities reliant on a nonshore China parent, give details of USD cash position/terms/restrictions'
    )
    margining_vs_unmargined = models.TextField(
        null=True,
        blank=True,
        help_text='Are all hedging facilities subject to margining or are unmargined OTC lines also provided?'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)

class CreditAnalysisForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_analysis_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_analysis_forms')
    
    # Credit Analysis specific fields
    credit_analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_analyses',
        help_text='Credit Analyst performing the analysis'
    )
    
    # Basic Details
    industry_analysis = models.TextField(
        blank=True,
        help_text='Industry analysis and outlook'
    )
    business_model_assessment = models.TextField(
        blank=True,
        help_text='Assessment of business model and strategy'
    )
    management_quality = models.CharField(
        max_length=20,
        choices=[('excellent', 'Excellent'), ('good', 'Good'), ('satisfactory', 'Satisfactory'), ('poor', 'Poor')],
        blank=True,
        help_text='Management quality assessment'
    )
    
    # Executive Summary
    executive_summary = models.TextField(
        blank=True,
        help_text='Executive summary of the credit analysis'
    )
    key_risks = models.TextField(
        blank=True,
        help_text='Key risks identified'
    )
    mitigating_factors = models.TextField(
        blank=True,
        help_text='Mitigating factors and risk controls'
    )
    
    # Financial Analysis
    revenue_analysis = models.TextField(
        blank=True,
        help_text='Analysis of revenue trends and sustainability'
    )
    profitability_analysis = models.TextField(
        blank=True,
        help_text='Analysis of profitability metrics'
    )
    cash_flow_analysis = models.TextField(
        blank=True,
        help_text='Cash flow analysis and projections'
    )
    debt_capacity_analysis = models.TextField(
        blank=True,
        help_text='Assessment of debt capacity and leverage'
    )
    
    # Risk Assessment
    credit_rating_recommendation = models.CharField(
        max_length=10,
        blank=True,
        help_text='Internal credit rating recommendation'
    )
    probability_of_default = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Estimated probability of default (%)'
    )
    loss_given_default = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Estimated loss given default (%)'
    )
    
    # Climate Scorecard
    climate_risk_score = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        blank=True,
        help_text='Climate risk assessment score'
    )
    esg_score = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        blank=True,
        help_text='ESG risk score'
    )
    transition_risk_assessment = models.TextField(
        blank=True,
        help_text='Assessment of transition risks'
    )
    physical_risk_assessment = models.TextField(
        blank=True,
        help_text='Assessment of physical climate risks'
    )
    
    # Final recommendations
    recommendation = models.CharField(
        max_length=25,
        choices=[('approve', 'Approve'), ('approve_with_conditions', 'Approve with Conditions'), ('reject', 'Reject')],
        blank=True,
        help_text='Final recommendation'
    )
    recommended_conditions = models.TextField(
        blank=True,
        help_text='Recommended conditions if applicable'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)

class CreditCompilationForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_compilation_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_compilation_forms')
    
    # Credit Compilation specific fields
    compiler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='compiled_credit_papers',
        help_text='Credit Analyst who compiled the credit paper'
    )
    
    # Credit Paper sections
    credit_paper_summary = models.TextField(
        blank=True,
        help_text='Executive summary of the credit paper'
    )
    facility_summary = models.TextField(
        blank=True,
        help_text='Summary of requested facilities'
    )
    counterparty_background = models.TextField(
        blank=True,
        help_text='Background information on counterparty'
    )
    business_rationale = models.TextField(
        blank=True,
        help_text='Business rationale for the facilities'
    )
    risk_assessment_summary = models.TextField(
        blank=True,
        help_text='Summary of risk assessment findings'
    )
    financial_analysis_summary = models.TextField(
        blank=True,
        help_text='Summary of financial analysis'
    )
    legal_documentation_summary = models.TextField(
        blank=True,
        help_text='Summary of legal documentation review'
    )
    conditions_precedent = models.TextField(
        blank=True,
        help_text='Conditions precedent to drawdown'
    )
    ongoing_covenants = models.TextField(
        blank=True,
        help_text='Ongoing covenants and monitoring requirements'
    )
    pricing_summary = models.TextField(
        blank=True,
        help_text='Pricing and fee structure summary'
    )
    
    # Compilation status
    all_forms_reviewed = models.BooleanField(
        default=False,
        help_text='All required forms have been reviewed'
    )
    ready_for_approval = models.BooleanField(
        default=False,
        help_text='Credit paper is ready for approval'
    )
    compiler_notes = models.TextField(
        blank=True,
        help_text='Internal notes from the compiler'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)

class CreditApprovalForm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_application = models.OneToOneField(CreditApplication, on_delete=models.CASCADE, related_name='credit_approval_form')
    workflow_instance = models.ForeignKey(WorkflowInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_approval_forms')
    
    # Credit Approval specific fields
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_credit_applications',
        help_text='Credit Committee member or DA holder who made the approval decision'
    )
    
    # Approval decision and details
    approval_decision = models.CharField(
        max_length=25,
        choices=[
            ('approved', 'Approved'),
            ('approved_with_conditions', 'Approved with Conditions'),
            ('rejected', 'Rejected'),
            ('deferred', 'Deferred'),
            ('withdrawn', 'Withdrawn')
        ],
        null=True,
        blank=True,
        help_text='Final approval decision'
    )
    approval_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date and time of approval decision'
    )
    delegated_authority_level = models.CharField(
        max_length=10,
        choices=[
            ('DA1', 'DA1'), ('DA2', 'DA2'), ('DA3', 'DA3'), ('DA4', 'DA4'),
            ('DA5', 'DA5'), ('DA6', 'DA6'), ('DA7', 'DA7'), ('DA8', 'DA8'),
            ('CC', 'Credit Committee')
        ],
        null=True,
        blank=True,
        help_text='Delegated authority level used for approval'
    )
    
    # Approval conditions and terms
    approved_amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Total approved amount across all facilities'
    )
    approval_conditions = models.TextField(
        null=True,
        blank=True,
        help_text='Conditions precedent and subsequent to approval'
    )
    pricing_terms = models.TextField(
        null=True,
        blank=True,
        help_text='Approved pricing and fee structure'
    )
    facility_terms = models.TextField(
        null=True,
        blank=True,
        help_text='Key terms and conditions of approved facilities'
    )
    covenants = models.TextField(
        null=True,
        blank=True,
        help_text='Financial and operational covenants'
    )
    
    # Approval comments and rationale
    approval_comments = models.TextField(
        null=True,
        blank=True,
        help_text='Comments and rationale for the approval decision'
    )
    risk_assessment_summary = models.TextField(
        null=True,
        blank=True,
        help_text='Summary of key risks and mitigants considered'
    )
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        help_text='Detailed reason for rejection if applicable'
    )
    
    # Approval limits and utilization
    tenor_approved = models.IntegerField(
        null=True,
        blank=True,
        help_text='Approved tenor in months'
    )
    review_date = models.DateField(
        null=True,
        blank=True,
        help_text='Next review date for the approved facilities'
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text='Expiry date of the approval'
    )
    
    # Credit committee details (if applicable)
    committee_meeting_date = models.DateField(
        null=True,
        blank=True,
        help_text='Date of credit committee meeting (if DA level requires CC)'
    )
    committee_members_present = models.TextField(
        null=True,
        blank=True,
        help_text='Names of credit committee members present at the meeting'
    )
    
    # Documentation and legal requirements
    documentation_requirements = models.TextField(
        null=True,
        blank=True,
        help_text='Legal documentation requirements for drawdown'
    )
    special_conditions = models.TextField(
        null=True,
        blank=True,
        help_text='Any special conditions or requirements'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    form_started_at = models.DateTimeField(null=True, blank=True)
    form_completed_at = models.DateTimeField(null=True, blank=True)
    form_last_saved_at = models.DateTimeField(null=True, blank=True)
