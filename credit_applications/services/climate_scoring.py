"""
Climate Scorecard Scoring Service.

Implements the scoring methodology defined in the PRA SS5/25 Enhanced Climate Scorecard.
All scores are on a 1-5 scale (1=Weak, 5=Strong).
"""

import logging
from decimal import Decimal

logger = logging.getLogger(__name__)


def _safe_decimal(value, default=Decimal('0')):
    """Safely convert a value to Decimal."""
    if value is None:
        return default
    try:
        return Decimal(str(value))
    except (ValueError, TypeError):
        return default


def _average_scores(scores):
    """Calculate average of scores, ignoring None values."""
    valid_scores = [s for s in scores if s is not None]
    if not valid_scores:
        return None
    return sum(valid_scores) / len(valid_scores)


def calculate_transition_preparedness_score(scorecard):
    """
    Calculate Transition Risk - Preparedness Total.
    Average of 5 factor scores:
    - Net-Zero Target Score
    - TCFD Disclosure Score
    - Climate Governance Score
    - Transition Plan Score
    - Capex Alignment Score

    Returns:
        Decimal score or None if insufficient data
    """
    scores = [
        scorecard.net_zero_score,
        scorecard.tcfd_disclosure_score,
        scorecard.climate_governance_score,
        scorecard.transition_plan_score,
        scorecard.capex_alignment_score,
    ]

    avg = _average_scores(scores)
    if avg is not None:
        return _safe_decimal(round(avg, 2))
    return None


def calculate_transition_vulnerability_score(scorecard):
    """
    Calculate Transition Risk - Vulnerability Total.
    Average of 7 factor scores:
    - Carbon Intensity Score
    - Stranded Asset Score
    - Policy Pressure Score
    - Technology Disruption Score
    - Market Sentiment Score
    - Litigation Score
    - Country Dependency Score

    Returns:
        Decimal score or None if insufficient data
    """
    scores = [
        scorecard.carbon_intensity_score,
        scorecard.stranded_asset_score,
        scorecard.policy_pressure_score,
        scorecard.tech_disruption_score,
        scorecard.market_sentiment_score,
        scorecard.litigation_score,
        scorecard.country_dependency_score,
    ]

    avg = _average_scores(scores)
    if avg is not None:
        return _safe_decimal(round(avg, 2))
    return None


def calculate_transition_opportunity_score(scorecard):
    """
    Calculate Transition Risk - Opportunity Total.
    Average of 3 factor scores:
    - Green Market Growth Score
    - Green Revenue Score
    - Competitive Advantage Score

    Returns:
        Decimal score or None if insufficient data
    """
    scores = [
        scorecard.green_market_growth_score,
        scorecard.green_revenue_score,
        scorecard.competitive_advantage_score,
    ]

    avg = _average_scores(scores)
    if avg is not None:
        return _safe_decimal(round(avg, 2))
    return None


def calculate_physical_risk_score(scorecard):
    """
    Calculate Physical Risk Total.
    Average of 5 factor scores:
    - Acute Hazard Score
    - Chronic Exposure Score
    - Ecosystem Dependency Score
    - Adaptation Capability Score
    - Scenario Analysis Score

    Returns:
        Decimal score or None if insufficient data
    """
    scores = [
        scorecard.acute_hazard_score,
        scorecard.chronic_exposure_score,
        scorecard.ecosystem_dependency_score,
        scorecard.adaptation_capability_score,
        scorecard.scenario_analysis_score,
    ]

    avg = _average_scores(scores)
    if avg is not None:
        return _safe_decimal(round(avg, 2))
    return None


def calculate_overall_transition_risk_score(scorecard):
    """
    Calculate Overall Transition Risk Score.
    Formula: 30% Preparedness + 60% Vulnerability - 10% Opportunity Offset

    Higher score = higher risk (inverted for preparedness and opportunity)

    Returns:
        String risk level: 'low', 'medium', 'high', or 'critical'
    """
    prep = calculate_transition_preparedness_score(scorecard)
    vuln = calculate_transition_vulnerability_score(scorecard)
    opp = calculate_transition_opportunity_score(scorecard)

    if prep is None or vuln is None:
        return None

    # Invert preparedness (higher prep = lower risk)
    prep_risk = Decimal('6') - prep

    # Vulnerability is already aligned (higher vuln = higher risk)
    vuln_risk = vuln

    # Opportunity offset (higher opportunity = lower risk)
    opp_offset = _safe_decimal(opp) if opp else Decimal('0')

    # Calculate weighted score
    # Higher values = higher risk
    weighted_score = (
        Decimal('0.3') * prep_risk +
        Decimal('0.6') * vuln_risk -
        Decimal('0.1') * opp_offset
    )

    # Map to risk categories
    if weighted_score <= Decimal('1.5'):
        return 'low'
    elif weighted_score <= Decimal('2.5'):
        return 'medium'
    elif weighted_score <= Decimal('3.5'):
        return 'high'
    else:
        return 'critical'


