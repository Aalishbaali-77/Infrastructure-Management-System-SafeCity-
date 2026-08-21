from django.db import models

from apps.core.models import BaseModel
from apps.projects.models import Project
from apps.provinces.models import Town


class Site(BaseModel):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('ACTIVE', 'Active'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
    ]

    project = models.ForeignKey(Project, related_name='sites', on_delete=models.PROTECT)
    town = models.ForeignKey(Town, related_name='sites', on_delete=models.PROTECT)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    geofence_radius_m = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')

    def __str__(self):
        return self.name
