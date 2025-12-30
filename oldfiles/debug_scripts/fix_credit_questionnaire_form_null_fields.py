#!/usr/bin/env python3
"""
Script to fix all CreditQuestionnaireForm fields that have blank=True but missing null=True
"""

import re

def fix_questionnaire_form_fields():
    """Fix all CreditQuestionnaireForm fields by adding null=True where missing"""
    
    file_path = '/Users/gavinslater/projects/credit-project/credit_applications/models.py'
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # List of fields that need fixing (from manual analysis)
    fields_to_fix = [
        'primary_products',
        'trading_flow_drivers', 
        'position_size_drivers',
        'typical_max_tenor',
        'strategic_vs_proprietary',
        'icbcs_financing',
        'total_counterparty_financing_lines',
        'repo_hedging_management',
        'location_grade_details',
        'exit_risk_limits',
        'other_secured_trade_finance',
        'repo_balance_sheet_treatment',
        'notional_value_requested',
        'icbcs_proportion_total_book',
        'total_position_capacity',
        'position_business_context',
        'material_basis_risk',
        'hedge_accounting',
        'market_stress_tests',
        'stress_management',
        'stress_governance',
        'stress_assumptions',
        'trading_policy_governance',
        'available_derivative_lines',
        'cash_banking_lines',
        'treasury_management_structure',
        'usd_cash_location',
        'china_parent_restrictions',
        'margining_vs_unmargined'
    ]
    
    # Pattern to find field definitions with blank=True but not null=True
    # This will match the pattern: field_name = models.SomeField(..., blank=True, ...)
    
    for field_name in fields_to_fix:
        # Pattern to match the field definition
        pattern = rf'({field_name}\s*=\s*models\.\w+\([^)]*?)(\n\s+blank=True,)'
        
        # Check if null=True is already present
        if f'{field_name}' in content and 'null=True' not in content[content.find(field_name):content.find(field_name) + 200]:
            # Replace blank=True with null=True,\n        blank=True
            replacement = r'\1\n        null=True,\2'
            content = re.sub(pattern, replacement, content)
            print(f"Fixed {field_name}")
        else:
            print(f"Skipped {field_name} (already has null=True or not found)")
    
    # Write the file back
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("All CreditQuestionnaireForm fields fixed!")

if __name__ == "__main__":
    fix_questionnaire_form_fields()