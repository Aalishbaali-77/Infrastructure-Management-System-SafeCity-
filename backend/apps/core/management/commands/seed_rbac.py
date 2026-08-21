from django.core.management.base import BaseCommand

from apps.core.models import Permission, RolePermission

PERMISSIONS = [
    ("project.view", "View projects"),
    ("project.create", "Create projects"),
    ("project.approve", "Approve project workflows"),
    ("site.view", "View sites"),
    ("site.update_progress", "Log daily progress on a site"),
    ("ncr.view", "View non-conformance reports"),
    ("ncr.create", "Create NCRs"),
    ("ncr.resolve", "Resolve NCRs"),
    ("ipc.view", "View IPC payments"),
    ("ipc.approve", "Approve IPC payments"),
    ("user.manage", "Manage users and roles"),
    ("audit.view", "View audit logs (read-only)"),
]

ROLE_PERMISSIONS = {
    "EXEC": ["project.view", "project.create", "site.view", "ncr.view", "ipc.view"],
    "HOD": ["project.view", "project.approve", "site.view", "ncr.view", "ncr.resolve", "ipc.view"],
    "DIR": [
        "project.view", "project.approve", "site.view", "ncr.view",
        "ncr.resolve", "ipc.view", "ipc.approve",
    ],
    "SITE_ENG": [
        "project.view", "site.view", "site.update_progress", "ncr.view", "ncr.create",
    ],
    "CONTRACTOR": ["project.view", "site.view", "site.update_progress"],
    "QA": ["project.view", "site.view", "ncr.view", "ncr.create"],
    "VENDOR": ["project.view", "site.view"],
    "SYSTEM_ADMIN": ["user.manage", "audit.view"],
    "AUDITOR": ["audit.view", "project.view", "site.view", "ncr.view", "ipc.view"],
}

class Command(BaseCommand):
    help = "Seed baseline permissions and role-permission mappings"

    def handle(self, *args, **options):
        for code, description in PERMISSIONS:
            obj, created = Permission.objects.get_or_create(
                code=code, defaults={"description": description}
            )
            status = "Created" if created else "Already exists"
            self.stdout.write(f"{status} permission: {obj.code}")

        for role, perm_codes in ROLE_PERMISSIONS.items():
            for code in perm_codes:
                try:
                    permission = Permission.objects.get(code=code)
                except Permission.DoesNotExist:
                    self.stderr.write(f"Permission '{code}' not found, skipping")
                    continue
                obj, created = RolePermission.objects.get_or_create(
                    role=role, permission=permission
                )
                status = "Assigned" if created else "Already assigned"
                self.stdout.write(f"{status}: {role} -> {code}")