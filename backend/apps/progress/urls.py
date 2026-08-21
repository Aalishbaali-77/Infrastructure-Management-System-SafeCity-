from rest_framework.routers import DefaultRouter

from .views import (
    DailyProgressEntryViewSet,
    ProgressTaskTemplateViewSet,
    SiteProgressTaskViewSet,
)

router = DefaultRouter()
router.register(
    'progress-task-templates',
    ProgressTaskTemplateViewSet,
    basename='progress-task-template',
)
router.register(
    'site-progress-tasks',
    SiteProgressTaskViewSet,
    basename='site-progress-task',
)
router.register('daily-progress', DailyProgressEntryViewSet, basename='daily-progress')
urlpatterns = router.urls
