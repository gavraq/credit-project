import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopNavBar from '../TopNavBar';
import { fetchCreditRequest, saveBusinessSponsorshipForm, performWorkflowTransition } from '../../services/api'; // Assuming updateCreditApplication exists
import LogoutButton from '../LogoutButton';
import WorkflowStatus from '../common/WorkflowStatus';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import Typography from '@mui/material/Typography'; // Added import

const BusinessSponsorshipForm = ({ creditApplication: initialCreditApplication, currentStep = 1 }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [userGuidanceMessage, setUserGuidanceMessage] = useState(null);
  const [transitionSuccessMessage, setTransitionSuccessMessage] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);

  // Workflow state for the BusinessSponsorshipForm itself
  const [bsWorkflowInstanceId, setBsWorkflowInstanceId] = useState(null);
  const [currentBsWorkflowState, setCurrentBsWorkflowState] = useState(null);
  const [allowedBsTransitionsList, setAllowedBsTransitionsList] = useState([]);

  // Form state
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorDecision, setSponsorDecision] = useState(''); // 'approve' or 'reject'
  const [sponsorComments, setSponsorComments] = useState('');
  const [secondSponsorDecision, setSecondSponsorDecision] = useState(''); // 'approve' or 'reject'

  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [secondSponsorName, setSecondSponsorName] = useState('');
  const [secondSponsorComments, setSecondSponsorComments] = useState('');

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

  const populateFormData = (data) => {
    if (!data) return;
    setCreditApplication(data); // Store the whole application object

    // Pre-populate sponsor names from CreditRequestForm if available
    let initialSponsorName = '';
    let initialSecondSponsorName = '';

    if (data.credit_request_form && data.credit_request_form.form_data && data.credit_request_form.form_data.prioritisation_sponsorship) {
      initialSponsorName = data.credit_request_form.form_data.prioritisation_sponsorship.senior_business_sponsor_name || '';
      initialSecondSponsorName = data.credit_request_form.form_data.prioritisation_sponsorship.second_business_sponsor_name || '';
    }
    
    // Set initial state for sponsor names based on CreditRequestForm
    // These might be overridden by BusinessSponsorshipForm's own saved data later if it exists
    setSponsorName(initialSponsorName);
    setSecondSponsorName(initialSecondSponsorName);

    // Populate Business Sponsorship Form specific data (which might override the above if already saved)
    if (data.business_sponsorship_form && data.business_sponsorship_form.form_data) {
      const bsFormData = data.business_sponsorship_form.form_data;
      
      // If BS form has its own saved sponsor_name, it takes precedence. Otherwise, keep pre-populated.
      setSponsorName(bsFormData.sponsor_name || initialSponsorName || user?.name || ''); 
      setSponsorDecision(bsFormData.sponsor_decision || '');
      setSponsorComments(bsFormData.sponsor_comments || '');
      
      // If BS form has its own saved second_sponsor_name, it takes precedence. Otherwise, keep pre-populated.
      setSecondSponsorName(bsFormData.second_sponsor_name || initialSecondSponsorName || ''); 
      setSecondSponsorDecision(bsFormData.second_sponsor_decision || '');
      setSecondSponsorComments(bsFormData.second_sponsor_comments || '');
      
      setFormStartDate(bsFormData.form_start_date || new Date().toISOString().split('T')[0]);
      setFormCompletionDate(bsFormData.form_completion_date || '');
      
      // Populate BS workflow specific data
      setBsWorkflowInstanceId(data.business_sponsorship_form.workflow_instance_id || null);
      setCurrentBsWorkflowState(data.business_sponsorship_form.workflow_state_name || null);
      setAllowedBsTransitionsList(data.business_sponsorship_form.available_transitions || []);

    } else {
      // If no business_sponsorship_form.form_data exists, ensure defaults are set using pre-populated values
      // or fallbacks if pre-population also yielded nothing.
      setSponsorName(initialSponsorName || user?.name || '');
      setSecondSponsorName(initialSecondSponsorName || ''); // Default for second sponsor if not pre-populated
      setFormStartDate(new Date().toISOString().split('T')[0]);
      // Reset other BS form specific fields if necessary
      setSponsorDecision('');
      setSponsorComments('');
      setSecondSponsorDecision('');
      setSecondSponsorComments('');
      setFormCompletionDate('');

      // Also ensure BS workflow state is reset if no bs_form data
      if (data.business_sponsorship_form) { // Check if bs_form object exists even if form_data inside it doesn't
        setBsWorkflowInstanceId(data.business_sponsorship_form.workflow_instance_id || null);
        setCurrentBsWorkflowState(data.business_sponsorship_form.workflow_state_name || null);
        setAllowedBsTransitionsList(data.business_sponsorship_form.available_transitions || []);
      } else {
        setBsWorkflowInstanceId(null);
        setCurrentBsWorkflowState(null);
        setAllowedBsTransitionsList([]);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    if (initialCreditApplication) {
      populateFormData(initialCreditApplication);
      setLoading(false);
    } else if (id) {
      fetchCreditRequest(id)
        .then(data => {
          populateFormData(data);
        })
        .catch(error => {
          console.error('Failed to fetch credit request details:', error);
          setSaveError('Failed to load form data.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // This case is for a brand new, unsaved application. Handled by populateFormData defaults.
      populateFormData(null);
      setLoading(false);
    }
  }, [id, initialCreditApplication]);

  const handleSubmit = async (e, isDraft = false) => {
    if (e) {
      e.preventDefault();
    }
    setSaveLoading(true);
    setSaveError(null);
    setUserGuidanceMessage(null);
    setTransitionSuccessMessage(null);

    const businessSponsorshipPayload = {
      sponsor_name: sponsorName,
      sponsor_decision: sponsorDecision,
      sponsor_comments: sponsorComments,
      second_sponsor_decision: secondSponsorDecision,
      form_start_date: formStartDate,
      form_completion_date: isDraft ? formCompletionDate : new Date().toISOString().split('T')[0],
      second_sponsor_name: secondSponsorName,
      second_sponsor_comments: secondSponsorComments,
    };

    if (!bsWorkflowInstanceId) {
      businessSponsorshipPayload.create_workflow_instance = true;
    }

    const payload = {
      business_sponsorship_form: businessSponsorshipPayload
    };

    try {
      const updatedData = await saveBusinessSponsorshipForm(id, payload);
      setCreditApplication(updatedData);

      if (updatedData.business_sponsorship_form) {
        const bsForm = updatedData.business_sponsorship_form;
        setBsWorkflowInstanceId(bsForm.workflow_instance_id || null);
        setCurrentBsWorkflowState(bsForm.workflow_state_name || null);
        setAllowedBsTransitionsList(updatedData.business_sponsorship_form.available_transitions || []);
        if (bsForm.form_data) {
            setFormCompletionDate(bsForm.form_data.form_completion_date || '');
        }
      }
      
      // If called as part of handleWorkflowAction, the calling function will handle UI updates (messages, navigation)
      // and further state refreshes based on the transition.
      // For a direct draft save (isDraft=true and not part of workflow action), we might add specific success message/navigation here if needed in future.
      return updatedData; // Return the response for promise chaining
    } catch (error) {
      setSaveError(error.message || 'Failed to save data. Please try again.');
      throw error; // Re-throw to be caught by handleWorkflowAction or other callers
    } finally {
      // If handleSubmit is called directly for a draft save (not via handleWorkflowAction),
      // then setSaveLoading to false here. Otherwise, handleWorkflowAction controls it.
      if (isDraft && e) { // 'e' would be present for a direct button click, null if called from handleWorkflowAction
        setSaveLoading(false);
        // Potentially add success message & navigation for direct draft save here if it's ever re-introduced as a standalone button
        // For now, assuming all saves leading to UI changes are via handleWorkflowAction
      }
    }
  };

  const handleWorkflowAction = async (transitionCode, comments = '') => {
    if (!bsWorkflowInstanceId) {
      setTransitionError("Business Sponsorship workflow instance not found. Save the form first.");
      return;
    }
    setTransitionLoading(true);
    setSaveLoading(true); // Indicate saving is also in progress
    setTransitionError(null);
    setSaveError(null);
    setUserGuidanceMessage(null);
    setTransitionSuccessMessage(null);

    try {
      // Step 1: Save the form data by calling handleSubmit
      // Passing false for isDraft as the draft nature is part of the transitionCode (e.g., BS_TR_1)
      await handleSubmit(null, false); 

      // Step 2: Perform the workflow transition if save was successful
      if (!bsWorkflowInstanceId) {
        // This check might be redundant if handleSubmit ensures workflow instance creation/retrieval
        // or if the workflow instance is always expected to exist for any transition.
        // For now, keeping it as a safeguard.
        throw new Error("Business Sponsorship workflow instance not found. Save the form first or ensure it's created.");
      }
      // Determine the correct transition code to send.
      // The transition object structure might differ between workflows.
      // Some may pass the code string directly, others an object with a .code property.
      const codeToSend = typeof transitionCode === 'object' && transitionCode !== null && transitionCode.code ? transitionCode.code : transitionCode;

      if (!codeToSend) {
        throw new Error('Transition code is missing or invalid.');
      }

      const transitionResult = await performWorkflowTransition(bsWorkflowInstanceId, codeToSend, comments);
      
      // Update UI based on transition result
      // Fetch latest data to refresh form state, including new allowed transitions
      const latestAppData = await fetchCreditRequest(id);
      populateFormData(latestAppData); // This will update creditApplication, workflow states, and form fields

      setTransitionSuccessMessage(`Action '${transitionResult.transition_name}' was successful. Navigating back to dashboard...`);
      setTimeout(() => { navigate('/'); }, 2000);

    } catch (error) {
      // Error could be from handleSubmit or performWorkflowTransition
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred.';
      setTransitionError(errorMessage);
      setSaveError(errorMessage); // Also set saveError if it's a general failure
    } finally {
      setTransitionLoading(false);
      setSaveLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: colors.neutral700 }}>Loading Business Sponsorship Form...</div>;
  if (!creditApplication && !loading) return <div style={{ padding: '2rem', textAlign: 'center', color: colors.error }}>Could not load application data.</div>;

  return (
    <div style={{
      maxWidth: '1300px',
      margin: '0 auto',
      padding: '1rem',
      backgroundColor: colors.neutral200, // Page background color
      fontFamily: 'Arial, sans-serif' // Consistent font
    }}>
      <TopNavBar LogoutButton={LogoutButton} />

      {/* Title Block */}
      <div style={{ marginBottom: '2rem', marginTop: '1rem' }}> {/* Added marginTop for spacing from TopNavBar */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: colors.neutral800,
          marginBottom: '0.5rem'
        }}>
          Business Sponsorship Form
        </h1>
        <p style={{ color: colors.neutral600 }}>
          Manage and record the business sponsorship details.
        </p>
      </div>

      {/* WorkflowStatus after title block, before form card */}
      <WorkflowStatus currentStep={currentStep} />

      {/* Inner white card for the form content */}
      <div style={{
        backgroundColor: colors.neutral100, // white
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <form onSubmit={handleSubmit}>
          <FormSection title="Primary Business Sponsor" description="The primary business sponsor must approve or reject the application.">
            <FormField
              label="Sponsor Name"
              type="text"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              disabled
              colors={colors}
            />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.neutral700, fontWeight: '500' }}>Decision *</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSponsorDecision('approve')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: `2px solid ${sponsorDecision === 'approve' ? colors.success : colors.success}`,
                    backgroundColor: sponsorDecision === 'approve' ? colors.success : 'white',
                    color: sponsorDecision === 'approve' ? 'white' : colors.success,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setSponsorDecision('reject')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: `2px solid ${sponsorDecision === 'reject' ? colors.icbcRed : colors.icbcRed}`,
                    backgroundColor: sponsorDecision === 'reject' ? colors.icbcRed : 'white',
                    color: sponsorDecision === 'reject' ? 'white' : colors.icbcRed,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
            <FormField
              label="Sponsor Comments"
              type="textarea"
              placeholder="Provide comments to support your decision..."
              value={sponsorComments}
              onChange={(e) => setSponsorComments(e.target.value)}
              required
              colors={colors}
            />
          </FormSection>

          <FormSection title="Second Business Sponsor (Optional)" description="An optional second sponsor can also provide their decision.">
            <FormField
              label="Second Sponsor Name"
              type="text"
              placeholder="Enter second sponsor's name"
              value={secondSponsorName}
              onChange={(e) => setSecondSponsorName(e.target.value)}
              colors={colors}
            />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: colors.neutral700, fontWeight: '500' }}>Decision</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSecondSponsorDecision('approve')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: `2px solid ${secondSponsorDecision === 'approve' ? colors.success : colors.success}`,
                    backgroundColor: secondSponsorDecision === 'approve' ? colors.success : 'white',
                    color: secondSponsorDecision === 'approve' ? 'white' : colors.success,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setSecondSponsorDecision('reject')}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.375rem',
                    border: `2px solid ${secondSponsorDecision === 'reject' ? colors.icbcRed : colors.icbcRed}`,
                    backgroundColor: secondSponsorDecision === 'reject' ? colors.icbcRed : 'white',
                    color: secondSponsorDecision === 'reject' ? 'white' : colors.icbcRed,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
            <FormField
              label="Second Sponsor Comments"
              type="textarea"
              placeholder="Provide comments to support your decision..."
              value={secondSponsorComments}
              onChange={(e) => setSecondSponsorComments(e.target.value)}
              colors={colors}
            />
          </FormSection>



          {saveError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: colors.redLight, color: colors.icbcRed, borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              Save Error: {saveError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ backgroundColor: 'white', color: colors.neutral800, border: `1px solid ${colors.neutral400}`, padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {allowedBsTransitionsList && allowedBsTransitionsList.map(transition => {
                const isRejectTransition = transition.name.toLowerCase().includes('reject') || transition.code.toLowerCase().includes('reject');
                const isDisabledByLogic = isRejectTransition 
                  ? (sponsorDecision !== 'reject' && secondSponsorDecision !== 'reject') 
                  : (sponsorDecision !== 'approve');

                return (
                  <button
                    type="button"
                    key={transition.code}
                    onClick={() => {
                      let comments = '';
                      if (isRejectTransition) {
                        if (sponsorDecision !== 'reject' && secondSponsorDecision !== 'reject') {
                          setUserGuidanceMessage('A rejection decision must be selected by at least one sponsor.');
                          return;
                        }
                        comments = sponsorDecision === 'reject' ? sponsorComments : secondSponsorComments;
                      } else {
                        if (sponsorDecision !== 'approve') {
                          setUserGuidanceMessage('The primary sponsor must approve the application to submit for analysis.');
                          return;
                        }
                      }
                      handleWorkflowAction(transition.code, comments);
                    }}
                    disabled={saveLoading || transitionLoading || isDisabledByLogic}
                    style={{
                      backgroundColor: isRejectTransition ? colors.icbcRed : colors.standardBankBlue,
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      cursor: (saveLoading || transitionLoading || isDisabledByLogic) ? 'not-allowed' : 'pointer',
                      opacity: (saveLoading || transitionLoading || isDisabledByLogic) ? 0.7 : 1,
                    }}
                  >
                    {transitionLoading ? 'Processing...' : transition.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          {userGuidanceMessage && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: colors.blueLight, color: colors.standardBankBlue, borderRadius: '0.375rem', fontSize: '0.875rem', border: `1px solid ${colors.standardBankBlue}` }}>
              {userGuidanceMessage}
            </div>
          )}
          {transitionSuccessMessage && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#E6FFFA', color: '#2F855A', borderRadius: '0.375rem', fontSize: '0.875rem', border: `1px solid #38A169` }}>
              {transitionSuccessMessage}
            </div>
          )}
          {transitionError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: colors.redLight, color: colors.icbcRed, borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              Transition Error: {transitionError}
            </div>
          )}
        </form>
      </div> {/* End of inner white card */}
    </div>
  );
};

export default BusinessSponsorshipForm;