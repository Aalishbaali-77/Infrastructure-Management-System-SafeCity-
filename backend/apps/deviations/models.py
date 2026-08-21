from django.conf import settings
from django.db import models

from apps.core.models import BaseModel
from apps.progress.models import SiteProgressTask
from apps.provinces.models import Province
from apps.sites.models import Site


class NcrSequence(BaseModel):
    """Tracks the last NCR number issued per province, per year."""

    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='ncr_sequences')
    year = models.PositiveIntegerField()
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('province', 'year')

    def __str__(self):
        return f'{self.province.code}-{self.year}: {self.last_number}'


class ExecutionDeviation(BaseModel):
    """
    A record of 'what was planned vs what actually happened' —
    either auto-detected by the system (quantity mismatch) or
    manually raised by a user (vendor, method, safety, other issues).
    """

    SOURCE_CHOICES = [
        ('AUTO', 'Auto-detected'),
        ('MANUAL', 'Manually raised'),
    ]

    TYPE_CHOICES = [
        ('QTY_OVERRUN', 'Quantity over plan'),
        ('QTY_UNDERRUN', 'Quantity under plan'),
        ('OTHER', 'Other (manual report)'),
        # more types (METHOD_DEVIATION, VENDOR_SUBSTITUTION, etc.) added in step 2
    ]

    SEVERITY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('MAJOR', 'Major'),
        ('MINOR', 'Minor'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('HOD_REVIEW', 'HOD review'),
        ('DIR_REVIEW', 'Director review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CONDITIONAL', 'Conditional approval'),
        ('CLOSED', 'Closed'),
    ]

    ncr_number = models.CharField(max_length=50, unique=True, blank=True)

    site = models.ForeignKey(Site, related_name='deviations', on_delete=models.CASCADE)
    site_task = models.ForeignKey(
        SiteProgressTask,
        related_name='deviations',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Optional — set when the deviation is about a specific task/BOQ item.',
    )

    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='MANUAL')
    deviation_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MINOR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    planned_quantity = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    actual_quantity = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    variance_quantity = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    variance_pct = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    description = models.TextField()
    remarks = models.TextField(blank=True, default='')

    evidence_document_ids = models.JSONField(default=list, blank=True)
    linked_progress_ids = models.JSONField(default=list, blank=True)

    blocks_fac = models.BooleanField(default=False)

    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='deviations_raised',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='deviations_approved',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['site', 'status']),
            models.Index(fields=['deviation_type', 'severity']),
        ]

    def save(self, *args, **kwargs):
        if not self.ncr_number:
            self.ncr_number = self._generate_ncr_number()
        super().save(*args, **kwargs)

    def _generate_ncr_number(self):
        from django.db import transaction
        from django.utils import timezone

        province = self.site.town.province
        year = timezone.now().year
        with transaction.atomic():
            seq, _ = NcrSequence.objects.select_for_update().get_or_create(
                province=province, year=year
            )
            seq.last_number += 1
            seq.save(update_fields=['last_number', 'updated_at'])
        return f'NCR-{province.code}-{year}-{seq.last_number:04d}'

    def __str__(self):
        return f'{self.ncr_number} ({self.deviation_type}, {self.severity})'