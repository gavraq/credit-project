from django.db import migrations
import datetime

def seed_limit_types(apps, schema_editor):
    LimitType = apps.get_model('credit_applications', 'LimitType')
    limit_types = [
        {"name": "High-Wrong-Way Risk (HWWR)", "code": "HWWR"},
        {"name": "IOSCO", "code": "IOSCO"},
        {"name": "Initial Margin (IM)", "code": "IM"},
        {"name": "Metal Lease", "code": "METAL_LEASE"},
        {"name": "Non-Performing Loans (NPL)", "code": "NPL"},
        {"name": "Nostro (Primary)", "code": "NOSTRO_PRIMARY"},
        {"name": "Right-Way Risk (RWR)", "code": "RWR"},
        {"name": "Standby Letter of Credit (SBLC)", "code": "SBLC"},
        {"name": "Total Return Swap (TRS)", "code": "TRS"},
        {"name": "Trading (Pre-Settlement)", "code": "TRADING_PRE_SETTLEMENT"},
        {"name": "Trading (Settlement)", "code": "TRADING_SETTLEMENT"},
        {"name": "Variation Margin (VM)", "code": "VM"},
    ]
    for lt in limit_types:
        LimitType.objects.update_or_create(code=lt["code"], defaults={"name": lt["name"]})

def seed_counterparties(apps, schema_editor):
    Counterparty = apps.get_model('credit_applications', 'Counterparty')
    now = datetime.datetime.now()
    counterparties = [
        {"name": "Test Corporation Ltd", "cif_number": "CIF1746474242", "country_of_incorporation": "United Kingdom", "business_description": "Test company for workflow testing"},
        {"name": "Global Mining Corp", "cif_number": "GC12345", "country_of_incorporation": "Australia", "business_description": "Diversified mining group with assets in multiple continents."},
        {"name": "Euro Metal Trading", "cif_number": "ET98765", "country_of_incorporation": "Germany", "business_description": "European trading house focused on ferrous and non-ferrous metals."},
        {"name": "American Steel Inc", "cif_number": "AS24680", "country_of_incorporation": "United States", "business_description": "Major steel manufacturer with global exports."},
        {"name": "Asian Commodities Ltd", "cif_number": "AC13579", "country_of_incorporation": "Singapore", "business_description": "Commodities trading firm specializing in metals and energy."},
        {"name": "Africa Resources", "cif_number": "AR75319", "country_of_incorporation": "South Africa", "business_description": "Mining company with operations across Africa."},
    ]
    for cp in counterparties:
        Counterparty.objects.update_or_create(
            cif_number=cp["cif_number"],
            defaults={
                "name": cp["name"],
                "country_of_incorporation": cp["country_of_incorporation"],
                "business_description": cp["business_description"],
                "created_at": now,
                "updated_at": now,
            }
        )

def run_seed(apps, schema_editor):
    seed_limit_types(apps, schema_editor)
    seed_counterparties(apps, schema_editor)

class Migration(migrations.Migration):

    dependencies = [
        ("credit_applications", "0004_limittype_and_more"),
    ]

    operations = [
        migrations.RunPython(run_seed),
    ]

