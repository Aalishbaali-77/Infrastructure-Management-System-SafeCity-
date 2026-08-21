import uuid

from django.db import models


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Module(BaseModel):
    key = models.CharField(max_length=100, unique=True)   # e.g. "boq" (no leading slash)
    label = models.CharField(max_length=100)               # e.g. "BOQ"

    def __str__(self):
        return self.label
    
class Permission(BaseModel):
    ACTION_CHOICES = [
        ('view', 'View'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    code = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)
    module = models.ForeignKey(
        Module, related_name='permissions', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    action = models.CharField(
        max_length=20, choices=ACTION_CHOICES, null=True, blank=True,
    )

    class Meta:
        unique_together = ('module', 'action')

    def __str__(self):
        return self.code
    

class RolePermission(BaseModel):
    role = models.CharField(max_length=20)
    permission = models.ForeignKey(
        Permission, related_name='role_permissions', on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role} -> {self.permission.code}"