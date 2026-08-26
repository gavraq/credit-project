import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditRequest, fetchUsersByRole, performWorkflowTransition, saveCreditAnalysisForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

const CreditAnalysisForm = ({ creditApplication: initialCreditApplication, currentStep = 4 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);
  const user = useSelector(state => state.auth.user);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  // Form state - Basic Details
  const [creditAnalyst, setCreditAnalyst] = useState('');
  const [industryAnalysis, setIndustryAnalysis] = useState('');
  const [businessModelAssessment, setBusinessModelAssessment] = useState('');
  const [managementQuality, setManagementQuality] = useState('');

  // Executive Summary
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [keyRisks, setKeyRisks] = useState('');
  const [mitigatingFactors, setMitigatingFactors] = useState('');

  // Financial Analysis
  const [revenueAnalysis, setRevenueAnalysis] = useState('');
  const [profitabilityAnalysis, setProfitabilityAnalysis] = useState('');
  const [cashFlowAnalysis, setCashFlowAnalysis] = useState('');
  const [debtCapacityAnalysis, setDebtCapacityAnalysis] = useState('');

  // Risk Assessment
  const [creditRatingRecommendation, setCreditRatingRecommendation] = useState('');
  const [probabilityOfDefault, setProbabilityOfDefault] = useState('');
  const [lossGivenDefault, setLossGivenDefault] = useState('');

  // Climate Scorecard
  const [climateRiskScore, setClimateRiskScore] = useState('');
  const [esgScore, setEsgScore] = useState('');
  const [transitionRiskAssessment, setTransitionRiskAssessment] = useState('');
  const [physicalRiskAssessment, setPhysicalRiskAssessment] = useState('');

  // Final Recommendations
  const [recommendation, setRecommendation] = useState('');
  const [recommendedConditions, setRecommendedConditions] = useState('');

  // Form metadata
  const [formStartDate, setFormStartDate] = useState('');
  const [creditAnalysts, setCreditAnalysts] = useState([]);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);
  const {
    detail: creditAnalysisForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'credit_analysis_form',
    { refreshKey: refetchTrigger }
  );

  // Tab management
  const [activeTab, setActiveTab] = useState(0);
  
  const tabOptions = [
    "Basic Details",
    "Executive Summary", 
    "Financial Analysis",
    "Risk Assessment",
    "Climate Scorecard"
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

  const populateFormData = useCallback((analysisForm) => {
    if (!analysisForm) return;

    // Set workflow information
    setWorkflowInstanceId(analysisForm.workflow_instance?.id || null);
    setCurrentWorkflowState(analysisForm.workflow_instance?.current_state || 'N/A');
    setAllowedTransitions(analysisForm.available_transitions || []);

    // Populate form fields
    setCreditAnalyst(analysisForm.credit_analyst || user?.id || '');
    setIndustryAnalysis(analysisForm.industry_analysis || '');
    setBusinessModelAssessment(analysisForm.business_model_assessment || '');
    setManagementQuality(analysisForm.management_quality || '');
    
    setExecutiveSummary(analysisForm.executive_summary || '');
    setKeyRisks(analysisForm.key_risks || '');
    setMitigatingFactors(analysisForm.mitigating_factors || '');
    
    setRevenueAnalysis(analysisForm.revenue_analysis || '');
    setProfitabilityAnalysis(analysisForm.profitability_analysis || '');
    setCashFlowAnalysis(analysisForm.cash_flow_analysis || '');
    setDebtCapacityAnalysis(analysisForm.debt_capacity_analysis || '');
    
    setCreditRatingRecommendation(analysisForm.credit_rating_recommendation || '');
    setProbabilityOfDefault(analysisForm.probability_of_default || '');
    setLossGivenDefault(analysisForm.loss_given_default || '');
    
    setClimateRiskScore(analysisForm.climate_risk_score || '');
    setEsgScore(analysisForm.esg_score || '');
    setTransitionRiskAssessment(analysisForm.transition_risk_assessment || '');
    setPhysicalRiskAssessment(analysisForm.physical_risk_assessment || '');
    
    setRecommendation(analysisForm.recommendation || '');
    setRecommendedConditions(analysisForm.recommended_conditions || '');
    
    setFormStartDate(analysisForm.form_started_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
  }, [user]);

  const fetchAndSetAnalysts = useCallback(async () => {
    setLoadingAnalysts(true);
    try {
      const analysts = await fetchUsersByRole('Credit Analyst');
      setCreditAnalysts(analysts || []);
    } catch (error) {
      setCreditAnalysts([]);
    } finally {
      setLoadingAnalysts(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setApplicationLoading(false);
        return;
      }
      setApplicationLoading(true);
      try {
        const application = await fetchCreditRequest(id);
        setCreditApplication(application);
        setTransitionError(null);
      } catch (error) {
        setTransitionError('Failed to load application data.');
        setCreditApplication(null);
      } finally {
        setApplicationLoading(false);
      }
    };

    fetchData();
    fetchAndSetAnalysts();
  }, [id, refetchTrigger, fetchAndSetAnalysts]);

  useEffect(() => {
    if (artifactError) {
      setTransitionError('Failed to load credit analysis form data.');
      return;
    }

    if (!creditAnalysisForm) {
      return;
    }

    populateFormData(creditAnalysisForm);
  }, [artifactError, creditAnalysisForm, populateFormData]);

  const buildPayload = useCallback(() => {
    const toIsoDateTime = (dateValue) => {
      if (!dateValue) {
        return null;
      }

      const normalizedValue = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`;
      return new Date(normalizedValue).toISOString();
    };

    return {
      credit_analyst: creditAnalyst || null,
      industry_analysis: industryAnalysis,
      business_model_assessment: businessModelAssessment,
      management_quality: managementQuality || null,
      executive_summary: executiveSummary,
      key_risks: keyRisks,
      mitigating_factors: mitigatingFactors,
      revenue_analysis: revenueAnalysis,
      profitability_analysis: profitabilityAnalysis,
      cash_flow_analysis: cashFlowAnalysis,
      debt_capacity_analysis: debtCapacityAnalysis,
      credit_rating_recommendation: creditRatingRecommendation || null,
      probability_of_default: probabilityOfDefault ? parseFloat(probabilityOfDefault) : null,
      loss_given_default: lossGivenDefault ? parseFloat(lossGivenDefault) : null,
      climate_risk_score: climateRiskScore || null,
      esg_score: esgScore || null,
      transition_risk_assessment: transitionRiskAssessment,
      physical_risk_assessment: physicalRiskAssessment,
      recommendation: recommendation || null,
      recommended_conditions: recommendedConditions,
      form_started_at: toIsoDateTime(formStartDate),
      form_completed_at: new Date().toISOString(),
    };
  }, [
    creditAnalyst, industryAnalysis, businessModelAssessment, managementQuality,
    executiveSummary, keyRisks, mitigatingFactors, revenueAnalysis, profitabilityAnalysis,
    cashFlowAnalysis, debtCapacityAnalysis, creditRatingRecommendation, probabilityOfDefault,
    lossGivenDefault, climateRiskScore, esgScore, transitionRiskAssessment, physicalRiskAssessment,
    recommendation, recommendedConditions, formStartDate
  ]);

  const handleSave = async () => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();
    
    try {
      // Use the proper API service function
      await saveCreditAnalysisForm(id, payload);
      navigate('/');
    } catch (error) {
      setTransitionError(error.message || 'Failed to save data.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transition, comments) => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();

    try {
      // First save form data using proper API service
      await saveCreditAnalysisForm(id, payload);
      
      // Then perform transition with proper Phase 3 payload structure
      const transitionPayload = { transition_code: transition.code, comments: comments };

      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code.includes('DRAFT') || transition.name.toLowerCase().includes('draft')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
    } catch (error) {
      // Use same error handling pattern as other Phase 3 forms
      let detailedError = 'An unexpected error occurred during transition.';
      if (error.response) {
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: (Status: ${error.response.status}) - No additional data.`;
        }
      } else if (error.request) {
        detailedError = 'Transition error: No response received from server.';
      } else {
        detailedError = `Error: ${error.message}`;
      }
      setTransitionError(detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  const workflowStatusProps = {
    currentStep: currentStep,
    workflowType: "CREDIT_ANALYSIS",
    colors: colors,
    currentWorkflowState: { name: currentWorkflowState },
  };

  const workflowActionsProps = {
    key: workflowInstanceId || 'new-analysis-actions',
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: allowedTransitions || [],
    colors: colors,
  };
  const loading = applicationLoading || artifactLoading;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <FormPageWrapper
      title="Credit Analysis Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      {/* Application Details */}
      <CreditApplicationDetailsSection creditApplication={creditApplication} />

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          marginBottom: '1.5rem',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.palette.grey[500],
            padding: '16px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
            '&:hover': {
              color: theme.palette.grey[600],
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
            height: 2,
          },
        }}
      >
        {tabOptions.map((tab, index) => (
          <Tab key={index} label={tab} />
        ))}
      </Tabs>

      {/* Basic Details Tab */}
      {activeTab === 0 && (
        <>
          <FormSection title="Basic Information" description="Provide basic details about the counterparty analysis">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <FormField
                label="Credit Analyst"
                type="select"
                value={creditAnalyst}
                onChange={(e) => setCreditAnalyst(e.target.value)}
                options={[
                  { value: '', label: loadingAnalysts ? 'Loading...' : 'Select an analyst' },
                  ...creditAnalysts.map(analyst => ({ value: analyst.id, label: `${analyst.first_name} ${analyst.last_name}` }))
                ]}
                colors={colors}
                required
                disabled={loadingAnalysts}
              />
              <FormField
                label="Management Quality"
                type="select"
                value={managementQuality}
                onChange={(e) => setManagementQuality(e.target.value)}
                options={[
                  { value: '', label: 'Select quality rating' },
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'good', label: 'Good' },
                  { value: 'satisfactory', label: 'Satisfactory' },
                  { value: 'poor', label: 'Poor' }
                ]}
                colors={colors}
              />
            </div>
            <FormField
              label="Industry Analysis"
              type="textarea"
              value={industryAnalysis}
              onChange={(e) => setIndustryAnalysis(e.target.value)}
              placeholder="Provide analysis of the industry and outlook"
              colors={colors}
            />
            <FormField
              label="Business Model Assessment"
              type="textarea"
              value={businessModelAssessment}
              onChange={(e) => setBusinessModelAssessment(e.target.value)}
              placeholder="Assessment of business model and strategy"
              colors={colors}
            />
          </FormSection>
        </>
      )}

      {/* Executive Summary Tab */}
      {activeTab === 1 && (
        <FormSection title="Executive Summary" description="Provide executive summary and key findings">
          <FormField
            label="Executive Summary"
            type="textarea"
            value={executiveSummary}
            onChange={(e) => setExecutiveSummary(e.target.value)}
            placeholder="Executive summary of the credit analysis"
            colors={colors}
            rows={4}
          />
          <FormField
            label="Key Risks"
            type="textarea"
            value={keyRisks}
            onChange={(e) => setKeyRisks(e.target.value)}
            placeholder="Key risks identified"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Mitigating Factors"
            type="textarea"
            value={mitigatingFactors}
            onChange={(e) => setMitigatingFactors(e.target.value)}
            placeholder="Mitigating factors and risk controls"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Financial Analysis Tab */}
      {activeTab === 2 && (
        <FormSection title="Financial Analysis" description="Detailed financial analysis and assessment">
          <FormField
            label="Revenue Analysis"
            type="textarea"
            value={revenueAnalysis}
            onChange={(e) => setRevenueAnalysis(e.target.value)}
            placeholder="Analysis of revenue trends and sustainability"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Profitability Analysis"
            type="textarea"
            value={profitabilityAnalysis}
            onChange={(e) => setProfitabilityAnalysis(e.target.value)}
            placeholder="Analysis of profitability metrics"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Cash Flow Analysis"
            type="textarea"
            value={cashFlowAnalysis}
            onChange={(e) => setCashFlowAnalysis(e.target.value)}
            placeholder="Cash flow analysis and projections"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Debt Capacity Analysis"
            type="textarea"
            value={debtCapacityAnalysis}
            onChange={(e) => setDebtCapacityAnalysis(e.target.value)}
            placeholder="Assessment of debt capacity and leverage"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Risk Assessment Tab */}
      {activeTab === 3 && (
        <FormSection title="Risk Assessment" description="Credit risk assessment and recommendations">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <FormField
              label="Credit Rating Recommendation"
              type="text"
              value={creditRatingRecommendation}
              onChange={(e) => setCreditRatingRecommendation(e.target.value)}
              placeholder="e.g., AAA, AA+, BBB"
              colors={colors}
            />
            <FormField
              label="Probability of Default (%)"
              type="number"
              value={probabilityOfDefault}
              onChange={(e) => setProbabilityOfDefault(e.target.value)}
              placeholder="0.00"
              step="0.01"
              max="100"
              colors={colors}
            />
            <FormField
              label="Loss Given Default (%)"
              type="number"
              value={lossGivenDefault}
              onChange={(e) => setLossGivenDefault(e.target.value)}
              placeholder="0.00"
              step="0.01"
              max="100"
              colors={colors}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField
              label="Final Recommendation"
              type="select"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              options={[
                { value: '', label: 'Select recommendation' },
                { value: 'approve', label: 'Approve' },
                { value: 'approve_with_conditions', label: 'Approve with Conditions' },
                { value: 'reject', label: 'Reject' }
              ]}
              colors={colors}
              required
            />
          </div>
          <FormField
            label="Recommended Conditions"
            type="textarea"
            value={recommendedConditions}
            onChange={(e) => setRecommendedConditions(e.target.value)}
            placeholder="Recommended conditions if applicable"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Climate Scorecard Tab */}
      {activeTab === 4 && (
        <FormSection title="Climate Scorecard" description="Climate and ESG risk assessment">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <FormField
              label="Climate Risk Score"
              type="select"
              value={climateRiskScore}
              onChange={(e) => setClimateRiskScore(e.target.value)}
              options={[
                { value: '', label: 'Select climate risk score' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              colors={colors}
            />
            <FormField
              label="ESG Score"
              type="select"
              value={esgScore}
              onChange={(e) => setEsgScore(e.target.value)}
              options={[
                { value: '', label: 'Select ESG risk score' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              colors={colors}
            />
          </div>
          <FormField
            label="Transition Risk Assessment"
            type="textarea"
            value={transitionRiskAssessment}
            onChange={(e) => setTransitionRiskAssessment(e.target.value)}
            placeholder="Assessment of transition risks"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Physical Risk Assessment"
            type="textarea"
            value={physicalRiskAssessment}
            onChange={(e) => setPhysicalRiskAssessment(e.target.value)}
            placeholder="Assessment of physical climate risks"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Save Button */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={transitionLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.neutral600,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: transitionLoading ? 'not-allowed' : 'pointer',
            opacity: transitionLoading ? 0.6 : 1,
          }}
        >
          {transitionLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </FormPageWrapper>
  );
};

export default CreditAnalysisForm;
