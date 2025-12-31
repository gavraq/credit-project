# Risk Agent Climate Scorecard Output Schema

## Overview

This document defines the JSON output schema that the Risk Agent skill must produce to fully populate the Climate Scorecard form in the Credit Risk Workflow System.

The Climate Scorecard is a PRA SS5/25-compliant climate risk assessment with approximately 80 fields across 9 sections. The AI-generated output must include all fields with appropriate confidence scores.

---

## Request Identification

### Delivery Method: Telegram Message with JSON

Requests from the Credit Risk Workflow System are sent via **Telegram message** containing structured JSON. The Risk Agent (Claude) should parse the JSON from the message body to identify the source system.

### Source System Identifier

When a Telegram message contains the following JSON structure, it indicates a request from the Credit Risk Workflow System:

```json
{
  "source_system": "credit_workflow",
  "request_type": "climate_scorecard_generation",
  "version": "1.0",
  ...
}
```

### Trigger Conditions

The Risk Agent skill should use this Climate Scorecard output template when the Telegram message contains JSON with **ALL** of the following:

1. `source_system` equals `"credit_workflow"`
2. `request_type` equals `"climate_scorecard_generation"`

### Example Telegram Message

The Credit Workflow System will send a Telegram message like this:

```
Generate climate scorecard for this credit application:

{
  "source_system": "credit_workflow",
  "request_type": "climate_scorecard_generation",
  "version": "1.0",
  "counterparty": {
    "name": "Company Name Ltd",
    "sector": "Energy",
    "country": "United Kingdom",
    "id": "uuid-here"
  },
  "credit_application": {
    "id": "uuid-here",
    "credit_request_amount": 5000000,
    "currency": "GBP"
  },
  "documents": [
    {
      "name": "Annual Report 2024.pdf",
      "url": "..."
    },
    {
      "name": "TCFD Report 2024.pdf",
      "url": "..."
    }
  ],
  "existing_data": {}
}
```

### Document Analysis Requirements

The Risk Agent should analyse **all provided documents** for climate-relevant information to populate the PRA SS5/25 compliant scorecard. Documents may include (but are not limited to):

| Document Type | Climate Information Typically Found |
|---------------|-------------------------------------|
| Annual Report / Annual Accounts | Emissions data, climate governance disclosures, risk factors |
| TCFD Report | Governance, strategy, risk management, metrics & targets |
| CDP Questionnaire Response | Detailed emissions, targets, transition plans |
| Net Zero Transition Plan | Decarbonisation pathway, milestones, capex alignment |
| ESG/Sustainability Report | ESG ratings, environmental initiatives, performance |
| Climate Risk Assessment | Physical and transition risk exposures |
| Science-Based Targets Initiative (SBTi) Commitment | Validated targets, scope coverage |
| Investor Presentations | Strategic climate commitments, green revenue |

**Key principles:**
- Extract climate-related information from whatever documents are available, not expect specific document types
- Many counterparties may only have an Annual Report, while others may have comprehensive TCFD disclosures
- **Always use the latest/most recent documents available** - climate disclosures evolve rapidly and older data may be outdated
- When multiple years of the same document type are available, prioritise the most recent
- If data conflicts between documents, prefer the newer source

**PRA SS5/25 Focus Areas:**
- Transition risk preparedness (net-zero targets, TCFD, governance, transition plans, capex)
- Transition risk vulnerability (carbon intensity, stranded assets, policy exposure, litigation)
- Physical risk exposure (acute hazards, chronic exposure, adaptation capability)
- Scenario analysis integration

### Response Requirements

When the above JSON identifiers are detected in the message, the Risk Agent **MUST** return a response using the exact JSON schema defined in this document, including:
- All ~80 fields populated (use reasonable defaults if data unavailable)
- Confidence scores for each field (0.0-1.0)
- Generation notes explaining data sources and assumptions

The response should be returned as a JSON code block in the Telegram reply

---

## Current Issues Identified

Based on testing, the following fields are **not being populated** by the current Risk Agent skill:

