from rest_framework import serializers

from apps.projects.models import Project
from apps.provinces.models import Town
from .models import Site


class SiteSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )
    town_id = serializers.PrimaryKeyRelatedField(
        source='town', queryset=Town.objects.all()
    )
    town_name = serializers.CharField(source='town.name', read_only=True)
    district_id = serializers.UUIDField(source='town.district_id', read_only=True)
    district_name = serializers.CharField(source='town.district.name', read_only=True)
    province_id = serializers.UUIDField(
        source='town.district.province_id', read_only=True
    )
    province_name = serializers.CharField(
        source='town.district.province.name', read_only=True
    )

    class Meta:
        model = Site
        fields = [
            'id',
            'project_id',
            'town_id',
            'town_name',
            'district_id',
            'district_name',
            'province_id',
            'province_name',
            'name',
            'location',
            'latitude',
            'longitude',
            'geofence_radius_m',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        town = attrs.get('town') or getattr(self.instance, 'town', None)
        if project and town and town.district.province_id != project.province_id:
            raise serializers.ValidationError(
                {'town_id': 'Town must belong to the same province as the project.'}
            )
        return attrs
