from django.db import models

from apps.core.models import BaseModel
from apps.provinces.models import Province


class Project(BaseModel):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('ACTIVE', 'Active'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
    ]

    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, related_name='projects', on_delete=models.PROTECT)
    program_code = models.CharField(max_length=50, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    budget = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')

    def __str__(self):
        return self.name