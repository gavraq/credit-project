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

const BusinessSponsorshipForm = ({ creditApplication: initialCreditApplication, mainWorkflowStep = 1 }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);

  // Workflow state for the BusinessSponsorshipForm itself
  const [bsWorkflowInstanceId, setBsWorkflowInstanceId] = useState(null);
  const [currentBsWorkflowState, setCurrentBsWorkflowState] = useState(null);
  const [allowedBsTransitionsList, setAllowedBsTransitionsList] = useState([]);

  // Form state
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorshipRationale, setSponsorshipRationale] = useState('');
  const [keyRisksAndMitigants, setKeyRisksAndMitigants] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [secondSponsorName, setSecondSponsorName] = useState('');
  const [secondSponsorComments, setSecondSponsorComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState(''); // For potential reject transitions

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
    const populateFormDataLocal = (appData) => {
      if (!appData) {
        console.warn('BusinessSponsorshipForm populateFormDataLocal: called with no appData');
        return;
      }

      setCreditApplication(appData); // Set the main credit application data for context

      // Extract potential data sources
      const crPrioritisationData = appData.credit_request_form?.form_data?.prioritisation_sponsorship;
      const bsFormContainer = appData.business_sponsorship_form;
      const bsFormData = bsFormContainer?.form_data;

      // Set common form fields (dates, rationale, etc.) and workflow states
      if (bsFormContainer) {
        setBsWorkflowInstanceId(bsFormContainer.workflow_instance_id || null);
        setCurrentBsWorkflowState(bsFormContainer.workflow_state_name || null);
        setAllowedBsTransitionsList(bsFormContainer.available_transitions || []);

        if (bsFormData) {
          // Existing BusinessSponsorshipForm data found, use it or fallback to CR data for sponsors
          setSponsorName(bsFormData.sponsor_name || crPrioritisationData?.senior_business_sponsor_name || '');
          setSponsorshipRationale(bsFormData.sponsorship_rationale || '');
          setKeyRisksAndMitigants(bsFormData.key_risks_and_mitigants || '');
          setFormStartDate(bsFormData.form_start_date || new Date().toISOString().split('T')[0]);
          setFormCompletionDate(bsFormData.form_completion_date || '');
          setSecondSponsorName(bsFormData.second_sponsor_name || crPrioritisationData?.second_business_sponsor_name || '');
          setSecondSponsorComments(bsFormData.second_sponsor_comments || crPrioritisationData?.second_business_sponsor_comments || '');
          setRejectionReason(bsFormData.rejection_reason || '');
        } else {
          // No specific bsFormData, but bsFormContainer exists (e.g., workflow initiated but form not saved).
          // Treat as new form content, populate from CR data for sponsors.
          setFormStartDate(new Date().toISOString().split('T')[0]);
          setSponsorName(crPrioritisationData?.senior_business_sponsor_name || '');
          setSponsorshipRationale(''); // Specific to this form
          setKeyRisksAndMitigants(''); // Specific to this form
          setFormCompletionDate('');
          setSecondSponsorName(crPrioritisationData?.second_business_sponsor_name || '');
          setSecondSponsorComments(crPrioritisationData?.second_business_sponsor_comments || '');
          setRejectionReason('');
        }
      } else {
        // No bsFormContainer at all. This is a completely new BusinessSponsorshipForm instance.
        // Populate from CR data for sponsors and set defaults for other fields.
        setFormStartDate(new Date().toISOString().split('T')[0]);
        setSponsorName(crPrioritisationData?.senior_business_sponsor_name || '');
        setSponsorshipRationale('');
        setKeyRisksAndMitigants('');
        setFormCompletionDate('');
        setSecondSponsorName(crPrioritisationData?.second_business_sponsor_name || '');
        setSecondSponsorComments(crPrioritisationData?.second_business_sponsor_comments || '');
        setRejectionReason('');
        // Initialize workflow states for a new sub-form
        setBsWorkflowInstanceId(null);
        setCurrentBsWorkflowState(null); // Or an initial state like 'Draft'
        setAllowedBsTransitionsList([]);
      }
      // setLoading(false); // Typically handled by the useEffect that calls this function
    };

    if (initialCreditApplication) {
      setLoading(true);
      populateFormDataLocal(initialCreditApplication);
      setLoading(false);
    } else if (id) {
      const fetchApplicationData = async () => {
        setLoading(true);
        setSaveError(null); // Clear previous errors
        try {
          const fetchedData = await fetchCreditRequest(id);
          populateFormDataLocal(fetchedData);
        } catch (err) {
          console.error("Failed to fetch credit application data:", err);
          setSaveError(`Failed to load application data: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchApplicationData();
    } else {
      // No id and no initialCreditApplication, potentially a new main application scenario (though this form is usually for existing)
      setLoading(false);
      console.warn('BusinessSponsorshipForm loaded without ID or initial data.');
    }
  }, [id, initialCreditApplication]);

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);

    const businessSponsorshipPayload = {
      sponsor_name: sponsorName,
      sponsorship_rationale: sponsorshipRationale,
      key_risks_and_mitigants: keyRisksAndMitigants,
      form_start_date: formStartDate,
      form_completion_date: isDraft ? formCompletionDate : new Date().toISOString().split('T')[0],
      second_sponsor_name: secondSponsorName,
      second_sponsor_comments: secondSponsorComments,
      // Include other fields as necessary
    };
    if (rejectionReason && !isDraft) { // Only include rejection reason if it's relevant for a non-draft submission
        businessSponsorshipPayload.rejection_reason = rejectionReason;
    }


    const payload = {
      form_data: businessSponsorshipPayload
      // Add create_workflow_instance: true if this save should trigger workflow creation
      // This might be needed if the BusinessSponsorshipForm record itself is created on this save
      // and its workflow needs to be initialized.
    };
    
    // If this is the first time saving BS form, it might need to create the workflow instance.
    // The backend serializer handles creating/updating the BusinessSponsorshipForm model instance.
    // The view might handle creating the workflow instance for it.
    if (!bsWorkflowInstanceId) {
        payload.create_workflow_instance = true; // Or a more specific flag if needed for BS form
    }


    try {
      const updatedData = await saveBusinessSponsorshipForm(id, payload);
      setCreditApplication(updatedData); // Update local state with response

      if (updatedData.business_sponsorship_form) {
        const bsForm = updatedData.business_sponsorship_form;
        setBsWorkflowInstanceId(bsForm.workflow_instance_id || null);
        setCurrentBsWorkflowState(bsForm.workflow_state_name || null);
        setAllowedBsTransitionsList(bsForm.available_transitions || []);
        if (bsForm.form_data) {
            setFormCompletionDate(bsForm.form_data.form_completion_date || '');
        }
      }
      alert(isDraft ? 'Business Sponsorship form saved as draft!' : 'Business Sponsorship form submitted!');
      // Optionally navigate or refresh data
    } catch (error) {
      console.error('Failed to save Business Sponsorship form:', error);
      setSaveError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleWorkflowAction = async (transitionCode, comments = '') => {
    if (!bsWorkflowInstanceId) {
      setTransitionError("Business Sponsorship workflow instance not found. Save the form first.");
      return;
    }
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      const result = await performWorkflowTransition(bsWorkflowInstanceId, { transition_code: transitionCode, comments });
      // After successful transition, re-fetch application data to get updated workflow state and transitions
      const data = await fetchCreditRequest(id);
      setCreditApplication(data);
      if (data.business_sponsorship_form) {
        const bsForm = data.business_sponsorship_form;
        setBsWorkflowInstanceId(bsForm.workflow_instance_id || null);
        setCurrentBsWorkflowState(bsForm.workflow_state_name || null);
        setAllowedBsTransitionsList(bsForm.available_transitions || []);
      }
      alert(`Action ${transitionCode} performed successfully!`);
    } catch (error) {
      console.error(`Failed to perform workflow action ${transitionCode}:`, error);
      setTransitionError(error.message || `Failed to perform action ${transitionCode}.`);
    } finally {
      setTransitionLoading(false);
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
      <WorkflowStatus currentStep={mainWorkflowStep} />

      {/* Inner white card for the form content */}
      <div style={{
        backgroundColor: colors.neutral100, // white
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <form onSubmit={handleSubmit}>
          <FormSection title="Sponsorship Details" description="Provide details about the business sponsorship.">
                <FormField
                  label="Sponsor Name"
                  type="text"
                  placeholder="Enter sponsor name (auto-populated from Credit Request)"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  colors={colors}
                  required
                  // Assuming this might be read-only if strictly auto-populated, or editable if it can be overridden.
                  // For now, keeping it editable.
                />
                <FormField
                  label="Optional Second Senior Business Sponsor Name"
                  type="text"
                  placeholder="Enter second sponsor name (auto-populated from Credit Request)"
                  value={secondSponsorName}
                  onChange={(e) => setSecondSponsorName(e.target.value)}
                  colors={colors}
                />
                <FormField
                  label="Comments (Second Sponsor)"
                  type="textarea"
                  placeholder="Enter comments for the second sponsor"
                  value={secondSponsorComments}
                  onChange={(e) => setSecondSponsorComments(e.target.value)}
                  colors={colors}
                />
            <FormField
              label="Sponsorship Rationale"
              type="textarea"
              placeholder="Explain the rationale behind this sponsorship"
              value={sponsorshipRationale}
              onChange={(e) => setSponsorshipRationale(e.target.value)}
              required={true}
              colors={colors}
            />
            <FormField
              label="Key Risks & Mitigants"
              type="textarea"
              placeholder="Identify key risks and their mitigants"
              value={keyRisksAndMitigants}
              onChange={(e) => setKeyRisksAndMitigants(e.target.value)}
              colors={colors}
            />
          </FormSection>

          <FormSection title="Form Dates" description="Manage the start and completion dates of this form.">
            <FormField
              label="Form Start Date"
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              colors={colors}
              disabled // Or make it editable based on your logic
            />
            <FormField
              label="Form Completion Date"
              type="date"
              value={formCompletionDate}
              onChange={(e) => setFormCompletionDate(e.target.value)}
              colors={colors}
              disabled // Usually set on final submission
            />
          </FormSection>

          {/* Rejection Reason Field (conditionally show based on workflow) */}
          {allowedBsTransitionsList.some(t => t.name.toLowerCase().includes('reject')) && (
             <FormSection title="Rejection Details" description="Provide details if rejecting.">
                <FormField 
                  label="Rejection Reason" 
                  type="textarea" 
                  placeholder="If rejecting, please provide detailed reasons" 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  colors={colors}
                />
            </FormSection>
          )}

          {saveError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: colors.redLight, color: colors.icbcRed, borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              Save Error: {saveError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{ backgroundColor: 'white', color: colors.neutral800, border: `1px solid ${colors.neutral400}`, padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button" // Changed to type="button" to prevent form submission
                onClick={(e) => handleSubmit(e, true)} // Pass true for isDraft
                disabled={saveLoading || transitionLoading}
                style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: (saveLoading || transitionLoading) ? 'not-allowed' : 'pointer' }}
              >
                {saveLoading && !transitionLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              
              {allowedBsTransitionsList && allowedBsTransitionsList.map(transition => {
                const isRejectTransition = transition.name.toLowerCase().includes('reject') || transition.code.toLowerCase().includes('reject');
                return (
                  <button
                    type="button"
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
                    disabled={saveLoading || transitionLoading || (isRejectTransition && !rejectionReason)}
                    style={{
                      backgroundColor: isRejectTransition ? colors.icbcRed : colors.standardBankBlue,
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      cursor: (saveLoading || transitionLoading || (isRejectTransition && !rejectionReason)) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {transitionLoading ? 'Processing...' : transition.name}
                  </button>
                );
              })}
            </div>
          </div>
          
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