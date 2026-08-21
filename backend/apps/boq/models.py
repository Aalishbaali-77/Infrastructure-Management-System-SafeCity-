from django.db import models

from apps.core.models import BaseModel
from apps.projects.models import Project


class BOQ(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('UPLOADING', 'Uploading'),
        ('PARSING', 'Parsing'),
        ('READY', 'Ready'),
        ('PUBLISHED', 'Published'),
    ]

    project = models.ForeignKey(Project, related_name='boqs', on_delete=models.CASCADE)
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    template = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"BOQ v{self.version} - {self.project.name}"


class BOQItem(BaseModel):
    """
    Line item matching the SC-GIMS import BOQ spreadsheet columns.
    Derived fields (fob_total, price_with_*, total_ddp_*) are computed properties.
    """

    boq = models.ForeignKey(BOQ, related_name='items', on_delete=models.CASCADE)

    # Identity / catalogue
    pc1 = models.CharField(max_length=50, blank=True, default='')
    no = models.PositiveIntegerField(default=1)
    item_type = models.CharField(max_length=100, blank=True, default='')
    item = models.CharField(max_length=100)
    item_description = models.TextField()
    model_name = models.CharField(max_length=150, blank=True, default='')
    model = models.CharField(max_length=150, blank=True, default='')
    oem = models.CharField(max_length=150, blank=True, default='')
    unit = models.CharField(max_length=20)
    package_qty = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    qty = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # FOB / HS / currency
    fob = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    hs_code_description = models.TextField(blank=True, default='')
    hs_code = models.CharField(max_length=50, blank=True, default='')
    curr = models.CharField(max_length=10, default='USD')
    tax = models.CharField(max_length=50, blank=True, default='')
    curr_rate = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    # Percentage inputs
    bank_charges_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    freight_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    landing_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    insurance_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    cd_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    acd_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    rd_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    st_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    ast_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    it_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    cess_pct = models.DecimalField(max_digits=8, decimal_places=4, default=0)

    # Absolute cost columns
    bank_charges = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    freight_insurance = models.DecimalField(
        max_digits=14, decimal_places=4, default=0,
        help_text='F/I',
    )
    price_with_fi = models.DecimalField(
        max_digits=14, decimal_places=4, default=0,
        help_text='PriceWithF/I',
    )
    landing = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    insurance = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    custom_duty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    addl_custom_duty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    regulatory_duty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    sales_tax = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    addl_sales_tax = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    income_tax = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    cess_tax = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    ddp_unit_usd = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    ddp_unit_pkr = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # App tracking (not in spreadsheet)
    actual_quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    quantity_tolerance_pct = models.DecimalField(max_digits=5, decimal_places=2, default=5)

    class Meta:
        ordering = ['no', 'item']

    # --- Derived (Excel formulas) ---

    @property
    def fob_total(self):
        return self.fob * self.qty

    @property
    def price_with_landing(self):
        """PriceWithLanding (AF+AG) = PriceWithF/I + Landing."""
        return self.price_with_fi + self.landing

    @property
    def price_with_insurance(self):
        """PriceWithInsurance (AH+AI) = PriceWithLanding + Insurance."""
        return self.price_with_landing + self.insurance

    @property
    def total_ddp_usd(self):
        return self.ddp_unit_usd * self.qty

    @property
    def total_ddp_pkr(self):
        return self.ddp_unit_pkr * self.qty

    # Aliases used by progress / variance UIs
    @property
    def item_code(self):
        return self.item

    @property
    def description(self):
        return self.item_description

    @property
    def planned_quantity(self):
        return self.qty

    @property
    def amount(self):
        return self.total_ddp_pkr

    def __str__(self):
        return f"{self.item} - {self.item_description[:30]}"