### Missing/Empty Fields:
1. **Climate Governance** - checkboxes not set (board oversight, exec accountability, compensation linked)
2. **Transition Plan** - checkboxes and milestones text empty
3. **Green Capex %** - numeric value missing
4. **Carbon Intensity** - Scope 1, 2, 3 numeric values missing
5. **Stranded Asset Types** - descriptive text missing
6. **Policy Pressure Jurisdictions** - text missing
7. **Tech Disruption Assessment** - text missing
8. **Market Sentiment ESG Rating** - text missing
9. **Litigation Assessment** - text missing
10. **Country Dependency Revenue %** - numeric value missing
11. **Green Market Growth Assessment** - text missing
12. **Green Revenue %** - numeric value missing
13. **Competitive Advantage Assessment** - text missing
14. **Acute Hazard Types** - array missing
15. **Chronic Exposure Assessment** - text missing
16. **Ecosystem Dependency Assessment** - text missing
17. **Adaptation Investments** - text missing
18. **Scenario Analysis** - all fields empty (conducted, scenarios, time horizons, integration)
19. **Risk Appetite** - justification and conditions text missing
20. **Capital & ICAAP** - assessment text and add-on % missing
21. **Data Quality** - sources, proxies, gaps all missing
22. **Next Review Date** - date missing

---

## Required JSON Output Schema

The Risk Agent skill must return a JSON object with the following structure:

