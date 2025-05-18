from rest_framework.routers import DefaultRouter
from .views import CreditApplicationViewSet, CounterpartyViewSet, LimitRequestViewSet, LimitTypeViewSet

router = DefaultRouter()
router.register(r'credit-applications', CreditApplicationViewSet, basename='creditapplication')
router.register(r'counterparties', CounterpartyViewSet, basename='counterparty')
router.register(r'limit-requests', LimitRequestViewSet, basename='limitrequest')
router.register(r'limit-types', LimitTypeViewSet, basename='limittype')

urlpatterns = router.urls
