import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PasswordResetOTP, Role, User

from .models import PasswordResetOTP, User
from .serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    UserWriteSerializer,
    RoleSerializer
)

from rest_framework.pagination import CursorPagination


class UserCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 500
    ordering = '-date_joined'

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'pagination': {
                'next_cursor': self.get_next_link(),
                'previous_cursor': self.get_previous_link(),
                'page_size': self.page_size,
                'has_more': self.has_next,
            },
        })
    
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role

        return Response(
            {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            raise AuthenticationFailed('Invalid or expired refresh token.')

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            if api_settings.ROTATE_REFRESH_TOKENS:
                if api_settings.BLACKLIST_AFTER_ROTATION:
                    refresh.blacklist()

                refresh.set_jti()
                refresh.set_exp()
                refresh.set_iat()

            return Response(
                {
                    'access_token': access_token,
                    'refresh_token': str(refresh),
                },
                status=status.HTTP_200_OK,
            )

        except TokenError:
            raise AuthenticationFailed('Invalid or expired refresh token.')


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            raise AuthenticationFailed('Invalid or expired refresh token.')

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            raise AuthenticationFailed('Invalid or expired refresh token.')

        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    generic_response = {
        'detail': (
            'If an account exists for this email, '
            'a password reset code has been sent.'
        )
    }

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if not user:
            return Response(self.generic_response, status=status.HTTP_200_OK)

        now = timezone.now()
        cooldown_start = now - timedelta(
            seconds=settings.PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS
        )

        latest_otp = (
            PasswordResetOTP.objects
            .filter(user=user, used_at__isnull=True)
            .order_by('-created_at')
            .first()
        )

        if latest_otp and latest_otp.created_at > cooldown_start:
            return Response(self.generic_response, status=status.HTTP_200_OK)

        PasswordResetOTP.objects.filter(
            user=user,
            used_at__isnull=True,
        ).update(used_at=now)

        otp = f"{secrets.randbelow(1_000_000):06d}"

        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=make_password(otp),
            expires_at=now + timedelta(
                minutes=settings.PASSWORD_RESET_OTP_EXPIRY_MINUTES
            ),
        )

        send_mail(
            subject='SC-GIMS password reset code',
            message=(
                f'Your SC-GIMS password reset code is: {otp}\n\n'
                f'This code expires in '
                f'{settings.PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(self.generic_response, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if not user:
            raise ValidationError({'otp': 'Invalid or expired OTP.'})

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            raise ValidationError({'new_password': list(exc.messages)})

        invalid_otp = False

        with transaction.atomic():
            otp_record = (
                PasswordResetOTP.objects
                .select_for_update()
                .filter(user=user, used_at__isnull=True)
                .order_by('-created_at')
                .first()
            )

            now = timezone.now()

            if not otp_record:
                invalid_otp = True

            elif otp_record.expires_at <= now:
                otp_record.used_at = now
                otp_record.save(update_fields=['used_at'])
                invalid_otp = True

            elif otp_record.attempts >= settings.PASSWORD_RESET_OTP_MAX_ATTEMPTS:
                otp_record.used_at = now
                otp_record.save(update_fields=['used_at'])
                invalid_otp = True

            elif not check_password(otp, otp_record.otp_hash):
                otp_record.attempts += 1
                otp_record.save(update_fields=['attempts'])
                invalid_otp = True

            else:
                user.set_password(new_password)
                user.save(update_fields=['password'])

                otp_record.used_at = now
                otp_record.save(update_fields=['used_at'])

                PasswordResetOTP.objects.filter(
                    user=user,
                    used_at__isnull=True,
                ).update(used_at=now)

        if invalid_otp:
            raise ValidationError({'otp': 'Invalid or expired OTP.'})

        return Response(
            {'detail': 'Password reset successfully.'},
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    """System Admin — full user management."""
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated]
    pagination_class = UserCursorPagination

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return UserSerializer
        return UserWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ['role', 'is_active']:
            value = self.request.query_params.get(param)
            if value is not None:
                qs = qs.filter(**{param: value})
        province_id = self.request.query_params.get('province_id')
        if province_id:
            qs = qs.filter(province_assignments__province_id=province_id)
        return qs.distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(UserSerializer(serializer.instance).data)

    def perform_update(self, serializer):
        instance = self.get_object()
        deactivating = (
            'is_active' in serializer.validated_data
            and serializer.validated_data['is_active'] is False
        )

        if instance == self.request.user and deactivating:
            raise ValidationError(
                {'detail': 'You cannot deactivate your own account.'}
            )

        if (
            instance.role == 'SYSTEM_ADMIN'
            and deactivating
            and not User.objects.filter(
                role='SYSTEM_ADMIN', is_active=True
            ).exclude(pk=instance.pk).exists()
        ):
            raise ValidationError(
                {'detail': 'Cannot deactivate the last active SYSTEM_ADMIN.'}
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError(
                {'detail': 'You cannot delete your own account.'}
            )

        if (
            instance.role == 'SYSTEM_ADMIN'
            and not User.objects.filter(role='SYSTEM_ADMIN')
            .exclude(pk=instance.pk)
            .exists()
        ):
            raise ValidationError(
                {'detail': 'Cannot delete the last SYSTEM_ADMIN.'}
            )

        instance.delete()

    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        instance = self.get_object()

        if instance == request.user:
            raise ValidationError(
                {'detail': 'You cannot change your own active status.'}
            )

        new_status = not instance.is_active

        if (
            instance.role == 'SYSTEM_ADMIN'
            and not new_status
            and not User.objects.filter(
                role='SYSTEM_ADMIN', is_active=True
            ).exclude(pk=instance.pk).exists()
        ):
            raise ValidationError(
                {'detail': 'Cannot deactivate the last active SYSTEM_ADMIN.'}
            )

        instance.is_active = new_status
        instance.save(update_fields=['is_active'])
        return Response(UserSerializer(instance).data)

class RoleViewSet(viewsets.ModelViewSet):
    """System Admin — manage roles, including custom ones."""
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(is_system=False)

    def perform_update(self, serializer):
        instance = self.get_object()
        deactivating = (
            'is_active' in serializer.validated_data
            and serializer.validated_data['is_active'] is False
        )
        if instance.name == 'SYSTEM_ADMIN' and deactivating:
            raise ValidationError(
                {'detail': 'SYSTEM_ADMIN role can never be deactivated.'}
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_system:
            raise ValidationError(
                {'detail': 'Built-in system roles cannot be deleted.'}
            )
        if User.objects.filter(role=instance.name).exists():
            raise ValidationError(
                {'detail': 'Cannot delete a role that is still assigned to users.'}
            )
        instance.delete()