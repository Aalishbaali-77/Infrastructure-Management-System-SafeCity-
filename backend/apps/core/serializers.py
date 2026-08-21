from rest_framework import serializers

from .models import Module, Permission, RolePermission


class PermissionMatrixSerializer(serializers.Serializer):
    """
    Read-only representation of one module's row in the permissions matrix.
    Not tied to a single model — built manually in the view from
    Module + Permission + RolePermission data.
    """
    key = serializers.CharField()
    label = serializers.CharField()
    allowedRoles = serializers.ListField(child=serializers.CharField())
    crud = serializers.DictField(child=serializers.ListField(child=serializers.CharField()))