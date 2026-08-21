from django.db import migrations


class Migration(migrations.Migration):
    """City table was already dropped by an earlier 0004 revision; sync Django state only."""

    dependencies = [
        ('provinces', '0004_district_town_hierarchy'),
        ('sites', '0003_site_town'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='City'),
            ],
            database_operations=[],
        ),
    ]
