from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Project
from .serializers import ProjectSerializer
from apps.core.permissions import HasModulePermission

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = "projects"

    def get_queryset(self):
        qs = super().get_queryset()
        province_id = self.request.query_params.get('province_id')
        status_param = self.request.query_params.get('status')
        if province_id:
            qs = qs.filter(province_id=province_id)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs