from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('boq', '0003_alter_boq_site'),
    ]

    operations = [
        migrations.RenameField(
            model_name='boqitem',
            old_name='item_code',
            new_name='item',
        ),
        migrations.RenameField(
            model_name='boqitem',
            old_name='description',
            new_name='item_description',
        ),
        migrations.RenameField(
            model_name='boqitem',
            old_name='planned_quantity',
            new_name='qty',
        ),
        migrations.RenameField(
            model_name='boqitem',
            old_name='rate',
            new_name='fob',
        ),
        migrations.AlterField(
            model_name='boqitem',
            name='item',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='boqitem',
            name='fob',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.RemoveField(
            model_name='boqitem',
            name='discipline',
        ),
        migrations.RemoveField(
            model_name='boqitem',
            name='installation_method',
        ),
        migrations.RemoveField(
            model_name='boqitem',
            name='specified_vendor',
        ),
        migrations.AddField(
            model_name='boqitem',
            name='pc1',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='no',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='item_type',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='model_name',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='model',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='oem',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='package_qty',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='hs_code_description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='hs_code',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='curr',
            field=models.CharField(default='USD', max_length=10),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='tax',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='curr_rate',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='bank_charges_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='freight_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='landing_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='insurance_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='cd_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='acd_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='rd_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='st_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='ast_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='it_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='cess_pct',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='bank_charges',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='freight_insurance',
            field=models.DecimalField(
                decimal_places=4, default=0, help_text='F/I', max_digits=14
            ),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='price_with_fi',
            field=models.DecimalField(
                decimal_places=4, default=0, help_text='PriceWithF/I', max_digits=14
            ),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='landing',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='insurance',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='custom_duty',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='addl_custom_duty',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='regulatory_duty',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='sales_tax',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='addl_sales_tax',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='income_tax',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='cess_tax',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='ddp_unit_usd',
            field=models.DecimalField(decimal_places=4, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='boqitem',
            name='ddp_unit_pkr',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AlterModelOptions(
            name='boqitem',
            options={'ordering': ['no', 'item']},
        ),
        migrations.AlterUniqueTogether(
            name='boqitem',
            unique_together={('boq', 'item', 'no')},
        ),
    ]
