from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.boq.models import BOQ, BOQItem
from apps.progress.models import ProgressTaskTemplate, SiteProgressTask
from apps.sites.models import Site

TEMPLATES = [
    {
        'key': 'fiber_digging',
        'name': 'Digging for Fiber Lay',
        'category': 'FIBER',
        'unit': 'm',
        'description': 'Trench / duct digging ahead of fiber installation',
        'kpi_schema': [
            {'key': 'crew_count', 'label': 'Crew count', 'value_type': 'number'},
            {'key': 'depth_m', 'label': 'Avg depth (m)', 'value_type': 'number'},
        ],
        'boq_item_types': ['FIBER', 'CONDUIT'],
        'boq_item_codes': ['SND-FIBER', 'FIB'],
    },
    {
        'key': 'hdpe_pipe',
        'name': 'HDPE Pipe',
        'category': 'CONDUIT',
        'unit': 'm',
        'description': 'HDPE conduit laying',
        'kpi_schema': [
            {'key': 'pipe_diameter_mm', 'label': 'Pipe Ø (mm)', 'value_type': 'number'},
        ],
        'boq_item_types': ['CONDUIT'],
        'boq_item_codes': ['SND-COND', 'COND', 'HDPE'],
    },
    {
        'key': 'backfilling',
        'name': 'Back Filling',
        'category': 'CIVIL',
        'unit': 'm',
        'description': 'Trench backfilling after conduit / cable',
        'kpi_schema': [
            {'key': 'compacted', 'label': 'Compacted', 'value_type': 'boolean'},
        ],
        'boq_item_types': ['CIVIL', 'CONDUIT'],
        'boq_item_codes': ['SND-COND', 'CIV'],
    },
    {
        'key': 'fiber_laying',
        'name': 'Fiber Laying',
        'category': 'FIBER',
        'unit': 'm',
        'description': 'Optical fiber cable laying',
        'kpi_schema': [
            {'key': 'cable_type', 'label': 'Cable type', 'value_type': 'string'},
        ],
        'boq_item_types': ['FIBER'],
        'boq_item_codes': ['SND-FIBER', 'FIB'],
    },
    {
        'key': 'civil_work',
        'name': 'Civil Work',
        'category': 'CIVIL',
        'unit': 'NOS',
        'description': 'General civil works (chambers, poles, foundations)',
        'kpi_schema': [
            {'key': 'work_type', 'label': 'Work type', 'value_type': 'string'},
        ],
        'boq_item_types': ['CIVIL', 'ELECTRICAL', 'NETWORKING'],
        'boq_item_codes': ['SND-CCTV', 'CIV', 'ELE', 'NET'],
    },
]

SITE_PLANS = {
    'fiber_digging': Decimal('2000'),
    'hdpe_pipe': Decimal('1800'),
    'backfilling': Decimal('2000'),
    'fiber_laying': Decimal('1500'),
    'civil_work': Decimal('25'),
}


def match_boq_item(items, template_row):
    types = {t.upper() for t in template_row.get('boq_item_types', [])}
    codes = [c.upper() for c in template_row.get('boq_item_codes', [])]
    for item in items:
        if (item.item_type or '').upper() in types:
            return item
    for item in items:
        code = (item.item or '').upper()
        if any(code.startswith(prefix) or prefix in code for prefix in codes):
            return item
    return items[0] if items else None


class Command(BaseCommand):
    help = 'Seed progress task templates and assign them to sites, linked to BOQ items when present'

    def handle(self, *args, **options):
        templates = []
        for row in TEMPLATES:
            obj, created = ProgressTaskTemplate.objects.update_or_create(
                key=row['key'],
                defaults={
                    'name': row['name'],
                    'category': row['category'],
                    'unit': row['unit'],
                    'description': row['description'],
                    'kpi_schema': row['kpi_schema'],
                    'is_active': True,
                },
            )
            templates.append((obj, row))
            self.stdout.write(
                self.style.SUCCESS(f'{"Created" if created else "Updated"} template {obj.key}')
            )

        sites = list(Site.objects.all())
        if not sites:
            self.stdout.write(self.style.WARNING('No sites found — templates only.'))
            return

        assigned = 0
        linked = 0
        for site in sites:
            boq = (
                BOQ.objects.filter(site=site)
                .prefetch_related('items')
                .order_by('-version', '-created_at')
                .first()
            )
            items = list(boq.items.all()) if boq else []

            for order, (template, row) in enumerate(templates):
                boq_item = match_boq_item(items, row) if items else None
                planned = (
                    boq_item.qty
                    if boq_item is not None
                    else SITE_PLANS.get(template.key, Decimal('0'))
                )
                unit = boq_item.unit if boq_item is not None else template.unit
                _, created = SiteProgressTask.objects.update_or_create(
                    site=site,
                    key=template.key,
                    defaults={
                        'template': template,
                        'boq': boq,
                        'boq_item': boq_item,
                        'name': template.name,
                        'category': template.category,
                        'unit': unit,
                        'planned_quantity': planned,
                        'sort_order': order,
                        'is_active': True,
                        'kpi_schema': template.kpi_schema,
                        'attributes': {},
                    },
                )
                if created:
                    assigned += 1
                if boq_item:
                    linked += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Site tasks across {len(sites)} site(s); '
                f'{assigned} newly created; {linked} linked to BOQ items.'
            )
        )
