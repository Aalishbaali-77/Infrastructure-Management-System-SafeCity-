from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    ResetPasswordView,
    UserViewSet,
    RoleViewSet,
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('roles', RoleViewSet, basename='role')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path(
        'forgot-password/',
        ForgotPasswordView.as_view(),
        name='forgot-password',
    ),
    path(
        'reset-password/',
        ResetPasswordView.as_view(),
        name='reset-password',
    ),
    path('', include(router.urls)),
]