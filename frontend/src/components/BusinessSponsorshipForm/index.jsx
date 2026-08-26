import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditArtifact, fetchCreditRequest, performWorkflowTransition, saveBusinessSponsorshipForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

const BusinessSponsorshipForm = ({ creditApplication: initialCreditApplication, currentStep = 3 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme(); // Add theme hook
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  // Form state
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorDecision, setSponsorDecision] = useState('');
  const [sponsorComments, setSponsorComments] = useState('');
  const [secondSponsorName, setSecondSponsorName] = useState('');
  const [secondSponsorDecision, setSecondSponsorDecision] = useState('');
  const [secondSponsorComments, setSecondSponsorComments] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const {
    detail: businessSponsorshipForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'business_sponsorship_form',
    { refreshKey: refetchTrigger }
  );


  const populateFormData = useCallback((businessForm, creditRequestForm) => {
    if (!businessForm) {
      setWorkflowInstanceId(null);
      setCurrentWorkflowState('');
      setAllowedTransitions([]);
      setSponsorName('');
      setSponsorDecision('');
      setSponsorComments('');
      setSecondSponsorName('');
      setSecondSponsorDecision('');
      setSecondSponsorComments('');
      setFormStartDate('');
      setFormCompletionDate('');
      return;
    }

    // Use Business Sponsorship Form sub-process workflow - SAME PATTERN as CreditRequestForm/CreditReviewForm
    if (businessForm.workflow_instance) {
      setWorkflowInstanceId(businessForm.workflow_instance.id);
      setCurrentWorkflowState(businessForm.workflow_instance.current_state || 'Draft');
    }
    
    // Use available_transitions from Business Sponsorship Form serializer
    setAllowedTransitions(businessForm.available_transitions || []);

    // Extract sponsor names from Credit Request Form data (same pattern as original)
    const primarySponsorName = businessForm.senior_business_sponsor_name || 
                              (creditRequestForm?.senior_business_sponsor_name) || 
                              '';
    const secondSponsorDisplayName = businessForm.second_business_sponsor_name || 
                             (creditRequestForm?.second_business_sponsor_name) || 
                             '';

    // Map backend field names to frontend state
    setSponsorName(primarySponsorName);
    setSponsorDecision(businessForm.senior_sponsor_approval || '');
    setSponsorComments(businessForm.senior_sponsor_comments || '');
    setSecondSponsorName(secondSponsorDisplayName);
    setSecondSponsorDecision(businessForm.second_sponsor_approval || '');
    setSecondSponsorComments(businessForm.second_sponsor_comments || '');
    setFormStartDate(businessForm.form_started_at ? businessForm.form_started_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormCompletionDate(businessForm.form_completed_at ? businessForm.form_completed_at.split('T')[0] : '');
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
  }, [id, refetchTrigger]);

  useEffect(() => {
    let isActive = true;

    const loadSupportingArtifacts = async () => {
      if (artifactError) {
        setTransitionError('Failed to load business sponsorship form data.');
        return;
      }

      if (!businessSponsorshipForm) {
        populateFormData(null, null);
        return;
      }

      try {
        const creditRequestForm = await fetchCreditArtifact(id, 'credit_request_form');
        if (isActive) {
          populateFormData(businessSponsorshipForm, creditRequestForm);
          setTransitionError(null);
        }
      } catch (error) {
        if (isActive) {
          setTransitionError('Failed to load supporting credit request form data.');
        }
      }
    };

    loadSupportingArtifacts();

    return () => {
      isActive = false;
    };
  }, [artifactError, businessSponsorshipForm, id, populateFormData]);

  const buildPayload = useCallback(() => {
    const toIsoDateTime = (dateValue) => {
      if (!dateValue) {
        return null;
      }

      const normalizedValue = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`;
      return new Date(normalizedValue).toISOString();
    };

    return {
      senior_sponsor_approval: sponsorDecision || null,
      senior_sponsor_comments: sponsorComments,
      second_sponsor_approval: secondSponsorDecision || null,
      second_sponsor_comments: secondSponsorComments,
      form_started_at: toIsoDateTime(formStartDate || new Date().toISOString().split('T')[0]),
      form_completed_at: toIsoDateTime(
        formCompletionDate || new Date().toISOString().split('T')[0]
      ),
    };
  }, [sponsorDecision, sponsorComments, secondSponsorDecision, secondSponsorComments, formStartDate, formCompletionDate]);

  const handleSave = async () => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();
    try {
      // Use the proper API service function
      await saveBusinessSponsorshipForm(id, payload);
      navigate('/');
    } catch (error) {
      setTransitionError(error.message || 'Failed to save data.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transition, comments) => {
    // Validation: Check if rejection requires rejection decision
    if (transition && transition.name.toLowerCase().includes('reject') && sponsorDecision !== 'rejected' && secondSponsorDecision !== 'rejected') {
      setTransitionError('A rejection decision must be selected by at least one sponsor.');
      return;
    }

    // Validation: Check if approval requires approval decision
    if (transition && transition.name.toLowerCase().includes('submit') && !transition.name.toLowerCase().includes('reject') && sponsorDecision !== 'approved') {
      setTransitionError('The primary sponsor must approve the application to proceed.');
      return;
    }

    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();

    try {
      // First save form data using proper API service
      await saveBusinessSponsorshipForm(id, payload);
      
      // Then perform transition with proper Phase 3 payload structure
      const transitionComments = transition.name.toLowerCase().includes('reject') 
        ? (sponsorDecision === 'rejected' ? sponsorComments : secondSponsorComments)
        : comments;
      const transitionPayload = { transition_code: transition.code, comments: transitionComments };

      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'BS_SAVE_DRAFT' || transition.code === 'BS_BACK_TO_DRAFT' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('submit')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
    } catch (error) {
      // Use same error handling pattern as Credit Review Form
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
    workflowType: "BUSINESS_SPONSORSHIP",
    currentWorkflowState: { name: currentWorkflowState },
  };

  const workflowActionsProps = {
    key: workflowInstanceId || 'new-business-actions',
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: allowedTransitions || [],
  };
  const loading = applicationLoading || artifactLoading;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <FormPageWrapper
      title="Business Sponsorship Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      <CreditApplicationDetailsSection creditApplication={creditApplication} />

      <FormSection title="Primary Business Sponsor" description="The primary business sponsor must approve or reject the application.">
        <FormField
          label="Sponsor Name"
          type="text"
          value={sponsorName}
          onChange={(e) => setSponsorName(e.target.value)}
          disabled
          helperText="This is pre-populated from the Credit Request Form"
        />
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: theme.palette.grey[600], // Design brief: neutral700
            fontWeight: '500',
            fontSize: '0.875rem',
            fontFamily: theme.typography.fontFamily
          }}>
            Decision <span style={{ color: theme.palette.secondary.main }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="outlined"
              onClick={() => setSponsorDecision('approved')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: sponsorDecision === 'approved' ? theme.palette.success.main : theme.palette.background.paper,
                color: sponsorDecision === 'approved' ? theme.palette.success.contrastText : theme.palette.success.main,
                border: `1px solid ${theme.palette.success.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSponsorDecision('rejected')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: sponsorDecision === 'rejected' ? theme.palette.secondary.main : theme.palette.background.paper,
                color: sponsorDecision === 'rejected' ? theme.palette.secondary.contrastText : theme.palette.secondary.main,
                border: `1px solid ${theme.palette.secondary.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Reject
            </Button>
          </div>
        </div>

        <FormField
          label="Sponsor Comments"
          type="textarea"
          placeholder="Provide comments to support your decision..."
          value={sponsorComments}
          onChange={(e) => setSponsorComments(e.target.value)}
          required
        />
      </FormSection>

      <FormSection title="Second Business Sponsor (Optional)" description="An optional second sponsor can also provide their decision.">
        <FormField
          label="Second Sponsor Name"
          type="text"
          value={secondSponsorName}
          onChange={(e) => setSecondSponsorName(e.target.value)}
          disabled
          helperText="This is pre-populated from the Credit Request Form"
        />
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: theme.palette.grey[600], // Design brief: neutral700
            fontWeight: '500',
            fontSize: '0.875rem',
            fontFamily: theme.typography.fontFamily
          }}>
            Decision
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="outlined"
              onClick={() => setSecondSponsorDecision('approved')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: secondSponsorDecision === 'approved' ? theme.palette.success.main : theme.palette.background.paper,
                color: secondSponsorDecision === 'approved' ? theme.palette.success.contrastText : theme.palette.success.main,
                border: `1px solid ${theme.palette.success.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSecondSponsorDecision('rejected')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: secondSponsorDecision === 'rejected' ? theme.palette.secondary.main : theme.palette.background.paper,
                color: secondSponsorDecision === 'rejected' ? theme.palette.secondary.contrastText : theme.palette.secondary.main,
                border: `1px solid ${theme.palette.secondary.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Reject
            </Button>
          </div>
        </div>

        <FormField
          label="Second Sponsor Comments"
          type="textarea"
          placeholder="Provide comments to support your decision..."
          value={secondSponsorComments}
          onChange={(e) => setSecondSponsorComments(e.target.value)}
        />
      </FormSection>

      <div style={{ 
        marginTop: theme.spacing(5), // 20px
        paddingTop: theme.spacing(5), // 20px
        borderTop: `1px solid ${theme.palette.grey[200]}`, 
        display: 'flex', 
        justifyContent: 'flex-end' 
      }}>
        <Button
          variant="outlined"
          onClick={handleSave}
          disabled={transitionLoading}
          style={{
            minWidth: '120px',
            height: '38px',
            fontWeight: 500,
            fontSize: '0.875rem',
            textTransform: 'none',
            borderRadius: '6px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.grey[500],
            border: `1px solid ${theme.palette.grey[300]}`,
            opacity: transitionLoading ? 0.6 : 1,
            cursor: transitionLoading ? 'not-allowed' : 'pointer',
            fontFamily: theme.typography.fontFamily
          }}
        >
          {transitionLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </FormPageWrapper>
  );
};

export default BusinessSponsorshipForm;
