from django.contrib import admin
from .models import (
    Counterparty, CreditApplication, LimitRequest, DocumentType, Document,
    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm, CreditQuestionnaireForm, CreditAnalysisForm,
    CreditCompilationForm, CreditApprovalForm
)

admin.site.register(Counterparty)
admin.site.register(CreditApplication)
admin.site.register(LimitRequest)
admin.site.register(DocumentType)
admin.site.register(Document)
admin.site.register(CreditRequestForm)
admin.site.register(CreditReviewForm)
admin.site.register(BusinessSponsorshipForm)
admin.site.register(LegalReviewForm)
admin.site.register(CreditQuestionnaireForm)
admin.site.register(CreditAnalysisForm)
admin.site.register(CreditCompilationForm)
admin.site.register(CreditApprovalForm)

# Register your models here.
