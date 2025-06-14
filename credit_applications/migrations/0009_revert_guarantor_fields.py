# Generated manually on 2025-06-14
from django.db import migrations, models, connection

def drop_guarantor_id_column(apps, schema_editor):
    # We need to check if the column exists before trying to drop it,
    # as this migration might be run on a DB that never had it.
    db_table = 'credit_applications_creditrequestform'
    column_name = 'guarantor_id'
    
    with connection.cursor() as cursor:
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = '{db_table}'
                AND column_name = '{column_name}'
            );
        """)
        column_exists = cursor.fetchone()[0]

    if column_exists:
        schema_editor.execute(f"ALTER TABLE {db_table} DROP COLUMN {column_name} CASCADE;")


class Migration(migrations.Migration):

    dependencies = [
        ('credit_applications', '0008_rename_second_business_sponsor_creditrequestform_second_business_sponsor_name_and_more'),
    ]

    operations = [
        # Step 1: Manually drop the 'guarantor_id' column if it exists
        migrations.RunPython(drop_guarantor_id_column, migrations.RunPython.noop),
        
        # Step 2: Add the CharField for guarantor_name
        migrations.AddField(
            model_name='creditrequestform',
            name='guarantor_name',
            field=models.CharField(max_length=255, blank=True, null=True),
        ),
        # Step 3: Add the CharField for guarantor_cif
        migrations.AddField(
            model_name='creditrequestform',
            name='guarantor_cif',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
    ]
