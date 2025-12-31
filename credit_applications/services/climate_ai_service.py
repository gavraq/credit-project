"""
Climate Scorecard AI Service.

Integrates with the Risk Agent service to generate AI-powered Climate Scorecards.
The Risk Agent uses the climate-scorecard-filler skill to research counterparties
and generate comprehensive PRA SS5/25-compliant assessments.

Architecture:
    Credit Workflow Backend
           │
           ▼ HTTP POST /query
    Telegram Agent Service (localhost:8095 or configured URL)
           │
           ▼
    Claude Agent SDK (in riskagent context)
           │
           ▼
    climate-scorecard-filler skill
           │
           ▼
    Structured JSON/Markdown response
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

# Risk Agent configuration
# Production: https://telegram.gavinslater.co.uk (requires nginx timeout > 5 mins)
# Local dev: http://localhost:8095
RISK_AGENT_URL = os.getenv('RISK_AGENT_URL', 'https://telegram.gavinslater.co.uk')
RISK_AGENT_API_KEY = os.getenv('RISK_AGENT_API_KEY', '')
RISK_AGENT_CWD = os.getenv('RISK_AGENT_CWD', '/Users/gavinslater/projects/riskagent')
RISK_AGENT_TIMEOUT = int(os.getenv('RISK_AGENT_TIMEOUT', '600'))  # 10 minutes default


class ClimateAIService:
    """
    Service for AI-powered Climate Scorecard generation.

    Connects to the Risk Agent service which runs the climate-scorecard-filler
    skill to research counterparties and generate comprehensive assessments.
    """

    def __init__(self):
        """Initialize the AI service with Risk Agent configuration."""
        self.agent_url = RISK_AGENT_URL
        self.api_key = RISK_AGENT_API_KEY
        self.cwd = RISK_AGENT_CWD
        self.timeout = RISK_AGENT_TIMEOUT

    def generate_scorecard(
        self,
        counterparty,
        credit_application,
        documents=None,
        use_mock=None
    ) -> Dict[str, Any]:
        """
        Generate Climate Scorecard fields using the Risk Agent service.

        Args:
            counterparty: Counterparty instance with name, sector, country
            credit_application: CreditApplication instance
            documents: Optional list of document contents to include
            use_mock: Force mock mode (True/False). If None, auto-detect.

        Returns:
            Dict containing:
                - fields: Dict of field_name -> value
                - confidence_scores: Dict of field_name -> 0.0-1.0
                - generation_notes: String with AI reasoning
                - model_version: String identifying the model used
        """
        # Determine if we should use mock mode
        if use_mock is None:
            # Check if Risk Agent is available
            use_mock = not self._check_agent_health()

        if use_mock:
            logger.info("Using mock AI generation (Risk Agent not available)")
            return self._generate_mock_scorecard(counterparty)

        try:
            return self._generate_via_risk_agent(
                counterparty,
                credit_application,
                documents
            )
        except Exception as e:
            logger.error(f"Risk Agent generation failed, falling back to mock: {e}")
            return self._generate_mock_scorecard(counterparty)

    def _check_agent_health(self) -> bool:
        """Check if the Risk Agent service is available."""
        try:
            response = requests.get(
                f"{self.agent_url}/health",
                timeout=5
            )
            return response.status_code == 200
        except requests.RequestException as e:
            logger.warning(f"Risk Agent health check failed: {e}")
            return False

    def _generate_via_risk_agent(
        self,
        counterparty,
        credit_application,
        documents
    ) -> Dict[str, Any]:
        """
        Generate scorecard by calling the Risk Agent service.

        Sends a structured JSON request via Telegram message that the Risk Agent
        identifies as coming from the Credit Workflow System.
        """
        # Build counterparty data
        counterparty_name = counterparty.name if counterparty else "Unknown"
        sector = getattr(counterparty, 'sector', 'Unknown') if counterparty else "Unknown"
        country = getattr(counterparty, 'country', 'Unknown') if counterparty else "Unknown"
        counterparty_id = str(counterparty.id) if counterparty and hasattr(counterparty, 'id') else None

        # Build credit application data
        credit_app_data = {}
        if credit_application:
            credit_app_data = {
                'id': str(credit_application.id) if hasattr(credit_application, 'id') else None,
                'credit_request_amount': float(credit_application.credit_request_amount) if hasattr(credit_application, 'credit_request_amount') and credit_application.credit_request_amount else None,
                'currency': getattr(credit_application, 'credit_request_currency', 'GBP'),
                'description': getattr(credit_application, 'description', ''),
            }

        # Build documents list
        docs_list = []
        if documents:
            if isinstance(documents, list):
                for doc in documents:
                    if isinstance(doc, dict):
                        docs_list.append({
                            'name': doc.get('name', doc.get('filename', 'Unknown')),
                            'url': doc.get('url', ''),
                        })
                    elif isinstance(doc, str):
                        docs_list.append({'name': doc, 'url': ''})
            elif isinstance(documents, str):
                # If documents is a string, include as context
                docs_list.append({'name': 'Provided context', 'content': documents})

        # Build the structured request payload
        request_payload = {
            'source_system': 'credit_workflow',
            'request_type': 'climate_scorecard_generation',
            'version': '1.0',
            'counterparty': {
                'name': counterparty_name,
                'sector': sector,
                'country': country,
                'id': counterparty_id,
            },
            'credit_application': credit_app_data,
            'documents': docs_list,
            'existing_data': {},
        }

        # Construct the message with embedded JSON
        message = f"""Generate climate scorecard for this credit application:

