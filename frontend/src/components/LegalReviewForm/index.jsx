import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchCreditRequest, performWorkflowTransition, saveLegalReviewForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import { Box, Tabs, Tab } from '@mui/material';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

const LegalReviewForm = ({ creditApplication: initialCreditApplication }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);
  const user = useSelector(state => state.auth.user);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Workflow state for the LegalReviewForm itself - Phase 3 pattern
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  // Form state
  const [formStartDate, setFormStartDate] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const {
    detail: legalReviewForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'legal_review_form',
    { refreshKey: refetchTrigger }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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

  const populateFormData = (formDetail) => {
    if (!formDetail) {
      setWorkflowInstanceId(null);
      setCurrentWorkflowState('');
      setAllowedTransitions([]);
      setFormStartDate(new Date().toISOString().split('T')[0]);
      setFormData({});
      return;
    }

    const initialFormData = {};

    // Populate Legal Review Form specific data - Phase 3 pattern
    if (formDetail.workflow_instance) {
      setWorkflowInstanceId(formDetail.workflow_instance.id);
      setCurrentWorkflowState(formDetail.workflow_instance.current_state || 'Draft');
    }

    setAllowedTransitions(formDetail.available_transitions || []);

    initialFormData.agreement_template = formDetail.agreement_template || '';
    initialFormData.governing_law = formDetail.governing_law || '';
    initialFormData.non_standard_provisions = formDetail.non_standard_provisions || '';
    initialFormData.positive_netting_opinion = formDetail.positive_netting_opinion !== null ? String(formDetail.positive_netting_opinion) : '';
    initialFormData.positive_collateral_opinion = formDetail.positive_collateral_opinion !== null ? String(formDetail.positive_collateral_opinion) : '';
    initialFormData.has_csa = formDetail.has_csa !== null ? String(formDetail.has_csa) : '';
    initialFormData.csa_type = formDetail.csa_type || '';
    initialFormData.csa_threshold = formDetail.csa_threshold || '';
    initialFormData.csa_minimum_transfer = formDetail.csa_minimum_transfer || '';
    initialFormData.csa_independent_amount = formDetail.csa_independent_amount || '';
    initialFormData.counterparty_events_of_default = formDetail.counterparty_events_of_default || '';
    initialFormData.grace_period = formDetail.grace_period || '';
    initialFormData.iosco_compliant = formDetail.iosco_compliant !== null ? String(formDetail.iosco_compliant) : '';

    setFormData(initialFormData);
  };

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
  }, [id, user, refetchTrigger]);

  useEffect(() => {
    if (artifactError) {
      setTransitionError('Failed to load legal review form data.');
      return;
    }

    populateFormData(legalReviewForm);
  }, [artifactError, legalReviewForm]);

  const buildPayload = () => {
    const toBoolean = (value) => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return null;
    };

    const toDecimal = (value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const toIsoDateTime = (dateValue) => {
      if (!dateValue) {
        return null;
      }

      const normalizedValue = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`;
      return new Date(normalizedValue).toISOString();
    };

    return {
      agreement_template: formData.agreement_template || null,
      governing_law: formData.governing_law,
      non_standard_provisions: formData.non_standard_provisions,
      positive_netting_opinion: toBoolean(formData.positive_netting_opinion),
      positive_collateral_opinion: toBoolean(formData.positive_collateral_opinion),
      has_csa: toBoolean(formData.has_csa),
      csa_type: formData.csa_type || null,
      csa_threshold: toDecimal(formData.csa_threshold),
      csa_minimum_transfer: toDecimal(formData.csa_minimum_transfer),
      csa_independent_amount: toDecimal(formData.csa_independent_amount),
      counterparty_events_of_default: formData.counterparty_events_of_default,
      grace_period: formData.grace_period,
      iosco_compliant: toBoolean(formData.iosco_compliant),
      form_started_at: toIsoDateTime(formStartDate || new Date().toISOString().split('T')[0]),
    };
  };

  // Phase 3 handleTransition pattern - matches other forms exactly
  const handleTransition = async (transition, comments = '') => {
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    const payload = buildPayload();
    
    try {
      // First save form data using proper API service
      await saveLegalReviewForm(id, payload);
      
      // Then perform transition with proper Phase 3 payload structure - SAME AS OTHER FORMS
      const transitionPayload = { transition_code: transition.code, comments: comments };

      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'LR_SAVE_DRAFT' || transition.code === 'LR_BACK_TO_DRAFT' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('submit')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      // Use same error handling pattern as BusinessSponsorshipForm
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

  // Workflow status props for FormPageWrapper
  const workflowStatusProps = {
    currentStep: creditApplication?.workflow_state?.metadata?.step_number || 6, // Legal Review is typically step 6
    workflowType: "LEGAL_REVIEW",
    colors: colors,
    currentWorkflowState: { name: currentWorkflowState },
  };

  // Workflow actions props for FormPageWrapper
  const workflowActionsProps = {
    key: workflowInstanceId || 'new-legal-review-actions',
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: allowedTransitions || [],
    colors: colors,
  };
  const loading = applicationLoading || artifactLoading;
  
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Legal Review Form...</div>;

  return (
    <FormPageWrapper
      title="Legal Review Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >

      {/* Form content - FormPageWrapper handles the white card styling */}
      <div>
        {/* Title is handled by FormPageWrapper */}
        
        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading form data...</div>}
        {!loading && !creditApplication && id && <div style={{ textAlign: 'center', padding: '2rem', color: '#E53E3E' }}>Could not load application data for ID: {id}.</div>}
        {!loading && !creditApplication && !id && <div style={{ textAlign: 'center', padding: '2rem', color: '#E53E3E' }}>No application ID provided.</div>}

        {creditApplication && !loading && (
          <>
            <CreditApplicationDetailsSection creditApplication={creditApplication} />
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="legal review form tabs" variant="fullWidth">
                <Tab label="Agreement Details" />
                <Tab label="Legal Opinions" />
                <Tab label="CSA & Collateral" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Box sx={{ width: '100%' }}>
                <FormSection title="Legal Agreement Information" description="Provide details on the legal agreement template and governing law.">
                  <FormField 
                    label="Agreement Template *" 
                    name="agreement_template" 
                    type="select" 
                    value={formData.agreement_template || ''} 
                    onChange={handleChange} 
                    colors={colors} 
                    options={[
                      {value: '', label: 'Select Agreement Template'},
                      {value: 'ISDA', label: 'ISDA Master Agreement'},
                      {value: 'GMRA', label: 'Global Master Repurchase Agreement'},
                      {value: 'CSA', label: 'Credit Support Annex'},
                      {value: 'OTHER', label: 'Other'}
                    ]} 
                  />
                  <FormField label="Governing Law" name="governing_law" value={formData.governing_law || ''} onChange={handleChange} colors={colors} placeholder="e.g., English Law, New York Law" />
                  <FormField label="Non-Standard Provisions" name="non_standard_provisions" type="textarea" value={formData.non_standard_provisions || ''} onChange={handleChange} colors={colors} placeholder="Any non-standard provisions in the agreement" />
                  <FormField label="Counterparty Events of Default" name="counterparty_events_of_default" type="textarea" value={formData.counterparty_events_of_default || ''} onChange={handleChange} colors={colors} placeholder="Counterparty events of default provisions" />
                  <FormField label="Grace Period" name="grace_period" value={formData.grace_period || ''} onChange={handleChange} colors={colors} placeholder="Grace period for defaults" />
                </FormSection>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ width: '100%' }}>
                <FormSection title="Legal Opinions" description="Provide details on legal opinions received.">
                  <FormField label="Positive Netting Opinion" name="positive_netting_opinion" type="select" value={formData.positive_netting_opinion || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select answer'}, {value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}]} />
                  <FormField label="Positive Collateral Opinion" name="positive_collateral_opinion" type="select" value={formData.positive_collateral_opinion || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select answer'}, {value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}]} />
                  <FormField label="IOSCO Compliant" name="iosco_compliant" type="select" value={formData.iosco_compliant || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select answer'}, {value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}]} />
                </FormSection>
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ width: '100%' }}>
                <FormSection title="CSA & Collateral Details" description="Provide details on Credit Support Annex and collateral arrangements.">
                  <FormField label="Has CSA" name="has_csa" type="select" value={formData.has_csa || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select answer'}, {value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}]} />
                  <FormField label="CSA Type" name="csa_type" value={formData.csa_type || ''} onChange={handleChange} colors={colors} placeholder="Type of CSA agreement" />
                  <FormField label="CSA Threshold" name="csa_threshold" type="number" value={formData.csa_threshold || ''} onChange={handleChange} colors={colors} placeholder="CSA threshold amount" />
                  <FormField label="CSA Minimum Transfer" name="csa_minimum_transfer" type="number" value={formData.csa_minimum_transfer || ''} onChange={handleChange} colors={colors} placeholder="CSA minimum transfer amount" />
                  <FormField label="CSA Independent Amount" name="csa_independent_amount" type="number" value={formData.csa_independent_amount || ''} onChange={handleChange} colors={colors} placeholder="CSA independent amount" />
                </FormSection>
              </Box>
            )}
          </>
        )} {/* End of conditional rendering for creditApplication */}
      </div>
    </FormPageWrapper>
  );
};

export default LegalReviewForm;
