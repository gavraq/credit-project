from django.contrib import admin
from .models import (
    Counterparty, CreditApplication, LimitRequest, LimitType, DocumentType, Document,
    CreditRequestForm, CreditReviewForm, BusinessSponsorshipForm, LegalReviewForm, CreditQuestionnaireForm, CreditAnalysisForm,
    CreditCompilationForm, CreditApprovalForm, ClimateScorecard
)

admin.site.register(Counterparty)
admin.site.register(CreditApplication)
admin.site.register(LimitRequest)
admin.site.register(LimitType)
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
admin.site.register(ClimateScorecard)

# Register your models here.