```json
{
  "scorecard_data": {
    // SECTION 1: Assessment Context (auto-populated by system, but can be suggested)
    "assessment_type": "initial|annual_review|event_triggered|material_change",

    // SECTION 2: Transition Risk - Preparedness
    "net_zero_target_exists": true,
    "net_zero_target_year": 2050,
    "net_zero_target_scope": "scope_1|scope_1_2|scope_1_2_3",
    "net_zero_science_based": false,
    "net_zero_score": 2,

    "tcfd_disclosure_level": "none|partial|full|verified",
    "tcfd_disclosure_score": 3,

    "climate_governance_board": true,
    "climate_governance_exec_accountability": true,
    "climate_governance_incentives_linked": false,
    "climate_governance_score": 3,

    "transition_plan_exists": true,
    "transition_plan_published": false,
    "transition_plan_milestones": "2025: 20% emissions reduction from 2019 baseline\n2030: 50% reduction, exit coal operations\n2040: Net-zero Scope 1 & 2\n2050: Net-zero all scopes",
    "transition_plan_score": 2,

    "green_capex_percentage": 15.5,
    "capex_alignment_trajectory": "increasing|stable|decreasing",
    "capex_alignment_score": 1,

    // SECTION 3: Transition Risk - Vulnerability
    "carbon_intensity_scope1": 850.25,
    "carbon_intensity_scope2": 120.50,
    "carbon_intensity_scope3": 2500.00,
    "carbon_intensity_trend": "declining|stable|increasing",
    "carbon_intensity_score": 1,

    "stranded_asset_exposure": "none|low|medium|high",
    "stranded_asset_types": "Coal-to-liquids facilities (Secunda plant valued at $8.5bn), coal mining operations (5 active mines), oil & gas upstream assets",
    "stranded_asset_score": 5,

    "policy_pressure_jurisdictions": "South Africa (carbon tax escalating to $30/tCO2e by 2030), EU (CBAM exposure on exports), USA (potential EPA regulations)",
    "policy_pressure_carbon_pricing_exposure": true,
    "policy_pressure_score": 2,

    "tech_disruption_risk_level": "low|medium|high|critical",
    "tech_disruption_assessment": "High disruption risk from: (1) Green hydrogen economics reaching parity by 2030-2035, (2) Battery electric vehicles reducing liquid fuel demand, (3) Renewable energy cost decline threatening gas-to-power. Partial mitigation through green hydrogen investments.",
    "tech_disruption_score": 2,

    "market_sentiment_esg_rating": "Sustainalytics 38.6 (Severe Risk), MSCI BB",
    "market_sentiment_investor_pressure": "low|medium|high",
    "market_sentiment_score": 2,

    "litigation_current_cases": 0,
    "litigation_historical_cases": 2,
    "litigation_exposure_assessment": "No current climate litigation. Historical cases include 2018 air quality dispute (settled) and 2020 water pollution complaint (resolved). Elevated future litigation risk due to sector exposure and Just Transition pressures in South Africa.",
    "litigation_score": 4,

    "country_dependency_high_risk_revenue": 85.5,
    "country_dependency_score": 2,

    // SECTION 4: Transition Risk - Opportunity
    "green_market_growth_potential": "none|low|medium|high|transformative",
    "green_market_growth_assessment": "Opportunities in: (1) Green hydrogen export to EU/Asia leveraging existing infrastructure, (2) Sustainable aviation fuel production, (3) Circular economy waste-to-value from gasification expertise, (4) Solar/wind development in SA (excellent resources)",
    "green_market_growth_score": 1,

    "green_revenue_percentage": 3.5,
    "green_revenue_trend": "declining|stable|growing|rapidly_growing",
    "green_revenue_score": 1,

    "competitive_advantage_assessment": "Limited current advantage. Potential advantages: (1) Fischer-Tropsch technology adaptable to green hydrogen, (2) Large-scale project execution capability, (3) Established infrastructure corridors. Disadvantages: Heavy carbon lock-in, stranded asset overhang, limited balance sheet flexibility.",
    "competitive_advantage_score": 2,

    // SECTION 5: Physical Risk Assessment
    "acute_hazard_exposure": "low|medium|high|critical",
    "acute_hazard_types": ["floods", "storms", "water_stress", "extreme_heat"],
    "acute_hazard_score": 4,

    "chronic_exposure_assessment": "Key chronic risks: (1) Water stress at Secunda (110M m3/yr from stressed Vaal River system), (2) Rising temperatures affecting cooling efficiency at inland operations, (3) Sea level rise minimal impact (operations inland). Water security is primary chronic concern.",
    "chronic_exposure_score": 3,

    "ecosystem_dependency_level": "none|low|medium|high",
    "ecosystem_dependency_assessment": "Moderate ecosystem dependency: (1) Water-intensive operations reliant on Vaal River catchment, (2) Agricultural feedstocks for some chemical operations, (3) Biodiversity offsets required for mining operations. No critical single-ecosystem dependency.",
    "ecosystem_dependency_score": 3,

    "adaptation_capability_level": "none|limited|developing|mature",
    "adaptation_investments": "Current investments: (1) R2.5bn water recycling and efficiency program at Secunda, (2) Dry cooling technology pilots, (3) Climate-resilient infrastructure upgrades. Planned: Solar power for operations, alternative water sources assessment.",
    "adaptation_capability_score": 3,

    "scenario_analysis_conducted": true,
    "scenario_analysis_scenarios": ["IEA Net Zero 2050", "IEA Stated Policies", "NGFS Orderly Transition", "NGFS Disorderly"],
    "scenario_analysis_time_horizons": ["2030", "2040", "2050"],
    "scenario_analysis_integration": "Scenario results inform capital allocation (reduced fossil fuel expansion), stress testing (carbon price sensitivity analysis), and strategic planning (green hydrogen investment case). Annual board review of scenario implications.",
    "scenario_analysis_score": 3,

    // SECTION 6: Risk Appetite Alignment
    "risk_appetite_category": "avoid|manage|monitor|acceptable",
    "risk_appetite_justification": "MANAGE category appropriate due to: (1) Critical transition risk requiring active monitoring and covenants, (2) Demonstrated commitment to transition (green hydrogen investments), (3) Strategic importance of relationship, (4) Acceptable physical risk profile. Does not meet AVOID threshold as business model transformation is underway.",
    "risk_appetite_conditions": "Conditions for continued engagement: (1) Climate-linked covenants on annual emissions reduction, (2) Green CAPEX minimum thresholds, (3) Quarterly GHG reporting, (4) Annual climate risk review, (5) Exclusion of CTL expansion financing, (6) Short tenors (3-5yr max) with amortization.",

    // SECTION 7: Capital & ICAAP Considerations
    "pillar_2_treatment": "not_material|low_add_on|medium_add_on|high_add_on",
    "icaap_materiality_assessment": "Climate risk is MATERIAL for this exposure: (1) Single-name concentration in high-carbon sector, (2) Transition risk could impair repayment capacity under adverse scenarios, (3) Physical risk to collateral (if any) is moderate. Recommend explicit Pillar 2 consideration for climate-adjusted PD/LGD.",
    "capital_add_on_recommendation": 1.5,

    // SECTION 8: Data Quality Declaration
    "data_sources": ["CDP 2023 Submission", "TCFD Report 2023", "Annual Integrated Report 2023", "Sustainalytics", "MSCI ESG", "Company sustainability website", "Just Share analysis", "Centre for Environmental Rights reports"],
    "data_proxies_used": "Scope 3 emissions estimated using sector averages for categories 11 (use of sold products) where company-specific data unavailable. Carbon intensity benchmarked against sector peers for validation.",
    "data_gaps_identified": "Key data gaps: (1) Detailed asset-level physical risk assessment not available, (2) Supplier-specific Scope 3 data limited, (3) Forward-looking transition plan financial impacts not quantified, (4) Biodiversity impact metrics not systematically reported.",
    "data_quality_overall": "poor|fair|good|excellent",

    // SECTION 9: Summary & Recommendations
    "overall_transition_risk_score": "low|medium|high|critical",
    "overall_physical_risk_score": "low|medium|high|critical",
    "overall_climate_risk_rating": "A|B|C|D|E",

    "key_risk_drivers": "1) Stranded asset realization - Secunda CTL plant ($1.9bn impairment, world's largest single emitter 56.5 Mt CO2e/yr); 2) Carbon tax escalation to $30/tCO2e by 2030 creating $2-3bn annual liability; 3) Net-zero execution risk with green hydrogen projects stalled; 4) Water security at Secunda (110M m3/yr in stressed Vaal River System); 5) Market sentiment deterioration (Sustainalytics 38.6 Severe, 3.2°C trajectory)",

    "key_opportunities": "1) Chemical portfolio reorientation toward specialty/sustainable chemicals; 2) Green hydrogen/renewable energy if execution improves (2GW pipeline, SA solar/wind advantages); 3) Circular economy waste-to-value leveraging gasification expertise; 4) Just transition partnerships accessing $8.5bn JETP funding; 5) Water technology leadership exporting zero liquid effluent discharge expertise",

    "recommended_mitigations": "CREDIT STRUCTURE: 1) Climate-linked covenants (annual emission reduction targets, green CAPEX minimums, carbon tax coverage ratios); 2) Short tenors (3-5yr max) with amortization; 3) Exclude CTL assets from collateral; 4) Green use of proceeds restrictions. MONITORING: 5) Quarterly GHG/carbon tax reporting; 6) Annual climate risk reviews with independent engineering assessment; 7) Board climate expertise requirements. PORTFOLIO: 8) Cap exposure <2% of loan book; 9) Pillar 2 climate capital add-on (50-100bps); 10) Define climate-based exit triggers",

    "monitoring_triggers": "RED FLAGS: 1) Annual emissions fail to decline ≥3% YoY for 2 consecutive years; 2) Additional impairments >ZAR 10bn on fossil assets; 3) Carbon tax exceeds $25/tCO2e before 2028; 4) Green hydrogen project cancellation; 5) IVRS water allocation cuts >30%; 6) Secunda flooding shutdown >15 days/year; 7) CTL phase-out designation; 8) Sustainalytics ESG risk >40; 9) Climate litigation >$500M. FREQUENCY: Quarterly (emissions, tax, covenants), Annual (full scorecard update), Event-driven (impairments, regulations, weather, litigation)",

    "next_review_date": "2025-12-31"
  },

  "confidence_scores": {
    "net_zero_target_exists": 0.95,
    "net_zero_target_year": 0.90,
    "net_zero_target_scope": 0.85,
    "net_zero_science_based": 0.90,
    "net_zero_score": 0.80,
    "tcfd_disclosure_level": 0.90,
    "tcfd_disclosure_score": 0.80,
    "climate_governance_board": 0.85,
    "climate_governance_exec_accountability": 0.80,
    "climate_governance_incentives_linked": 0.75,
    "climate_governance_score": 0.75,
    "transition_plan_exists": 0.90,
    "transition_plan_published": 0.85,
    "transition_plan_milestones": 0.70,
    "transition_plan_score": 0.75,
    "green_capex_percentage": 0.60,
    "capex_alignment_trajectory": 0.75,
    "capex_alignment_score": 0.70,
    "carbon_intensity_scope1": 0.85,
    "carbon_intensity_scope2": 0.80,
    "carbon_intensity_scope3": 0.50,
    "carbon_intensity_trend": 0.80,
    "carbon_intensity_score": 0.75,
    "stranded_asset_exposure": 0.85,
    "stranded_asset_types": 0.80,
    "stranded_asset_score": 0.75,
    "policy_pressure_jurisdictions": 0.80,
    "policy_pressure_carbon_pricing_exposure": 0.90,
    "policy_pressure_score": 0.75,
    "tech_disruption_risk_level": 0.75,
    "tech_disruption_assessment": 0.70,
    "tech_disruption_score": 0.70,
    "market_sentiment_esg_rating": 0.95,
    "market_sentiment_investor_pressure": 0.80,
    "market_sentiment_score": 0.75,
    "litigation_current_cases": 0.85,
    "litigation_historical_cases": 0.75,
    "litigation_exposure_assessment": 0.70,
    "litigation_score": 0.75,
    "country_dependency_high_risk_revenue": 0.80,
    "country_dependency_score": 0.75,
    "green_market_growth_potential": 0.70,
    "green_market_growth_assessment": 0.65,
    "green_market_growth_score": 0.70,
    "green_revenue_percentage": 0.60,
    "green_revenue_trend": 0.70,
    "green_revenue_score": 0.70,
    "competitive_advantage_assessment": 0.65,
    "competitive_advantage_score": 0.65,
    "acute_hazard_exposure": 0.80,
    "acute_hazard_types": 0.75,
    "acute_hazard_score": 0.75,
    "chronic_exposure_assessment": 0.70,
    "chronic_exposure_score": 0.70,
    "ecosystem_dependency_level": 0.70,
    "ecosystem_dependency_assessment": 0.65,
    "ecosystem_dependency_score": 0.65,
    "adaptation_capability_level": 0.70,
    "adaptation_investments": 0.65,
    "adaptation_capability_score": 0.70,
    "scenario_analysis_conducted": 0.85,
    "scenario_analysis_scenarios": 0.80,
    "scenario_analysis_time_horizons": 0.80,
    "scenario_analysis_integration": 0.65,
    "scenario_analysis_score": 0.70,
    "risk_appetite_category": 0.75,
    "risk_appetite_justification": 0.70,
    "risk_appetite_conditions": 0.70,
    "pillar_2_treatment": 0.70,
    "icaap_materiality_assessment": 0.65,
    "capital_add_on_recommendation": 0.60,
    "data_sources": 0.90,
    "data_proxies_used": 0.75,
    "data_gaps_identified": 0.70,
    "data_quality_overall": 0.80,
    "overall_transition_risk_score": 0.85,
    "overall_physical_risk_score": 0.80,
    "overall_climate_risk_rating": 0.80,
    "key_risk_drivers": 0.85,
    "key_opportunities": 0.75,
    "recommended_mitigations": 0.80,
    "monitoring_triggers": 0.75,
    "next_review_date": 0.90
  },

  "generation_notes": "Comprehensive PRA SS5/25-compliant climate scorecard generated based on analysis of [Counterparty Name]'s climate disclosures, regulatory filings, ESG ratings, and independent research sources. Key data sources include CDP submissions, TCFD reports, and third-party ESG assessments. Confidence levels reflect data availability and verification status - lower confidence scores indicate areas requiring analyst verification or additional data gathering."
}
```

