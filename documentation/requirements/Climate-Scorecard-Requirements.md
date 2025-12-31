# Climate Scorecard Feature Requirements

## Document Information
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Created | 2025-12-30 |
| Status | Approved for Implementation |
| Author | Claude Code |

## 1. Executive Summary

This document defines the requirements for a comprehensive PRA SS5/25-compliant Climate Scorecard feature. The scorecard will be implemented as a **separate sub-form** within the Credit Risk Workflow System, featuring AI-powered field generation with analyst review capabilities.

This is the **first AI-powered feature** in the Credit Risk system, establishing patterns for future AI integrations.

## 2. Business Context

### 2.1 Current State
The Credit Analysis Form contains 4 basic climate fields:
- `climate_risk_score` (Low/Medium/High dropdown)
- `esg_score` (Low/Medium/High dropdown)
- `transition_risk_assessment` (free text)
- `physical_risk_assessment` (free text)

These fields are insufficient for:
- PRA SS5/25 regulatory compliance
- Comprehensive transition risk assessment
- Physical risk scenario analysis
- Data quality documentation
- Capital/ICAAP considerations

### 2.2 Target State
A comprehensive Climate Scorecard with ~80 fields across 9 sections, featuring:
- Full PRA SS5/25 regulatory framework compliance
- AI-powered field generation with confidence scores
- Analyst review and override capabilities
- Integration with existing workflow system

### 2.3 Regulatory Framework
The scorecard aligns with **PRA SS5/25** (Supervisory Statement on climate risk), which requires banks to:
- Assess transition and physical climate risks
- Document scenario analysis quality
- Align with risk appetite frameworks
- Consider ICAAP/capital implications
- Maintain data quality standards

## 3. Functional Requirements

### 3.1 Form Structure

The Climate Scorecard shall contain the following sections:

| Section | Fields | Purpose |
|---------|--------|---------|
| 1. Assessment Context | 4 | Metadata: analyst, date, type, framework |
| 2. Transition Risk - Preparedness | 15 | 5 factors: Net-zero, TCFD, Governance, Plan, Capex |
| 3. Transition Risk - Vulnerability | 21 | 7 factors: Carbon, Stranded, Policy, Tech, Market, Litigation, Country |
| 4. Transition Risk - Opportunity | 9 | 3 factors: Market growth, Green revenue, Competitive advantage |
| 5. Physical Risk | 15 | 5 factors: Acute, Chronic, Ecosystem, Adaptation, Scenario |
| 6. Risk Appetite | 3 | Category, justification, conditions |
| 7. Capital & ICAAP | 3 | Pillar treatment, materiality, add-on |
| 8. Data Quality | 4 | Sources, proxies, gaps, overall quality |
| 9. Summary & AI Metadata | 15 | Scores, recommendations, AI tracking |

**Total: ~80 fields**

### 3.2 Scoring Methodology

#### 3.2.1 Factor Scores
- Each assessment factor scored 1-5 (1=Weak, 5=Strong)
- Scores stored as integers with evidence/assessment text

#### 3.2.2 Section Totals
- **Transition Preparedness**: Average of 5 factor scores
- **Transition Vulnerability**: Average of 7 factor scores
- **Transition Opportunity**: Average of 3 factor scores
- **Physical Risk**: Average of 5 factor scores

#### 3.2.3 Overall Scores
- **Transition Risk Score**: 30% Preparedness + 60% Vulnerability - 10% Opportunity Offset
- **Physical Risk Score**: Weighted average of physical factors
- **Combined Rating**: A-E scale based on combined scores

| Rating | Description | Score Range |
|--------|-------------|-------------|
| A | Minimal Risk | 4.0-5.0 |
| B | Low Risk | 3.0-3.9 |
| C | Moderate Risk | 2.0-2.9 |
| D | High Risk | 1.0-1.9 |
| E | Critical Risk | 0-0.9 |

### 3.3 AI Generation Requirements

#### 3.3.1 Trigger
- Manual "Generate with AI" button (not automatic)
- Available in Draft and Analyst Review states
- Requires user to confirm before generation

#### 3.3.2 Inputs
The AI service shall use:
- Counterparty name and sector
- Credit application context
- Attached documents (if available)
- External data sources (future enhancement)

#### 3.3.3 Outputs
The AI service shall return:
- Field values for all scorecard fields
- Confidence score (0.0-1.0) per field
- Generation notes explaining reasoning
- Model version identifier

