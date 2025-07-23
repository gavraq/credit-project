import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditRequest, performWorkflowTransition, saveBusinessSponsorshipForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';

const BusinessSponsorshipForm = ({ creditApplication: initialCreditApplication, currentStep = 3 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme(); // Add theme hook
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);
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


  const populateFormData = useCallback((data) => {
    if (!data) return;

    setCreditApplication(data);

    const businessForm = data.business_sponsorship_form;
    if (!businessForm) {
      console.error('No business_sponsorship_form found in data');
      return;
    }

    // Use Business Sponsorship Form sub-process workflow - SAME PATTERN as CreditRequestForm/CreditReviewForm
    if (businessForm.workflow_instance) {
      setWorkflowInstanceId(businessForm.workflow_instance.id);
      setCurrentWorkflowState(businessForm.workflow_instance.current_state || 'Draft');
    }
    
    // Use available_transitions from Business Sponsorship Form serializer
    console.log('Available transitions from API:', businessForm.available_transitions);
    setAllowedTransitions(businessForm.available_transitions || []);
    console.log('Setting allowedTransitions state to:', businessForm.available_transitions || []);

    // Extract sponsor names from Credit Request Form data (same pattern as original)
    const creditRequestForm = data.credit_request_form;
    const primarySponsorName = businessForm.senior_business_sponsor_name || 
                              (creditRequestForm?.senior_business_sponsor_name) || 
                              '';
    const secondSponsorName = businessForm.second_business_sponsor_name || 
                             (creditRequestForm?.second_business_sponsor_name) || 
                             '';

    // Map backend field names to frontend state
    setSponsorName(primarySponsorName);
    setSponsorDecision(businessForm.senior_sponsor_approval || '');
    setSponsorComments(businessForm.senior_sponsor_comments || '');
    setSecondSponsorName(secondSponsorName);
    setSecondSponsorDecision(businessForm.second_sponsor_approval || '');
    setSecondSponsorComments(businessForm.second_sponsor_comments || '');
    setFormStartDate(businessForm.form_started_at ? businessForm.form_started_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormCompletionDate(businessForm.form_completed_at ? businessForm.form_completed_at.split('T')[0] : '');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchCreditRequest(id);
        populateFormData(data);
      } catch (error) {
        console.error('Failed to fetch credit application:', error);
        setTransitionError('Failed to load application data.');
      } finally {
        setLoading(false);
      }
    };

    if (initialCreditApplication) {
      populateFormData(initialCreditApplication);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [id, initialCreditApplication, refetchTrigger, populateFormData]);

  const buildPayload = useCallback(() => {
    // Use FLAT PREFIXED FIELDS matching the backend model field names
    return {
      business_sponsorship_form_senior_business_sponsor_name: sponsorName,
      business_sponsorship_form_senior_sponsor_approval: sponsorDecision,
      business_sponsorship_form_senior_sponsor_comments: sponsorComments,
      business_sponsorship_form_second_business_sponsor_name: secondSponsorName,
      business_sponsorship_form_second_sponsor_approval: secondSponsorDecision,
      business_sponsorship_form_second_sponsor_comments: secondSponsorComments,
      business_sponsorship_form_form_started_at: formStartDate,
      business_sponsorship_form_form_completed_at: formCompletionDate || new Date().toISOString().split('T')[0],
    };
  }, [sponsorName, sponsorDecision, sponsorComments, secondSponsorName, secondSponsorDecision, secondSponsorComments, formStartDate, formCompletionDate]);

  const handleSave = async () => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();
    try {
      // Use the proper API service function
      await saveBusinessSponsorshipForm(id, payload);
      navigate('/');
    } catch (error) {
      console.error('Error saving business sponsorship form:', error);
      setTransitionError(error.message || 'Failed to save data.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transition, comments) => {
    // Validation: Check if rejection requires rejection decision
    if (transition && transition.name.toLowerCase().includes('reject') && sponsorDecision !== 'reject' && secondSponsorDecision !== 'reject') {
      setTransitionError('A rejection decision must be selected by at least one sponsor.');
      return;
    }

    // Validation: Check if approval requires approval decision
    if (transition && transition.name.toLowerCase().includes('submit') && !transition.name.toLowerCase().includes('reject') && sponsorDecision !== 'approve') {
      setTransitionError('The primary sponsor must approve the application to proceed.');
      return;
    }

    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();

    try {
      console.log('Business Sponsorship Form - Saving form data first...');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      // First save form data using proper API service
      await saveBusinessSponsorshipForm(id, payload);
      console.log('Business Sponsorship Form - Form data saved successfully');
      
      // Then perform transition with proper Phase 3 payload structure
      const transitionComments = transition.name.toLowerCase().includes('reject') 
        ? (sponsorDecision === 'reject' ? sponsorComments : secondSponsorComments)
        : comments;
      const transitionPayload = { transition_code: transition.code, comments: transitionComments };
      
      console.log('Business Sponsorship Form - Performing transition...');
      console.log('Transition payload:', JSON.stringify(transitionPayload, null, 2));
      console.log('Workflow instance ID:', workflowInstanceId);
      
      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      console.log('Business Sponsorship Form - Transition performed successfully');
      
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
        console.error('Backend error response data:', error.response.data);
        console.error('Backend error response status:', error.response.status);
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: (Status: ${error.response.status}) - No additional data.`;
        }
      } else if (error.request) {
        console.error('Transition error: No response received:', error.request);
        detailedError = 'Transition error: No response received from server.';
      } else {
        console.error('Transition setup error:', error.message);
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
              onClick={() => setSponsorDecision('approve')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: sponsorDecision === 'approve' ? theme.palette.success.main : theme.palette.background.paper,
                color: sponsorDecision === 'approve' ? theme.palette.success.contrastText : theme.palette.success.main,
                border: `1px solid ${theme.palette.success.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSponsorDecision('reject')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: sponsorDecision === 'reject' ? theme.palette.secondary.main : theme.palette.background.paper,
                color: sponsorDecision === 'reject' ? theme.palette.secondary.contrastText : theme.palette.secondary.main,
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
              onClick={() => setSecondSponsorDecision('approve')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: secondSponsorDecision === 'approve' ? theme.palette.success.main : theme.palette.background.paper,
                color: secondSponsorDecision === 'approve' ? theme.palette.success.contrastText : theme.palette.success.main,
                border: `1px solid ${theme.palette.success.main}`,
                fontFamily: theme.typography.fontFamily
              }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSecondSponsorDecision('reject')}
              style={{
                minWidth: '120px',
                height: '38px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: secondSponsorDecision === 'reject' ? theme.palette.secondary.main : theme.palette.background.paper,
                color: secondSponsorDecision === 'reject' ? theme.palette.secondary.contrastText : theme.palette.secondary.main,
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