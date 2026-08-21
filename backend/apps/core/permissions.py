from rest_framework.permissions import BasePermission

from apps.accounts.models import UserProvinceAssignment
from apps.core.models import RolePermission

class HasModulePermission(BasePermission):
    """
    Usage: set `module_key = "boq"` on the viewset.
    Checks the live permissions matrix, mapping the current DRF action
    to view/create/update/delete automatically.
    """
    action_map = {
        'list': 'view',
        'retrieve': 'view',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
        # Custom @actions
        'items_bulk': 'update',
        'publish': 'update',
        'mark_ready': 'update',
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.role == 'SYSTEM_ADMIN':
            return True

        module_key = getattr(view, 'module_key', None)
        if module_key is None:
            return True  # viewset didn't declare a module — don't block

        if view.action == 'items':
            required_action = 'view' if request.method == 'GET' else 'create'
        else:
            required_action = self.action_map.get(view.action)
            if required_action is None:
                return False

        return RolePermission.objects.filter(
            role=request.user.role,
            permission__code=f"{module_key}.{required_action}",
        ).exists()


class HasPermission(BasePermission):
    """
    Usage: set `required_permission = "project.view"` on the view,
    or override `get_required_permission(request, view)` for dynamic checks.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_permission = getattr(view, 'required_permission', None)
        if required_permission is None:
            return True  # no permission declared, don't block

        return RolePermission.objects.filter(
            role=request.user.role,
            permission__code=required_permission,
        ).exists()
    

class ProvinceScopedQuerysetMixin:
    """
    Mixin for viewsets whose model has a `province` field (directly or via FK).
    Superusers and roles like director/admin/auditor see everything;
    everyone else is scoped to their assigned provinces.
    """
    province_field = 'province'
    unscoped_roles = {'DIR', 'SYSTEM_ADMIN', 'AUDITOR'}

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_superuser or user.role in self.unscoped_roles:
            return queryset

        assigned_province_ids = UserProvinceAssignment.objects.filter(
            user=user
        ).values_list('province_id', flat=True)

        filter_kwargs = {f'{self.province_field}__in': assigned_province_ids}
        return queryset.filter(**filter_kwargs)