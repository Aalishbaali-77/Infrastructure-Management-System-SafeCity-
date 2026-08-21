import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.progress.models import DailyProgressEntry

from .services import detect_quantity_deviations

logger = logging.getLogger(__name__)


@receiver(post_save, sender=DailyProgressEntry)
def on_daily_progress_saved(sender, instance, **kwargs):
    # Runs synchronously inside DailyProgressEntry.save(): any exception escaping
    # here would roll back the progress entry itself, so auto-detection failures
    # are logged and swallowed instead of breaking the triggering request.
    try:
        detect_quantity_deviations(instance.site_task_id)
    except Exception:
        logger.exception(
            'Auto-detection of quantity deviations failed after saving '
            'DailyProgressEntry %s (site_task %s)',
            instance.pk,
            instance.site_task_id,
        )


@receiver(post_delete, sender=DailyProgressEntry)
def on_daily_progress_deleted(sender, instance, **kwargs):
    # The DB row is gone but the in-memory instance still carries site_task_id, so
    # detection can recompute the cumulative actual without the deleted entry.
    try:
        detect_quantity_deviations(instance.site_task_id)
    except Exception:
        logger.exception(
            'Auto-detection of quantity deviations failed after deleting '
            'DailyProgressEntry %s (site_task %s)',
            instance.pk,
            instance.site_task_id,
        )
