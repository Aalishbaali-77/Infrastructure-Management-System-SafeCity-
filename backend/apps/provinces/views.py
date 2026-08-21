from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import HasPermission

from .models import District, Province, Town
from .serializers import DistrictSerializer, ProvinceSerializer, TownSerializer


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'provinces.view'


class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.select_related('province')
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'provinces.view'

    def get_queryset(self):
        qs = super().get_queryset()
        province_id = self.request.query_params.get('province_id')
        if province_id:
            qs = qs.filter(province_id=province_id)
        return qs


class TownViewSet(viewsets.ModelViewSet):
    queryset = Town.objects.select_related('district', 'district__province')
    serializer_class = TownSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'provinces.view'

    def get_queryset(self):
        qs = super().get_queryset()
        district_id = self.request.query_params.get('district_id')
        province_id = self.request.query_params.get('province_id')
        if district_id:
            qs = qs.filter(district_id=district_id)
        if province_id:
            qs = qs.filter(district__province_id=province_id)
        return qs
