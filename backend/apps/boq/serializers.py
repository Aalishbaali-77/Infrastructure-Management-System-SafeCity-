from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from apps.projects.models import Project
from .models import BOQ, BOQItem


class BOQItemSerializer(serializers.ModelSerializer):
    boq_id = serializers.UUIDField(read_only=True)
    fob_total = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    price_with_landing = serializers.DecimalField(
        max_digits=14, decimal_places=4, read_only=True
    )
    price_with_insurance = serializers.DecimalField(
        max_digits=14, decimal_places=4, read_only=True
    )
    total_ddp_usd = serializers.DecimalField(
        max_digits=18, decimal_places=4, read_only=True
    )
    total_ddp_pkr = serializers.DecimalField(
        max_digits=18, decimal_places=2, read_only=True
    )
    item_code = serializers.CharField(source='item', read_only=True)
    description = serializers.CharField(source='item_description', read_only=True)
    planned_quantity = serializers.DecimalField(
        source='qty', max_digits=14, decimal_places=2, read_only=True
    )
    amount = serializers.DecimalField(
        source='total_ddp_pkr', max_digits=18, decimal_places=2, read_only=True
    )

    class Meta:
        model = BOQItem
        
        fields = [
            'id',
            'boq_id',
            'pc1',
            'no',
            'item_type',
            'item',
            'item_code',
            'item_description',
            'description',
            'model_name',
            'model',
            'oem',
            'unit',
            'package_qty',
            'qty',
            'planned_quantity',
            'actual_quantity',
            'fob',
            'fob_total',
            'hs_code_description',
            'hs_code',
            'curr',
            'tax',
            'curr_rate',
            'bank_charges_pct',
            'freight_pct',
            'landing_pct',
            'insurance_pct',
            'cd_pct',
            'acd_pct',
            'rd_pct',
            'st_pct',
            'ast_pct',
            'it_pct',
            'cess_pct',
            'bank_charges',
            'freight_insurance',
            'price_with_fi',
            'landing',
            'price_with_landing',
            'insurance',
            'price_with_insurance',
            'custom_duty',
            'addl_custom_duty',
            'regulatory_duty',
            'sales_tax',
            'addl_sales_tax',
            'income_tax',
            'cess_tax',
            'ddp_unit_usd',
            'total_ddp_usd',
            'ddp_unit_pkr',
            'total_ddp_pkr',
            'amount',
            'quantity_tolerance_pct',
            'created_at',
            'updated_at',
        ]


class BOQItemWriteSerializer(serializers.ModelSerializer):
    boq_id = serializers.PrimaryKeyRelatedField(
        source='boq', queryset=BOQ.objects.all(), required=False
    )

    class Meta:
        model = BOQItem
        validators = []
        fields = [
            'boq_id',
            'pc1',
            'no',
            'item_type',
            'item',
            'item_description',
            'model_name',
            'model',
            'oem',
            'unit',
            'package_qty',
            'qty',
            'actual_quantity',
            'fob',
            'hs_code_description',
            'hs_code',
            'curr',
            'tax',
            'curr_rate',
            'bank_charges_pct',
            'freight_pct',
            'landing_pct',
            'insurance_pct',
            'cd_pct',
            'acd_pct',
            'rd_pct',
            'st_pct',
            'ast_pct',
            'it_pct',
            'cess_pct',
            'bank_charges',
            'freight_insurance',
            'price_with_fi',
            'landing',
            'insurance',
            'custom_duty',
            'addl_custom_duty',
            'regulatory_duty',
            'sales_tax',
            'addl_sales_tax',
            'income_tax',
            'cess_tax',
            'ddp_unit_usd',
            'ddp_unit_pkr',
            'quantity_tolerance_pct',
        ]

    def to_internal_value(self, data):
        """
        Excel-derived decimal values (currency conversions, percentage math)
        often carry more decimal places than the model allows, since Excel
        keeps full float precision. Round every incoming decimal field down
        to whatever precision its model field actually defines, BEFORE DRF's
        own decimal-place validation runs on it. This must happen here
        (not in validate()) because DRF checks decimal precision while
        parsing each field, ahead of object-level validation.
        """
        if hasattr(data, '_mutable'):
            data = data.copy()
        else:
            data = dict(data)

        model_fields = {f.name: f for f in BOQItem._meta.get_fields()}

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
            data[field_name] = str(
                value.quantize(quantize_exp, rounding=ROUND_HALF_UP)
            )

        return super().to_internal_value(data)


class BOQSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    total_amount = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = BOQ
        fields = [
            'id', 'project_id', 'project_name',
            'version', 'status', 'template', 'total_amount', 'items_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_total_amount(self, obj):
        return sum((item.total_ddp_pkr for item in obj.items.all()), 0)

    def get_items_count(self, obj):
        if hasattr(obj, 'items_count_ann'):
            return obj.items_count_ann
        return obj.items.count()


class BOQWriteSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )

    class Meta:
        model = BOQ
        fields = ['project_id', 'version', 'template']

    def create(self, validated_data):
        return BOQ.objects.create(status='DRAFT', **validated_data)

    def to_representation(self, instance):
        instance = (
            BOQ.objects.select_related('project')
            .prefetch_related('items')
            .get(pk=instance.pk)
        )
        return BOQSerializer(instance, context=self.context).data