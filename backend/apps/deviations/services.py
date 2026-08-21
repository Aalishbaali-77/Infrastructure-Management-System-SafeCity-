from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Sum

from apps.progress.models import DailyProgressEntry, SiteProgressTask

from .models import ExecutionDeviation

DEFAULT_TOLERANCE_PCT = Decimal('5')
MAJOR_THRESHOLD_PCT = Decimal('10')
# ExecutionDeviation.variance_pct is DecimalField(max_digits=8, decimal_places=2),
# so anything beyond this cannot be stored. Clamp rather than raise, because this
# runs inside a DailyProgressEntry save and must never break the triggering write.
MAX_VARIANCE_PCT = Decimal('999999.99')


def detect_quantity_deviations(site_task_id):
    try:
        site_task = SiteProgressTask.objects.select_related('boq_item', 'site').get(pk=site_task_id)
    except SiteProgressTask.DoesNotExist:
        return

    actual = DailyProgressEntry.objects.filter(site_task_id=site_task_id).aggregate(
        s=Sum('quantity')
    )['s'] or Decimal('0')

    boq_item = site_task.boq_item
    # Baseline is always this site task's own planned quantity: BOQItem.qty is a
    # cross-site total (see SiteProgressTask.sync_boq_actual), while `actual` above
    # sums only this one site task's entries — comparing the two is a scope mismatch.
    planned = site_task.planned_quantity
    tolerance_pct = (
        boq_item.quantity_tolerance_pct if boq_item is not None else DEFAULT_TOLERANCE_PCT
    )
    if tolerance_pct is None:
        tolerance_pct = DEFAULT_TOLERANCE_PCT

    if not planned:
        return

    variance_quantity = actual - planned

    # Underrun detection is deliberately disabled: `actual` is cumulative-to-date
    # while `planned` is the task total, so any partially-complete task would look
    # massively "under" plan and raise a false NCR on every progress entry. Only
    # overruns (actual beyond plan) are auto-detected.
    if variance_quantity <= 0:
        return

    variance_pct = (variance_quantity / planned) * Decimal('100')
    variance_pct = variance_pct.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    if variance_pct <= tolerance_pct:
        return

    if variance_pct > MAX_VARIANCE_PCT:
        variance_pct = MAX_VARIANCE_PCT

    deviation_type = 'QTY_OVERRUN'
    severity = 'MAJOR' if variance_pct > MAJOR_THRESHOLD_PCT else 'MINOR'
    description = f'Auto-detected: {variance_pct:.2f}% over planned quantity'

    existing = ExecutionDeviation.objects.filter(
        site_task_id=site_task_id,
        source='AUTO',
    ).exclude(status__in=('APPROVED', 'REJECTED', 'CLOSED')).first()

    if existing:
        existing.actual_quantity = actual
        existing.planned_quantity = planned
        existing.variance_quantity = variance_quantity
        existing.variance_pct = variance_pct
        existing.deviation_type = deviation_type
        existing.severity = severity
        existing.description = description
        existing.save(update_fields=[
            'actual_quantity', 'planned_quantity', 'variance_quantity',
            'variance_pct', 'deviation_type', 'severity', 'description', 'updated_at',
        ])
        return

    ExecutionDeviation.objects.create(
        site=site_task.site,
        site_task=site_task,
        source='AUTO',
        deviation_type=deviation_type,
        severity=severity,
        status='DRAFT',
        planned_quantity=planned,
        actual_quantity=actual,
        variance_quantity=variance_quantity,
        variance_pct=variance_pct,
        description=description,
    )