---

## Field Type Reference

### Enum/Choice Fields

| Field | Valid Values |
|-------|--------------|
| `assessment_type` | `initial`, `annual_review`, `event_triggered`, `material_change` |
| `net_zero_target_scope` | `scope_1`, `scope_1_2`, `scope_1_2_3` |
| `tcfd_disclosure_level` | `none`, `partial`, `full`, `verified` |
| `capex_alignment_trajectory` | `increasing`, `stable`, `decreasing` |
| `carbon_intensity_trend` | `declining`, `stable`, `increasing` |
| `stranded_asset_exposure` | `none`, `low`, `medium`, `high` |
| `tech_disruption_risk_level` | `low`, `medium`, `high`, `critical` |
| `market_sentiment_investor_pressure` | `low`, `medium`, `high` |
| `green_market_growth_potential` | `none`, `low`, `medium`, `high`, `transformative` |
| `green_revenue_trend` | `declining`, `stable`, `growing`, `rapidly_growing` |
| `acute_hazard_exposure` | `low`, `medium`, `high`, `critical` |
| `ecosystem_dependency_level` | `none`, `low`, `medium`, `high` |
| `adaptation_capability_level` | `none`, `limited`, `developing`, `mature` |
| `risk_appetite_category` | `avoid`, `manage`, `monitor`, `acceptable` |
| `pillar_2_treatment` | `not_material`, `low_add_on`, `medium_add_on`, `high_add_on` |
| `data_quality_overall` | `poor`, `fair`, `good`, `excellent` |
| `overall_transition_risk_score` | `low`, `medium`, `high`, `critical` |
| `overall_physical_risk_score` | `low`, `medium`, `high`, `critical` |
| `overall_climate_risk_rating` | `A`, `B`, `C`, `D`, `E` |

