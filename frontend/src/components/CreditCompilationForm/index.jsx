import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditRequest, fetchUsersByRole, performWorkflowTransition, saveCreditCompilationForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

const CreditCompilationForm = ({ creditApplication: initialCreditApplication, currentStep = 5 }) => {
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

  // Form state - Phase 3 pattern
  const [formData, setFormData] = useState({});

  // Form metadata
  const [formStartDate, setFormStartDate] = useState('');
  const [creditAnalysts, setCreditAnalysts] = useState([]);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);
  const {
    detail: creditCompilationForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'credit_compilation_form',
    { refreshKey: refetchTrigger }
  );

  // Tab management
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const tabOptions = [
    "Credit Paper Summary",
    "Risk & Analysis", 
    "Legal & Conditions",
    "Compilation Status"
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

  const populateFormData = useCallback((formDetail) => {
    const initialFormData = {};

    // Populate Credit Compilation Form specific data - Phase 3 pattern
    if (!formDetail) {
      setWorkflowInstanceId(null);
      setCurrentWorkflowState('');
      setAllowedTransitions([]);
      setFormStartDate(new Date().toISOString().split('T')[0]);
      setFormData({});
      return;
    }

    if (formDetail.workflow_instance) {
      setWorkflowInstanceId(formDetail.workflow_instance.id);
      setCurrentWorkflowState(formDetail.workflow_instance.current_state || 'Draft');
    }

    setAllowedTransitions(formDetail.available_transitions || []);

    initialFormData.compiler = formDetail.compiler || user?.id || '';
    initialFormData.credit_paper_summary = formDetail.credit_paper_summary || '';
    initialFormData.facility_summary = formDetail.facility_summary || '';
    initialFormData.counterparty_background = formDetail.counterparty_background || '';
    initialFormData.business_rationale = formDetail.business_rationale || '';
    initialFormData.risk_assessment_summary = formDetail.risk_assessment_summary || '';
    initialFormData.financial_analysis_summary = formDetail.financial_analysis_summary || '';
    initialFormData.legal_documentation_summary = formDetail.legal_documentation_summary || '';
    initialFormData.conditions_precedent = formDetail.conditions_precedent || '';
    initialFormData.ongoing_covenants = formDetail.ongoing_covenants || '';
    initialFormData.pricing_summary = formDetail.pricing_summary || '';
    initialFormData.all_forms_reviewed = formDetail.all_forms_reviewed !== null ? String(formDetail.all_forms_reviewed) : '';
    initialFormData.ready_for_approval = formDetail.ready_for_approval !== null ? String(formDetail.ready_for_approval) : '';
    initialFormData.compiler_notes = formDetail.compiler_notes || '';
    setFormData(initialFormData);
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
        setTransitionError('Failed to load credit application data.');
        setCreditApplication(null);
      } finally {
        setApplicationLoading(false);
      }
    };

    fetchData();

    fetchAndSetAnalysts();
  }, [id, refetchTrigger, populateFormData, fetchAndSetAnalysts]);

  useEffect(() => {
    if (artifactError) {
      setTransitionError('Failed to load credit compilation form data.');
      return;
    }

    populateFormData(creditCompilationForm);
  }, [artifactError, creditCompilationForm, populateFormData]);

  const buildPayload = useCallback(() => {
    const toIsoDateTime = (dateValue) => {
      if (!dateValue) {
        return null;
      }

      const normalizedValue = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`;
      return new Date(normalizedValue).toISOString();
    };

    return {
      ...formData,
      compiler: formData.compiler || null,
      all_forms_reviewed: formData.all_forms_reviewed === 'true' || formData.all_forms_reviewed === true,
      ready_for_approval: formData.ready_for_approval === 'true' || formData.ready_for_approval === true,
      form_started_at: toIsoDateTime(formStartDate || new Date().toISOString().split('T')[0]),
    };
  }, [formData, formStartDate]);

  // Phase 3 handleTransition pattern - matches other forms exactly
  const handleTransition = async (transition, comments = '') => {
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    // Build payload like other Phase 3 forms
    const payload = buildPayload();

    try {
      // First save form data using proper API service
      await saveCreditCompilationForm(id, payload);
      
      // Then perform transition with proper Phase 3 payload structure - SAME AS OTHER FORMS
      const transitionPayload = { transition_code: transition.code, comments: comments };

      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'CC_SAVE_DRAFT' || transition.code === 'CC_BACK_TO_DRAFT' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('submit')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      // Use same error handling pattern as other forms
      let detailedError = 'An unexpected error occurred during transition.';
      if (error.response) {
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: Status ${error.response.status}`;
        }
      } else if (error.message) {
        detailedError = error.message;
      }
      
      setTransitionError(detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  const workflowStatusProps = {
    currentStep: currentStep,
    workflowType: "CREDIT_COMPILATION",
    colors: colors,
    currentWorkflowState: { name: currentWorkflowState },
  };

  const workflowActionsProps = {
    key: workflowInstanceId || 'new-compilation-actions',
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
      title="Credit Compilation Form"
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

      {/* Credit Paper Summary Tab */}
      {activeTab === 0 && (
        <>
          <FormSection title="Basic Information" description="Provide basic details about the credit compilation">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
              <FormField
                label="Compiler"
                name="compiler"
                type="select"
                value={formData.compiler || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: loadingAnalysts ? 'Loading...' : 'Select a compiler' },
                  ...creditAnalysts.map(analyst => ({ value: analyst.id, label: `${analyst.first_name} ${analyst.last_name}` }))
                ]}
                colors={colors}
                required
                disabled={loadingAnalysts}
              />
            </div>
          </FormSection>

          <FormSection title="Credit Paper Summary" description="Executive summary and facility overview">
            <FormField
              label="Credit Paper Executive Summary"
              name="credit_paper_summary"
              type="textarea"
              value={formData.credit_paper_summary || ''}
              onChange={handleChange}
              placeholder="Executive summary of the credit paper"
              colors={colors}
              rows={4}
            />
            <FormField
              label="Facility Summary"
              name="facility_summary"
              type="textarea"
              value={formData.facility_summary || ''}
              onChange={handleChange}
              placeholder="Summary of requested facilities"
              colors={colors}
              rows={3}
            />
            <FormField
              label="Counterparty Background"
              name="counterparty_background"
              type="textarea"
              value={formData.counterparty_background || ''}
              onChange={handleChange}
              placeholder="Background information on counterparty"
              colors={colors}
              rows={3}
            />
            <FormField
              label="Business Rationale"
              name="business_rationale"
              type="textarea"
              value={formData.business_rationale || ''}
              onChange={handleChange}
              placeholder="Business rationale for the facilities"
              colors={colors}
              rows={3}
            />
          </FormSection>
        </>
      )}

      {/* Risk & Analysis Tab */}
      {activeTab === 1 && (
        <FormSection title="Risk & Financial Analysis" description="Summaries of risk assessment and financial analysis">
          <FormField
            label="Risk Assessment Summary"
            name="risk_assessment_summary"
            type="textarea"
            value={formData.risk_assessment_summary || ''}
            onChange={handleChange}
            placeholder="Summary of risk assessment findings"
            colors={colors}
            rows={4}
          />
          <FormField
            label="Financial Analysis Summary"
            name="financial_analysis_summary"
            type="textarea"
            value={formData.financial_analysis_summary || ''}
            onChange={handleChange}
            placeholder="Summary of financial analysis"
            colors={colors}
            rows={4}
          />
          <FormField
            label="Pricing Summary"
            name="pricing_summary"
            type="textarea"
            value={formData.pricing_summary || ''}
            onChange={handleChange}
            placeholder="Pricing and fee structure summary"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Legal & Conditions Tab */}
      {activeTab === 2 && (
        <FormSection title="Legal Documentation & Conditions" description="Legal documentation and conditions precedent">
          <FormField
            label="Legal Documentation Summary"
            name="legal_documentation_summary"
            type="textarea"
            value={formData.legal_documentation_summary || ''}
            onChange={handleChange}
            placeholder="Summary of legal documentation review"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Conditions Precedent"
            name="conditions_precedent"
            type="textarea"
            value={formData.conditions_precedent || ''}
            onChange={handleChange}
            placeholder="Conditions precedent to drawdown"
            colors={colors}
            rows={3}
          />
          <FormField
            label="Ongoing Covenants"
            name="ongoing_covenants"
            type="textarea"
            value={formData.ongoing_covenants || ''}
            onChange={handleChange}
            placeholder="Ongoing covenants and monitoring requirements"
            colors={colors}
            rows={3}
          />
        </FormSection>
      )}

      {/* Compilation Status Tab */}
      {activeTab === 3 && (
        <FormSection title="Compilation Status" description="Review status and readiness for approval">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="allFormsReviewed"
                name="all_forms_reviewed"
                checked={formData.all_forms_reviewed === 'true' || formData.all_forms_reviewed === true}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="allFormsReviewed" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                All required forms have been reviewed
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="readyForApproval"
                name="ready_for_approval"
                checked={formData.ready_for_approval === 'true' || formData.ready_for_approval === true}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="readyForApproval" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                Credit paper is ready for approval
              </label>
            </div>
          </div>
          <FormField
            label="Compiler Notes"
            name="compiler_notes"
            type="textarea"
            value={formData.compiler_notes || ''}
            onChange={handleChange}
            placeholder="Internal notes from the compiler"
            colors={colors}
            rows={4}
          />
        </FormSection>
      )}

    </FormPageWrapper>
  );
};

export default CreditCompilationForm;
