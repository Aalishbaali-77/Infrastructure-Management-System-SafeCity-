from django.core.management.base import BaseCommand

from apps.accounts.models import Role

BUILT_IN_ROLES = [
    ('EXEC', 'Executive'),
    ('HOD', 'HOD'),
    ('DIR', 'Director'),
    ('SITE_ENG', 'Site Engineer'),
    ('CONTRACTOR', 'Contractor'),
    ('QA', 'QA Inspector'),
    ('VENDOR', 'Vendor'),
    ('SYSTEM_ADMIN', 'System Admin'),
    ('AUDITOR', 'Auditor'),
]


class Command(BaseCommand):
    help = "Seed the 9 built-in system roles (is_system=True, cannot be deleted)"

    def handle(self, *args, **options):
        for name, label in BUILT_IN_ROLES:
            role, created = Role.objects.get_or_create(
                name=name,
                defaults={'label': label, 'is_system': True, 'is_active': True},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                self.stdout.write(f"Already exists: {name}")