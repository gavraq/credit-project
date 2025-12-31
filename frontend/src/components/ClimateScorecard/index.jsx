import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Tabs, Tab, Button, CircularProgress, Alert, Chip, Tooltip, LinearProgress,
  Typography, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { fetchCreditRequest, performWorkflowTransition, saveClimateScorecard, generateClimateScorecard, fetchUsersByRole } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';

// Confidence indicator component for AI-generated fields
const ConfidenceIndicator = ({ confidence, fieldName }) => {
  if (confidence === undefined || confidence === null) return null;

  let color = 'error';
  let label = 'Low';
  if (confidence >= 0.8) {
    color = 'success';
    label = 'High';
  } else if (confidence >= 0.6) {
    color = 'warning';
    label = 'Medium';
  }

  return (
    <Tooltip title={`AI Confidence: ${(confidence * 100).toFixed(0)}%`}>
      <Chip
        size="small"
        label={label}
        color={color}
        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
      />
    </Tooltip>
  );
};

const ClimateScorecard = ({ creditApplication: initialCreditApplication, currentStep = 4 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useSelector(state => state.auth.user);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Application state
  const [creditApplication, setCreditApplication] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Workflow state
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  // AI metadata
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiConfidenceScores, setAiConfidenceScores] = useState({});
  const [aiGenerationNotes, setAiGenerationNotes] = useState('');
  const [analystReviewStatus, setAnalystReviewStatus] = useState('pending');

  // Section 1: Assessment Context
  const [analyst, setAnalyst] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [assessmentType, setAssessmentType] = useState('initial');
  const [frameworkVersion, setFrameworkVersion] = useState('PRA_SS5_25_ENHANCED');

  // Section 2: Transition Preparedness
  const [netZeroTargetExists, setNetZeroTargetExists] = useState(false);
  const [netZeroTargetYear, setNetZeroTargetYear] = useState('');
  const [netZeroTargetScope, setNetZeroTargetScope] = useState('');
  const [netZeroScienceBased, setNetZeroScienceBased] = useState(false);
  const [netZeroScore, setNetZeroScore] = useState('');
  const [tcfdDisclosureLevel, setTcfdDisclosureLevel] = useState('');
  const [tcfdDisclosureScore, setTcfdDisclosureScore] = useState('');
  const [climateGovernanceBoard, setClimateGovernanceBoard] = useState(false);
  const [climateGovernanceExecAccountability, setClimateGovernanceExecAccountability] = useState(false);
  const [climateGovernanceIncentivesLinked, setClimateGovernanceIncentivesLinked] = useState(false);
  const [climateGovernanceScore, setClimateGovernanceScore] = useState('');
  const [transitionPlanExists, setTransitionPlanExists] = useState(false);
  const [transitionPlanPublished, setTransitionPlanPublished] = useState(false);
  const [transitionPlanMilestones, setTransitionPlanMilestones] = useState('');
  const [transitionPlanScore, setTransitionPlanScore] = useState('');
  const [greenCapexPercentage, setGreenCapexPercentage] = useState('');
  const [capexAlignmentTrajectory, setCapexAlignmentTrajectory] = useState('');
  const [capexAlignmentScore, setCapexAlignmentScore] = useState('');

  // Section 3: Transition Vulnerability
  const [carbonIntensityScope1, setCarbonIntensityScope1] = useState('');
  const [carbonIntensityScope2, setCarbonIntensityScope2] = useState('');
  const [carbonIntensityScope3, setCarbonIntensityScope3] = useState('');
  const [carbonIntensityTrend, setCarbonIntensityTrend] = useState('');
  const [carbonIntensityScore, setCarbonIntensityScore] = useState('');
  const [strandedAssetExposure, setStrandedAssetExposure] = useState('');
  const [strandedAssetTypes, setStrandedAssetTypes] = useState('');
  const [strandedAssetScore, setStrandedAssetScore] = useState('');
  const [policyPressureJurisdictions, setPolicyPressureJurisdictions] = useState('');
  const [policyPressureCarbonPricingExposure, setPolicyPressureCarbonPricingExposure] = useState(false);
  const [policyPressureScore, setPolicyPressureScore] = useState('');
  const [techDisruptionRiskLevel, setTechDisruptionRiskLevel] = useState('');
  const [techDisruptionAssessment, setTechDisruptionAssessment] = useState('');
  const [techDisruptionScore, setTechDisruptionScore] = useState('');
  const [marketSentimentEsgRating, setMarketSentimentEsgRating] = useState('');
  const [marketSentimentInvestorPressure, setMarketSentimentInvestorPressure] = useState('');
  const [marketSentimentScore, setMarketSentimentScore] = useState('');
  const [litigationCurrentCases, setLitigationCurrentCases] = useState('');
  const [litigationHistoricalCases, setLitigationHistoricalCases] = useState('');
  const [litigationExposureAssessment, setLitigationExposureAssessment] = useState('');
  const [litigationScore, setLitigationScore] = useState('');
  const [countryDependencyHighRiskRevenue, setCountryDependencyHighRiskRevenue] = useState('');
  const [countryDependencyScore, setCountryDependencyScore] = useState('');

  // Section 4: Transition Opportunity
  const [greenMarketGrowthPotential, setGreenMarketGrowthPotential] = useState('');
  const [greenMarketGrowthAssessment, setGreenMarketGrowthAssessment] = useState('');
  const [greenMarketGrowthScore, setGreenMarketGrowthScore] = useState('');
  const [greenRevenuePercentage, setGreenRevenuePercentage] = useState('');
  const [greenRevenueTrend, setGreenRevenueTrend] = useState('');
  const [greenRevenueScore, setGreenRevenueScore] = useState('');
  const [competitiveAdvantageAssessment, setCompetitiveAdvantageAssessment] = useState('');
  const [competitiveAdvantageScore, setCompetitiveAdvantageScore] = useState('');

  // Section 5: Physical Risk
  const [acuteHazardExposure, setAcuteHazardExposure] = useState('');
  const [acuteHazardTypes, setAcuteHazardTypes] = useState([]);
  const [acuteHazardScore, setAcuteHazardScore] = useState('');
  const [chronicExposureAssessment, setChronicExposureAssessment] = useState('');
  const [chronicExposureScore, setChronicExposureScore] = useState('');
  const [ecosystemDependencyLevel, setEcosystemDependencyLevel] = useState('');
  const [ecosystemDependencyAssessment, setEcosystemDependencyAssessment] = useState('');
  const [ecosystemDependencyScore, setEcosystemDependencyScore] = useState('');
  const [adaptationCapabilityLevel, setAdaptationCapabilityLevel] = useState('');
  const [adaptationInvestments, setAdaptationInvestments] = useState('');
  const [adaptationCapabilityScore, setAdaptationCapabilityScore] = useState('');
  const [scenarioAnalysisConducted, setScenarioAnalysisConducted] = useState(false);
  const [scenarioAnalysisScenarios, setScenarioAnalysisScenarios] = useState([]);
  const [scenarioAnalysisTimeHorizons, setScenarioAnalysisTimeHorizons] = useState([]);
  const [scenarioAnalysisIntegration, setScenarioAnalysisIntegration] = useState('');
  const [scenarioAnalysisScore, setScenarioAnalysisScore] = useState('');

  // Section 6: Risk Appetite
  const [riskAppetiteCategory, setRiskAppetiteCategory] = useState('');
  const [riskAppetiteJustification, setRiskAppetiteJustification] = useState('');
  const [riskAppetiteConditions, setRiskAppetiteConditions] = useState('');

  // Section 7: Capital & ICAAP
  const [pillar2Treatment, setPillar2Treatment] = useState('');
  const [icaapMaterialityAssessment, setIcaapMaterialityAssessment] = useState('');
  const [capitalAddOnRecommendation, setCapitalAddOnRecommendation] = useState('');

  // Section 8: Data Quality
  const [dataSources, setDataSources] = useState([]);
  const [dataProxiesUsed, setDataProxiesUsed] = useState('');
  const [dataGapsIdentified, setDataGapsIdentified] = useState('');
  const [dataQualityOverall, setDataQualityOverall] = useState('');

  // Section 9: Summary
  const [overallTransitionRiskScore, setOverallTransitionRiskScore] = useState('');
  const [overallPhysicalRiskScore, setOverallPhysicalRiskScore] = useState('');
  const [overallClimateRiskRating, setOverallClimateRiskRating] = useState('');
  const [keyRiskDrivers, setKeyRiskDrivers] = useState('');
  const [keyOpportunities, setKeyOpportunities] = useState('');
  const [recommendedMitigations, setRecommendedMitigations] = useState('');
  const [monitoringTriggers, setMonitoringTriggers] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState('');

  // Analysts list
  const [creditAnalysts, setCreditAnalysts] = useState([]);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);

  // Tab management
  const [activeTab, setActiveTab] = useState(0);

  const tabOptions = [
    "Assessment Context",
    "Transition Preparedness",
    "Transition Vulnerability",
    "Transition Opportunity",
    "Physical Risk",
    "Risk Appetite",
    "Capital & ICAAP",
    "Data Quality",
    "Summary"
  ];

  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7',
    success: '#38B2AC',
    warning: '#F6AD55',
    error: '#E53E3E',
    neutral100: '#FFFFFF',
    neutral200: '#F5F7FA',
    neutral300: '#E4E7EB',
    neutral400: '#CBD2D9',
    neutral500: '#9AA5B1',
    neutral600: '#7B8794',
    neutral700: '#4A5568',
    neutral800: '#323F4B',
    neutral900: '#1F2933'
  };

  // Score options for 1-5 scale
  const scoreOptions = [
    { value: '1', label: '1 - Very Weak/High Risk' },
    { value: '2', label: '2 - Weak/Elevated Risk' },
    { value: '3', label: '3 - Moderate/Average' },
    { value: '4', label: '4 - Good/Low Risk' },
    { value: '5', label: '5 - Excellent/Minimal Risk' },
  ];

  const populateFormData = useCallback((data) => {
    if (!data) return;
    setCreditApplication(data);

    const scorecard = data.climate_scorecard;
    if (!scorecard) return;

    // Set workflow information
    setWorkflowInstanceId(scorecard.workflow_instance?.id || null);
    setCurrentWorkflowState(scorecard.workflow_instance?.current_state || 'N/A');
    setAllowedTransitions(scorecard.available_transitions || []);

    // AI metadata
    setAiGenerated(scorecard.ai_generated || false);
    setAiConfidenceScores(scorecard.ai_confidence_scores || {});
    setAiGenerationNotes(scorecard.ai_generation_notes || '');
    setAnalystReviewStatus(scorecard.analyst_review_status || 'pending');

    // Section 1
    setAnalyst(scorecard.analyst || user?.id || '');
    setAssessmentDate(scorecard.assessment_date || new Date().toISOString().split('T')[0]);
    setAssessmentType(scorecard.assessment_type || 'initial');
    setFrameworkVersion(scorecard.framework_version || 'PRA_SS5_25_ENHANCED');

    // Section 2
    setNetZeroTargetExists(scorecard.net_zero_target_exists || false);
    setNetZeroTargetYear(scorecard.net_zero_target_year || '');
    setNetZeroTargetScope(scorecard.net_zero_target_scope || '');
    setNetZeroScienceBased(scorecard.net_zero_science_based || false);
    setNetZeroScore(scorecard.net_zero_score?.toString() || '');
    setTcfdDisclosureLevel(scorecard.tcfd_disclosure_level || '');
    setTcfdDisclosureScore(scorecard.tcfd_disclosure_score?.toString() || '');
    setClimateGovernanceBoard(scorecard.climate_governance_board || false);
    setClimateGovernanceExecAccountability(scorecard.climate_governance_exec_accountability || false);
    setClimateGovernanceIncentivesLinked(scorecard.climate_governance_incentives_linked || false);
    setClimateGovernanceScore(scorecard.climate_governance_score?.toString() || '');
    setTransitionPlanExists(scorecard.transition_plan_exists || false);
    setTransitionPlanPublished(scorecard.transition_plan_published || false);
    setTransitionPlanMilestones(scorecard.transition_plan_milestones || '');
    setTransitionPlanScore(scorecard.transition_plan_score?.toString() || '');
    setGreenCapexPercentage(scorecard.green_capex_percentage?.toString() || '');
    setCapexAlignmentTrajectory(scorecard.capex_alignment_trajectory || '');
    setCapexAlignmentScore(scorecard.capex_alignment_score?.toString() || '');

    // Section 3
    setCarbonIntensityScope1(scorecard.carbon_intensity_scope1?.toString() || '');
    setCarbonIntensityScope2(scorecard.carbon_intensity_scope2?.toString() || '');
    setCarbonIntensityScope3(scorecard.carbon_intensity_scope3?.toString() || '');
    setCarbonIntensityTrend(scorecard.carbon_intensity_trend || '');
    setCarbonIntensityScore(scorecard.carbon_intensity_score?.toString() || '');
    setStrandedAssetExposure(scorecard.stranded_asset_exposure || '');
    setStrandedAssetTypes(scorecard.stranded_asset_types || '');
    setStrandedAssetScore(scorecard.stranded_asset_score?.toString() || '');
    setPolicyPressureJurisdictions(scorecard.policy_pressure_jurisdictions || '');
    setPolicyPressureCarbonPricingExposure(scorecard.policy_pressure_carbon_pricing_exposure || false);
    setPolicyPressureScore(scorecard.policy_pressure_score?.toString() || '');
    setTechDisruptionRiskLevel(scorecard.tech_disruption_risk_level || '');
    setTechDisruptionAssessment(scorecard.tech_disruption_assessment || '');
    setTechDisruptionScore(scorecard.tech_disruption_score?.toString() || '');
    setMarketSentimentEsgRating(scorecard.market_sentiment_esg_rating || '');
    setMarketSentimentInvestorPressure(scorecard.market_sentiment_investor_pressure || '');
    setMarketSentimentScore(scorecard.market_sentiment_score?.toString() || '');
    setLitigationCurrentCases(scorecard.litigation_current_cases?.toString() || '');
    setLitigationHistoricalCases(scorecard.litigation_historical_cases?.toString() || '');
    setLitigationExposureAssessment(scorecard.litigation_exposure_assessment || '');
    setLitigationScore(scorecard.litigation_score?.toString() || '');
    setCountryDependencyHighRiskRevenue(scorecard.country_dependency_high_risk_revenue?.toString() || '');
    setCountryDependencyScore(scorecard.country_dependency_score?.toString() || '');

    // Section 4
    setGreenMarketGrowthPotential(scorecard.green_market_growth_potential || '');
    setGreenMarketGrowthAssessment(scorecard.green_market_growth_assessment || '');
    setGreenMarketGrowthScore(scorecard.green_market_growth_score?.toString() || '');
    setGreenRevenuePercentage(scorecard.green_revenue_percentage?.toString() || '');
    setGreenRevenueTrend(scorecard.green_revenue_trend || '');
    setGreenRevenueScore(scorecard.green_revenue_score?.toString() || '');
    setCompetitiveAdvantageAssessment(scorecard.competitive_advantage_assessment || '');
    setCompetitiveAdvantageScore(scorecard.competitive_advantage_score?.toString() || '');

    // Section 5
    setAcuteHazardExposure(scorecard.acute_hazard_exposure || '');
    setAcuteHazardTypes(scorecard.acute_hazard_types || []);
    setAcuteHazardScore(scorecard.acute_hazard_score?.toString() || '');
    setChronicExposureAssessment(scorecard.chronic_exposure_assessment || '');
    setChronicExposureScore(scorecard.chronic_exposure_score?.toString() || '');
    setEcosystemDependencyLevel(scorecard.ecosystem_dependency_level || '');
    setEcosystemDependencyAssessment(scorecard.ecosystem_dependency_assessment || '');
    setEcosystemDependencyScore(scorecard.ecosystem_dependency_score?.toString() || '');
    setAdaptationCapabilityLevel(scorecard.adaptation_capability_level || '');
    setAdaptationInvestments(scorecard.adaptation_investments || '');
    setAdaptationCapabilityScore(scorecard.adaptation_capability_score?.toString() || '');
    setScenarioAnalysisConducted(scorecard.scenario_analysis_conducted || false);
    setScenarioAnalysisScenarios(scorecard.scenario_analysis_scenarios || []);
    setScenarioAnalysisTimeHorizons(scorecard.scenario_analysis_time_horizons || []);
    setScenarioAnalysisIntegration(scorecard.scenario_analysis_integration || '');
    setScenarioAnalysisScore(scorecard.scenario_analysis_score?.toString() || '');

    // Section 6
    setRiskAppetiteCategory(scorecard.risk_appetite_category || '');
    setRiskAppetiteJustification(scorecard.risk_appetite_justification || '');
    setRiskAppetiteConditions(scorecard.risk_appetite_conditions || '');

    // Section 7
    setPillar2Treatment(scorecard.pillar_2_treatment || '');
    setIcaapMaterialityAssessment(scorecard.icaap_materiality_assessment || '');
    setCapitalAddOnRecommendation(scorecard.capital_add_on_recommendation?.toString() || '');

    // Section 8
    setDataSources(scorecard.data_sources || []);
    setDataProxiesUsed(scorecard.data_proxies_used || '');
    setDataGapsIdentified(scorecard.data_gaps_identified || '');
    setDataQualityOverall(scorecard.data_quality_overall || '');

    // Section 9
    setOverallTransitionRiskScore(scorecard.overall_transition_risk_score || '');
    setOverallPhysicalRiskScore(scorecard.overall_physical_risk_score || '');
    setOverallClimateRiskRating(scorecard.overall_climate_risk_rating || '');
    setKeyRiskDrivers(scorecard.key_risk_drivers || '');
    setKeyOpportunities(scorecard.key_opportunities || '');
    setRecommendedMitigations(scorecard.recommended_mitigations || '');
    setMonitoringTriggers(scorecard.monitoring_triggers || '');
    setNextReviewDate(scorecard.next_review_date || '');
  }, [user]);

  const fetchAndSetAnalysts = useCallback(async () => {
    setLoadingAnalysts(true);
    try {
      const analysts = await fetchUsersByRole('Credit Analyst');
      setCreditAnalysts(analysts || []);
    } catch (error) {
      console.error('Failed to fetch credit analysts:', error);
    } finally {
      setLoadingAnalysts(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Always fetch fresh data - don't rely on potentially stale initialCreditApplication
      // This ensures workflow transitions are always up-to-date
      setLoading(true);
      try {
        const data = await fetchCreditRequest(id);
        populateFormData(data);
      } catch (error) {
        console.error('Error fetching credit application:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    fetchAndSetAnalysts();
  }, [id, populateFormData, fetchAndSetAnalysts, refetchTrigger]);

  const buildFormData = () => {
    return {
      // Section 1
      analyst,
      assessment_date: assessmentDate,
      assessment_type: assessmentType,
      framework_version: frameworkVersion,
      // Section 2
      net_zero_target_exists: netZeroTargetExists,
      net_zero_target_year: netZeroTargetYear ? parseInt(netZeroTargetYear) : null,
      net_zero_target_scope: netZeroTargetScope,
      net_zero_science_based: netZeroScienceBased,
      net_zero_score: netZeroScore ? parseInt(netZeroScore) : null,
      tcfd_disclosure_level: tcfdDisclosureLevel,
      tcfd_disclosure_score: tcfdDisclosureScore ? parseInt(tcfdDisclosureScore) : null,
      climate_governance_board: climateGovernanceBoard,
      climate_governance_exec_accountability: climateGovernanceExecAccountability,
      climate_governance_incentives_linked: climateGovernanceIncentivesLinked,
      climate_governance_score: climateGovernanceScore ? parseInt(climateGovernanceScore) : null,
      transition_plan_exists: transitionPlanExists,
      transition_plan_published: transitionPlanPublished,
      transition_plan_milestones: transitionPlanMilestones,
      transition_plan_score: transitionPlanScore ? parseInt(transitionPlanScore) : null,
      green_capex_percentage: greenCapexPercentage ? parseFloat(greenCapexPercentage) : null,
      capex_alignment_trajectory: capexAlignmentTrajectory,
      capex_alignment_score: capexAlignmentScore ? parseInt(capexAlignmentScore) : null,
      // Section 3
      carbon_intensity_scope1: carbonIntensityScope1 ? parseFloat(carbonIntensityScope1) : null,
      carbon_intensity_scope2: carbonIntensityScope2 ? parseFloat(carbonIntensityScope2) : null,
      carbon_intensity_scope3: carbonIntensityScope3 ? parseFloat(carbonIntensityScope3) : null,
      carbon_intensity_trend: carbonIntensityTrend,
      carbon_intensity_score: carbonIntensityScore ? parseInt(carbonIntensityScore) : null,
      stranded_asset_exposure: strandedAssetExposure,
      stranded_asset_types: strandedAssetTypes,
      stranded_asset_score: strandedAssetScore ? parseInt(strandedAssetScore) : null,
      policy_pressure_jurisdictions: policyPressureJurisdictions,
      policy_pressure_carbon_pricing_exposure: policyPressureCarbonPricingExposure,
      policy_pressure_score: policyPressureScore ? parseInt(policyPressureScore) : null,
      tech_disruption_risk_level: techDisruptionRiskLevel,
      tech_disruption_assessment: techDisruptionAssessment,
      tech_disruption_score: techDisruptionScore ? parseInt(techDisruptionScore) : null,
      market_sentiment_esg_rating: marketSentimentEsgRating,
      market_sentiment_investor_pressure: marketSentimentInvestorPressure,
      market_sentiment_score: marketSentimentScore ? parseInt(marketSentimentScore) : null,
      litigation_current_cases: litigationCurrentCases ? parseInt(litigationCurrentCases) : null,
      litigation_historical_cases: litigationHistoricalCases ? parseInt(litigationHistoricalCases) : null,
      litigation_exposure_assessment: litigationExposureAssessment,
      litigation_score: litigationScore ? parseInt(litigationScore) : null,
      country_dependency_high_risk_revenue: countryDependencyHighRiskRevenue ? parseFloat(countryDependencyHighRiskRevenue) : null,
      country_dependency_score: countryDependencyScore ? parseInt(countryDependencyScore) : null,
      // Section 4
      green_market_growth_potential: greenMarketGrowthPotential,
      green_market_growth_assessment: greenMarketGrowthAssessment,
      green_market_growth_score: greenMarketGrowthScore ? parseInt(greenMarketGrowthScore) : null,
      green_revenue_percentage: greenRevenuePercentage ? parseFloat(greenRevenuePercentage) : null,
      green_revenue_trend: greenRevenueTrend,
      green_revenue_score: greenRevenueScore ? parseInt(greenRevenueScore) : null,
      competitive_advantage_assessment: competitiveAdvantageAssessment,
      competitive_advantage_score: competitiveAdvantageScore ? parseInt(competitiveAdvantageScore) : null,
      // Section 5
      acute_hazard_exposure: acuteHazardExposure,
      acute_hazard_types: acuteHazardTypes,
      acute_hazard_score: acuteHazardScore ? parseInt(acuteHazardScore) : null,
      chronic_exposure_assessment: chronicExposureAssessment,
      chronic_exposure_score: chronicExposureScore ? parseInt(chronicExposureScore) : null,
      ecosystem_dependency_level: ecosystemDependencyLevel,
      ecosystem_dependency_assessment: ecosystemDependencyAssessment,
      ecosystem_dependency_score: ecosystemDependencyScore ? parseInt(ecosystemDependencyScore) : null,
      adaptation_capability_level: adaptationCapabilityLevel,
      adaptation_investments: adaptationInvestments,
      adaptation_capability_score: adaptationCapabilityScore ? parseInt(adaptationCapabilityScore) : null,
      scenario_analysis_conducted: scenarioAnalysisConducted,
      scenario_analysis_scenarios: scenarioAnalysisScenarios,
      scenario_analysis_time_horizons: scenarioAnalysisTimeHorizons,
      scenario_analysis_integration: scenarioAnalysisIntegration,
      scenario_analysis_score: scenarioAnalysisScore ? parseInt(scenarioAnalysisScore) : null,
      // Section 6
      risk_appetite_category: riskAppetiteCategory,
      risk_appetite_justification: riskAppetiteJustification,
      risk_appetite_conditions: riskAppetiteConditions,
      // Section 7
      pillar_2_treatment: pillar2Treatment,
      icaap_materiality_assessment: icaapMaterialityAssessment,
      capital_add_on_recommendation: capitalAddOnRecommendation ? parseFloat(capitalAddOnRecommendation) : null,
      // Section 8
      data_sources: dataSources,
      data_proxies_used: dataProxiesUsed,
      data_gaps_identified: dataGapsIdentified,
      data_quality_overall: dataQualityOverall,
      // Section 9
      overall_transition_risk_score: overallTransitionRiskScore,
      overall_physical_risk_score: overallPhysicalRiskScore,
      overall_climate_risk_rating: overallClimateRiskRating,
      key_risk_drivers: keyRiskDrivers,
      key_opportunities: keyOpportunities,
      recommended_mitigations: recommendedMitigations,
      monitoring_triggers: monitoringTriggers,
      next_review_date: nextReviewDate || null,
    };
  };

  const handleSave = async (transitionCode, transitionName) => {
    setTransitionLoading(true);
    setTransitionError(null);

    try {
      const formData = buildFormData();
      await saveClimateScorecard(id, formData);

      if (transitionCode && workflowInstanceId) {
        await performWorkflowTransition(workflowInstanceId, transitionCode);
      }

      setRefetchTrigger(prev => prev + 1);

      if (transitionName?.toLowerCase().includes('submit')) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving climate scorecard:', error);
      setTransitionError(error.response?.data?.detail || 'Failed to save climate scorecard');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    setAiError(null);

    try {
      const result = await generateClimateScorecard(id);
      if (result.success) {
        setRefetchTrigger(prev => prev + 1);
      } else {
        setAiError(result.detail || 'AI generation failed');
      }
    } catch (error) {
      console.error('Error generating AI scorecard:', error);
      setAiError(error.response?.data?.detail || 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  // Get overall rating color
  const getRatingColor = (rating) => {
    const ratingColors = {
      'A': colors.success,
      'B': '#9AE6B4',
      'C': colors.warning,
      'D': '#FC8181',
      'E': colors.error,
    };
    return ratingColors[rating] || colors.neutral400;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <FormPageWrapper
      title="Climate Scorecard"
      subtitle="PRA SS5/25 Enhanced Climate Risk Assessment"
      currentStep={currentStep}
      creditApplication={creditApplication}
      formType="climate_scorecard"
      workflowState={currentWorkflowState}
      allowedTransitions={allowedTransitions}
      onTransition={handleSave}
      transitionLoading={transitionLoading}
      transitionError={transitionError}
    >
      {/* AI Generation Panel */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: colors.blueLight, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="primary" />
              AI-Powered Generation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate scorecard fields using AI analysis of counterparty data
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {aiGenerated && (
              <Chip
                label={`AI Review: ${analystReviewStatus}`}
                color={analystReviewStatus === 'approved' ? 'success' : analystReviewStatus === 'pending' ? 'warning' : 'default'}
                size="small"
              />
            )}
            <Button
              variant="contained"
              startIcon={aiGenerated ? <RefreshIcon /> : <AutoAwesomeIcon />}
              onClick={handleGenerateAI}
              disabled={aiGenerating}
            >
              {aiGenerating ? 'Generating...' : aiGenerated ? 'Regenerate' : 'Generate with AI'}
            </Button>
          </Box>
        </Box>
        {aiGenerating && <LinearProgress sx={{ mt: 2 }} />}
        {aiError && <Alert severity="error" sx={{ mt: 2 }}>{aiError}</Alert>}
        {aiGenerationNotes && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">{aiGenerationNotes}</Typography>
          </Alert>
        )}
      </Paper>

      {/* Overall Rating Display */}
      {overallClimateRiskRating && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Overall Climate Rating</Typography>
            <Box sx={{
              width: 60, height: 60, borderRadius: '50%',
              bgcolor: getRatingColor(overallClimateRiskRating),
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mt: 1
            }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {overallClimateRiskRating}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Transition Risk</Typography>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{overallTransitionRiskScore || '-'}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Physical Risk</Typography>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{overallPhysicalRiskScore || '-'}</Typography>
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {tabOptions.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Tab 0: Assessment Context */}
        {activeTab === 0 && (
          <FormSection title="Assessment Context & Metadata">
            <CreditApplicationDetailsSection creditApplication={creditApplication} />
            <FormField label="Analyst" type="select" value={analyst} onChange={(e) => setAnalyst(e.target.value)}
              options={creditAnalysts.map(a => ({ value: a.id, label: `${a.first_name} ${a.last_name}` }))} />
            <FormField label="Assessment Date" type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} />
            <FormField label="Assessment Type" type="select" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)}
              options={[
                { value: 'initial', label: 'Initial Assessment' },
                { value: 'annual_review', label: 'Annual Review' },
                { value: 'event_triggered', label: 'Event Triggered' },
                { value: 'material_change', label: 'Material Change' },
              ]} />
            <FormField label="Framework Version" type="text" value={frameworkVersion} onChange={(e) => setFrameworkVersion(e.target.value)} disabled />
          </FormSection>
        )}

        {/* Tab 1: Transition Preparedness */}
        {activeTab === 1 && (
          <>
            <FormSection title="Net-Zero Target">
              <FormField label="Net-Zero Target Exists" type="checkbox" value={netZeroTargetExists} onChange={(e) => setNetZeroTargetExists(e.target.checked)} />
              <ConfidenceIndicator confidence={aiConfidenceScores?.net_zero_target_exists} />
              <FormField label="Target Year" type="number" value={netZeroTargetYear} onChange={(e) => setNetZeroTargetYear(e.target.value)} />
              <FormField label="Target Scope" type="select" value={netZeroTargetScope} onChange={(e) => setNetZeroTargetScope(e.target.value)}
                options={[
                  { value: 'scope_1', label: 'Scope 1 Only' },
                  { value: 'scope_1_2', label: 'Scope 1 & 2' },
                  { value: 'scope_1_2_3', label: 'Scope 1, 2 & 3' },
                ]} />
              <FormField label="Science-Based (SBTi Validated)" type="checkbox" value={netZeroScienceBased} onChange={(e) => setNetZeroScienceBased(e.target.checked)} />
              <FormField label="Net-Zero Score (1-5)" type="select" value={netZeroScore} onChange={(e) => setNetZeroScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="TCFD Disclosure">
              <FormField label="Disclosure Level" type="select" value={tcfdDisclosureLevel} onChange={(e) => setTcfdDisclosureLevel(e.target.value)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'full', label: 'Full' },
                  { value: 'verified', label: 'Verified' },
                ]} />
              <FormField label="TCFD Score (1-5)" type="select" value={tcfdDisclosureScore} onChange={(e) => setTcfdDisclosureScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Climate Governance">
              <FormField label="Board-Level Oversight" type="checkbox" value={climateGovernanceBoard} onChange={(e) => setClimateGovernanceBoard(e.target.checked)} />
              <FormField label="Executive Accountability" type="checkbox" value={climateGovernanceExecAccountability} onChange={(e) => setClimateGovernanceExecAccountability(e.target.checked)} />
              <FormField label="Compensation Linked to Climate" type="checkbox" value={climateGovernanceIncentivesLinked} onChange={(e) => setClimateGovernanceIncentivesLinked(e.target.checked)} />
              <FormField label="Governance Score (1-5)" type="select" value={climateGovernanceScore} onChange={(e) => setClimateGovernanceScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Transition Plan">
              <FormField label="Transition Plan Exists" type="checkbox" value={transitionPlanExists} onChange={(e) => setTransitionPlanExists(e.target.checked)} />
              <FormField label="Publicly Published" type="checkbox" value={transitionPlanPublished} onChange={(e) => setTransitionPlanPublished(e.target.checked)} />
              <FormField label="Key Milestones" type="textarea" value={transitionPlanMilestones} onChange={(e) => setTransitionPlanMilestones(e.target.value)} rows={3} />
              <FormField label="Transition Plan Score (1-5)" type="select" value={transitionPlanScore} onChange={(e) => setTransitionPlanScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Capex Alignment">
              <FormField label="Green Capex (%)" type="number" value={greenCapexPercentage} onChange={(e) => setGreenCapexPercentage(e.target.value)} />
              <FormField label="Alignment Trajectory" type="select" value={capexAlignmentTrajectory} onChange={(e) => setCapexAlignmentTrajectory(e.target.value)}
                options={[
                  { value: 'increasing', label: 'Increasing' },
                  { value: 'stable', label: 'Stable' },
                  { value: 'decreasing', label: 'Decreasing' },
                ]} />
              <FormField label="Capex Score (1-5)" type="select" value={capexAlignmentScore} onChange={(e) => setCapexAlignmentScore(e.target.value)} options={scoreOptions} />
            </FormSection>
          </>
        )}

        {/* Tab 2: Transition Vulnerability */}
        {activeTab === 2 && (
          <>
            <FormSection title="Carbon Intensity">
              <FormField label="Scope 1 Intensity" type="number" value={carbonIntensityScope1} onChange={(e) => setCarbonIntensityScope1(e.target.value)} />
              <FormField label="Scope 2 Intensity" type="number" value={carbonIntensityScope2} onChange={(e) => setCarbonIntensityScope2(e.target.value)} />
              <FormField label="Scope 3 Intensity" type="number" value={carbonIntensityScope3} onChange={(e) => setCarbonIntensityScope3(e.target.value)} />
              <FormField label="Trend" type="select" value={carbonIntensityTrend} onChange={(e) => setCarbonIntensityTrend(e.target.value)}
                options={[{ value: 'declining', label: 'Declining' }, { value: 'stable', label: 'Stable' }, { value: 'increasing', label: 'Increasing' }]} />
              <FormField label="Carbon Score (1-5)" type="select" value={carbonIntensityScore} onChange={(e) => setCarbonIntensityScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Stranded Assets">
              <FormField label="Exposure Level" type="select" value={strandedAssetExposure} onChange={(e) => setStrandedAssetExposure(e.target.value)}
                options={[{ value: 'none', label: 'None' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              <FormField label="Asset Types at Risk" type="textarea" value={strandedAssetTypes} onChange={(e) => setStrandedAssetTypes(e.target.value)} rows={2} />
              <FormField label="Stranded Asset Score (1-5)" type="select" value={strandedAssetScore} onChange={(e) => setStrandedAssetScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Policy Pressure">
              <FormField label="Key Jurisdictions" type="textarea" value={policyPressureJurisdictions} onChange={(e) => setPolicyPressureJurisdictions(e.target.value)} rows={2} />
              <FormField label="Carbon Pricing Exposure" type="checkbox" value={policyPressureCarbonPricingExposure} onChange={(e) => setPolicyPressureCarbonPricingExposure(e.target.checked)} />
              <FormField label="Policy Score (1-5)" type="select" value={policyPressureScore} onChange={(e) => setPolicyPressureScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Technology Disruption">
              <FormField label="Risk Level" type="select" value={techDisruptionRiskLevel} onChange={(e) => setTechDisruptionRiskLevel(e.target.value)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
              <FormField label="Assessment" type="textarea" value={techDisruptionAssessment} onChange={(e) => setTechDisruptionAssessment(e.target.value)} rows={2} />
              <FormField label="Tech Score (1-5)" type="select" value={techDisruptionScore} onChange={(e) => setTechDisruptionScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Market Sentiment">
              <FormField label="Current ESG Rating" type="text" value={marketSentimentEsgRating} onChange={(e) => setMarketSentimentEsgRating(e.target.value)} />
              <FormField label="Investor Pressure" type="select" value={marketSentimentInvestorPressure} onChange={(e) => setMarketSentimentInvestorPressure(e.target.value)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              <FormField label="Market Score (1-5)" type="select" value={marketSentimentScore} onChange={(e) => setMarketSentimentScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Litigation Risk">
              <FormField label="Current Cases" type="number" value={litigationCurrentCases} onChange={(e) => setLitigationCurrentCases(e.target.value)} />
              <FormField label="Historical Cases" type="number" value={litigationHistoricalCases} onChange={(e) => setLitigationHistoricalCases(e.target.value)} />
              <FormField label="Exposure Assessment" type="textarea" value={litigationExposureAssessment} onChange={(e) => setLitigationExposureAssessment(e.target.value)} rows={2} />
              <FormField label="Litigation Score (1-5)" type="select" value={litigationScore} onChange={(e) => setLitigationScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Country Dependency">
              <FormField label="High-Risk Revenue (%)" type="number" value={countryDependencyHighRiskRevenue} onChange={(e) => setCountryDependencyHighRiskRevenue(e.target.value)} />
              <FormField label="Country Score (1-5)" type="select" value={countryDependencyScore} onChange={(e) => setCountryDependencyScore(e.target.value)} options={scoreOptions} />
            </FormSection>
          </>
        )}

        {/* Tab 3: Transition Opportunity */}
        {activeTab === 3 && (
          <>
            <FormSection title="Green Market Growth">
              <FormField label="Growth Potential" type="select" value={greenMarketGrowthPotential} onChange={(e) => setGreenMarketGrowthPotential(e.target.value)}
                options={[
                  { value: 'none', label: 'None' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' }, { value: 'transformative', label: 'Transformative' }
                ]} />
              <FormField label="Assessment" type="textarea" value={greenMarketGrowthAssessment} onChange={(e) => setGreenMarketGrowthAssessment(e.target.value)} rows={3} />
              <FormField label="Growth Score (1-5)" type="select" value={greenMarketGrowthScore} onChange={(e) => setGreenMarketGrowthScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Green Revenue">
              <FormField label="Current Green Revenue (%)" type="number" value={greenRevenuePercentage} onChange={(e) => setGreenRevenuePercentage(e.target.value)} />
              <FormField label="Revenue Trend" type="select" value={greenRevenueTrend} onChange={(e) => setGreenRevenueTrend(e.target.value)}
                options={[
                  { value: 'declining', label: 'Declining' }, { value: 'stable', label: 'Stable' },
                  { value: 'growing', label: 'Growing' }, { value: 'rapidly_growing', label: 'Rapidly Growing' }
                ]} />
              <FormField label="Revenue Score (1-5)" type="select" value={greenRevenueScore} onChange={(e) => setGreenRevenueScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Competitive Advantage">
              <FormField label="Assessment" type="textarea" value={competitiveAdvantageAssessment} onChange={(e) => setCompetitiveAdvantageAssessment(e.target.value)} rows={3} />
              <FormField label="Advantage Score (1-5)" type="select" value={competitiveAdvantageScore} onChange={(e) => setCompetitiveAdvantageScore(e.target.value)} options={scoreOptions} />
            </FormSection>
          </>
        )}

        {/* Tab 4: Physical Risk */}
        {activeTab === 4 && (
          <>
            <FormSection title="Acute Hazards">
              <FormField label="Exposure Level" type="select" value={acuteHazardExposure} onChange={(e) => setAcuteHazardExposure(e.target.value)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
              <FormField label="Hazard Types" type="text" value={acuteHazardTypes.join(', ')} onChange={(e) => setAcuteHazardTypes(e.target.value.split(',').map(s => s.trim()))} helperText="Comma-separated: floods, storms, wildfires" />
              <FormField label="Acute Score (1-5)" type="select" value={acuteHazardScore} onChange={(e) => setAcuteHazardScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Chronic Exposure">
              <FormField label="Assessment" type="textarea" value={chronicExposureAssessment} onChange={(e) => setChronicExposureAssessment(e.target.value)} rows={3} />
              <FormField label="Chronic Score (1-5)" type="select" value={chronicExposureScore} onChange={(e) => setChronicExposureScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Ecosystem Dependency">
              <FormField label="Dependency Level" type="select" value={ecosystemDependencyLevel} onChange={(e) => setEcosystemDependencyLevel(e.target.value)}
                options={[{ value: 'none', label: 'None' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
              <FormField label="Assessment" type="textarea" value={ecosystemDependencyAssessment} onChange={(e) => setEcosystemDependencyAssessment(e.target.value)} rows={2} />
              <FormField label="Ecosystem Score (1-5)" type="select" value={ecosystemDependencyScore} onChange={(e) => setEcosystemDependencyScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Adaptation Capability">
              <FormField label="Capability Level" type="select" value={adaptationCapabilityLevel} onChange={(e) => setAdaptationCapabilityLevel(e.target.value)}
                options={[{ value: 'none', label: 'None' }, { value: 'limited', label: 'Limited' }, { value: 'developing', label: 'Developing' }, { value: 'mature', label: 'Mature' }]} />
              <FormField label="Investments" type="textarea" value={adaptationInvestments} onChange={(e) => setAdaptationInvestments(e.target.value)} rows={2} />
              <FormField label="Adaptation Score (1-5)" type="select" value={adaptationCapabilityScore} onChange={(e) => setAdaptationCapabilityScore(e.target.value)} options={scoreOptions} />
            </FormSection>
            <FormSection title="Scenario Analysis">
              <FormField label="Analysis Conducted" type="checkbox" value={scenarioAnalysisConducted} onChange={(e) => setScenarioAnalysisConducted(e.target.checked)} />
              <FormField label="Scenarios Used" type="text" value={scenarioAnalysisScenarios.join(', ')} onChange={(e) => setScenarioAnalysisScenarios(e.target.value.split(',').map(s => s.trim()))} helperText="e.g., RCP 2.6, RCP 4.5, RCP 8.5" />
              <FormField label="Time Horizons" type="text" value={scenarioAnalysisTimeHorizons.join(', ')} onChange={(e) => setScenarioAnalysisTimeHorizons(e.target.value.split(',').map(s => s.trim()))} helperText="e.g., 2030, 2050" />
              <FormField label="Integration into Strategy" type="textarea" value={scenarioAnalysisIntegration} onChange={(e) => setScenarioAnalysisIntegration(e.target.value)} rows={2} />
              <FormField label="Scenario Score (1-5)" type="select" value={scenarioAnalysisScore} onChange={(e) => setScenarioAnalysisScore(e.target.value)} options={scoreOptions} />
            </FormSection>
          </>
        )}

        {/* Tab 5: Risk Appetite */}
        {activeTab === 5 && (
          <FormSection title="Risk Appetite Alignment">
            <FormField label="Risk Appetite Category" type="select" value={riskAppetiteCategory} onChange={(e) => setRiskAppetiteCategory(e.target.value)}
              options={[
                { value: 'avoid', label: 'Avoid - Outside Risk Appetite' },
                { value: 'manage', label: 'Manage - Requires Active Mitigation' },
                { value: 'monitor', label: 'Monitor - Enhanced Monitoring Required' },
                { value: 'acceptable', label: 'Acceptable - Within Risk Appetite' },
              ]} />
            <FormField label="Justification" type="textarea" value={riskAppetiteJustification} onChange={(e) => setRiskAppetiteJustification(e.target.value)} rows={4} />
            <FormField label="Conditions/Mitigating Actions" type="textarea" value={riskAppetiteConditions} onChange={(e) => setRiskAppetiteConditions(e.target.value)} rows={3} />
          </FormSection>
        )}

        {/* Tab 6: Capital & ICAAP */}
        {activeTab === 6 && (
          <FormSection title="Capital & ICAAP Considerations">
            <FormField label="Pillar 2 Treatment" type="select" value={pillar2Treatment} onChange={(e) => setPillar2Treatment(e.target.value)}
              options={[
                { value: 'not_material', label: 'Not Material' },
                { value: 'low_add_on', label: 'Low Capital Add-On (0-2%)' },
                { value: 'medium_add_on', label: 'Medium Capital Add-On (2-5%)' },
                { value: 'high_add_on', label: 'High Capital Add-On (>5%)' },
              ]} />
            <FormField label="ICAAP Materiality Assessment" type="textarea" value={icaapMaterialityAssessment} onChange={(e) => setIcaapMaterialityAssessment(e.target.value)} rows={4} />
            <FormField label="Recommended Capital Add-On (%)" type="number" value={capitalAddOnRecommendation} onChange={(e) => setCapitalAddOnRecommendation(e.target.value)} />
          </FormSection>
        )}

        {/* Tab 7: Data Quality */}
        {activeTab === 7 && (
          <FormSection title="Data Quality Declaration">
            <FormField label="Data Sources Used" type="text" value={dataSources.join(', ')} onChange={(e) => setDataSources(e.target.value.split(',').map(s => s.trim()))} helperText="Comma-separated list of sources" />
            <FormField label="Proxy Data Used" type="textarea" value={dataProxiesUsed} onChange={(e) => setDataProxiesUsed(e.target.value)} rows={3} />
            <FormField label="Data Gaps Identified" type="textarea" value={dataGapsIdentified} onChange={(e) => setDataGapsIdentified(e.target.value)} rows={3} />
            <FormField label="Overall Data Quality" type="select" value={dataQualityOverall} onChange={(e) => setDataQualityOverall(e.target.value)}
              options={[
                { value: 'poor', label: 'Poor - Significant gaps, heavy reliance on proxies' },
                { value: 'fair', label: 'Fair - Some gaps, moderate proxy usage' },
                { value: 'good', label: 'Good - Minor gaps, limited proxy usage' },
                { value: 'excellent', label: 'Excellent - Comprehensive data, minimal proxies' },
              ]} />
          </FormSection>
        )}

        {/* Tab 8: Summary */}
        {activeTab === 8 && (
          <>
            <FormSection title="Overall Assessment">
              <FormField label="Transition Risk Score" type="select" value={overallTransitionRiskScore} onChange={(e) => setOverallTransitionRiskScore(e.target.value)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
              <FormField label="Physical Risk Score" type="select" value={overallPhysicalRiskScore} onChange={(e) => setOverallPhysicalRiskScore(e.target.value)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
              <FormField label="Overall Climate Rating" type="select" value={overallClimateRiskRating} onChange={(e) => setOverallClimateRiskRating(e.target.value)}
                options={[
                  { value: 'A', label: 'A - Minimal Risk' },
                  { value: 'B', label: 'B - Low Risk' },
                  { value: 'C', label: 'C - Moderate Risk' },
                  { value: 'D', label: 'D - High Risk' },
                  { value: 'E', label: 'E - Critical Risk' },
                ]} />
            </FormSection>
            <FormSection title="Key Findings & Recommendations">
              <FormField label="Key Risk Drivers" type="textarea" value={keyRiskDrivers} onChange={(e) => setKeyRiskDrivers(e.target.value)} rows={3} />
              <FormField label="Key Opportunities" type="textarea" value={keyOpportunities} onChange={(e) => setKeyOpportunities(e.target.value)} rows={3} />
              <FormField label="Recommended Mitigations" type="textarea" value={recommendedMitigations} onChange={(e) => setRecommendedMitigations(e.target.value)} rows={3} />
              <FormField label="Monitoring Triggers" type="textarea" value={monitoringTriggers} onChange={(e) => setMonitoringTriggers(e.target.value)} rows={2} />
              <FormField label="Next Review Date" type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} />
            </FormSection>
          </>
        )}
      </Box>
    </FormPageWrapper>
  );
};

export default ClimateScorecard;
