import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsersByRole } from '../../services/api';
import TopNavBar from '../TopNavBar';
import { fetchCreditRequest, submitCreditReview, performWorkflowTransition } from '../../services/api';
import LogoutButton from '../LogoutButton';

// Import sub-components
import WorkflowStatus from './WorkflowStatus';
import FormField from './FormField';
import FormSection from './FormSection';

const CreditReviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState(null);
  const [allowedTransitionsList, setAllowedTransitionsList] = useState([]);

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

  useEffect(() => {
    const fetchApplicationData = async () => {
      setLoading(true);
      setLoadingAnalysts(true);
      try {
        const data = await fetchCreditRequest(id);
        setCreditApplication(data);
        setWorkflowInstanceId(data.workflow_instance_id || null);
        setCurrentWorkflowState(data.workflow_state || null);
        setAllowedTransitionsList(data.available_transitions || []);

        // Set form start date if it's a new form
        if (!formStartDate) {
          setFormStartDate(data.form_start_date || new Date().toISOString().split('T')[0]);
        }

        if (data.credit_review_form && data.credit_review_form.form_data) {
          const reviewFormData = data.credit_review_form.form_data;

          // Populate form fields from existing data
          setCreditReviewer(reviewFormData.credit_reviewer || (user && user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user ? user.username : '')) || '');
          setAssignedAnalyst(reviewFormData.assigned_analyst || '');
          setDelegatedAuthority(reviewFormData.delegated_authority || '');
          setNeedQuestionnaire(typeof reviewFormData.need_questionnaire === 'boolean' ? reviewFormData.need_questionnaire : (reviewFormData.need_questionnaire === 'true'));
          setAdditionalInfo(reviewFormData.additional_info || '');
          setRejectionReason(reviewFormData.rejection_reason || '');
          setFormCompletionDate(reviewFormData.form_completion_date || '');
        } else {
          // Default the credit reviewer to the current user
          setCreditReviewer(user && user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user ? user.username : ''));
        }

        // Fetch credit analysts
        try {
          const analysts = await fetchUsersByRole('credit_analyst');
          setCreditAnalysts(analysts || []);
        } catch (analystError) {
          console.error('Error fetching credit analysts:', analystError);
        }

      } catch (error) {
        console.error('Error fetching credit application:', error);
      } finally {
        setLoading(false);
        setLoadingAnalysts(false);
      }
    };

    if (id) {
      fetchApplicationData();
    }
  }, [id, dispatch, user]);

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);

    try {
      const payload = {
        credit_review_form: {
          credit_reviewer: creditReviewer,
          assigned_analyst: assignedAnalyst,
          delegated_authority: delegatedAuthority,
          need_questionnaire: needQuestionnaire,
          additional_info: additionalInfo,
          rejection_reason: rejectionReason,
          form_start_date: formStartDate,
          form_completion_date: isDraft ? formCompletionDate : new Date().toISOString().split('T')[0],
        }
      };

      // Update completion date state if not a draft
      if (!isDraft) {
        setFormCompletionDate(payload.credit_review_form.form_completion_date);
      }

      const response = await submitCreditReview(id, payload);

      if (isDraft) {
        navigate('/'); // Navigate to dashboard (homepage) after draft save
      }
      // For non-draft, success alert/navigation will be handled by handleWorkflowAction
      return response; // Return response for promise chain
    } catch (error) {
      console.error('Error submitting credit review:', error);
      setTransitionError(error.message || 'An error occurred while submitting the form');
      throw error; // Re-throw error for promise chain
    } finally {
      // Only set transitionLoading to false if it's a draft save.
      // For submissions leading to transitions, handleWorkflowAction will manage it.
      if (isDraft) {
        setTransitionLoading(false);
      }
    }
  };

  const handleWorkflowAction = async (transitionCode, comments = '') => {
    setTransitionLoading(true);
    setTransitionError(null);

    try {
      // Save the form data first (non-draft)
      // Pass a synthetic event or null if handleSubmit doesn't strictly need 'e'
      await handleSubmit(null, false);

      // If save is successful, proceed to transition
      if (!workflowInstanceId) {
        throw new Error('Workflow instance ID is not available.');
      }

      const transitionResponse = await performWorkflowTransition(workflowInstanceId, transitionCode, comments);
      alert(`Action '${transitionResponse.data?.transition_name || transitionCode}' performed successfully!`);

      // Re-fetch data to get new state, transitions, and updated form data
      const updatedData = await fetchCreditRequest(id);
      setCreditApplication(updatedData);
      setWorkflowInstanceId(updatedData.workflow_instance_id || null);
      setCurrentWorkflowState(updatedData.workflow_state || null);
      setAllowedTransitionsList(updatedData.available_transitions || []);
      if (updatedData.credit_review_form) {
        const formData = updatedData.credit_review_form;
        setCreditReviewer(formData.credit_reviewer || user?.name || '');
        setAssignedAnalyst(formData.assigned_analyst || '');
        setDelegatedAuthority(formData.delegated_authority || '');
        setNeedQuestionnaire(formData.need_questionnaire || '');
        setAdditionalInfo(formData.additional_info || '');
        setRejectionReason(formData.rejection_reason || '');
        setFormStartDate(formData.form_start_date || new Date().toISOString().split('T')[0]);
        setFormCompletionDate(formData.form_completion_date || '');
      }
      // Optionally navigate or further UI updates based on transitionResponse
      // e.g., if transitionResponse indicates workflow completion, navigate to dashboard
      if (transitionResponse.data?.workflow_completed) {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error(`Error performing action '${transitionCode}':`, error);
      setTransitionError(error.message || `Failed to perform action '${transitionCode}'.`);
      // handleSubmit might have already set transitionLoading to false if it failed.
      // Ensure it's false if the error is from performWorkflowTransition itself.
    } finally {
      setTransitionLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <TopNavBar>
        <LogoutButton />
      </TopNavBar>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: colors.neutral800,
          marginBottom: '0.5rem'
        }}>
          Credit Review Form
        </h1>
        <p style={{ color: colors.neutral600 }}>
          Review and assess the credit application
        </p>
      </div>

      <WorkflowStatus currentStep={2} />

      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <FormSection title="Credit Application Details" description="Review the credit application details">
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Reference Number:</strong> {creditApplication?.reference_number}</p>
            <p><strong>Title:</strong> {creditApplication?.title}</p>
            <p><strong>Counterparty:</strong> {creditApplication?.counterparty?.name}</p>
            <p><strong>Priority:</strong> {creditApplication?.priority}</p>
            <p><strong>Required By:</strong> {creditApplication?.required_by_date}</p>
          </div>
        </FormSection>

        <FormSection title="Credit Reviewer Information" colors={colors}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div> {/* Wrapper for Credit Reviewer */}
              <FormField
                label="Credit Reviewer"
                type="text"
                placeholder="Enter credit reviewer name"
                value={creditReviewer}
                onChange={(e) => setCreditReviewer(e.target.value)}
                colors={colors}
                required
              />
            </div>
            <div> {/* Wrapper for Assigned Credit Analyst and its comment */}
              <FormField 
                label="Assigned Credit Analyst" 
                type="select" 
                value={assignedAnalyst} // This will now store analyst ID
                onChange={(e) => setAssignedAnalyst(e.target.value)} // Stores ID
                options={[
                  { value: '', label: loadingAnalysts ? 'Loading analysts...' : (creditAnalysts.length === 0 ? 'No analysts found' : 'Select an analyst') },
                  ...creditAnalysts.map(analyst => ({ value: analyst.id, label: `${analyst.first_name} ${analyst.last_name} (${analyst.username})` }))
                ]}
                colors={colors}
                required
                disabled={loadingAnalysts}
              />
              <p style={{ fontSize: '0.75rem', color: colors.neutral600, marginTop: '0.25rem', fontStyle: 'italic', paddingLeft: '0.1rem' }}>
                Note: The Assigned Credit Analyst can be different from the Credit Reviewer.
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Delegated Authority" description="Specify the delegated authority level required for approval">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }}>
            <FormField
              label="Delegated Authority (DA) Level" 
              type="select"
              options={[
                { value: "", label: "Select DA Level" },
                { value: "1", label: "DA1 - Board" },
                { value: "2", label: "DA2 - Credit Committee" },
                { value: "3", label: "DA3 - Chief Risk Officer" },
                { value: "4", label: "DA4 - Head of Credit" },
                { value: "5", label: "DA5 - Department Head" },
                { value: "6", label: "DA6 - Senior Credit Analyst" },
                { value: "7", label: "DA7 - Credit Analyst" },
                { value: "8", label: "DA8 - Junior Credit Analyst" }
              ]} 
              value={delegatedAuthority}
              onChange={(e) => setDelegatedAuthority(e.target.value)}
              colors={colors}
              required
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem' 
            }}>
              Need for additional Credit Questionnaire? <span style={{ color: colors.icbcRed }}>*</span>
            </p>
            <FormField
              type="select"
              name="needQuestionnaire"
              value={needQuestionnaire === null || typeof needQuestionnaire === 'undefined' ? '' : String(needQuestionnaire)} // Handle null/undefined for select, map boolean to string
              onChange={(e) => {
                const val = e.target.value;
                setNeedQuestionnaire(val === '' ? null : val === 'true'); // Convert back to boolean or null
              }}
              options={[
                { label: 'Select...', value: '' },
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
              colors={colors}
              // required // Add back if this field is truly required
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <FormField 
              label="Request additional information from Front Office" 
              type="textarea" 
              placeholder="Specify any additional information required from the Front Office" 
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              colors={colors}
            />
          </div>
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.redLight,
            borderRadius: '0.5rem'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              color: colors.icbcRed
            }}>
              Rejection Details
            </p>
            <FormField 
              label="Rejection Reason" 
              type="textarea" 
              placeholder="If rejecting this credit request, please provide detailed reasons" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              colors={colors}
            />
          </div>
        </FormSection>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '2rem' 
        }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'white',
              color: colors.neutral800,
              fontWeight: '500',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.neutral400}`,
              cursor: 'pointer'
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>←</span>
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={(e) => handleSubmit(e, true)}
              disabled={transitionLoading}
              style={{ 
                backgroundColor: 'white',
                border: `1px solid ${colors.neutral400}`,
                color: colors.neutral800,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: transitionLoading ? 'not-allowed' : 'pointer',
                opacity: transitionLoading ? 0.7 : 1
              }}
            >
              Save as Draft
            </button>
            
            {allowedTransitionsList && allowedTransitionsList.map(transition => {
              const isRejectTransition = transition.name.toLowerCase().includes('reject') || transition.code.toLowerCase().includes('reject') || transition.code === 'CR_TR_4' || transition.code === 'PP_TR_4';
              return (
                <button
                  key={transition.code}
                  onClick={() => {
                    let comments = '';
                    if (isRejectTransition) {
                      if (!rejectionReason) {
                        alert('Please provide a rejection reason to perform this action.');
                        return;
                      }
                      comments = rejectionReason;
                    }
                    handleWorkflowAction(transition.code, comments);
                  }}
                  disabled={transitionLoading || (isRejectTransition && !rejectionReason)}
                  style={{
                    backgroundColor: isRejectTransition ? colors.icbcRed : colors.standardBankBlue,
                    border: 'none',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: (transitionLoading || (isRejectTransition && !rejectionReason)) ? 'not-allowed' : 'pointer',
                    opacity: (transitionLoading || (isRejectTransition && !rejectionReason)) ? 0.7 : 1
                  }}
                >
                  {transition.name}
                </button>
              );
            })}
          </div>
        </div>
        
        {transitionError && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: colors.redLight, 
            color: colors.icbcRed,
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}>
            {transitionError}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditReviewForm;
