from django.core.management.base import BaseCommand

from apps.provinces.models import Province

PROVINCES = [
    ("Sindh", "SINDH"),
    ("Punjab", "PUNJAB"),
    ("Balochistan", "BALOCH"),
]


class Command(BaseCommand):
    help = "Seed the three provinces used by SC-GIMS"

    def handle(self, *args, **options):
        for name, code in PROVINCES:
            obj, created = Province.objects.get_or_create(
                name=name, defaults={'code': code}
            )
            status = "Created" if created else "Already exists"
            self.stdout.write(f"{status}: {obj.name} ({obj.code})")