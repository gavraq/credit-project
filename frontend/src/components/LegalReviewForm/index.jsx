import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopNavBar from '../TopNavBar';
import { fetchCreditRequest, performWorkflowTransition, saveLegalReviewForm, fetchUsersByRole } from '../../services/api';
import LogoutButton from '../LogoutButton';
import WorkflowStatus from '../common/WorkflowStatus';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import { Box, Typography, Container, Paper, Grid, TextField, Button, MenuItem, Alert, CircularProgress, Switch, FormControlLabel, FormGroup, FormHelperText, Tooltip } from '@mui/material';

const LegalReviewForm = ({ creditApplication: initialCreditApplication, currentStep }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [userGuidanceMessage, setUserGuidanceMessage] = useState(null);
  const [transitionSuccessMessage, setTransitionSuccessMessage] = useState(null);
  const [isDisabledByLogic, setIsDisabledByLogic] = useState(false); // Placeholder for form validation logic
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);
  const user = useSelector(state => state.auth.user);
  const [legalReviewers, setLegalReviewers] = useState([]);

  // Workflow state for the LegalReviewForm itself
  const [lrWorkflowInstanceId, setLrWorkflowInstanceId] = useState(null);
  const [currentLrWorkflowState, setCurrentLrWorkflowState] = useState(null);
  const [allowedLrTransitionsList, setAllowedLrTransitionsList] = useState([]);

  // State for parent workflow step indicator
  const [mainWorkflowStep, setMainWorkflowStep] = useState(1); // Default

  useEffect(() => {
    if (creditApplication && creditApplication.workflow_state?.code) {
      const parentWorkflowStateCode = creditApplication.workflow_state.code;
      let step = 1;
      switch (parentWorkflowStateCode) {
        case 'CREDIT_PAPER_CREDIT_REQUEST':
          step = 1;
          break;
        case 'CREDIT_PAPER_CREDIT_REVIEW_PENDING':
          step = 2;
          break;
        case 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING':
          step = 3;
          break;
        case 'CREDIT_PAPER_ANALYSIS_PENDING': // This is where Legal Review happens
          step = 4;
          break;
        case 'CREDIT_PAPER_CREDIT_COMMITTEE_PAPER_PENDING': // Assuming this is the 'Credit Paper' step
          step = 5;
          break;
        case 'CREDIT_PAPER_FINAL_APPROVAL_PENDING': // Assuming this is 'Approval'
          step = 6;
          break;
        default:
          step = 1; // Or a sensible default if the state is unknown
          break;
      }
      setMainWorkflowStep(step);
    }
  }, [creditApplication]);

  useEffect(() => {
    const fetchLegalReviewers = async () => {
      try {
        const responseData = await fetchUsersByRole('legal_reviewer');
        if (responseData && Array.isArray(responseData.results)) {
          setLegalReviewers(responseData.results);
        } else if (responseData && Array.isArray(responseData)) {
          setLegalReviewers(responseData);
        } else {
          console.error('Fetched legal reviewers is not in expected format:', responseData);
          setLegalReviewers([]);
        }
      } catch (err) {
        console.error('Failed to fetch legal reviewers:', err);
        setLegalReviewers([]);
      }
    };
    fetchLegalReviewers();
  }, []);

  // Form state - to be expanded based on legal-review-form.tsx
  const [agreementType, setAgreementType] = useState('');
  const [governingLaw, setGoverningLaw] = useState(''); // Example field for ISDA
  const [legalCommentary, setLegalCommentary] = useState('');
  const [legalOpinion, setLegalOpinion] = useState(''); // e.g., 'Approved', 'Approved with comments', 'Rejected'
  const [legalReviewerName, setLegalReviewerName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  // ISDA specific fields
  const [isdaCounterpartyEvents, setIsdaCounterpartyEvents] = useState('');
  const [isdaTerminationCurrency, setIsdaTerminationCurrency] = useState('');
  const [isdaNettingProvisions, setIsdaNettingProvisions] = useState('');
  const [isdaGoverningLaw, setIsdaGoverningLaw] = useState(''); // Already have governingLaw, maybe rename for clarity or make specific

  // GMRA specific fields
  const [gmraTransactionTypes, setGmraTransactionTypes] = useState('');
  const [gmraMarginMaintenance, setGmraMarginMaintenance] = useState('');

  // CSA specific fields
  const [csaCollateralType, setCsaCollateralType] = useState('');
  const [csaThresholdAmount, setCsaThresholdAmount] = useState('');

  // Document Review Section
  const [keyDates, setKeyDates] = useState('');
  const [financialTerms, setFinancialTerms] = useState('');
  const [covenants, setCovenants] = useState('');
  const [defaultProvisions, setDefaultProvisions] = useState('');
  const [criticalLegalRisks, setCriticalLegalRisks] = useState('');

  // Legal Opinion Options (from UI example)
  const [legalOpinionOptions, setLegalOpinionOptions] = useState([
    { id: 'approve_standard', title: 'Approve - Standard', description: 'Standard terms, no material deviations.', icon: '✓', iconColor: '#38B2AC', selected: false },
    { id: 'approve_comments', title: 'Approve with Comments', description: 'Minor deviations noted, acceptable.', icon: '!', iconColor: '#F6AD55', selected: false },
    { id: 'reject_material', title: 'Reject - Material Risk', description: 'Significant legal risks identified.', icon: '✕', iconColor: '#E53E3E', selected: false },
  ]);

  const handleLegalOpinionSelect = (id) => {
    setLegalOpinionOptions(prevOptions => 
      prevOptions.map(opt => ({ ...opt, selected: opt.id === id }))
    );
    const selectedOpt = legalOpinionOptions.find(opt => opt.id === id);
    if (selectedOpt) {
      setLegalOpinion(selectedOpt.title); // Store the title or a code in main legalOpinion state
    }
  };

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

    if (data.legal_review_form && data.legal_review_form.form_data) {
      const lrFormData = data.legal_review_form.form_data;
      setAgreementType(lrFormData.agreement_type || '');
      setGoverningLaw(lrFormData.governing_law || '');
      setLegalCommentary(lrFormData.legal_commentary || '');
      setLegalOpinion(lrFormData.legal_opinion || '');
      setLegalReviewerName(lrFormData.legal_reviewer_name || user?.name || '');
      setFormStartDate(lrFormData.form_start_date || new Date().toISOString().split('T')[0]);
      setFormCompletionDate(lrFormData.form_completion_date || '');

      // ISDA
      setIsdaCounterpartyEvents(lrFormData.isda_counterparty_events || '');
      setIsdaTerminationCurrency(lrFormData.isda_termination_currency || '');
      setIsdaNettingProvisions(lrFormData.isda_netting_provisions || '');
      setIsdaGoverningLaw(lrFormData.isda_governing_law || lrFormData.governing_law || ''); // Prioritize specific if available

      // GMRA
      setGmraTransactionTypes(lrFormData.gmra_transaction_types || '');
      setGmraMarginMaintenance(lrFormData.gmra_margin_maintenance || '');

      // CSA
      setCsaCollateralType(lrFormData.csa_collateral_type || '');
      setCsaThresholdAmount(lrFormData.csa_threshold_amount || '');

      // Document Review
      setKeyDates(lrFormData.key_dates || '');
      setFinancialTerms(lrFormData.financial_terms || '');
      setCovenants(lrFormData.covenants || '');
      setDefaultProvisions(lrFormData.default_provisions || '');
      setCriticalLegalRisks(lrFormData.critical_legal_risks || '');

      // Legal Opinion selection
      if (lrFormData.legal_opinion) {
        setLegalOpinionOptions(prevOptions => 
          prevOptions.map(opt => ({ ...opt, selected: opt.title === lrFormData.legal_opinion }))
        );
      }

    } else {
      setLegalReviewerName(user?.name || '');
      setFormStartDate(new Date().toISOString().split('T')[0]);
    }

  // Populate Legal Review Form specific workflow data
  if (data.legal_review_form) { // Check if legal_review_form object exists
    setLrWorkflowInstanceId(data.legal_review_form.workflow_instance_id || null);
    setCurrentLrWorkflowState(data.legal_review_form.workflow_state_name || null);
    setAllowedLrTransitionsList(data.legal_review_form.available_transitions || []);
  } else {
    // If no legal_review_form object, reset workflow state
    setLrWorkflowInstanceId(null);
    setCurrentLrWorkflowState(null);
    setAllowedLrTransitionsList([]);
  }
  };

  useEffect(() => {
    if (id && !initialCreditApplication) {
      setLoading(true);
      fetchCreditRequest(id)
        .then(response => {
          populateFormData(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to fetch credit application details:', error);
          setSaveError('Failed to load application data.');
          setLoading(false);
        });
    } else if (initialCreditApplication) {
      populateFormData(initialCreditApplication);
      setLoading(false);
    }
  }, [id, initialCreditApplication, user]);

  const handleSubmit = async (e, isDraft = false, isFinalSubmit = false) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    setUserGuidanceMessage(null);
    setTransitionSuccessMessage(null);

    const currentFormStartDate = formStartDate || new Date().toISOString().split('T')[0];
    if (!formStartDate) {
      setFormStartDate(currentFormStartDate);
    }

    const legalReviewPayload = {
      agreement_type: agreementType,
      governing_law: governingLaw,
      legal_commentary: legalCommentary,
      form_completion_date: isDraft ? formCompletionDate : (isFinalSubmit ? new Date().toISOString().split('T')[0] : ''),
      form_start_date: currentFormStartDate,
      legal_reviewer_name: legalReviewerName, // This should be the ID of the reviewer
      legal_opinion: legalOpinion,
      
      isda_governing_law: agreementType === 'ISDA' ? isdaGoverningLaw : undefined,
      isda_counterparty_events: agreementType === 'ISDA' ? isdaCounterpartyEvents : undefined,
      isda_termination_currency: agreementType === 'ISDA' ? isdaTerminationCurrency : undefined,
      isda_netting_provisions: agreementType === 'ISDA' ? isdaNettingProvisions : undefined,
      
      gmra_transaction_types: agreementType === 'GMRA' ? gmraTransactionTypes : undefined,
      gmra_margin_maintenance: agreementType === 'GMRA' ? gmraMarginMaintenance : undefined,
      
      csa_collateral_type: agreementType === 'CSA' ? csaCollateralType : undefined,
      csa_threshold_amount: agreementType === 'CSA' ? csaThresholdAmount : undefined,
      
      governing_law: agreementType === 'OTHER' ? governingLaw : (agreementType !== 'ISDA' ? governingLaw : undefined),

      key_dates: keyDates,
      financial_terms: financialTerms,
      covenants: covenants,
      default_provisions: defaultProvisions,
      critical_legal_risks: criticalLegalRisks,
    };

    Object.keys(legalReviewPayload).forEach(key => {
      if (legalReviewPayload[key] === undefined) {
        delete legalReviewPayload[key];
      }
    });

    const payload = {
      legal_review_form: legalReviewPayload
    };

    try {
      const response = await saveLegalReviewForm(id, payload);
      setCreditApplication(response.data);
      populateFormData(response.data);
      setSaveLoading(false);
      if (isDraft) { 
        // Set user guidance message only if it's a direct form save as draft (e is present).
        // For workflow actions, the handleWorkflowAction function will set its own success/guidance messages.
        if (e) {
            setUserGuidanceMessage('Draft saved successfully!');
        }
        navigate('/');
      }
      return response.data;
    } catch (error) {
      console.error('Error saving Legal Review Form:', error);
      let errorMessage = 'Failed to save legal review form.';
      if (error.response && error.response.data) {
        const errors = error.response.data;
        if (typeof errors === 'string') {
          errorMessage = errors;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        } else if (errors.legal_review_form && typeof errors.legal_review_form === 'object'){
          const formErrors = errors.legal_review_form.form_data || errors.legal_review_form;
          errorMessage = Object.values(formErrors).flat().join(' ');
        } else if (typeof errors === 'object'){
          errorMessage = Object.values(errors).flat().join(' ');
        }
      }
      setSaveError(errorMessage);
      setUserGuidanceMessage(null);
      setTransitionLoading(false);
      setSaveLoading(false);
      return;
    }
  }

  const handleWorkflowAction = async (receivedTransitionValue, explicitComments = '') => {
  // receivedTransitionValue is what actualTransitionCode from the map resolved to.
  // explicitComments is what finalComments from the map resolved to.

  let apiTransitionCode;
  let apiComments = explicitComments; // Start with comments from onClick logic (finalComments)

  if (typeof receivedTransitionValue === 'object' && receivedTransitionValue !== null) {
    apiTransitionCode = receivedTransitionValue.transition_code; // Get string code from object
    // The 'finalComments' logic in the onClick handler should be definitive for comments.
    // If explicitComments (finalComments) is empty, and receivedTransitionValue has embedded comments,
    // finalComments should have already picked receivedTransitionValue.comments if requiresComments was false.
    // Thus, apiComments (explicitComments) should be correct as is.
  } else {
    apiTransitionCode = receivedTransitionValue; // Assume it's already the string code
  }

  if (typeof apiTransitionCode !== 'string') {
    console.error(
      `[LegalReviewForm] handleWorkflowAction: apiTransitionCode is not a string. Value: ${JSON.stringify(apiTransitionCode)}. Received input: ${JSON.stringify(receivedTransitionValue)}`
    );
    setTransitionError('Internal error processing transition code. Unable to extract string code.');
    setTransitionLoading(false);
    setSaveLoading(false);
    return;
  }

  let currentLrInstanceId = lrWorkflowInstanceId;

  if (!currentLrInstanceId) {
    try {
      setUserGuidanceMessage('Legal Review process not yet started. Attempting to save and initiate...');
      // Pass 'true' for isDraft to handleSubmit when initiating.
      const savedData = await handleSubmit(null, true);
      if (savedData?.legal_review_form?.workflow_instance_id) {
        currentLrInstanceId = savedData.legal_review_form.workflow_instance_id;
        setUserGuidanceMessage('Legal Review process initiated. Now attempting action...');
      } else {
        setTransitionError('Legal Review process could not be initiated. Please save as draft first.');
        setUserGuidanceMessage(null);
        setTransitionLoading(false);
        setSaveLoading(false);
        return;
      }
    } catch (saveError) {
      setTransitionError(`Failed to save before action: ${saveError.message}`);
      setUserGuidanceMessage(null);
      setTransitionLoading(false);
      setSaveLoading(false);
      return;
    }
  }

  setTransitionLoading(true);
  setSaveLoading(true);
  setTransitionError(null);
  setSaveError(null);
  setUserGuidanceMessage(null);
  setTransitionSuccessMessage(null);

  try {
    // Determine if the save operation before transition should be marked as 'draft'.
    // This is for the handleSubmit call, not directly for the transition payload.
    const isSavingAsDraftBeforeTransition = apiTransitionCode === 'LR_TR_1' || apiTransitionCode === 'LR_TR_3';
    const isFinalSubmissionForSave = apiTransitionCode === 'LR_TR_4';
    const updatedApplicationData = await handleSubmit(null, isSavingAsDraftBeforeTransition, isFinalSubmissionForSave);
    currentLrInstanceId = updatedApplicationData?.legal_review_form?.workflow_instance_id || currentLrInstanceId;

    if (!currentLrInstanceId) {
      setTransitionError("Workflow instance ID for Legal Review is missing after save. Cannot perform action.");
      setTransitionLoading(false);
      setSaveLoading(false);
      return;
    }

    console.debug(`[LegalReviewForm] Calling performWorkflowTransition with: instanceId=${currentLrInstanceId}, code=${apiTransitionCode} (type: ${typeof apiTransitionCode}), comments=${apiComments} (type: ${typeof apiComments})`);
    const transitionResult = await performWorkflowTransition(currentLrInstanceId, apiTransitionCode, apiComments);
    
    // Update application state with new workflow details from transitionResult
    // The transitionResult is the direct response from performWorkflowTransition, which is response.data from the API call.
    // It should contain the updated workflow instance details.
    setCreditApplication(prevApp => {
      const newApp = { ...prevApp };
      const updatedWorkflowData = transitionResult; // transitionResult is already response.data

      if (newApp.legal_review_form) {
        newApp.legal_review_form = {
          ...newApp.legal_review_form,
          workflow_instance_id: updatedWorkflowData.id, // Use 'id' from workflow instance
          workflow_state_name: updatedWorkflowData.current_state ? updatedWorkflowData.current_state.name : 'Unknown State',
          available_transitions: updatedWorkflowData.allowed_transitions || [],
          form_data: updatedApplicationData?.legal_review_form?.form_data // Carry over saved form_data
        };
      } else {
        newApp.legal_review_form = {
          workflow_instance_id: updatedWorkflowData.id,
          workflow_state_name: updatedWorkflowData.current_state ? updatedWorkflowData.current_state.name : 'Unknown State',
          available_transitions: updatedWorkflowData.allowed_transitions || [],
          form_data: updatedApplicationData?.legal_review_form?.form_data
        };
      }
      if (!updatedWorkflowData.current_state) {
        console.warn('[LegalReviewForm] handleWorkflowAction: updatedWorkflowData.current_state is undefined. API response might be missing current_state details.');
      }
      populateFormData(newApp); // Ensure all derived states are updated
      return newApp;
    });
    
    setTransitionSuccessMessage(`Legal Review: ${transitionResult.transition_name || apiTransitionCode} successful.`);

  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'An unexpected error occurred.';
    console.error('[LegalReviewForm] Error in handleWorkflowAction:', error.response || error);
    setTransitionError(errorMessage);
  } finally {
    setTransitionLoading(false);
    setSaveLoading(false);
  }
};

  return (
    <div style={{ backgroundColor: colors.neutral200, minHeight: '100vh' }}>
      <TopNavBar />
      {/* Parent Workflow Status */}
      {creditApplication && (
        <WorkflowStatus 
          currentStep={mainWorkflowStep} 
        />
      )}
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Typography variant="h4" style={{ color: colors.neutral900 }}>Legal Review</Typography>
        </div>

        {creditApplication && creditApplication.workflow_instance && (
          <WorkflowStatus 
            workflowSteps={creditApplication.workflow_instance.workflow.ordered_states.map(s => s.name)} 
            currentStepName={creditApplication.workflow_instance.current_state.name} 
          />
        )}

        <div style={{ backgroundColor: colors.neutral100, padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <form onSubmit={(e) => handleSubmit(e, false)}> {/* Default submit is not draft */}
            <Typography variant="h5" gutterBottom style={{ color: colors.neutral800, marginBottom: '1.5rem' }}>Legal Review Details</Typography>
            
            {/* Placeholder for actual form fields based on legal-review-form.tsx */}
            <FormSection title="Legal Agreement Details" description="Select the primary agreement type and fill in relevant details.">
              <FormField
                label="Agreement Type"
                type="select"
                name="agreementType"
                value={agreementType}
                onChange={(e) => setAgreementType(e.target.value)}
                options={[
                  { value: '', label: 'Select Agreement Type' },
                  { value: 'ISDA', label: 'ISDA Master Agreement' },
                  { value: 'GMRA', label: 'GMRA (Global Master Repurchase Agreement)' },
                  { value: 'CSA', label: 'CSA (Credit Support Annex)' },
                  { value: 'OTHER', label: 'Other Bespoke Agreement' }
                ]}
                required
              />

              {agreementType === 'ISDA' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>ISDA Specifics</Typography>
                  <FormField label="Governing Law" name="isdaGoverningLaw" value={isdaGoverningLaw} onChange={(e) => setIsdaGoverningLaw(e.target.value)} placeholder="e.g., English Law, New York Law" />
                  <FormField label="Counterparty Additional Events of Default" type="textarea" name="isdaCounterpartyEvents" value={isdaCounterpartyEvents} onChange={(e) => setIsdaCounterpartyEvents(e.target.value)} placeholder="Specify any additional events" />
                  <FormField label="Termination Currency" name="isdaTerminationCurrency" value={isdaTerminationCurrency} onChange={(e) => setIsdaTerminationCurrency(e.target.value)} placeholder="e.g., USD, EUR" />
                  <FormField label="Netting Provisions" type="textarea" name="isdaNettingProvisions" value={isdaNettingProvisions} onChange={(e) => setIsdaNettingProvisions(e.target.value)} placeholder="Describe netting arrangements" />
                </>
              )}

              {agreementType === 'GMRA' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>GMRA Specifics</Typography>
                  <FormField label="Transaction Types Covered" type="textarea" name="gmraTransactionTypes" value={gmraTransactionTypes} onChange={(e) => setGmraTransactionTypes(e.target.value)} placeholder="e.g., Classic Repo, Sell/Buy-Back" />
                  <FormField label="Margin Maintenance Requirements" type="textarea" name="gmraMarginMaintenance" value={gmraMarginMaintenance} onChange={(e) => setGmraMarginMaintenance(e.target.value)} placeholder="Details on margin calls, haircuts, etc." />
                </>
              )}

              {agreementType === 'CSA' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>CSA Specifics</Typography>
                  <FormField label="Collateral Type & Eligibility" type="textarea" name="csaCollateralType" value={csaCollateralType} onChange={(e) => setCsaCollateralType(e.target.value)} placeholder="e.g., Cash (USD, EUR), Government Bonds" />
                  <FormField label="Threshold Amount" name="csaThresholdAmount" value={csaThresholdAmount} onChange={(e) => setCsaThresholdAmount(e.target.value)} placeholder="Specify threshold and currency" />
                </>
              )}
               {agreementType === 'OTHER' && (
                <FormField
                  label="Details for Other Agreement Type"
                  type="textarea"
                  name="otherAgreementDetails" // Ensure state variable exists for this
                  // value={otherAgreementDetails} onChange={(e) => setOtherAgreementDetails(e.target.value)}
                  placeholder="Provide comprehensive details about the bespoke agreement..."
                />
              )}
            </FormSection>

            <FormSection title="Document Review & Risk Identification" description="Highlight key terms, dates, and potential legal risks from the reviewed documents.">
              <FormField label="Key Dates (e.g., Expiry, Review)" type="textarea" name="keyDates" value={keyDates} onChange={(e) => setKeyDates(e.target.value)} placeholder="List important dates and their significance" />
              <FormField label="Financial Terms & Amounts" type="textarea" name="financialTerms" value={financialTerms} onChange={(e) => setFinancialTerms(e.target.value)} placeholder="Note any specific financial obligations or terms" />
              <FormField label="Key Covenants" type="textarea" name="covenants" value={covenants} onChange={(e) => setCovenants(e.target.value)} placeholder="Identify and describe key covenants (financial, operational, informational)" />
              <FormField label="Default Provisions & Remedies" type="textarea" name="defaultProvisions" value={defaultProvisions} onChange={(e) => setDefaultProvisions(e.target.value)} placeholder="Summarize events of default and available remedies" />
              <FormField label="Critical Legal Risks & Mitigants" type="textarea" name="criticalLegalRisks" value={criticalLegalRisks} onChange={(e) => setCriticalLegalRisks(e.target.value)} placeholder="Highlight any material legal risks and proposed mitigants" required />
            </FormSection>

            <FormSection title="Legal Recommendations & Opinion" description="Provide overall legal assessment and formal opinion.">
              <FormField
                label="Legal Commentary & Overall Assessment"
                type="textarea"
                name="legalCommentary"
                value={legalCommentary}
                onChange={(e) => setLegalCommentary(e.target.value)}
                placeholder="Provide a comprehensive summary of the legal review, including rationale for the opinion..."
                required
              />
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Formal Legal Opinion</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: '1rem', mb: 2 }}>
                {legalOpinionOptions.map((option) => (
                  <Paper 
                    key={option.id}
                    elevation={option.selected ? 6 : 1}
                    sx={{
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      border: option.selected ? `2px solid ${option.iconColor}` : `1px solid ${colors.neutral300}`,
                      backgroundColor: option.selected ? `${option.iconColor}20` : colors.neutral100, // Light tint for selected
                      '&:hover': {
                        borderColor: option.iconColor,
                        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => handleLegalOpinionSelect(option.id)}
                  >
                    <Typography variant="h5" sx={{ color: option.iconColor }}>{option.icon}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>{option.title}</Typography>
                    <Typography variant="caption" sx={{ color: colors.neutral600 }}>{option.description}</Typography>
                  </Paper>
                ))}
              </Box>
              {/* Hidden FormField to store the actual selected legalOpinion value if needed for direct form submission, though it's also in state */}
              <input type="hidden" name="legalOpinion" value={legalOpinion} />
            </FormSection>

            <FormSection title="Reviewer Information">
                <FormField
                    label="Legal Reviewer Name"
                    type="select"
                    name="legalReviewerName"
                    value={legalReviewerName} // This should store the ID
                    onChange={(e) => setLegalReviewerName(e.target.value)}
                    options={[
                      { value: '', label: 'Select Legal Reviewer' },
                      ...legalReviewers.map(reviewer => ({
                        value: reviewer.id, // The value should be the user's ID
                        label: `${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim() || reviewer.username || 'Unnamed Reviewer' // Construct name
                      }))
                    ]}
                    required
                />
            </FormSection>
            
            {/* Document Upload Section - To be implemented */}
            <FormSection title="Supporting Legal Documents">
              <Typography variant="body2" color="textSecondary">Document upload functionality to be added here.</Typography>
            </FormSection>

            {saveError && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: colors.redLight, color: colors.icbcRed, borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                Save Error: {saveError}
              </div>
            )}
          </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => navigate(`/application/${id}`)} // Navigate to application details or dashboard
                style={{ backgroundColor: 'white', color: colors.neutral800, border: `1px solid ${colors.neutral400}`, padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Back to Application Hub
              </button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* Workflow Action Buttons - Render based on allowedLrTransitionsList */}
                {allowedLrTransitionsList && allowedLrTransitionsList.map(transition => {
                  let comments = '';
                  const isRejectTransition = transition.name.toLowerCase().includes('reject') || transition.code.toLowerCase().includes('reject');
                  const requiresComments = isRejectTransition || (transition.name.toLowerCase().includes('approve') && transition.name.toLowerCase().includes('comment'));

                  if (requiresComments) {
                    const userComments = prompt(`Please provide comments for '${transition.name}':`);
                    if (userComments === null) return; // User cancelled prompt
                    comments = userComments;
                  }

                  const actualTransitionCode = (typeof transition.code === 'object' && transition.code !== null) ? transition.code.transition_code : transition.code;
                  const embeddedComments = (typeof transition.code === 'object' && transition.code !== null && transition.code.comments !== undefined) ? transition.code.comments : '';
                  const finalComments = requiresComments ? comments : (embeddedComments || '');

                  console.debug('[LegalReviewForm] Button Click - Original transition.code:', transition.code);
                  console.debug('[LegalReviewForm] Button Click - Extracted actualTransitionCode:', actualTransitionCode);
                  console.debug('[LegalReviewForm] Button Click - Extracted embeddedComments:', embeddedComments);
                  console.debug('[LegalReviewForm] Button Click - Final comments for handler:', finalComments);

                  return (
                    <button
                      type="button"
                      key={actualTransitionCode} // Use actualTransitionCode for key
                      onClick={() => handleWorkflowAction(actualTransitionCode, finalComments)}
                      disabled={saveLoading || transitionLoading}
                      style={{
                        backgroundColor: isRejectTransition ? colors.redLight : (transition.name.toLowerCase().includes('submit') || transition.name.toLowerCase().includes('progress') ? colors.standardBankBlue : colors.neutral200),
                        color: isRejectTransition ? colors.icbcRed : (transition.name.toLowerCase().includes('submit') || transition.name.toLowerCase().includes('progress') ? colors.neutral100 : colors.neutral700),
                        border: `1px solid ${isRejectTransition ? colors.icbcRed : (transition.name.toLowerCase().includes('submit') || transition.name.toLowerCase().includes('progress') ? colors.standardBankBlue : colors.neutral400)}`,
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        cursor: (saveLoading || transitionLoading) ? 'not-allowed' : 'pointer',
                        opacity: (saveLoading || transitionLoading) ? 0.7 : 1,
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
        </div> 
      </div>
    </div>
  );
};

export default LegalReviewForm;