{json.dumps(request_payload, indent=2)}

Please analyse any available documents and return a comprehensive PRA SS5/25-compliant climate scorecard using the latest available information. Return the results as a JSON code block with the complete scorecard_data structure."""

        logger.info(f"Sending climate scorecard request to Risk Agent for: {counterparty_name}")

        # Call the Risk Agent
        headers = {}
        if self.api_key:
            headers['X-API-Key'] = self.api_key

        try:
            response = requests.post(
                f"{self.agent_url}/query",
                json={
                    "message": message,
                    "cwd": self.cwd,
                    "session_id": None  # New session for each generation
                },
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Risk Agent request failed: {e}")
            raise RuntimeError(f"Failed to contact Risk Agent: {e}")

        result = response.json()
        agent_response = result.get('response', '')

        logger.info(f"Risk Agent response received, parsing...")

        # Parse the response to extract structured data
        parsed = self._parse_agent_response(agent_response)

        # Add metadata
        parsed['model_version'] = f"risk-agent-{result.get('session_id', 'unknown')}"
        parsed['tools_used'] = result.get('tools_used', [])
        parsed['skills_used'] = result.get('skills_used', [])

        return parsed

    def _parse_agent_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the Risk Agent response to extract structured scorecard data.

        The agent may return:
        1. New format: JSON with 'scorecard_data' wrapper (from credit_workflow requests)
        2. Legacy format: JSON with 'fields' at top level
        3. Old skill format: JSON with 'transition_risks' / 'physical_risks'
        4. Markdown with embedded JSON
        5. A full scorecard report that needs field extraction
        """
        # Try to find a JSON block in the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                parsed = self._process_parsed_json(data)
                if parsed:
                    return parsed
            except json.JSONDecodeError:
                logger.warning("Found JSON block but failed to parse")

        # Try to find raw JSON object
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                potential_json = response_text[json_start:json_end]
                data = json.loads(potential_json)
                parsed = self._process_parsed_json(data)
                if parsed:
                    return parsed
        except json.JSONDecodeError:
            pass

        # Fall back to extracting from markdown/text
        logger.info("Parsing scorecard from text response")
        return self._extract_from_text(response_text)

    def _process_parsed_json(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process parsed JSON data from Risk Agent response.

        Handles multiple response formats:
        - New format with 'scorecard_data' wrapper
        - Legacy format with 'fields' at top level
        - Old skill format with 'transition_risks' / 'physical_risks'
        """
        # New format: scorecard_data wrapper (from credit_workflow requests)
        if 'scorecard_data' in data:
            scorecard_data = data['scorecard_data']
            confidence_scores = data.get('confidence_scores', {})
            generation_notes = data.get('generation_notes', '')

            # The scorecard_data contains all fields directly
            return {
                'fields': scorecard_data,
                'confidence_scores': confidence_scores,
                'generation_notes': generation_notes,
            }

        # Legacy format: fields at top level
        if 'fields' in data:
            return data

        # Old skill format: transition_risks / physical_risks structure
        if 'transition_risks' in data or 'physical_risks' in data:
            return self._map_skill_output_to_model(data)

        # Check if it's a flat scorecard structure (all fields at top level)
        scorecard_fields = [
            'overall_climate_risk_rating', 'overall_transition_risk_score',
            'overall_physical_risk_score', 'net_zero_target_exists',
            'tcfd_disclosure_level', 'risk_appetite_category'
        ]
        if any(field in data for field in scorecard_fields):
            # Treat the entire object as scorecard fields
            return {
                'fields': data,
                'confidence_scores': {},
                'generation_notes': 'Parsed from flat JSON structure',
            }

        return None

    def _map_skill_output_to_model(self, skill_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map the climate-scorecard-filler skill output format to our model fields.

        The skill outputs a comprehensive JSON structure with:
            - overall_assessment (score, rating, override_required)
            - transition_risks.categories (policy, technology, market, legal)
            - physical_risks.categories (acute, chronic, ecosystem)
            - strengths, vulnerabilities, key_recommendations
            - scenario_analysis, icaap_considerations
            - monitoring_triggers, data_quality

        We map these to our ClimateScorecard model fields.
        """
        fields = {}
        confidence_scores = {}

        # Helper to get nested value safely
        def get_nested(data, *keys, default=None):
            for key in keys:
                if isinstance(data, dict):
                    data = data.get(key, default)
                else:
                    return default
            return data

        # Map overall assessment (handle both nested and flat formats)
        overall = skill_output.get('overall_assessment', {})
        overall_score = (
            overall.get('overall_climate_risk_score') or
            skill_output.get('overall_climate_risk_score') or
            3.0
        )
        fields['overall_climate_risk_rating'] = self._score_to_rating(overall_score)
        confidence_scores['overall_climate_risk_rating'] = 0.8

        # Map rating override to risk appetite (check both formats)
        rating_override_required = (
            overall.get('rating_override_required') or
            skill_output.get('rating_override_required') or
            False
        )
        if rating_override_required:
            fields['risk_appetite_category'] = 'manage'
            # If mandatory override, set to 'avoid'
            override_dir = skill_output.get('rating_override_direction', '').upper()
            if 'MANDATORY' in str(skill_output.get('rating_override_notches', '')).upper():
                fields['risk_appetite_category'] = 'avoid'
        else:
            fields['risk_appetite_category'] = 'acceptable'
        confidence_scores['risk_appetite_category'] = 0.75

        # Map transition risk scores from categories structure
        # Handle both formats: transition_risks.categories and transition_risk_assessment.components
        tr = skill_output.get('transition_risks', {}) or skill_output.get('transition_risk_assessment', {})
        if tr:
            # Overall transition score
            if 'overall_score' in tr:
                fields['overall_transition_risk_score'] = self._score_to_risk_level(tr['overall_score'])
                confidence_scores['overall_transition_risk_score'] = 0.8

            categories = tr.get('categories', {}) or tr.get('components', {})

            # Policy/Regulatory Risk
            policy = categories.get('policy_regulatory_risk', {})
            if policy:
                score = policy.get('score', 3)
                fields['policy_pressure_score'] = self._invert_risk_score(score)
                drivers = policy.get('key_drivers', [])
                if drivers:
                    fields['policy_pressure_jurisdictions'] = '; '.join(drivers[:3])
                fields['policy_pressure_carbon_pricing_exposure'] = any(
                    'carbon' in d.lower() or 'ets' in d.lower() for d in drivers
                )
                confidence_scores['policy_pressure_score'] = 0.75

            # Technology Risk
            tech = categories.get('technology_risk', {})
            if tech:
                score = tech.get('score', 3)
                fields['tech_disruption_score'] = self._invert_risk_score(score)
                fields['tech_disruption_risk_level'] = self._score_to_exposure_level(score)
                drivers = tech.get('key_drivers', [])
                if drivers:
                    fields['tech_disruption_assessment'] = '; '.join(drivers[:3])
                confidence_scores['tech_disruption_score'] = 0.75

            # Market & Sentiment Risk
            market = categories.get('market_sentiment_risk', {})
            if market:
                score = market.get('score', 3)
                fields['market_sentiment_score'] = self._invert_risk_score(score)
                fields['market_sentiment_investor_pressure'] = self._score_to_exposure_level(score)
                confidence_scores['market_sentiment_score'] = 0.75

            # Legal/Liability Risk -> Litigation
            legal = categories.get('legal_liability_risk', {})
            if legal:
                score = legal.get('score', 3)
                fields['litigation_score'] = self._invert_risk_score(score)
                drivers = legal.get('key_drivers', [])
                if drivers:
                    fields['litigation_exposure_assessment'] = '; '.join(drivers[:3])
                confidence_scores['litigation_score'] = 0.75

        # Map physical risk scores from categories structure
        # Handle both formats: physical_risks.categories and physical_risk_assessment.components
        pr = skill_output.get('physical_risks', {}) or skill_output.get('physical_risk_assessment', {})
        if pr:
            # Overall physical score
            if 'overall_score' in pr:
                fields['overall_physical_risk_score'] = self._score_to_risk_level(pr['overall_score'])
                confidence_scores['overall_physical_risk_score'] = 0.8

            categories = pr.get('categories', {}) or pr.get('components', {})

            # Acute Physical Risks
            acute = categories.get('acute_physical_risks', {})
            if acute:
                score = acute.get('score', 3)
                fields['acute_hazard_score'] = self._invert_risk_score(score)
                fields['acute_hazard_exposure'] = self._score_to_exposure_level(score)
                drivers = acute.get('key_drivers', [])
                if drivers:
                    # Extract hazard types from drivers
                    hazard_types = []
                    for d in drivers:
                        d_lower = d.lower()
                        if 'flood' in d_lower:
                            hazard_types.append('floods')
                        if 'drought' in d_lower:
                            hazard_types.append('droughts')
                        if 'storm' in d_lower or 'hurricane' in d_lower:
                            hazard_types.append('storms')
                        if 'fire' in d_lower or 'wildfire' in d_lower:
                            hazard_types.append('wildfires')
                    fields['acute_hazard_types'] = list(set(hazard_types)) or ['floods', 'storms']
                confidence_scores['acute_hazard_score'] = 0.75

            # Chronic Physical Risks
            chronic = categories.get('chronic_physical_risks', {})
            if chronic:
                score = chronic.get('score', 3)
                fields['chronic_exposure_score'] = self._invert_risk_score(score)
                drivers = chronic.get('key_drivers', [])
                if drivers:
                    fields['chronic_exposure_assessment'] = '; '.join(drivers[:3])
                confidence_scores['chronic_exposure_score'] = 0.75

            # Ecosystem Risks (handle both naming conventions)
            ecosystem = categories.get('ecosystem_risks', {}) or categories.get('ecosystem_environmental_risks', {})
            if ecosystem:
                score = ecosystem.get('score', 3)
                fields['ecosystem_dependency_score'] = self._invert_risk_score(score)
                fields['ecosystem_dependency_level'] = self._score_to_exposure_level(score)
                drivers = ecosystem.get('key_drivers', [])
                if drivers:
                    fields['ecosystem_dependency_assessment'] = '; '.join(drivers[:3])
                confidence_scores['ecosystem_dependency_score'] = 0.75

        # Map vulnerabilities to key_risk_drivers
        vulnerabilities = skill_output.get('vulnerabilities', [])
        if vulnerabilities:
            fields['key_risk_drivers'] = '; '.join(vulnerabilities[:5])
            confidence_scores['key_risk_drivers'] = 0.8

        # Map strengths to key_opportunities
        strengths = skill_output.get('strengths', [])
        if strengths:
            fields['key_opportunities'] = '; '.join(strengths[:5])
            confidence_scores['key_opportunities'] = 0.8

        # Map key_recommendations to recommended_mitigations
        recommendations = skill_output.get('key_recommendations', [])
        if recommendations:
            fields['recommended_mitigations'] = '; '.join(recommendations[:5])
            confidence_scores['recommended_mitigations'] = 0.8

        # Map monitoring_triggers
        triggers = skill_output.get('monitoring_triggers', [])
        if triggers:
            fields['monitoring_triggers'] = '; '.join(triggers[:5])
            confidence_scores['monitoring_triggers'] = 0.8

        # Map data_quality
        data_quality = skill_output.get('data_quality', {})
        if data_quality:
            rating = data_quality.get('overall_rating', 'fair').lower()
            rating_map = {
                'high': 'good', 'medium-high': 'good',
                'medium': 'fair', 'medium-low': 'fair',
                'low': 'poor'
            }
            fields['data_quality_overall'] = rating_map.get(rating, 'fair')

            gaps = data_quality.get('critical_gaps', [])
            if gaps:
                fields['data_gaps_identified'] = '; '.join(gaps[:5])
            confidence_scores['data_quality_overall'] = 0.7

        # Map ICAAP considerations
        icaap = skill_output.get('icaap_considerations', {})
        if icaap:
            addon_bps = icaap.get('pillar_2_climate_capital_addon_bps', '')
            if addon_bps:
                # Parse range like "130-250" and take midpoint
                if isinstance(addon_bps, str) and '-' in addon_bps:
                    try:
                        low, high = map(float, addon_bps.split('-'))
                        midpoint = (low + high) / 2 / 100  # Convert bps to percentage
                        fields['capital_add_on_recommendation'] = round(midpoint, 2)
                    except (ValueError, TypeError):
                        pass
                elif isinstance(addon_bps, (int, float)):
                    fields['capital_add_on_recommendation'] = addon_bps / 100

            conclusion = icaap.get('capital_adequacy_conclusion', '')
            if 'adequate' in conclusion.lower():
                fields['pillar_2_treatment'] = 'low_add_on'
            elif 'material' in conclusion.lower():
                fields['pillar_2_treatment'] = 'medium_add_on'
            else:
                fields['pillar_2_treatment'] = 'low_add_on'

            fields['icaap_materiality_assessment'] = conclusion
            confidence_scores['pillar_2_treatment'] = 0.7

        # Map scenario analysis if available
        scenario = skill_output.get('scenario_analysis', {})
        if scenario:
            fields['scenario_analysis_conducted'] = True
            scenarios_used = list(scenario.keys())
            if scenarios_used:
                fields['scenario_analysis_scenarios'] = scenarios_used[:3]
            confidence_scores['scenario_analysis_conducted'] = 0.8

        # Map next_review_date with safe date parsing
        # Handle both formats: next_review.scheduled_date and assessment_metadata.next_review_due
        next_review = skill_output.get('next_review', {})
        metadata = skill_output.get('assessment_metadata', {})

        scheduled_date = (
            next_review.get('scheduled_date', '') or
            metadata.get('next_review_due', '')
        )
        if scheduled_date:
            parsed_date = self._parse_date_safely(scheduled_date)
            if parsed_date:
                fields['next_review_date'] = parsed_date
                confidence_scores['next_review_date'] = 0.9

        # Build generation notes from assessment metadata
        metadata = skill_output.get('assessment_metadata', {})
        generation_notes = f"Generated via Risk Agent climate-scorecard-filler skill"
        if metadata:
            framework = metadata.get('framework', '')
            date = metadata.get('assessment_date', '')
            if framework:
                generation_notes += f". Framework: {framework}"
            if date:
                generation_notes += f". Assessment date: {date}"

        return {
            'fields': fields,
            'confidence_scores': confidence_scores,
            'generation_notes': generation_notes
        }

    def _invert_risk_score(self, risk_score: float) -> int:
        """
        Convert risk score (1=low risk, 5=high risk) to quality score (1=poor, 5=excellent).

        The skill uses 1-5 where higher = more risk.
        Our model uses 1-5 where higher = better (lower risk).
        """
        return max(1, min(5, 6 - int(round(risk_score))))

    def _score_to_risk_level(self, score: float) -> str:
        """Convert numeric score to risk level string."""
        if score <= 1.5:
            return 'low'
        elif score <= 2.5:
            return 'medium'
        elif score <= 3.5:
            return 'high'
        else:
            return 'critical'

    def _score_to_exposure_level(self, score: float) -> str:
        """Convert numeric score to exposure level."""
        if score <= 1.5:
            return 'low'
        elif score <= 2.5:
            return 'medium'
        elif score <= 3.5:
            return 'high'
        else:
            return 'critical'

    def _score_to_rating(self, score: float) -> str:
        """Convert overall numeric score to A-E rating."""
        if score <= 1.5:
            return 'A'
        elif score <= 2.0:
            return 'B'
        elif score <= 2.5:
            return 'C'
        elif score <= 3.5:
            return 'D'
        else:
            return 'E'

    def _parse_date_safely(self, date_str: str) -> Optional[str]:
        """
        Safely parse a date string, handling various formats.

        Returns date in YYYY-MM-DD format or None if parsing fails.
        Handles edge cases like "2026-12-31 or upon trigger event".
        """
        if not date_str:
            return None

        # Try to extract just the date portion if there's extra text
        # Look for YYYY-MM-DD pattern
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', str(date_str))
        if date_match:
            try:
                from datetime import datetime
                parsed = datetime.strptime(date_match.group(1), '%Y-%m-%d')
                return parsed.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                pass

        # Try other common formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%Y/%m/%d',
        ]

        for fmt in date_formats:
            try:
                from datetime import datetime
                parsed = datetime.strptime(str(date_str).strip(), fmt)
                return parsed.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                continue

        return None

    def _extract_from_text(self, response_text: str) -> Dict[str, Any]:
        """
        Extract scorecard fields from a text/markdown response.

        This is a fallback when we can't find structured JSON.
        """
        fields = {}
        confidence_scores = {}

        # Look for score patterns like "Score: 3/5" or "3 out of 5"
        score_pattern = r'(\w+)[\s:]+(\d)(?:/5|\s*out\s*of\s*5)'

        for match in re.finditer(score_pattern, response_text, re.IGNORECASE):
            field_hint = match.group(1).lower()
            score = int(match.group(2))

            # Map common field hints to our model fields
            field_map = {
                'transition': 'overall_transition_risk_score',
                'physical': 'overall_physical_risk_score',
                'policy': 'policy_pressure_score',
                'technology': 'tech_disruption_score',
                'market': 'market_sentiment_score',
                'legal': 'litigation_score',
                'litigation': 'litigation_score',
                'acute': 'acute_hazard_score',
                'chronic': 'chronic_exposure_score',
                'ecosystem': 'ecosystem_dependency_score',
            }

            for hint, field_name in field_map.items():
                if hint in field_hint:
                    if 'risk_score' in field_name:
                        fields[field_name] = self._score_to_risk_level(score)
                    else:
                        fields[field_name] = self._invert_risk_score(score)
                    confidence_scores[field_name] = 0.6
                    break

        # Extract overall rating if present
        rating_match = re.search(r'overall.*rating[:\s]+([A-E])', response_text, re.IGNORECASE)
        if rating_match:
            fields['overall_climate_risk_rating'] = rating_match.group(1).upper()
            confidence_scores['overall_climate_risk_rating'] = 0.7

        return {
            'fields': fields,
            'confidence_scores': confidence_scores,
            'generation_notes': f"Extracted from text response. Full response available in agent logs."
        }

    def _generate_mock_scorecard(self, counterparty) -> Dict[str, Any]:
        """
        Generate mock scorecard data for testing/development.
        Returns realistic placeholder values.
        """
        logger.info(f"Generating mock scorecard for: {counterparty.name if counterparty else 'Unknown'}")

        # Default mock values based on a typical mid-risk company
        fields = {
            # Section 2: Transition Preparedness
            'net_zero_target_exists': True,
            'net_zero_target_year': 2050,
            'net_zero_target_scope': 'scope_1_2',
            'net_zero_science_based': False,
            'net_zero_score': 3,
            'tcfd_disclosure_level': 'partial',
            'tcfd_disclosure_score': 3,
            'climate_governance_board': True,
            'climate_governance_exec_accountability': False,
            'climate_governance_incentives_linked': False,
            'climate_governance_score': 2,
            'transition_plan_exists': True,
            'transition_plan_published': False,
            'transition_plan_milestones': 'Phase 1: 2030 - 30% reduction; Phase 2: 2040 - 60% reduction; Phase 3: 2050 - Net Zero',
            'transition_plan_score': 3,
            'green_capex_percentage': 15.0,
            'capex_alignment_trajectory': 'stable',
            'capex_alignment_score': 3,

            # Section 3: Transition Vulnerability
            'carbon_intensity_scope1': 150.0,
            'carbon_intensity_scope2': 80.0,
            'carbon_intensity_scope3': 500.0,
            'carbon_intensity_trend': 'stable',
            'carbon_intensity_score': 3,
            'stranded_asset_exposure': 'medium',
            'stranded_asset_types': 'Legacy manufacturing facilities, fossil fuel-dependent equipment',
            'stranded_asset_score': 3,
            'policy_pressure_jurisdictions': 'EU (ETS), UK (Carbon Tax), USA (EPA regulations)',
            'policy_pressure_carbon_pricing_exposure': True,
            'policy_pressure_score': 3,
            'tech_disruption_risk_level': 'medium',
            'tech_disruption_assessment': 'Moderate exposure to technological disruption in core business segments',
            'tech_disruption_score': 3,
            'market_sentiment_esg_rating': 'BBB',
            'market_sentiment_investor_pressure': 'medium',
            'market_sentiment_score': 3,
            'litigation_current_cases': 0,
            'litigation_historical_cases': 1,
            'litigation_exposure_assessment': 'Low litigation risk based on current portfolio and historical track record',
            'litigation_score': 4,
            'country_dependency_high_risk_revenue': 20.0,
            'country_dependency_score': 3,

            # Section 4: Transition Opportunity
            'green_market_growth_potential': 'medium',
            'green_market_growth_assessment': 'Moderate opportunities in green product development and sustainable services',
            'green_market_growth_score': 3,
            'green_revenue_percentage': 10.0,
            'green_revenue_trend': 'growing',
            'green_revenue_score': 3,
            'competitive_advantage_assessment': 'Some early-mover advantages in sustainable product lines',
            'competitive_advantage_score': 3,

            # Section 5: Physical Risk
            'acute_hazard_exposure': 'medium',
            'acute_hazard_types': ['floods', 'storms'],
            'acute_hazard_score': 3,
            'chronic_exposure_assessment': 'Moderate exposure to temperature increases and water stress in some regions',
            'chronic_exposure_score': 3,
            'ecosystem_dependency_level': 'low',
            'ecosystem_dependency_assessment': 'Limited direct dependency on ecosystem services',
            'ecosystem_dependency_score': 4,
            'adaptation_capability_level': 'developing',
            'adaptation_investments': 'Initial investments in climate resilience and business continuity planning',
            'adaptation_capability_score': 3,
            'scenario_analysis_conducted': True,
            'scenario_analysis_scenarios': ['RCP 4.5', 'RCP 8.5'],
            'scenario_analysis_time_horizons': ['2030', '2050'],
            'scenario_analysis_integration': 'Scenario results inform capital planning but not fully integrated into strategy',
            'scenario_analysis_score': 3,

            # Section 6: Risk Appetite
            'risk_appetite_category': 'manage',
            'risk_appetite_justification': 'Climate risks are material but manageable with appropriate mitigations',
            'risk_appetite_conditions': 'Enhanced monitoring required; annual climate risk review; escalation triggers defined',

            # Section 7: Capital & ICAAP
            'pillar_2_treatment': 'low_add_on',
            'icaap_materiality_assessment': 'Climate risk is assessed as moderately material under stress scenarios',
            'capital_add_on_recommendation': 2.5,

            # Section 8: Data Quality
            'data_sources': ['Company sustainability report', 'CDP disclosures', 'Industry benchmarks', 'Public filings'],
            'data_proxies_used': 'Sector averages used for Scope 3 emissions where company-specific data unavailable',
            'data_gaps_identified': 'Limited physical risk location data; Scope 3 category 11 estimates uncertain',
            'data_quality_overall': 'fair',

            # Section 9: Summary
            'key_risk_drivers': 'Carbon intensity in core operations; Policy exposure in key markets; Stranded asset risk',
            'key_opportunities': 'Growing green revenue stream; Potential for market share gain in sustainable products',
            'recommended_mitigations': 'Accelerate decarbonization roadmap; Enhance climate governance; Increase green capex allocation',
            'monitoring_triggers': 'Material change in carbon pricing; ESG rating downgrade; Physical event impact on operations',
        }

        # Generate confidence scores (mock values between 0.5 and 0.9)
        confidence_scores = {field: 0.7 for field in fields.keys()}

        # Adjust some confidence scores to be more realistic
        high_confidence = ['net_zero_target_exists', 'climate_governance_board', 'scenario_analysis_conducted']
        low_confidence = ['carbon_intensity_scope3', 'country_dependency_high_risk_revenue', 'litigation_current_cases']

        for field in high_confidence:
            if field in confidence_scores:
                confidence_scores[field] = 0.85

        for field in low_confidence:
            if field in confidence_scores:
                confidence_scores[field] = 0.55

        return {
            'fields': fields,
            'confidence_scores': confidence_scores,
            'generation_notes': (
                f"Mock scorecard generated for {counterparty.name if counterparty else 'Unknown'}. "
                "This is placeholder data for development/testing purposes. "
                "In production, connect to the Risk Agent service for AI-powered generation."
            ),
            'model_version': 'mock-v1'
        }
