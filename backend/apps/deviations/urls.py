from rest_framework.routers import DefaultRouter

from .views import ExecutionDeviationViewSet

router = DefaultRouter()
router.register('execution-deviations', ExecutionDeviationViewSet, basename='execution-deviation')
urlpatterns = router.urls
