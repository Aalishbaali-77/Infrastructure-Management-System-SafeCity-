from apps.boq.models import BOQ, BOQItem

boq = BOQ.objects.filter(site__isnull=False).first()
if boq is None:
    raise SystemExit('No BOQ with a site found. Create a project/site/BOQ first.')

BOQItem.objects.create(
    boq=boq,
    no=1,
    item_type='CIVIL',
    item='CIV-001',
    item_description='Foundation excavation',
    unit='m3',
    package_qty=1,
    qty=500,
    fob=1200,
    curr='USD',
    curr_rate=280,
    ddp_unit_usd=1300,
    ddp_unit_pkr=364000,
    actual_quantity=480,
)
BOQItem.objects.create(
    boq=boq,
    no=2,
    item_type='FIBER',
    item='FIB-001',
    item_description='Fiber cable laying',
    unit='m',
    package_qty=1,
    qty=2000,
    fob=350,
    curr='USD',
    curr_rate=280,
    ddp_unit_usd=380,
    ddp_unit_pkr=106400,
    actual_quantity=1900,
)