#### 3.3.4 Confidence Display
- High confidence (>=0.8): Green indicator
- Medium confidence (0.6-0.79): Orange indicator
- Low confidence (<0.6): Red indicator
- Fields with low confidence flagged for review

#### 3.3.5 Analyst Review
- All AI-generated fields editable by analyst
- Changed fields tracked (AI original vs analyst final)
- Review status: Pending → Reviewed → Approved/Rejected

### 3.4 Workflow Requirements

#### 3.4.1 States
| State | Description |
|-------|-------------|
| CS_DRAFT | Initial state, no data entered |
| CS_AI_GENERATED | AI has populated fields, pending review |
| CS_ANALYST_REVIEW | Analyst is reviewing/editing |
| CS_SUBMITTED | Final submission, terminal state |

#### 3.4.2 Transitions
| From | To | Action | Allowed Roles |
|------|-----|--------|---------------|
| DRAFT | AI_GENERATED | Generate with AI | Credit Analyst |
| DRAFT | ANALYST_REVIEW | Start Manual Entry | Credit Analyst |
| AI_GENERATED | ANALYST_REVIEW | Review AI Output | Credit Analyst |
| ANALYST_REVIEW | ANALYST_REVIEW | Save Draft | Credit Analyst |
| ANALYST_REVIEW | AI_GENERATED | Regenerate | Credit Analyst |
| ANALYST_REVIEW | SUBMITTED | Submit | Credit Analyst |

#### 3.4.3 Permissions
| Role | View | Edit |
|------|------|------|
| Relationship Manager | Yes | No |
| Credit Analyst | Yes | Yes |
| Business Sponsor | Yes | No |
| Legal Reviewer | Yes | No |
| Credit Approver | Yes | No |
| Committee Approver | Yes | No |

### 3.5 Integration Requirements

#### 3.5.1 Credit Application Integration
- One ClimateScorecard per CreditApplication (OneToOne)
- Appears as sub-process in ApplicationDetails view
- Auto-initialized when application reaches appropriate state

#### 3.5.2 Data Migration
- Existing climate data in CreditAnalysisForm preserved
- Optionally migrated to new ClimateScorecard
- Old fields deprecated but not removed initially

## 4. Data Model Requirements

### 4.1 ClimateScorecard Model

```
ClimateScorecard
├── id (UUID, PK)
├── credit_application (FK, OneToOne)
├── workflow_instance (FK)
│
├── Section 1: Context
│   ├── analyst (FK User)
│   ├── assessment_date
│   ├── assessment_type
│   └── framework_version
│
├── Section 2: Transition Preparedness
│   ├── net_zero_* (5 fields)
│   ├── tcfd_* (2 fields)
│   ├── climate_governance_* (4 fields)
│   ├── transition_plan_* (4 fields)
│   ├── capex_* (3 fields)
│   └── transition_preparedness_total
│
├── Section 3: Transition Vulnerability
│   ├── carbon_intensity_* (5 fields)
│   ├── stranded_asset_* (3 fields)
│   ├── policy_pressure_* (3 fields)
│   ├── tech_disruption_* (3 fields)
│   ├── market_sentiment_* (3 fields)
│   ├── litigation_* (4 fields)
│   ├── country_dependency_* (2 fields)
│   └── transition_vulnerability_total
│
├── Section 4: Transition Opportunity
│   ├── green_market_growth_* (3 fields)
│   ├── green_revenue_* (3 fields)
│   ├── competitive_advantage_* (2 fields)
│   └── transition_opportunity_total
│
├── Section 5: Physical Risk
│   ├── acute_hazard_* (3 fields)
│   ├── chronic_exposure_* (2 fields)
│   ├── ecosystem_dependency_* (3 fields)
│   ├── adaptation_capability_* (3 fields)
│   ├── scenario_analysis_* (5 fields)
│   └── physical_risk_total
│
├── Section 6: Risk Appetite
│   ├── risk_appetite_category
│   ├── risk_appetite_justification
│   └── risk_appetite_conditions
│
├── Section 7: Capital/ICAAP
│   ├── pillar_2_treatment
│   ├── icaap_materiality_assessment
│   └── capital_add_on_recommendation
│
├── Section 8: Data Quality
│   ├── data_sources (JSON)
│   ├── data_proxies_used
│   ├── data_gaps_identified
│   └── data_quality_overall
│
├── Section 9: Summary
│   ├── overall_transition_risk_score
│   ├── overall_physical_risk_score
│   ├── overall_climate_risk_rating
│   ├── key_risk_drivers
│   ├── key_opportunities
│   ├── recommended_mitigations
│   ├── monitoring_triggers
│   └── next_review_date
│
├── AI Metadata
│   ├── ai_generated
│   ├── ai_generated_at
│   ├── ai_model_version
│   ├── ai_confidence_scores (JSON)
│   ├── ai_generation_notes
│   └── analyst_review_status
│
└── Timestamps
    ├── created_at
    ├── updated_at
    ├── form_started_at
    ├── form_completed_at
    └── form_last_saved_at
```