def calculate_overall_physical_risk_score(scorecard):
    """
    Calculate Overall Physical Risk Score.
    Based on physical risk total with adjustment for adaptation capability.

    Returns:
        String risk level: 'low', 'medium', 'high', or 'critical'
    """
    physical_total = calculate_physical_risk_score(scorecard)

    if physical_total is None:
        return None

    # Invert: higher score (better) = lower risk
    risk_score = Decimal('6') - physical_total

    # Map to risk categories
    if risk_score <= Decimal('1.5'):
        return 'low'
    elif risk_score <= Decimal('2.5'):
        return 'medium'
    elif risk_score <= Decimal('3.5'):
        return 'high'
    else:
        return 'critical'


def calculate_overall_climate_rating(scorecard):
    """
    Calculate Overall Climate Risk Rating (A-E scale).
    Based on combined transition and physical risk scores.

    | Rating | Description | Score Range |
    |--------|-------------|-------------|
    | A | Minimal Risk | 4.0-5.0 |
    | B | Low Risk | 3.0-3.9 |
    | C | Moderate Risk | 2.0-2.9 |
    | D | High Risk | 1.0-1.9 |
    | E | Critical Risk | 0-0.9 |

    Returns:
        String rating: 'A', 'B', 'C', 'D', or 'E'
    """
    # Calculate section totals
    prep = calculate_transition_preparedness_score(scorecard)
    vuln = calculate_transition_vulnerability_score(scorecard)
    opp = calculate_transition_opportunity_score(scorecard)
    phys = calculate_physical_risk_score(scorecard)

    if prep is None and vuln is None and phys is None:
        return None

    # Calculate overall score (average of available scores)
    # Higher = better (lower risk)
    scores = []
    if prep is not None:
        scores.append(prep)
    if opp is not None:
        scores.append(opp)
    if phys is not None:
        scores.append(phys)

    # Vulnerability is inverted (high vuln = bad)
    if vuln is not None:
        scores.append(Decimal('6') - vuln)

    if not scores:
        return None

    overall = sum(scores) / len(scores)

    # Map to letter grades
    if overall >= Decimal('4.0'):
        return 'A'
    elif overall >= Decimal('3.0'):
        return 'B'
    elif overall >= Decimal('2.0'):
        return 'C'
    elif overall >= Decimal('1.0'):
        return 'D'
    else:
        return 'E'


def update_scorecard_totals(scorecard):
    """
    Update all calculated totals on a scorecard instance.
    Call this after AI generation or manual edits to ensure totals are current.

    Args:
        scorecard: ClimateScorecard instance

    Returns:
        Updated scorecard instance (not saved)
    """
    # Update section totals
    scorecard.transition_preparedness_total = calculate_transition_preparedness_score(scorecard)
    scorecard.transition_vulnerability_total = calculate_transition_vulnerability_score(scorecard)
    scorecard.transition_opportunity_total = calculate_transition_opportunity_score(scorecard)
    scorecard.physical_risk_total = calculate_physical_risk_score(scorecard)

    # Update overall scores
    scorecard.overall_transition_risk_score = calculate_overall_transition_risk_score(scorecard)
    scorecard.overall_physical_risk_score = calculate_overall_physical_risk_score(scorecard)
    scorecard.overall_climate_risk_rating = calculate_overall_climate_rating(scorecard)

    logger.info(
        f"Updated scorecard totals: "
        f"prep={scorecard.transition_preparedness_total}, "
        f"vuln={scorecard.transition_vulnerability_total}, "
        f"opp={scorecard.transition_opportunity_total}, "
        f"phys={scorecard.physical_risk_total}, "
        f"rating={scorecard.overall_climate_risk_rating}"
    )

    return scorecard
