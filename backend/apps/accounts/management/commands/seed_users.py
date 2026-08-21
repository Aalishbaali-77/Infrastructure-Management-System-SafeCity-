from django.core.management.base import BaseCommand

from apps.accounts.models import User

DEFAULT_PASSWORD = "Test@1234"

# Role names must match Role.name / User.role (uppercase codes).
SEED_USERS = [
    {"email": "exec@scgims.test", "role": "EXEC", "first_name": "Ahmed", "last_name": "Raza"},
    {"email": "hod@scgims.test", "role": "HOD", "first_name": "Sara", "last_name": "Malik"},
    {"email": "director@scgims.test", "role": "DIR", "first_name": "Imran", "last_name": "Sheikh"},
    {"email": "siteeng@scgims.test", "role": "SITE_ENG", "first_name": "Bilal", "last_name": "Hussain"},
    {"email": "contractor@scgims.test", "role": "CONTRACTOR", "first_name": "Contractor", "last_name": "Co."},
    {"email": "qa@scgims.test", "role": "QA", "first_name": "Fatima", "last_name": "Qureshi"},
    {"email": "vendor@scgims.test", "role": "VENDOR", "first_name": "Vendor", "last_name": "Supplies Ltd."},
    {"email": "admin@scgims.test", "role": "SYSTEM_ADMIN", "first_name": "Admin", "last_name": "User"},
    {"email": "auditor@scgims.test", "role": "AUDITOR", "first_name": "Zainab", "last_name": "Auditor"},
]


class Command(BaseCommand):
    help = "Seed the 9 role-based test users (one per role), all with password 'Test@1234'"

    def handle(self, *args, **options):
        for data in SEED_USERS:
            email = data["email"]

            if User.objects.filter(email=email).exists():
                self.stdout.write(f"Already exists: {email}")
                continue

            User.objects.create_user(
                email=email,
                password=DEFAULT_PASSWORD,
                role=data["role"],
                first_name=data["first_name"],
                last_name=data["last_name"],
            )
            self.stdout.write(self.style.SUCCESS(f"Created: {email} ({data['role']})"))