### 4.2 Field Types Summary
| Type | Count | Examples |
|------|-------|----------|
| CharField (choices) | ~25 | risk levels, categories |
| IntegerField (1-5 scores) | ~20 | factor scores |
| DecimalField | ~10 | percentages, totals |
| TextField | ~15 | assessments, notes |
| BooleanField | ~10 | yes/no flags |
| JSONField | ~5 | arrays, complex data |
| DateField | ~3 | dates |
| DateTimeField | ~5 | timestamps |
| ForeignKey | ~3 | relationships |

## 5. API Requirements

### 5.1 Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/credit/credit-applications/{id}/` | Include scorecard in response |
| PATCH | `/api/credit/credit-applications/{id}/save_climate_scorecard/` | Save form data |
| POST | `/api/credit/credit-applications/{id}/climate-scorecard/generate/` | Trigger AI generation |

### 5.2 Payload Structure

#### Save Scorecard (PATCH)
```json
{
  "climate_scorecard_analyst": "uuid",
  "climate_scorecard_assessment_date": "2025-01-15",
  "climate_scorecard_net_zero_target_exists": true,
  "climate_scorecard_net_zero_target_year": 2050,
  "climate_scorecard_net_zero_score": 4,
  ...
}
```

#### Generate Response (POST)
```json
{
  "success": true,
  "fields": {
    "net_zero_target_exists": true,
    "net_zero_target_year": 2050,
    ...
  },
  "confidence_scores": {
    "net_zero_target_exists": 0.95,
    "net_zero_target_year": 0.87,
    ...
  },
  "generation_notes": "Based on company sustainability report 2024...",
  "model_version": "claude-3-opus-20240229"
}
```

## 6. UI Requirements

### 6.1 Form Layout
- 9-tab interface matching scorecard sections
- Progress indicator showing completion status
- AI Generation Panel at top of form

### 6.2 AI Generation Panel
- "Generate with AI" button (prominent, primary color)
- Loading state during generation
- Overall confidence score display
- "Regenerate" option after initial generation

### 6.3 Field Display
- Standard Material-UI form controls
- Confidence indicator (colored dot) next to AI-generated fields
- Tooltip showing confidence percentage
- Visual distinction for analyst-modified fields

### 6.4 Scoring Display
- Score gauges/meters for section totals
- Overall rating prominently displayed
- Color coding: A=Green, B=Light Green, C=Yellow, D=Orange, E=Red

## 7. Non-Functional Requirements

### 7.1 Performance
- AI generation: <60 second timeout
- Form save: <2 seconds
- Form load: <1 second

### 7.2 Security
- AI API key stored in environment variables
- All API calls require JWT authentication
- Audit log of all AI generations

### 7.3 Error Handling
- Graceful degradation if AI service unavailable
- Manual entry always available as fallback
- Clear error messages for validation failures

## 8. Future Enhancements (Out of Scope)

- Automated data fetching from external ESG providers
- Document OCR for automatic data extraction
- Comparison with peer companies
- Historical trend analysis
- Automated monitoring triggers
- Integration with external climate databases

## 9. Acceptance Criteria

1. [ ] ClimateScorecard model created with all fields
2. [ ] API endpoints functional (GET, PATCH, POST generate)
3. [ ] Workflow states and transitions working
4. [ ] Form metadata and permissions configured
5. [ ] Frontend form renders all 9 tabs
6. [ ] AI generation populates all fields
7. [ ] Confidence scores displayed per field
8. [ ] Analyst can review and modify AI output
9. [ ] Scorecard appears in ApplicationDetails sub-process list
10. [ ] Data migration from old fields (if applicable)

## 10. References

- PRA SS5/25: https://www.bankofengland.co.uk/prudential-regulation/publication/2019/enhancing-banks-and-insurers-approaches-to-managing-the-financial-risks-from-climate-change-ss
- TCFD Recommendations: https://www.fsb-tcfd.org/recommendations/
- Example Scorecards:
  - GCB Bank ICBC Climate Scorecard
  - Sasol PRA SS5/25 Enhanced Scorecard
