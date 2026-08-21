from rest_framework.routers import DefaultRouter

from .views import BOQItemViewSet, BOQViewSet

router = DefaultRouter()
router.register('boq', BOQViewSet, basename='boq')
router.register('boq-items', BOQItemViewSet, basename='boq-item')
urlpatterns = router.urls
