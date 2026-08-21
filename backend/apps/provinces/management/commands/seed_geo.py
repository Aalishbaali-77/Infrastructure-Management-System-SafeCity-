from django.core.management.base import BaseCommand

from apps.provinces.models import District, Province, Town

# Province → District → Towns
GEO_DATA = {
    'Sindh': [
        {
            'name': 'Karachi',
            'code': 'D-KHI',
            'towns': [
                {'name': 'Karachi South', 'code': 'KHI-S'},
                {'name': 'Karachi East', 'code': 'KHI-E'},
                {'name': 'Karachi West', 'code': 'KHI-W'},
            ],
        },
        {
            'name': 'Hyderabad',
            'code': 'D-HYD',
            'towns': [
                {'name': 'Hyderabad City', 'code': 'HYD-C'},
                {'name': 'Qasimabad', 'code': 'HYD-Q'},
            ],
        },
        {
            'name': 'Sukkur',
            'code': 'D-SKZ',
            'towns': [{'name': 'Sukkur City', 'code': 'SKZ-C'}],
        },
    ],
    'Punjab': [
        {
            'name': 'Lahore',
            'code': 'D-LHE',
            'towns': [
                {'name': 'Lahore City', 'code': 'LHE-C'},
                {'name': 'Raiwind', 'code': 'LHE-R'},
            ],
        },
        {
            'name': 'Faisalabad',
            'code': 'D-FSD',
            'towns': [{'name': 'Faisalabad City', 'code': 'FSD-C'}],
        },
        {
            'name': 'Multan',
            'code': 'D-MUX',
            'towns': [{'name': 'Multan City', 'code': 'MUX-C'}],
        },
    ],
    'Balochistan': [
        {
            'name': 'Quetta',
            'code': 'D-UET',
            'towns': [
                {'name': 'Quetta City', 'code': 'UET-C'},
                {'name': 'Sariab', 'code': 'UET-S'},
            ],
        },
        {
            'name': 'Gwadar',
            'code': 'D-GWD',
            'towns': [{'name': 'Gwadar City', 'code': 'GWD-C'}],
        },
        {
            'name': 'Kech',
            'code': 'D-TUK',
            'towns': [{'name': 'Turbat', 'code': 'TUK-C'}],
        },
    ],
}


class Command(BaseCommand):
    help = 'Seed districts and towns under each province'

    def handle(self, *args, **options):
        for province_name, districts in GEO_DATA.items():
            try:
                province = Province.objects.get(name=province_name)
            except Province.DoesNotExist:
                self.stderr.write(
                    f"Province '{province_name}' not found — run seed_provinces first."
                )
                continue

            for d in districts:
                district, created = District.objects.update_or_create(
                    province=province,
                    code=d['code'],
                    defaults={'name': d['name']},
                )
                self.stdout.write(
                    f"{'Created' if created else 'Updated'} district: {district}"
                )
                for t in d['towns']:
                    town, t_created = Town.objects.update_or_create(
                        district=district,
                        name=t['name'],
                        defaults={'code': t['code']},
                    )
                    self.stdout.write(
                        f"  {'Created' if t_created else 'Updated'} town: {town}"
                    )
