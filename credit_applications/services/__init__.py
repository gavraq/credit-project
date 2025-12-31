"""
Services module for Credit Applications.

Contains AI service integrations and scoring calculations for the Climate Scorecard.
"""

from .climate_ai_service import ClimateAIService
from .climate_scoring import (
    calculate_transition_preparedness_score,
    calculate_transition_vulnerability_score,
    calculate_transition_opportunity_score,
    calculate_physical_risk_score,
    calculate_overall_transition_risk_score,
    calculate_overall_climate_rating,
)

__all__ = [
    'ClimateAIService',
    'calculate_transition_preparedness_score',
    'calculate_transition_vulnerability_score',
    'calculate_transition_opportunity_score',
    'calculate_physical_risk_score',
    'calculate_overall_transition_risk_score',
    'calculate_overall_climate_rating',
]
