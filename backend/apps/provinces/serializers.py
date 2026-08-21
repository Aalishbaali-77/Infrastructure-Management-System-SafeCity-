from rest_framework import serializers

from .models import District, Province, Town


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ['id', 'name', 'code', 'created_at', 'updated_at']


class DistrictSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source='province', queryset=Province.objects.all()
    )
    province_name = serializers.CharField(source='province.name', read_only=True)

    class Meta:
        model = District
        fields = [
            'id',
            'name',
            'code',
            'province_id',
            'province_name',
            'created_at',
            'updated_at',
        ]


class TownSerializer(serializers.ModelSerializer):
    district_id = serializers.PrimaryKeyRelatedField(
        source='district', queryset=District.objects.all()
    )
    district_name = serializers.CharField(source='district.name', read_only=True)
    province_id = serializers.UUIDField(source='district.province_id', read_only=True)
    province_name = serializers.CharField(source='district.province.name', read_only=True)

    class Meta:
        model = Town
        fields = [
            'id',
            'name',
            'code',
            'district_id',
            'district_name',
            'province_id',
            'province_name',
            'created_at',
            'updated_at',
        ]
