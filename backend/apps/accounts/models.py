import uuid
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import BaseModel



class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SYSTEM_ADMIN')
        return self.create_user(email, password, **extra_fields)

class Role(BaseModel):
    name = models.CharField(max_length=50, unique=True)   # machine name, e.g. "FINANCE"
    label = models.CharField(max_length=100)               # display name, e.g. "Finance Officer"
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.label

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    ROLE_CHOICES = [
        ('EXEC', 'Executive'),
        ('HOD', 'HOD'),
        ('DIR', 'Director'),
        ('SITE_ENG', 'Site Engineer'),
        ('CONTRACTOR', 'Contractor'),
        ('QA', 'QA Inspector'),
        ('VENDOR', 'Vendor'),
        ('SYSTEM_ADMIN', 'System Admin'),
        ('AUDITOR', 'Auditor'),
    ]

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, default='SITE_ENG')
    phone = models.CharField(max_length=20, blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class UserProvinceAssignment(BaseModel):
    user = models.ForeignKey(
        User, related_name='province_assignments', on_delete=models.CASCADE
    )
    province = models.ForeignKey(
        'provinces.Province', related_name='user_assignments', on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('user', 'province')

    def __str__(self):
        return f"{self.user.email} -> {self.province.name}"

class UserProjectAssignment(BaseModel):
    user = models.ForeignKey(
        User, related_name='project_assignments', on_delete=models.CASCADE
    )
    project = models.ForeignKey(
        'projects.Project', related_name='user_assignments', on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('user', 'project')

    def __str__(self):
        return f"{self.user.email} -> {self.project.name}"

class UserSiteAssignment(BaseModel):
    user = models.ForeignKey(
        User, related_name='site_assignments', on_delete=models.CASCADE
    )
    site_id = models.UUIDField()  # placeholder FK — real Site model lands in a later week

    class Meta:
        unique_together = ('user', 'site_id')

    def __str__(self):
        return f"{self.user.email} -> site {self.site_id}"
    
class PasswordResetOTP(BaseModel):
    user = models.ForeignKey(
        User,
        related_name='password_reset_otps',
        on_delete=models.CASCADE,
    )
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Password reset OTP for {self.user.email}"
    

