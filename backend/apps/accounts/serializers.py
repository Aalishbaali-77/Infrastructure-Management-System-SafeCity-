from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from apps.projects.models import Project
from apps.provinces.models import Province
from .models import Role, User, UserProjectAssignment, UserProvinceAssignment, UserSiteAssignment
import re


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'label', 'is_system', 'is_active']
        read_only_fields = ['id', 'is_system']

    def validate_name(self, value):
        value = value.upper()
        if not re.match(r'^[A-Z0-9_]+$', value):
            raise serializers.ValidationError(
                'Role name must be uppercase letters, numbers, and underscores only.'
            )
        if self.instance is None and Role.objects.filter(name=value).exists():
            raise serializers.ValidationError('A role with this name already exists.')
        return value

class UserSerializer(serializers.ModelSerializer):
    """Read serializer — used for login/me responses and the admin user list."""
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    province_ids = serializers.SerializerMethodField()
    site_ids = serializers.SerializerMethodField()
    project_ids = serializers.SerializerMethodField()
    contractor_id = serializers.SerializerMethodField()

    created_at = serializers.DateTimeField(source='date_joined', read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'is_active', 'role',
            'province_ids', 'site_ids', 'project_ids', 'contractor_id',
            'created_at',
        ]
        read_only_fields = fields

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_role(self, obj):
        return obj.role

    def get_province_ids(self, obj):
        return list(obj.province_assignments.values_list('province_id', flat=True))

    def get_site_ids(self, obj):
        return list(obj.site_assignments.values_list('site_id', flat=True))

    def get_project_ids(self, obj):
        return list(obj.project_assignments.values_list('project_id', flat=True))

    def get_contractor_id(self, obj):
        # No Contractor model exists yet — always null until that module is built.
        return None


class UserWriteSerializer(serializers.ModelSerializer):
    """Create/update serializer for the System Admin Users module."""
    name = serializers.CharField(write_only=True, required=True)
    province_ids = serializers.PrimaryKeyRelatedField(
        source='provinces', queryset=Province.objects.all(),
        many=True, required=False, write_only=True,
    )
    project_ids = serializers.PrimaryKeyRelatedField(
        source='projects', queryset=Project.objects.all(),
        many=True, required=False, write_only=True,
    )
    site_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'role', 'is_active',
            'province_ids', 'site_ids', 'project_ids',
        ]

    def validate_role(self, value):
        if not Role.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"'{value}' is not a valid role.")
        return value

    def _split_name(self, name):
        parts = name.strip().split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''
        return first_name, last_name

    def _sync_assignments(self, user, provinces, projects, site_ids):
        if provinces is not None:
            UserProvinceAssignment.objects.filter(user=user).exclude(
                province__in=provinces
            ).delete()
            for province in provinces:
                UserProvinceAssignment.objects.get_or_create(user=user, province=province)

        if projects is not None:
            UserProjectAssignment.objects.filter(user=user).exclude(
                project__in=projects
            ).delete()
            for project in projects:
                UserProjectAssignment.objects.get_or_create(user=user, project=project)

        if site_ids is not None:
            UserSiteAssignment.objects.filter(user=user).exclude(
                site_id__in=site_ids
            ).delete()
            for site_id in site_ids:
                UserSiteAssignment.objects.get_or_create(user=user, site_id=site_id)

    def create(self, validated_data):
        name = validated_data.pop('name')
        provinces = validated_data.pop('provinces', None)
        projects = validated_data.pop('projects', None)
        site_ids = validated_data.pop('site_ids', None)
        first_name, last_name = self._split_name(name)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=settings.DEFAULT_USER_PASSWORD,
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', 'SITE_ENG'),
            is_active=validated_data.get('is_active', True),
        )
        self._sync_assignments(user, provinces, projects, site_ids)
        return user

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        provinces = validated_data.pop('provinces', None)
        projects = validated_data.pop('projects', None)
        site_ids = validated_data.pop('site_ids', None)

        if name:
            instance.first_name, instance.last_name = self._split_name(name)

        for field in ('email', 'phone', 'role', 'is_active'):
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        self._sync_assignments(instance, provinces, projects, site_ids)
        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            username=attrs['email'],
            password=attrs['password'],
        )
        if not user:
            raise AuthenticationFailed({'detail': 'Invalid email or password.'})
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'This account is inactive.'})

        if user.role != 'SYSTEM_ADMIN':
            role = Role.objects.filter(name=user.role).first()
            if role is not None and not role.is_active:
                raise serializers.ValidationError(
                    {'detail': 'This role has been deactivated. Contact your administrator.'}
                )

        attrs['user'] = user
        return attrs

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)