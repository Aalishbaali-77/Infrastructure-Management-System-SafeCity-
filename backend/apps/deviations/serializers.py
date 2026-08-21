from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from apps.progress.models import SiteProgressTask
from apps.sites.models import Site
from .models import ExecutionDeviation


class ExecutionDeviationReadSerializer(serializers.ModelSerializer):
    site_id = serializers.UUIDField(read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    site_task_id = serializers.UUIDField(read_only=True, default=None)
    site_task_name = serializers.CharField(source='site_task.name', read_only=True, default=None)
    boq_item_id = serializers.UUIDField(source='site_task.boq_item_id', read_only=True, default=None)
    boq_item_name = serializers.CharField(source='site_task.boq_item.item', read_only=True, default=None)
    raised_by_id = serializers.UUIDField(source='raised_by.id', read_only=True, default=None)
    raised_by_name = serializers.SerializerMethodField()
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, default=None)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ExecutionDeviation
        fields = [
            'id',
            'ncr_number',
            'site_id',
            'site_name',
            'site_task_id',
            'site_task_name',
            'boq_item_id',
            'boq_item_name',
            'source',
            'deviation_type',
            'severity',
            'status',
            'planned_quantity',
            'actual_quantity',
            'variance_quantity',
            'variance_pct',
            'description',
            'remarks',
            'evidence_document_ids',
            'linked_progress_ids',
            'blocks_fac',
            'raised_by_id',
            'raised_by_name',
            'approved_by_id',
            'approved_by_name',
            'approved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_raised_by_name(self, obj):
        user = obj.raised_by
        if not user:
            return None
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or user.email

    def get_approved_by_name(self, obj):
        user = obj.approved_by
        if not user:
            return None
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or user.email


class ExecutionDeviationWriteSerializer(serializers.ModelSerializer):
    site_id = serializers.PrimaryKeyRelatedField(source='site', queryset=Site.objects.all())
    site_task_id = serializers.PrimaryKeyRelatedField(
        source='site_task',
        queryset=SiteProgressTask.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ExecutionDeviation
        fields = [
            'site_id',
            'site_task_id',
            'deviation_type',
            'severity',
            'planned_quantity',
            'actual_quantity',
            'variance_quantity',
            'variance_pct',
            'description',
            'remarks',
            'evidence_document_ids',
            'blocks_fac',
        ]

    def validate_deviation_type(self, value):
        if value in ('QTY_OVERRUN', 'QTY_UNDERRUN'):
            raise serializers.ValidationError(
                'QTY_OVERRUN and QTY_UNDERRUN are auto-detected only and cannot be raised manually.'
            )
        return value

    def validate(self, attrs):
        site = attrs.get('site') or getattr(self.instance, 'site', None)
        site_task = attrs.get('site_task') or getattr(self.instance, 'site_task', None)
        if site and site_task and site_task.site_id != site.id:
            raise serializers.ValidationError(
                {'site_task_id': 'Selected task does not belong to the selected site.'}
            )
        return attrs

    def to_internal_value(self, data):
        """
        Round incoming decimal fields to the model field's own decimal_places
        before DRF's precision validation runs, matching
        BOQItemWriteSerializer.to_internal_value (apps/boq/serializers.py).
        """
        if hasattr(data, '_mutable'):
            data = data.copy()
        else:
            data = dict(data)

        model_fields = {f.name: f for f in ExecutionDeviation._meta.get_fields()}
        for field_name, model_field in model_fields.items():
            if field_name not in data:
                continue
            raw_value = data[field_name]
            if raw_value is None or raw_value == '':
                continue
            decimal_places = getattr(model_field, 'decimal_places', None)
            if decimal_places is None:
                continue
            try:
                value = Decimal(str(raw_value))
            except Exception:
                continue
            quantize_exp = Decimal('1').scaleb(-decimal_places)
            data[field_name] = str(value.quantize(quantize_exp, rounding=ROUND_HALF_UP))

        return super().to_internal_value(data)

    def create(self, validated_data):
        request = self.context['request']
        return ExecutionDeviation.objects.create(
            source='MANUAL',
            status='DRAFT',
            raised_by=request.user,
            **validated_data,
        )

    def to_representation(self, instance):
        return ExecutionDeviationReadSerializer(instance, context=self.context).data
