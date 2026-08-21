from django.db.models import Count, Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import HasModulePermission
from .models import BOQ, BOQItem
from .serializers import (
    BOQItemSerializer,
    BOQItemWriteSerializer,
    BOQSerializer,
    BOQWriteSerializer,
)


class BOQViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'boq'

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return BOQWriteSerializer
        return BOQSerializer

    def get_queryset(self):
        qs = (
            BOQ.objects.select_related('project')
            .annotate(items_count_ann=Count('items'))
            .prefetch_related(
                Prefetch('items', queryset=BOQItem.objects.order_by('no', 'item'))
            )
            .order_by('-updated_at')
        )
        for param in ['project_id', 'status']:
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        return qs

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        boq = self.get_object()
        if request.method == 'GET':
            serializer = BOQItemSerializer(boq.items.all().order_by('no', 'item'), many=True)
            return Response({'data': serializer.data})

        if boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Cannot add items to a published BOQ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BOQItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(boq=boq)
        if boq.status == 'DRAFT':
            boq.status = 'READY'
            boq.save(update_fields=['status', 'updated_at'])
        return Response(
            BOQItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='items/bulk')
    def items_bulk(self, request, pk=None):
        """Replace all items on a non-published BOQ."""
        boq = self.get_object()
        if boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Cannot modify items on a published BOQ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payload = request.data
        if not isinstance(payload, list):
            return Response(
                {'detail': 'Expected a JSON array of BOQ items.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BOQItemWriteSerializer(data=payload, many=True)
        serializer.is_valid(raise_exception=True)
        boq.items.all().delete()
        items = []
        for row in serializer.validated_data:
            data = {k: v for k, v in row.items() if k != 'boq'}
            items.append(BOQItem(boq=boq, **data))
        BOQItem.objects.bulk_create(items)
        if items and boq.status in ('DRAFT', 'UPLOADING', 'PARSING'):
            boq.status = 'READY'
            boq.save(update_fields=['status', 'updated_at'])
        return Response(
            {'data': BOQItemSerializer(boq.items.all().order_by('no', 'item'), many=True).data},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        if request.user.role not in ('HOD', 'DIR', 'SYSTEM_ADMIN'):
            return Response(
                {'detail': 'Only HOD, DIR, or SYSTEM_ADMIN can publish a BOQ.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        boq = self.get_object()
        if boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'BOQ is already published.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not boq.items.exists():
            return Response(
                {'detail': 'Cannot publish a BOQ with no items.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        boq.status = 'PUBLISHED'
        boq.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(boq).data)

    @action(detail=True, methods=['post'], url_path='mark-ready')
    def mark_ready(self, request, pk=None):
        boq = self.get_object()
        if boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Published BOQ cannot change status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not boq.items.exists():
            return Response(
                {'detail': 'Add at least one item before marking ready.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        boq.status = 'READY'
        boq.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(boq).data)


class BOQItemViewSet(viewsets.ModelViewSet):
    """Standalone item CRUD: /api/v1/boq-items/"""

    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'boq'
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = BOQItem.objects.select_related('boq', 'boq__project').order_by(
            'boq_id', 'no', 'item'
        )
        boq_id = self.request.query_params.get('boq_id')
        if boq_id:
            qs = qs.filter(boq_id=boq_id)
        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return BOQItemWriteSerializer
        return BOQItemSerializer

    def perform_create(self, serializer):
        boq = serializer.validated_data['boq']
        if boq.status == 'PUBLISHED':
            raise PermissionError('Cannot add items to a published BOQ.')
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        boq = serializer.validated_data['boq']
        if boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Cannot add items to a published BOQ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        return Response(
            BOQItemSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Cannot edit items on a published BOQ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.boq.status == 'PUBLISHED':
            return Response(
                {'detail': 'Cannot delete items on a published BOQ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
