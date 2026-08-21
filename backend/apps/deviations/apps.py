from django.apps import AppConfig


class DeviationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.deviations'

    def ready(self):
        from . import signals  # noqa: F401
