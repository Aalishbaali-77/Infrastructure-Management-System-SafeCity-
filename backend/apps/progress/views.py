from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import HasModulePermission
from .models import DailyProgressEntry, ProgressTaskTemplate, SiteProgressTask
from .serializers import (
    DailyProgressEntrySerializer,
    ProgressTaskTemplateSerializer,
    SiteProgressTaskSerializer,
)


class ProgressTaskTemplateViewSet(viewsets.ModelViewSet):
    """Admin catalog of reusable progress task / KPI types."""

    queryset = ProgressTaskTemplate.objects.all()
    serializer_class = ProgressTaskTemplateSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'daily-progress'

    def get_queryset(self):
        qs = super().get_queryset()
        active = self.request.query_params.get('is_active')
        if active in ('true', '1'):
            qs = qs.filter(is_active=True)
        elif active in ('false', '0'):
            qs = qs.filter(is_active=False)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class SiteProgressTaskViewSet(viewsets.ModelViewSet):
    """Per-site tasks configured by admin (key/value KPIs), linked to BOQ lines."""

    queryset = SiteProgressTask.objects.select_related(
        'site',
        'site__project',
        'template',
        'boq',
        'boq_item',
    ).prefetch_related('entries')
    serializer_class = SiteProgressTaskSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'daily-progress'

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ('site_id', 'boq_id', 'boq_item_id', 'project_id'):
            value = self.request.query_params.get(param)
            if value:
                if param == 'project_id':
                    qs = qs.filter(site__project_id=value)
                else:
                    qs = qs.filter(**{param: value})
        active = self.request.query_params.get('is_active')
        if active in ('true', '1'):
            qs = qs.filter(is_active=True)
        elif active in ('false', '0'):
            qs = qs.filter(is_active=False)
        return qs


class DailyProgressEntryViewSet(viewsets.ModelViewSet):
    queryset = DailyProgressEntry.objects.select_related(
        'site',
        'site__project',
        'site_task',
        'site_task__boq',
        'site_task__boq_item',
        'submitted_by',
    )
    serializer_class = DailyProgressEntrySerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'daily-progress'

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ('site_id', 'site_task_id', 'date'):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        boq_id = self.request.query_params.get('boq_id')
        if boq_id:
            qs = qs.filter(site_task__boq_id=boq_id)
        boq_item_id = self.request.query_params.get('boq_item_id')
        if boq_item_id:
            qs = qs.filter(site_task__boq_item_id=boq_item_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        entry = serializer.save(submitted_by=self.request.user)
        entry.site_task.sync_boq_actual()

    def perform_update(self, serializer):
        entry = serializer.save()
        entry.site_task.sync_boq_actual()

    def perform_destroy(self, instance):
        site_task = instance.site_task
        instance.delete()
        site_task.sync_boq_actual()