### Score Fields (Integer 1-5)

All fields ending in `_score` must be integers from 1 to 5:
- **1** = Very Weak / High Risk
- **2** = Weak / Elevated Risk
- **3** = Moderate / Average
- **4** = Good / Low Risk
- **5** = Excellent / Minimal Risk

### Numeric Fields (Decimal)

| Field | Type | Description |
|-------|------|-------------|
| `green_capex_percentage` | Decimal (0-100) | Percentage of capex aligned with Paris goals |
| `carbon_intensity_scope1` | Decimal | tCO2e per unit revenue |
| `carbon_intensity_scope2` | Decimal | tCO2e per unit revenue |
| `carbon_intensity_scope3` | Decimal | tCO2e per unit revenue |
| `country_dependency_high_risk_revenue` | Decimal (0-100) | % revenue from high-risk jurisdictions |
| `green_revenue_percentage` | Decimal (0-100) | % revenue from green products/services |
| `capital_add_on_recommendation` | Decimal | Recommended capital add-on % |

### Boolean Fields

| Field | Description |
|-------|-------------|
| `net_zero_target_exists` | Has net-zero target |
| `net_zero_science_based` | SBTi validated |
| `climate_governance_board` | Board-level oversight |
| `climate_governance_exec_accountability` | Executive accountability |
| `climate_governance_incentives_linked` | Compensation linked to climate |
| `transition_plan_exists` | Formal transition plan exists |
| `transition_plan_published` | Plan publicly available |
| `policy_pressure_carbon_pricing_exposure` | Exposed to carbon pricing |
| `scenario_analysis_conducted` | Scenario analysis done |

