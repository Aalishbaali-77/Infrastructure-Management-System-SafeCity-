from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Deprecated alias — runs seed_geo (Province → District → Town)'

    def handle(self, *args, **options):
        self.stdout.write('seed_cities is deprecated; running seed_geo…')
        call_command('seed_geo')
