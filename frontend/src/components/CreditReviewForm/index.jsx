import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchUsersByRole, fetchCreditRequest, submitCreditReview, performWorkflowTransition } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';

const CreditReviewForm = ({ creditApplication: initialCreditApplication, currentStep = 2 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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
  const [creditReviewer, setCreditReviewer] = useState('');
  const [assignedAnalyst, setAssignedAnalyst] = useState('');
  const [delegatedAuthority, setDelegatedAuthority] = useState('');
  const [needQuestionnaire, setNeedQuestionnaire] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [creditAnalysts, setCreditAnalysts] = useState([]);
  const [loadingAnalysts, setLoadingAnalysts] = useState(false);


  const populateFormData = useCallback((data) => {
    if (!data) return;

    setCreditApplication(data);

    const reviewForm = data.credit_review_form;
    if (!reviewForm) {
      console.error('No credit_review_form found in data');
      return;
    }

    // Use Credit Review Form sub-process workflow - SAME PATTERN as CreditRequestForm
    if (reviewForm.workflow_instance) {
      setWorkflowInstanceId(reviewForm.workflow_instance.id);
      setCurrentWorkflowState(reviewForm.workflow_instance.current_state || 'Draft');
    }
    
    // Use available_transitions from Credit Review Form serializer
    console.log('Available transitions from API:', reviewForm.available_transitions);
    setAllowedTransitions(reviewForm.available_transitions || []);
    console.log('Setting allowedTransitions state to:', reviewForm.available_transitions || []);

    // Map backend field names to frontend state
    const defaultReviewer = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
    setCreditReviewer(defaultReviewer); // Always use current user's name for display
    
    // For assigned analyst, use the ID if it exists, otherwise empty
    if (reviewForm.assigned_credit_analyst) {
      if (typeof reviewForm.assigned_credit_analyst === 'object' && reviewForm.assigned_credit_analyst.id) {
        setAssignedAnalyst(reviewForm.assigned_credit_analyst.id);
      } else {
        setAssignedAnalyst(reviewForm.assigned_credit_analyst);
      }
    } else {
      setAssignedAnalyst('');
    }
    setDelegatedAuthority(reviewForm.delegated_authority_level || '');
    setNeedQuestionnaire(reviewForm.questionnaire_required ? 'yes' : 'no');
    setAdditionalInfo(reviewForm.additional_information_request || '');
    setRejectionReason(reviewForm.rejection_reason || '');
    setFormStartDate(reviewForm.form_started_at ? reviewForm.form_started_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormCompletionDate(reviewForm.form_completed_at ? reviewForm.form_completed_at.split('T')[0] : '');
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
      setLoading(false); // Important: set loading to false when using initialCreditApplication
    } else {
      fetchData();
    }

    fetchAndSetAnalysts();
  }, [id, initialCreditApplication, refetchTrigger, populateFormData, fetchAndSetAnalysts]);

  const buildPayload = useCallback(() => {
    // Use FLAT PREFIXED FIELDS - SAME PATTERN as working CreditRequestForm 
    return {
      credit_review_form_credit_reviewer: user?.id || null, // Use current user's ID, not name
      credit_review_form_assigned_credit_analyst: assignedAnalyst,
      credit_review_form_delegated_authority_level: delegatedAuthority,
      credit_review_form_questionnaire_required: needQuestionnaire === 'yes',
      credit_review_form_additional_information_request: additionalInfo,
      credit_review_form_rejection_reason: rejectionReason,
      credit_review_form_form_started_at: formStartDate,
      credit_review_form_form_completed_at: formCompletionDate || new Date().toISOString().split('T')[0],
    };
  }, [user?.id, assignedAnalyst, delegatedAuthority, needQuestionnaire, additionalInfo, rejectionReason, formStartDate, formCompletionDate]);

  const handleSave = async () => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();
    try {
      await submitCreditReview(id, payload);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving credit review:', error);
      setTransitionError(error.message || 'Failed to save data.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transition, comments) => {
    if (transition && transition.name.toLowerCase().includes('reject') && !rejectionReason) {
      setTransitionError('A rejection reason is required to perform this action.');
      return;
    }

    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();

    try {
      console.log('Credit Review Form - Saving form data first...');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      // First save form data
      await submitCreditReview(id, payload);
      console.log('Credit Review Form - Form data saved successfully');
      
      // Then perform transition with proper Phase 3 payload structure
      const transitionComments = transition.name.toLowerCase().includes('reject') ? rejectionReason : comments;
      const transitionPayload = { transition_code: transition.code, comments: transitionComments };
      
      console.log('Credit Review Form - Performing transition...');
      console.log('Transition payload:', JSON.stringify(transitionPayload, null, 2));
      console.log('Workflow instance ID:', workflowInstanceId);
      
      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      console.log('Credit Review Form - Transition performed successfully');
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'CR_SAVE_DRAFT' || transition.code === 'CR_BACK_TO_DRAFT' || transition.code === 'CR_SUBMIT_IN_PROGRESS' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('business')) {
        // For Save as Draft and Submit to In Progress transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
    } catch (error) {
      // Use same error handling pattern as Credit Request Form
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
    workflowType: "CREDIT_REVIEW",
    currentWorkflowState: { name: currentWorkflowState },
  };

  const workflowActionsProps = {
    key: workflowInstanceId || 'new-review-actions',
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
      title="Credit Review Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      <CreditApplicationDetailsSection creditApplication={creditApplication} />

      <FormSection title="Credit Reviewer Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField
            label="Credit Reviewer"
            type="text"
            value={creditReviewer}
            onChange={(e) => setCreditReviewer(e.target.value)}
            required
            disabled={true}
            helperText="This will be set to the current logged-in user who performs the review"
          />
          <FormField 
            label="Assigned Credit Analyst" 
            type="select" 
            value={assignedAnalyst}
            onChange={(e) => setAssignedAnalyst(e.target.value)}
            options={[
              { value: '', label: loadingAnalysts ? 'Loading...' : 'Select an analyst' },
              ...creditAnalysts.map(analyst => ({ value: analyst.id, label: `${analyst.first_name} ${analyst.last_name}` }))
            ]}
            required
            disabled={loadingAnalysts}
          />
        </div>
      </FormSection>

      <FormSection title="Delegated Authority" description="Specify the delegated authority level required for approval">
        <FormField
          label="Delegated Authority (DA) Level" 
          type="select"
          options={[
            { value: "", label: "Select DA Level" },
            { value: "DA1", label: "DA1 - Board" },
            { value: "DA2", label: "DA2 - Credit Committee" },
            { value: "DA3", label: "DA3 - Chief Risk Officer" },
            { value: "DA4", label: "DA4 - Head of Credit" },
            { value: "DA5", label: "DA5 - Department Head" },
            { value: "DA6", label: "DA6 - Senior Credit Analyst" },
            { value: "DA7", label: "DA7 - Credit Analyst" },
            { value: "DA8", label: "DA8 - Junior Credit Analyst" }
          ]} 
          value={delegatedAuthority}
          onChange={(e) => setDelegatedAuthority(e.target.value)}
          required
        />
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            marginBottom: '0.5rem',
            color: theme.palette.grey[600],
            fontFamily: theme.typography.fontFamily
          }}>
            Need for additional Credit Questionnaire? <span style={{ color: theme.palette.secondary.main }}>*</span>
          </p>
          <FormField
            type="select"
            name="needQuestionnaire"
            value={String(needQuestionnaire)}
            onChange={(e) => setNeedQuestionnaire(e.target.value)}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Additional Information" description="Provide any additional information or comments">
        <FormField 
          label="Additional Information" 
          type="textarea" 
          placeholder="Enter any additional information here"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />
      </FormSection>

      <FormSection title="Rejection Reason" description="Required if you are rejecting the application">
        <div style={{ 
          backgroundColor: theme.palette.secondary.light, 
          padding: '1rem', 
          borderRadius: '6px', 
          border: `1px solid ${theme.palette.secondary.main}`
        }}>
          <FormField 
            label="Rejection Reason" 
            type="textarea" 
            placeholder="If rejecting this credit request, please provide detailed reasons" 
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
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

export default CreditReviewForm;
