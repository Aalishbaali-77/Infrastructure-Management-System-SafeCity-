from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Module, Permission, RolePermission
from .serializers import PermissionMatrixSerializer



@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"})

def _build_matrix():
    modules = Module.objects.prefetch_related('permissions').order_by('key')
    role_permissions = RolePermission.objects.select_related('permission').all()

    # role -> set of permission codes that role currently has
    role_codes = {}
    for rp in role_permissions:
        role_codes.setdefault(rp.role, set()).add(rp.permission.code)

    matrix = []
    for module in modules:
        allowed_roles = []
        crud = {}
        for role, codes in role_codes.items():
            view_code = f"{module.key}.view"
            if view_code in codes:
                allowed_roles.append(role)
                actions = [
                    action for action in ('create', 'update', 'delete')
                    if f"{module.key}.{action}" in codes
                ]
                if actions:
                    crud[role] = actions

        matrix.append({
            'key': f"/{module.key}",
            'label': module.label,
            'allowedRoles': sorted(allowed_roles),
            'crud': crud,
        })
    return matrix


class PermissionMatrixView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = PermissionMatrixSerializer(_build_matrix(), many=True).data
        return Response({'data': data})


class PermissionRoleToggleView(APIView):
    """PATCH /permissions/{moduleKey}/role/{roleName} — toggle View access."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, module_key, role_name):
        if request.user.role != 'SYSTEM_ADMIN':
            return Response(
                {'detail': 'Only SYSTEM_ADMIN can modify permissions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        module = Module.objects.filter(key=module_key).first()
        if module is None:
            raise ValidationError({'detail': f"Unknown module '{module_key}'."})

        view_permission = Permission.objects.filter(
            module=module, action='view'
        ).first()
        if view_permission is None:
            raise ValidationError(
                {'detail': f"No 'view' permission configured for '{module_key}'."}
            )

        existing = RolePermission.objects.filter(
            role=role_name, permission=view_permission
        ).first()

        if existing:
            existing.delete()
            # Losing view access means CRUD access is meaningless too —
            # clean up any create/update/delete grants for this role+module.
            RolePermission.objects.filter(
                role=role_name,
                permission__module=module,
            ).delete()
        else:
            RolePermission.objects.create(role=role_name, permission=view_permission)

        return Response({'data': _build_matrix()})


class PermissionRoleCrudToggleView(APIView):
    """PATCH /permissions/{moduleKey}/role/{roleName}/crud — toggle one CRUD action."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, module_key, role_name):
        if request.user.role != 'SYSTEM_ADMIN':
            return Response(
                {'detail': 'Only SYSTEM_ADMIN can modify permissions.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        action_name = request.data.get('action')
        if action_name not in ('create', 'update', 'delete'):
            raise ValidationError(
                {'detail': "'action' must be one of: create, update, delete."}
            )

        module = Module.objects.filter(key=module_key).first()
        if module is None:
            raise ValidationError({'detail': f"Unknown module '{module_key}'."})

        view_permission = Permission.objects.filter(
            module=module, action='view'
        ).first()
        has_view = RolePermission.objects.filter(
            role=role_name, permission=view_permission
        ).exists()
        if not has_view:
            raise ValidationError(
                {'detail': f"Role '{role_name}' must have View access before CRUD actions can be granted."}
            )

        target_permission = Permission.objects.filter(
            module=module, action=action_name
        ).first()
        if target_permission is None:
            raise ValidationError(
                {'detail': f"No '{action_name}' permission configured for '{module_key}'."}
            )

        existing = RolePermission.objects.filter(
            role=role_name, permission=target_permission
        ).first()

        if existing:
            existing.delete()
        else:
            RolePermission.objects.create(role=role_name, permission=target_permission)

        return Response({'data': _build_matrix()})