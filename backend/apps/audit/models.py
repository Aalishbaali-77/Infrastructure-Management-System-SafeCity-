from django.db import models

from apps.accounts.models import User
from apps.core.models import BaseModel


class AuditLog(BaseModel):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} - {self.action}"