from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.accounts.models import User, UserProvinceAssignment, UserSiteAssignment
from apps.boq.models import BOQ, BOQItem
from apps.projects.models import Project
from apps.provinces.models import Province, Town
from apps.sites.models import Site

PROJECTS = [
    {
        'province_name': 'Sindh',
        'town_name': 'Karachi South',
        'project_name': 'Karachi Safe City Phase 1',
        'program_code': 'SC-SINDH-01',
        'sites': [
            ('KHI-Site-01', 'ACTIVE'),
            ('KHI-Site-02', 'PLANNED'),
        ],
    },
    {
        'province_name': 'Punjab',
        'town_name': 'Lahore City',
        'project_name': 'Lahore Safe City Phase 1',
        'program_code': 'SC-PUNJAB-01',
        'sites': [('LHE-Site-01', 'ACTIVE')],
    },
    {
        'province_name': 'Balochistan',
        'town_name': 'Quetta City',
        'project_name': 'Quetta Safe City Phase 1',
        'program_code': 'SC-BALOCH-01',
        'sites': [('UET-Site-01', 'ACTIVE')],
    },
]

# Spreadsheet-aligned BOQ line templates
BOQ_ITEM_TEMPLATES = [
    {
        'no': 1,
        'pc1': 'PC1-A',
        'item_type': 'FIBER',
        'item': 'SND-FIBER-001',
        'item_description': 'Single Mode Fiber Optic Cable (G.652D)',
        'model_name': 'G.652D SM',
        'model': 'SM-FOC-24',
        'oem': 'Huawei',
        'unit': 'KM',
        'package_qty': 1,
        'qty': 150,
        'actual_quantity': 132,
        'fob': Decimal('1400'),
        'hs_code': '8544.70',
        'hs_code_description': 'Optical fibre cables',
        'curr': 'USD',
        'curr_rate': Decimal('280'),
        'bank_charges_pct': Decimal('0.1'),
        'freight_pct': Decimal('2'),
        'landing_pct': Decimal('1'),
        'insurance_pct': Decimal('0.5'),
        'cd_pct': Decimal('5'),
        'st_pct': Decimal('18'),
        'bank_charges': Decimal('1.4'),
        'freight_insurance': Decimal('28'),
        'price_with_fi': Decimal('1428'),
        'landing': Decimal('14.28'),
        'insurance': Decimal('7.14'),
        'custom_duty': Decimal('72.12'),
        'sales_tax': Decimal('279.5'),
        'ddp_unit_usd': Decimal('1830'),
        'ddp_unit_pkr': Decimal('512400'),
    },
    {
        'no': 2,
        'pc1': 'PC1-A',
        'item_type': 'NETWORKING',
        'item': 'SND-CCTV-001',
        'item_description': 'PTZ Camera 2MP with IR',
        'model_name': 'PTZ 2MP',
        'model': 'DS-2DE',
        'oem': 'Hikvision',
        'unit': 'NOS',
        'package_qty': 1,
        'qty': 200,
        'actual_quantity': 180,
        'fob': Decimal('280'),
        'hs_code': '8525.80',
        'hs_code_description': 'Television cameras',
        'curr': 'USD',
        'curr_rate': Decimal('280'),
        'bank_charges_pct': Decimal('0.1'),
        'freight_pct': Decimal('2'),
        'cd_pct': Decimal('10'),
        'st_pct': Decimal('18'),
        'bank_charges': Decimal('0.28'),
        'freight_insurance': Decimal('5.6'),
        'price_with_fi': Decimal('285.6'),
        'landing': Decimal('2.86'),
        'insurance': Decimal('1.43'),
        'custom_duty': Decimal('28.99'),
        'sales_tax': Decimal('57.4'),
        'ddp_unit_usd': Decimal('376'),
        'ddp_unit_pkr': Decimal('105280'),
    },
    {
        'no': 3,
        'pc1': 'PC1-B',
        'item_type': 'CONDUIT',
        'item': 'SND-COND-001',
        'item_description': 'HDPE Conduit 50mm',
        'model_name': 'HDPE 50',
        'model': 'HDPE-50',
        'oem': 'Local',
        'unit': 'KM',
        'package_qty': 1,
        'qty': 120,
        'actual_quantity': 110,
        'fob': Decimal('400'),
        'hs_code': '3917.21',
        'hs_code_description': 'Tubes, pipes of plastics',
        'curr': 'USD',
        'curr_rate': Decimal('280'),
        'freight_pct': Decimal('3'),
        'cd_pct': Decimal('20'),
        'st_pct': Decimal('18'),
        'bank_charges': Decimal('0.4'),
        'freight_insurance': Decimal('12'),
        'price_with_fi': Decimal('412'),
        'landing': Decimal('4.12'),
        'insurance': Decimal('2.06'),
        'custom_duty': Decimal('83.64'),
        'sales_tax': Decimal('90.33'),
        'ddp_unit_usd': Decimal('592'),
        'ddp_unit_pkr': Decimal('165760'),
    },
]


