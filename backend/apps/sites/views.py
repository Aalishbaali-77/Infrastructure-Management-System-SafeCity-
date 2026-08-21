from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import HasModulePermission
from .models import Site
from .serializers import SiteSerializer


class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.select_related(
        'project',
        'town',
        'town__district',
        'town__district__province',
    )
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'sites'

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ('project_id', 'town_id', 'status'):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        district_id = self.request.query_params.get('district_id')
        if district_id:
            qs = qs.filter(town__district_id=district_id)
        province_id = self.request.query_params.get('province_id')
        if province_id:
            qs = qs.filter(town__district__province_id=province_id)
        # Backward-compatible alias
        city_id = self.request.query_params.get('city_id')
        if city_id:
            qs = qs.filter(town_id=city_id)
        return qs
