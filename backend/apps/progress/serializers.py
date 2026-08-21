from rest_framework import serializers
from rest_framework.fields import empty

from apps.boq.models import BOQ, BOQItem
from apps.sites.models import Site
from .models import DailyProgressEntry, ProgressTaskTemplate, SiteProgressTask


class ProgressTaskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressTaskTemplate
        fields = [
            'id',
            'key',
            'name',
            'category',
            'unit',
            'description',
            'kpi_schema',
            'is_active',
            'created_at',
            'updated_at',
        ]


class SiteProgressTaskSerializer(serializers.ModelSerializer):
    site_id = serializers.PrimaryKeyRelatedField(source='site', queryset=Site.objects.all())
    site_name = serializers.CharField(source='site.name', read_only=True)
    project_id = serializers.UUIDField(source='site.project_id', read_only=True)
    project_name = serializers.CharField(source='site.project.name', read_only=True)
    template_id = serializers.PrimaryKeyRelatedField(
        source='template',
        queryset=ProgressTaskTemplate.objects.all(),
        required=False,
        allow_null=True,
    )
    boq_id = serializers.PrimaryKeyRelatedField(
        source='boq',
        queryset=BOQ.objects.all(),
        required=False,
        allow_null=True,
    )
    boq_item_id = serializers.PrimaryKeyRelatedField(
        source='boq_item',
        queryset=BOQItem.objects.all(),
        required=False,
        allow_null=True,
    )
    boq_item_code = serializers.CharField(source='boq_item.item', read_only=True, default=None)
    boq_item_description = serializers.CharField(
        source='boq_item.item_description', read_only=True, default=None
    )
    boq_planned_qty = serializers.DecimalField(
        source='boq_item.qty',
        max_digits=14,
        decimal_places=2,
        read_only=True,
        default=None,
    )
    cumulative_quantity = serializers.SerializerMethodField()

    class Meta:
        model = SiteProgressTask
        fields = [
            'id',
            'site_id',
            'site_name',
            'project_id',
            'project_name',
            'template_id',
            'boq_id',
            'boq_item_id',
            'boq_item_code',
            'boq_item_description',
            'boq_planned_qty',
            'key',
            'name',
            'category',
            'unit',
            'planned_quantity',
            'sort_order',
            'is_active',
            'kpi_schema',
            'attributes',
            'cumulative_quantity',
            'created_at',
            'updated_at',
        ]

    def get_cumulative_quantity(self, obj):
        return sum((e.quantity for e in obj.entries.all()), 0)

    def validate(self, attrs):
        site = attrs.get('site') or getattr(self.instance, 'site', None)
        boq = attrs.get('boq', empty)
        if boq is empty:
            boq = getattr(self.instance, 'boq', None)
        boq_item = attrs.get('boq_item', empty)
        if boq_item is empty:
            boq_item = getattr(self.instance, 'boq_item', None)

        if boq and site and boq.project_id != site.project_id:
            raise serializers.ValidationError(
                {'boq_id': 'BOQ does not belong to the same project as the selected site.'}
            )
        if boq_item and boq and boq_item.boq_id != boq.id:
            raise serializers.ValidationError(
                {'boq_item_id': 'BOQ item does not belong to the selected BOQ.'}
            )
        if boq_item and site and boq_item.boq.project_id != site.project_id:
            raise serializers.ValidationError(
                {'boq_item_id': 'BOQ item does not belong to the same project as the selected site.'}
            )
        # Auto-fill boq from item
        if boq_item and not boq:
            attrs['boq'] = boq_item.boq
        return attrs

    def create(self, validated_data):
        template = validated_data.get('template')
        if template:
            validated_data.setdefault('key', template.key)
            validated_data.setdefault('name', template.name)
            validated_data.setdefault('category', template.category)
            validated_data.setdefault('unit', template.unit)
            if not validated_data.get('kpi_schema'):
                validated_data['kpi_schema'] = template.kpi_schema or []
        boq_item = validated_data.get('boq_item')
        if boq_item and not validated_data.get('planned_quantity'):
            validated_data['planned_quantity'] = boq_item.qty
            if not validated_data.get('unit'):
                validated_data['unit'] = boq_item.unit
        return super().create(validated_data)

    def update(self, instance, validated_data):
        boq_item = validated_data.get('boq_item', instance.boq_item)
        if (
            boq_item
            and 'planned_quantity' not in validated_data
            and validated_data.get('boq_item') is not None
        ):
            validated_data['planned_quantity'] = boq_item.qty
        return super().update(instance, validated_data)


class DailyProgressEntrySerializer(serializers.ModelSerializer):
    site_id = serializers.PrimaryKeyRelatedField(source='site', queryset=Site.objects.all())
    site_name = serializers.CharField(source='site.name', read_only=True)
    project_id = serializers.UUIDField(source='site.project_id', read_only=True)
    project_name = serializers.CharField(source='site.project.name', read_only=True)
    site_task_id = serializers.PrimaryKeyRelatedField(
        source='site_task', queryset=SiteProgressTask.objects.all()
    )
    task_key = serializers.CharField(source='site_task.key', read_only=True)
    task_name = serializers.CharField(source='site_task.name', read_only=True)
    task_unit = serializers.CharField(source='site_task.unit', read_only=True)
    planned_quantity = serializers.DecimalField(
        source='site_task.planned_quantity',
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    boq_id = serializers.UUIDField(source='site_task.boq_id', read_only=True, default=None)
    boq_item_id = serializers.UUIDField(
        source='site_task.boq_item_id', read_only=True, default=None
    )
    boq_item_code = serializers.CharField(
        source='site_task.boq_item.item', read_only=True, default=None
    )
    submitted_by_id = serializers.UUIDField(read_only=True)
    submitted_by_name = serializers.SerializerMethodField()
    cumulative_quantity = serializers.SerializerMethodField()

    class Meta:
        model = DailyProgressEntry
        fields = [
            'id',
            'site_id',
            'site_name',
            'project_id',
            'project_name',
            'site_task_id',
            'task_key',
            'task_name',
            'task_unit',
            'planned_quantity',
            'boq_id',
            'boq_item_id',
            'boq_item_code',
            'date',
            'quantity',
            'kpi_values',
            'remarks',
            'submitted_by_id',
            'submitted_by_name',
            'cumulative_quantity',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'submitted_by_id',
            'submitted_by_name',
            'cumulative_quantity',
            'task_key',
            'task_name',
            'task_unit',
            'planned_quantity',
            'site_name',
            'project_id',
            'project_name',
            'boq_id',
            'boq_item_id',
            'boq_item_code',
        ]

    def get_submitted_by_name(self, obj):
        user = obj.submitted_by
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or getattr(user, 'email', str(user.pk))

    def get_cumulative_quantity(self, obj):
        qs = DailyProgressEntry.objects.filter(
            site_task=obj.site_task,
            date__lte=obj.date,
        )
        return sum((e.quantity for e in qs), 0)

    def validate(self, attrs):
        site = attrs.get('site') or getattr(self.instance, 'site', None)
        site_task = attrs.get('site_task') or getattr(self.instance, 'site_task', None)
        if site and site_task and site_task.site_id != site.id:
            raise serializers.ValidationError(
                {'site_task_id': 'Selected task does not belong to the selected site.'}
            )
        if site_task and not site_task.is_active:
            raise serializers.ValidationError(
                {'site_task_id': 'Cannot log progress against an inactive task.'}
            )
        return attrs