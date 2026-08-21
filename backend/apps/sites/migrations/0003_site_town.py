# Site.city → Site.town (Town UUIDs match former City UUIDs)

import django.db.models.deletion
from django.db import migrations, models


def forwards(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    for site in Site.objects.all():
        Site.objects.filter(pk=site.pk).update(town_id=site.city_id)


def backwards(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    for site in Site.objects.all():
        Site.objects.filter(pk=site.pk).update(city_id=site.town_id)


class Migration(migrations.Migration):
    dependencies = [
        ('sites', '0002_alter_site_project'),
        ('provinces', '0004_district_town_hierarchy'),
    ]

    operations = [
        migrations.AddField(
            model_name='site',
            name='town',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='sites',
                to='provinces.town',
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name='site',
            name='city',
        ),
        migrations.AlterField(
            model_name='site',
            name='town',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='sites',
                to='provinces.town',
            ),
        ),
    ]
