from rest_framework import serializers

from apps.provinces.models import Province
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source='province', queryset=Province.objects.all()
    )
    province = serializers.CharField(source='province.name', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'province', 'province_id', 'program_code',
            'start_date', 'end_date', 'budget', 'status',
            'created_at', 'updated_at',
        ]