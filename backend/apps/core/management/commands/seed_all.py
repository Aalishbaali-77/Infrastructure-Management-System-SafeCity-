from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Run the full SC-GIMS seed pipeline in order: "
        "roles → users → provinces → cities → permissions → demo data."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-demo',
            action='store_true',
            help='Skip projects/sites/BOQ demo data',
        )

    def handle(self, *args, **options):
        steps = [
            ('seed_roles', {}),
            ('seed_users', {}),
            ('seed_provinces', {}),
            ('seed_geo', {}),
            ('seed_permissions', {}),
        ]
        if not options['skip_demo']:
            steps.append(('seed_demo_data', {}))
            steps.append(('seed_progress_tasks', {}))

        self.stdout.write(self.style.MIGRATE_HEADING('SC-GIMS seed_all'))
        for name, kwargs in steps:
            self.stdout.write(self.style.NOTICE(f'\n>>> {name}'))
            call_command(name, **kwargs)

        self.stdout.write(self.style.SUCCESS('\nSeed complete.'))
        self.stdout.write('Login examples (password Test@1234):')
        self.stdout.write('  admin@scgims.test  (SYSTEM_ADMIN)')
        self.stdout.write('  hod@scgims.test    (HOD)')
        self.stdout.write('  siteeng@scgims.test (SITE_ENG)')
