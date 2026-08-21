from django.urls import path

from .views import (
    PermissionMatrixView,
    PermissionRoleCrudToggleView,
    PermissionRoleToggleView,
    health_check,
)

urlpatterns = [
    path('v1/health/', health_check),
    path('v1/permissions/', PermissionMatrixView.as_view(), name='permissions'),
    path(
        'v1/permissions/<str:module_key>/role/<str:role_name>/',
        PermissionRoleToggleView.as_view(),
        name='permission-role-toggle',
    ),
    path(
        'v1/permissions/<str:module_key>/role/<str:role_name>/crud/',
        PermissionRoleCrudToggleView.as_view(),
        name='permission-role-crud-toggle',
    ),
]