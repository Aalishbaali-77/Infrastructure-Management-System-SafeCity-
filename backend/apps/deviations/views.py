import uuid

from django.db import models
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import UserSiteAssignment

from .models import ExecutionDeviation
from .permissions import DeviationPermission
from .serializers import ExecutionDeviationReadSerializer, ExecutionDeviationWriteSerializer

# edge -> roles allowed to perform it (SYSTEM_ADMIN bypasses via DeviationPermission/superuser already)
TRANSITION_RULES = {
    ('DRAFT', 'SUBMITTED'): {'SITE_ENG', 'CONTRACTOR', 'HOD', 'QA'},
    ('SUBMITTED', 'HOD_REVIEW'): {'HOD'},
    ('HOD_REVIEW', 'DIR_REVIEW'): {'HOD'},
    ('HOD_REVIEW', 'APPROVED'): {'HOD'},
    ('HOD_REVIEW', 'REJECTED'): {'HOD'},
    ('HOD_REVIEW', 'CONDITIONAL'): {'HOD'},
    ('DIR_REVIEW', 'APPROVED'): {'DIR'},
    ('DIR_REVIEW', 'REJECTED'): {'DIR'},
    ('DIR_REVIEW', 'CONDITIONAL'): {'DIR'},
}
CLOSE_ROLES = {'HOD', 'DIR'}


class ExecutionDeviationViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    permission_classes = [IsAuthenticated, DeviationPermission]
    module_key = 'deviations'

    def get_queryset(self):
        qs = ExecutionDeviation.objects.select_related(
            'site', 'site_task', 'site_task__boq_item', 'raised_by', 'approved_by'
        ).order_by('-created_at')

        user = self.request.user
        if not user.is_superuser and user.role != 'SYSTEM_ADMIN':
            assigned_site_ids = list(
                UserSiteAssignment.objects.filter(user=user).values_list('site_id', flat=True)
            )
            if assigned_site_ids:
                qs = qs.filter(site_id__in=assigned_site_ids)

        for param in ('status', 'severity', 'source'):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})

        project_id = self.request.query_params.get('project_id')
        if project_id:
            try:
                uuid.UUID(str(project_id))
            except (ValueError, TypeError, AttributeError):
                return qs.none()
            qs = qs.filter(site__project_id=project_id)

        site_id = self.request.query_params.get('site_id')
        if site_id:
            try:
                uuid.UUID(str(site_id))
            except (ValueError, TypeError, AttributeError):
                # Malformed UUID: no site can match, so return an empty page
                # rather than letting Django raise an untranslated 500.
                return qs.none()
            qs = qs.filter(site_id=site_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return ExecutionDeviationWriteSerializer
        return ExecutionDeviationReadSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superuser and user.role != 'SYSTEM_ADMIN':
            assigned_site_ids = list(
                UserSiteAssignment.objects.filter(user=user).values_list('site_id', flat=True)
            )
            if assigned_site_ids and serializer.validated_data['site'].id not in assigned_site_ids:
                raise PermissionDenied('You are not assigned to this site.')
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        is_admin = user.is_superuser or user.role == 'SYSTEM_ADMIN'
        if instance.status != 'DRAFT':
            raise PermissionDenied('Only draft deviations can be deleted.')
        if not is_admin and instance.raised_by_id != user.id:
            raise PermissionDenied('You can only delete deviations you raised.')
        instance.delete()

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        deviation = self.get_object()
        target_status = request.data.get('status')
        valid_targets = dict(ExecutionDeviation.STATUS_CHOICES).keys()
        # isinstance guard: a list/dict body value would raise TypeError
        # ("unhashable type") on the membership test before the 400 could fire.
        if not isinstance(target_status, str) or target_status not in valid_targets:
            return Response(
                {'detail': f'Unknown status "{target_status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_status = deviation.status
        user_role = request.user.role

        is_admin = request.user.is_superuser or user_role == 'SYSTEM_ADMIN'

        if target_status == 'CLOSED':
            allowed = is_admin or user_role in CLOSE_ROLES
        else:
            edge = (current_status, target_status)
            allowed_roles = TRANSITION_RULES.get(edge)
            if allowed_roles is None:
                return Response(
                    {'detail': f'Cannot move from {current_status} to {target_status}.'},
                    status=status.HTTP_409_CONFLICT,
                )
            allowed = is_admin or user_role in allowed_roles

        if not allowed:
            return Response(
                {'detail': f'Role {user_role} cannot move a deviation from {current_status} to {target_status}.'},
                status=status.HTTP_409_CONFLICT,
            )

        deviation.status = target_status
        update_fields = ['status', 'updated_at']
        if target_status == 'APPROVED':
            deviation.approved_by = request.user
            deviation.approved_at = timezone.now()
            update_fields += ['approved_by', 'approved_at']
        deviation.save(update_fields=update_fields)

        return Response(ExecutionDeviationReadSerializer(deviation).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.filter_queryset(self.get_queryset())
        grouped = qs.order_by()  # clear the model's default ordering so it doesn't leak into GROUP BY
        return Response({
            'total': qs.count(),
            'by_severity': dict(grouped.values_list('severity').annotate(c=models.Count('id'))),
            'by_status': dict(grouped.values_list('status').annotate(c=models.Count('id'))),
            'by_source': dict(grouped.values_list('source').annotate(c=models.Count('id'))),
        })