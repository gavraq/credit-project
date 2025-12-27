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


def add_guarantor_fields(apps, schema_editor):
    """Add guarantor_name and guarantor_cif columns if they don't exist"""
    db_table = 'credit_applications_creditrequestform'

    with connection.cursor() as cursor:
        # Check and add guarantor_name
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = %s
                AND column_name = 'guarantor_name'
            );
        """, [db_table])
        if not cursor.fetchone()[0]:
            schema_editor.execute(f"ALTER TABLE {db_table} ADD COLUMN guarantor_name VARCHAR(255) NULL;")

        # Check and add guarantor_cif
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = %s
                AND column_name = 'guarantor_cif'
            );
        """, [db_table])
        if not cursor.fetchone()[0]:
            schema_editor.execute(f"ALTER TABLE {db_table} ADD COLUMN guarantor_cif VARCHAR(50) NULL;")


class Migration(migrations.Migration):

    dependencies = [
        ('credit_applications', '0008_rename_second_business_sponsor_creditrequestform_second_business_sponsor_name_and_more'),
    ]

    operations = [
        # Step 1: Manually drop the 'guarantor_id' column if it exists
        migrations.RunPython(drop_guarantor_id_column, migrations.RunPython.noop),

        # Step 2: Add guarantor fields only if they don't exist
        migrations.RunPython(add_guarantor_fields, migrations.RunPython.noop),
    ]
