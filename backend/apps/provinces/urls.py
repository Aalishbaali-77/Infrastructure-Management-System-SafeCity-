from rest_framework.routers import DefaultRouter

from .views import DistrictViewSet, ProvinceViewSet, TownViewSet

router = DefaultRouter()
router.register('provinces', ProvinceViewSet)
router.register('districts', DistrictViewSet)
router.register('towns', TownViewSet)

urlpatterns = router.urls