### Array/JSON Fields

| Field | Format |
|-------|--------|
| `acute_hazard_types` | Array of strings: `["floods", "storms", "wildfires", "extreme_heat", "drought", "water_stress"]` |
| `scenario_analysis_scenarios` | Array of strings: `["IEA Net Zero 2050", "RCP 2.6", "RCP 4.5", "RCP 8.5", "NGFS Orderly"]` |
| `scenario_analysis_time_horizons` | Array of strings: `["2030", "2040", "2050"]` |
| `data_sources` | Array of strings listing data sources used |

### Text Fields (Must be populated with substantive content)

| Field | Min Length | Description |
|-------|------------|-------------|
| `transition_plan_milestones` | 50 chars | Key milestones with years and targets |
| `stranded_asset_types` | 30 chars | Types of assets at risk |
| `policy_pressure_jurisdictions` | 30 chars | Key jurisdictions with regulatory pressure |
| `tech_disruption_assessment` | 100 chars | Assessment of technology disruption risks |
| `litigation_exposure_assessment` | 50 chars | Assessment of litigation exposure |
| `green_market_growth_assessment` | 100 chars | Assessment of green market opportunities |
| `competitive_advantage_assessment` | 100 chars | Competitive positioning assessment |
| `chronic_exposure_assessment` | 100 chars | Chronic climate risks assessment |
| `ecosystem_dependency_assessment` | 50 chars | Ecosystem dependencies assessment |
| `adaptation_investments` | 50 chars | Adaptation investments description |
| `scenario_analysis_integration` | 100 chars | How scenarios integrate into strategy |
| `risk_appetite_justification` | 100 chars | Justification for risk category |
| `risk_appetite_conditions` | 100 chars | Conditions for continued engagement |
| `icaap_materiality_assessment` | 100 chars | ICAAP materiality assessment |
| `data_proxies_used` | 50 chars | Description of proxies/estimates used |
| `data_gaps_identified` | 50 chars | Key data gaps identified |
| `key_risk_drivers` | 200 chars | Key climate risk drivers (numbered list) |
| `key_opportunities` | 150 chars | Key opportunities (numbered list) |
| `recommended_mitigations` | 200 chars | Risk mitigations (structured) |
| `monitoring_triggers` | 200 chars | Events triggering review (structured) |

### Date Fields

| Field | Format | Description |
|-------|--------|-------------|
| `next_review_date` | `YYYY-MM-DD` | Recommended next review date (typically 12 months) |

---

## Confidence Score Guidelines

Confidence scores (0.0 to 1.0) should reflect:

| Range | Meaning | Guidance |
|-------|---------|----------|
| 0.90-1.00 | Very High | Directly from verified company disclosures |
| 0.75-0.89 | High | From multiple corroborating sources |
| 0.60-0.74 | Medium | From single unverified source or inference |
| 0.40-0.59 | Low | Estimated/proxy data used |
| 0.00-0.39 | Very Low | Limited data, high uncertainty |

---

## Integration Notes

The Credit Risk system calls the Risk Agent API at:
```
POST /query
{
  "query": "Generate a comprehensive PRA SS5/25 climate scorecard for [Counterparty Name]...",
  "format": "json"
}
```

The system expects the response to include the `scorecard_data`, `confidence_scores`, and `generation_notes` as defined above.

All fields must be present in the response. Use `null` only for fields where data is genuinely unavailable and cannot be estimated.
