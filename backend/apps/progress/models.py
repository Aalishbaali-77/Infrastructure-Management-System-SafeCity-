from django.conf import settings
from django.db import models
from django.db.models import Sum

from apps.boq.models import BOQ, BOQItem
from apps.core.models import BaseModel
from apps.sites.models import Site


class ProgressTaskTemplate(BaseModel):
    """
    Admin-controlled catalog of reusable progress activities / KPIs.
    Example keys: fiber_digging, hdpe_pipe, backfilling, fiber_laying, civil_work.
    """

    key = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, blank=True, default='')
    unit = models.CharField(max_length=30, default='m')
    description = models.TextField(blank=True, default='')
    # [{ "key": "crew_count", "label": "Crew", "value_type": "number" }, ...]
    kpi_schema = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.key})'


class SiteProgressTask(BaseModel):
    """
    Progress tasks enabled for a specific site, optionally linked to a BOQ line.
    Project comes via site.project; BOQ via boq / boq_item.
    """

    site = models.ForeignKey(Site, related_name='progress_tasks', on_delete=models.CASCADE)
    template = models.ForeignKey(
        ProgressTaskTemplate,
        related_name='site_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    boq = models.ForeignKey(
        BOQ,
        related_name='progress_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    boq_item = models.ForeignKey(
        BOQItem,
        related_name='progress_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='When set, planned qty defaults from BOQ item and daily logs update actual_quantity.',
    )
    key = models.SlugField(max_length=80)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, blank=True, default='')
    unit = models.CharField(max_length=30, default='m')
    planned_quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    kpi_schema = models.JSONField(default=list, blank=True)
    # Free-form admin key/values (spec notes, vendor prefs, etc.)
    attributes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = [('site', 'key')]

    def __str__(self):
        return f'{self.site.name}: {self.name}'

    def sync_boq_actual(self):
        """Push cumulative logged qty (summed across ALL sites' tasks for this BOQ item) onto BOQItem.actual_quantity."""
        if not self.boq_item_id:
            return
        total = DailyProgressEntry.objects.filter(
            site_task__boq_item_id=self.boq_item_id
        ).aggregate(s=Sum('quantity'))['s'] or 0
        BOQItem.objects.filter(pk=self.boq_item_id).update(actual_quantity=total)


class DailyProgressEntry(BaseModel):
    """One day's reported quantity (+ optional KPI values) for a site task."""

    site = models.ForeignKey(Site, related_name='daily_progress', on_delete=models.CASCADE)
    site_task = models.ForeignKey(
        SiteProgressTask,
        related_name='entries',
        on_delete=models.PROTECT,
    )
    date = models.DateField()
    quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    # Values keyed by kpi_schema[].key
    kpi_values = models.JSONField(default=dict, blank=True)
    remarks = models.TextField(blank=True, default='')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='daily_progress_entries',
        on_delete=models.PROTECT,
    )

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = [('site_task', 'date')]

    def __str__(self):
        return f'{self.site_task.key} @ {self.date}: {self.quantity}'