class Command(BaseCommand):
    help = "Seed demo Projects, Sites, BOQs (spreadsheet columns), and user assignments"

    def handle(self, *args, **options):
        contractor = User.objects.filter(role='CONTRACTOR').first()
        site_eng = User.objects.filter(role='SITE_ENG').first()
        hod = User.objects.filter(role='HOD').first()

        for entry in PROJECTS:
            province = Province.objects.filter(name=entry['province_name']).first()
            town = Town.objects.filter(
                name=entry['town_name'],
                district__province=province,
            ).first()
            if province is None or town is None:
                self.stdout.write(self.style.WARNING(
                    f"Skipping {entry['project_name']} — run seed_provinces/seed_geo first."
                ))
                continue

            project, created = Project.objects.get_or_create(
                name=entry['project_name'],
                defaults={
                    'province': province,
                    'program_code': entry['program_code'],
                    'start_date': date(2026, 1, 1),
                    'status': 'ACTIVE',
                    'budget': 50000000,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created project: {project.name}"))

            for user in (hod, site_eng):
                if user:
                    UserProvinceAssignment.objects.get_or_create(
                        user=user, province=province
                    )

            for idx, (site_name, site_status) in enumerate(entry['sites']):
                site, site_created = Site.objects.get_or_create(
                    name=site_name,
                    defaults={
                        'project': project,
                        'town': town,
                        'status': site_status,
                        'geofence_radius_m': 100,
                        'location': f'{town.name} node',
                    },
                )
                if site_created:
                    self.stdout.write(f"  Created site: {site.name}")

                if contractor is not None:
                    UserSiteAssignment.objects.get_or_create(
                        user=contractor, site_id=site.id
                    )
                if site_eng is not None:
                    UserSiteAssignment.objects.get_or_create(
                        user=site_eng, site_id=site.id
                    )

                # First site: published BOQ with items; second: draft READY shell
                boq_status = 'PUBLISHED' if idx == 0 else 'DRAFT'
                boq, boq_created = BOQ.objects.get_or_create(
                    project=project,
                    site=site,
                    version=1,
                    defaults={'status': boq_status, 'template': entry['program_code']},
                )
                if boq_created:
                    self.stdout.write(f"    Created BOQ ({boq_status}) for {site.name}")
                    if boq_status == 'PUBLISHED':
                        for template in BOQ_ITEM_TEMPLATES:
                            defaults = {
                                k: v
                                for k, v in template.items()
                                if k not in ('item', 'no')
                            }
                            BOQItem.objects.get_or_create(
                                boq=boq,
                                item=template['item'],
                                no=template['no'],
                                defaults=defaults,
                            )
                        boq.status = 'PUBLISHED'
                        boq.save(update_fields=['status'])
                        self.stdout.write(
                            f"      Added {len(BOQ_ITEM_TEMPLATES)} BOQ items"
                        )

        self.stdout.write(self.style.SUCCESS('Demo data seed finished.'))
