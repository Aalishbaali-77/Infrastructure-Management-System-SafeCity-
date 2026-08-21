from django.core.management.base import BaseCommand

from apps.accounts.models import Role
from apps.core.models import Module, Permission, RolePermission

MODULES = [
    ('projects', 'Projects'),
    ('sites', 'Sites'),
    ('boq', 'BOQ'),
    ('daily-progress', 'Daily Progress'),
    ('workflows', 'Workflows'),
    ('deviations', 'Deviations'),
    ('complaints', 'Complaints'),
    ('tasks', 'Tasks'),
    ('acceptance-tests', 'Acceptance Tests'),
    ('snag-list', 'Snag List'),
    ('field-logs', 'Field Logs'),
    ('variation-orders', 'Variation Orders'),
    ('ipc', 'IPC'),
    ('inventory', 'Inventory'),
    ('fac-readiness', 'FAC Readiness'),
    ('provinces', 'Provinces, Districts & Towns'),
]

ACTIONS = ['view', 'create', 'update', 'delete']

# role -> module -> actions (view implied if any CRUD listed; always include view explicitly)
ROLE_GRANTS = {
    'SYSTEM_ADMIN': {key: ACTIONS for key, _ in MODULES},
    'EXEC': {
        'projects': ['view'],
        'sites': ['view'],
        'boq': ['view'],
        'workflows': ['view'],
        'deviations': ['view'],
        'ipc': ['view'],
        'fac-readiness': ['view'],
        'provinces': ['view'],
    },
    'HOD': {
        'projects': ACTIONS,
        'sites': ACTIONS,
        'boq': ACTIONS,
        'daily-progress': ACTIONS,
        'workflows': ['view', 'update'],
        'deviations': ACTIONS,
        'tasks': ACTIONS,
        'acceptance-tests': ['view', 'create', 'update'],
        'snag-list': ['view', 'create', 'update'],
        'field-logs': ['view'],
        'variation-orders': ACTIONS,
        'ipc': ACTIONS,
        'inventory': ['view', 'create', 'update'],
        'fac-readiness': ['view', 'update'],
        'provinces': ['view'],
    },
    'DIR': {
        'projects': ['view', 'update'],
        'sites': ['view', 'update'],
        'boq': ['view', 'update'],
        'daily-progress': ['view'],
        'workflows': ['view'],
        'deviations': ['view', 'update'],
        'variation-orders': ['view', 'update'],
        'ipc': ['view', 'update'],
        'fac-readiness': ['view', 'update'],
        'provinces': ['view'],
    },
    'SITE_ENG': {
        'projects': ['view'],
        'sites': ['view', 'update'],
        'boq': ['view'],
        'daily-progress': ['view', 'create', 'update'],
        'deviations': ['view', 'create', 'update'],
               'complaints': ['view', 'create'],
        'tasks': ['view', 'create', 'update'],
        'acceptance-tests': ['view', 'create', 'update'],
        'snag-list': ['view', 'create', 'update'],
        'field-logs': ['view', 'create'],
        'inventory': ['view', 'create', 'update'],
        'provinces': ['view'],
    },
    'CONTRACTOR': {
        'projects': ['view'],
        'sites': ['view'],
        'boq': ['view'],
        'daily-progress': ['view', 'create'],
        'deviations': ['view', 'create', 'update'],
               'complaints': ['view', 'create'],
        'tasks': ['view'],
        'field-logs': ['view', 'create'],
        'inventory': ['view'],
        'provinces': ['view'],
    },
    'QA': {
        'projects': ['view'],
        'sites': ['view'],
        'boq': ['view'],
        'acceptance-tests': ACTIONS,
        'snag-list': ACTIONS,
        'deviations': ['view', 'create', 'update'],
               'complaints': ['view', 'create'],
        'inventory': ['view'],
        'provinces': ['view'],
    },
    'VENDOR': {
        'sites': ['view'],
        'boq': ['view'],
        'inventory': ['view'],
        'provinces': ['view'],
    },
    'AUDITOR': {
        key: ['view'] for key, _ in MODULES
    },
}


class Command(BaseCommand):
    help = "Seed modules/permissions and assign a production-like role matrix"

    def handle(self, *args, **options):
        for key, label in MODULES:
            module, created = Module.objects.get_or_create(
                key=key, defaults={'label': label}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created module: {key}"))

            for action in ACTIONS:
                code = f"{key}.{action}"
                permission = Permission.objects.filter(code=code).first()
                if permission is None:
                    Permission.objects.create(code=code, module=module, action=action)
                    self.stdout.write(f"  + {code}")
                elif permission.module_id is None:
                    permission.module = module
                    permission.action = action
                    permission.save(update_fields=['module', 'action'])
                    self.stdout.write(f"  ~ linked existing permission: {code}")

        granted = 0
        for role_name, modules in ROLE_GRANTS.items():
            if not Role.objects.filter(name=role_name).exists():
                self.stdout.write(self.style.WARNING(f"Role missing, skip grants: {role_name}"))
                continue
            for module_key, actions in modules.items():
                for action in actions:
                    permission = Permission.objects.filter(
                        module__key=module_key, action=action
                    ).first()
                    if permission is None:
                        continue
                    _, created = RolePermission.objects.get_or_create(
                        role=role_name, permission=permission
                    )
                    if created:
                        granted += 1

        self.stdout.write(self.style.SUCCESS(f"RolePermission grants ensured (+{granted} new)"))
