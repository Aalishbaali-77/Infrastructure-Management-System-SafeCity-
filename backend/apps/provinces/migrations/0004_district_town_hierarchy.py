# Province → District → Town (replaces City)

import uuid

from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    City = apps.get_model('provinces', 'City')
    District = apps.get_model('provinces', 'District')
    Town = apps.get_model('provinces', 'Town')

    for city in City.objects.all():
        district, _ = District.objects.get_or_create(
            province_id=city.province_id,
            name=f'{city.name} District',
            defaults={'id': uuid.uuid4(), 'code': f'D-{city.code}'[:20]},
        )
        if not Town.objects.filter(pk=city.id).exists():
            Town.objects.create(
                id=city.id,
                district=district,
                name=city.name,
                code=city.code,
            )


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('provinces', '0003_province_code'),
    ]

    operations = [
        migrations.CreateModel(
            name='District',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=20, unique=True)),
                (
                    'province',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='districts',
                        to='provinces.province',
                    ),
                ),
            ],
            options={
                'ordering': ['name'],
                'unique_together': {('province', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Town',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=20, unique=True)),
                (
                    'district',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='towns',
                        to='provinces.district',
                    ),
                ),
            ],
            options={
                'ordering': ['name'],
                'unique_together': {('district', 'name')},
            },
        ),
        migrations.RunPython(forwards, backwards),
    ]
