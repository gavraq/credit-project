import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsersByRole } from '../../services/api';

import TopNavBar from '../TopNavBar';
import LogoutButton from '../LogoutButton';
import FormWizardNav from './FormWizardNav';
import FormSection from './FormSection';
import VersionControlHeader from './VersionControlHeader';
import WorkflowActions from './WorkflowActions';
import CounterpartySection from './CounterpartySection';
import LimitsSection from './LimitsSection';
import RelationshipSection from './RelationshipSection';
import LegalSection from './LegalSection';
import PrioritisationSection from './PrioritisationSection';
import DocumentsSection from './DocumentsSection';
import DebugPanel from './DebugPanel';

const CreditRequestForm = (props) => {
  const { id } = useParams();
  const navigate = useNavigate(); // Added for navigation
  const editMode = props.editMode || !!id;
  
  // Workflow state logic
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);


  // Basic form fields
  const [dateFormStarted, setDateFormStarted] = useState(() => new Date().toISOString().slice(0, 16));
  const [dateFormCompleted, setDateFormCompleted] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNumber, setRequestNumber] = useState('CR-2025-0124'); // Auto-generated

  // Counterparty information
  const [counterparties, setCounterparties] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [counterpartyCIF, setCounterpartyCIF] = useState('');
  const [selectedGuarantor, setSelectedGuarantor] = useState('');
  const [guarantorCIF, setGuarantorCIF] = useState('');
  const [selectedGuarantorName, setSelectedGuarantorName] = useState(''); // Added state for guarantor name
  const [loadingCounterparties, setLoadingCounterparties] = useState(true);
  const [counterpartyError, setCounterpartyError] = useState(null);

  // Limits information
  const [limits, setLimits] = useState([
    {
      id: 1,
      type: '',
      existingAmount: '',
      existingTenor: '',
      proposedAmount: '',
      proposedTenor: '',
      comments: ''
    }
  ]);
  

  const [limitTypes, setLimitTypes] = useState([]);
  const [loadingLimitTypes, setLoadingLimitTypes] = useState(true);
  const [limitTypesError, setLimitTypesError] = useState(null);
  const [countryRiskLimitAvailable, setCountryRiskLimitAvailable] = useState('');
  const [detailedCommentsOnLimits, setDetailedCommentsOnLimits] = useState('');

  // Relationship information
  const [revenueLast12Months, setRevenueLast12Months] = useState('');
  const [revenueProjected12Months, setRevenueProjected12Months] = useState('');
  const [projectedRorwa, setProjectedRorwa] = useState('');
  const [mostSeniorContact, setMostSeniorContact] = useState('');
  const [lastClientVisitDate, setLastClientVisitDate] = useState('');
  const [relationshipComments, setRelationshipComments] = useState('');

  // Legal & Financial Documentation
  const [legalDocumentType, setLegalDocumentType] = useState('');
  const [positiveLegalOpinion, setPositiveLegalOpinion] = useState('');
  const [financialStatementsReceived, setFinancialStatementsReceived] = useState(false);
  const [interimStatementsAvailable, setInterimStatementsAvailable] = useState(false);

  // Prioritisation & Business Sponsorship
  const [priority, setPriority] = useState('Medium');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [accountExecutive, setAccountExecutive] = useState('');
  const [relationshipManager, setRelationshipManager] = useState('');
  const [businessSponsors, setBusinessSponsors] = useState([]);
  const [relationshipManagersList, setRelationshipManagersList] = useState([]);
  const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState('');
  const [selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor] = useState('');
  const [loadingBusinessSponsors, setLoadingBusinessSponsors] = useState(false);
  const [loadingRelationshipManagers, setLoadingRelationshipManagers] = useState(false);
  const [businessSponsorError, setBusinessSponsorError] = useState(null);
  const [relationshipManagerError, setRelationshipManagerError] = useState(null);
  const [justificationForHighPriority, setJustificationForHighPriority] = useState('');

  // Document uploads
  const [documents, setDocuments] = useState([]);

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

  // Clear transition error on ID change or load
  useEffect(() => {
    console.log('Clearing transitionError due to ID change or component mount for ID:', id);
    setTransitionError(null);
  }, [id]);

  // Fetch credit application on mount
  useEffect(() => {
    async function fetchCreditApplication() {
      if (!id) return; // Don't fetch if no ID (new application)
      
      try {
        const { get } = await import('../../services/api');
        console.log(`Fetching credit application with ID: ${id}`);
        const response = await get(`/api/credit/credit-applications/${id}/`);
        const creditApp = response.data;
        console.log('Fetched credit application:', creditApp);
        
        // Update form fields with credit application data
        // Populate direct CreditApplication fields
        setRequestTitle(creditApp.title || '');
        setSelectedCounterparty(creditApp.counterparty?.id || '');
        // Ensure priority is correctly capitalized for display if necessary, or handle in component
        setPriority(creditApp.priority || 'Medium'); 
        setRequiredByDate(creditApp.required_by_date || '');
        setDetailedCommentsOnLimits(creditApp.description || '');
        setRelationshipManager(creditApp.applicant_name || ''); // Assuming applicant_name is the RM
        setDateFormStarted(creditApp.date_form_started || (creditApp.created_at ? new Date(creditApp.created_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)));
        setRequestNumber(creditApp.request_number || `CR-TEMP-${id}`); // Populate request number

        // Populate limits
        if (creditApp.limit_requests && Array.isArray(creditApp.limit_requests) && creditApp.limit_requests.length > 0) {
          const fetchedLimits = creditApp.limit_requests.map((limit, index) => ({
            id: limit.id || Date.now() + index, // Ensure unique ID for React keys
            type: limit.limit_type,    // Use the full limit_type object for the dropdown
            existingAmount: limit.existing_amount || '',
            existingTenor: limit.existing_tenor || '',
            proposedAmount: limit.proposed_amount || '',
            proposedTenor: limit.proposed_tenor || '',
            comments: limit.comments || ''
          }));
          setLimits(fetchedLimits);
        } else {
          // Reset to default if no limits are fetched, or keep existing if preferred
          setLimits([
            {
              id: Date.now(),
              type: '',
              existingAmount: '',
              existingTenor: '',
              proposedAmount: '',
              proposedTenor: '',
              comments: ''
            }
          ]);
        }

        // Populate from credit_request_form (assuming it's nested as creditApp.credit_request_form)
        const formData = creditApp.credit_request_form;
        if (formData) {
          console.log('Populating from formData (creditApp.credit_request_form):', formData);
          setCounterpartyCIF(formData.counterparty_cif || ''); // Populate counterparty_cif from credit_request_form

          // Counterparty Section (Guarantor)
          const guarantorNameFromData = formData.guarantor_name || '';
          const guarantorCifFromData = formData.guarantor_cif || '';

          setSelectedGuarantorName(guarantorNameFromData);
          setGuarantorCIF(guarantorCifFromData);

          if ((guarantorNameFromData || guarantorCifFromData) && counterparties.length > 0) {
            const matchedGuarantor = counterparties.find(
              c => (guarantorNameFromData && c.name === guarantorNameFromData) || 
                   (guarantorCifFromData && c.cif_number === guarantorCifFromData)
            );
            if (matchedGuarantor) {
              setSelectedGuarantor(matchedGuarantor.id);
            } else {
              setSelectedGuarantor(''); // Reset if no match
            }
          } else {
            setSelectedGuarantor(''); // Reset if no name/CIF from formData or no counterparties loaded
          }
          
          // Limits Section (additional fields, not the table itself)
          setCountryRiskLimitAvailable(formData.country_risk_limit_available ? 'yes' : 'no'); // Changed to lowercase
          // detailedCommentsOnLimits is already set from creditApp.description, if it's duplicated in form_data, this would be the place

          // Relationship Section
          setRevenueLast12Months(formData.revenue_last_12m || '');
          setRevenueProjected12Months(formData.revenue_projected_12m || '');
          setProjectedRorwa(formData.projected_rorwa_percent || '');
          setMostSeniorContact(formData.most_senior_contact || '');
          setLastClientVisitDate(formData.last_client_visit_date || '');
          setRelationshipComments(formData.relationship_comments || '');

          // Legal Section
          setLegalDocumentType(formData.legal_documentation || '');
          setPositiveLegalOpinion(formData.positive_legal_opinion ? 'Yes' : 'No');
          setFinancialStatementsReceived(formData.financial_statements_received || false);
          setInterimStatementsAvailable(formData.interim_statements_available || false);

          // Prioritisation Section
          setAccountExecutive(formData.account_executive || '');
          // relationshipManager is already set from creditApp.applicant_name
          setSelectedBusinessSponsor(formData.senior_business_sponsor || '');
          setSelectedSecondBusinessSponsor(formData.second_business_sponsor || '');
          setJustificationForHighPriority(formData.high_priority_justification || '');
          // priority and requiredByDate are already set from creditApp direct fields
        }
        
        // Check if the credit application has a workflow instance
        if (creditApp.workflow_instance_id) {
          console.log(`Setting workflow instance ID from creditApp.workflow_instance_id: ${creditApp.workflow_instance_id}`);
          setWorkflowInstanceId(creditApp.workflow_instance_id);
        } else {
          console.error('Credit application response does not contain workflow_instance_id. Cannot set workflowInstanceId.');
        }

        // Set workflow state directly from the credit application response
        // This part can remain as is, as workflow_state and available_transitions are separate top-level keys
        if (creditApp.workflow_state) {
          console.log('Setting current state from credit application:', creditApp.workflow_state);
          setCurrentState(creditApp.workflow_state.name || '');
        }
        
        if (creditApp.available_transitions) {
          console.log('Setting allowed transitions from credit application:', creditApp.available_transitions);
          setAllowedTransitions(creditApp.available_transitions || []);
        }
      } catch (error) {
        console.error(`Error fetching credit application ${id}:`, error);
        setTransitionError(`Failed to load application data for ID ${id}. Please try refreshing. Error: ${error.message}`);
      }
    }
    
    if (id) {
      fetchCreditApplication();
    }
    // The else block (reset logic) is removed from here and moved to a new useEffect.
  }, [id, refetchTrigger, counterparties]);

  // New useEffect for resetting form states when 'id' is not present (new form)
  useEffect(() => {
    if (!id) {
      console.log('Resetting form for new application (id is null).');
      // Reset all form states for a new application
      setRequestTitle('');
      setSelectedCounterparty('');
      setCounterpartyCIF(''); // Reset counterparty CIF for new form
      setPriority('Medium');
      setRequiredByDate('');
      setDetailedCommentsOnLimits(''); // This is mapped to creditApp.description
      setRelationshipManager(''); // This is mapped to creditApp.applicant_name

      // Initialize dateFormStarted for new forms to current date/time
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setDateFormStarted(`${year}-${month}-${day}T${hours}:${minutes}`);
      
      setRequestNumber(''); // Clear request number for new form

      setLimits([{ id: Date.now(), type: '', existingAmount: '', existingTenor: '', proposedAmount: '', proposedTenor: '', comments: '' }]);
      
      setSelectedGuarantor('');
      setSelectedGuarantorName('');
      setGuarantorCIF('');

      setCountryRiskLimitAvailable('No'); // Default for new form
      setRevenueLast12Months('');
      setRevenueProjected12Months('');
      setProjectedRorwa('');
      setMostSeniorContact('');
      setLastClientVisitDate('');
      setRelationshipComments('');
      setLegalDocumentType('');
      setPositiveLegalOpinion('No'); // Default for new form
      setFinancialStatementsReceived(false); // Default for new form
      setInterimStatementsAvailable(false); // Default for new form
      setAccountExecutive('');
      setSelectedBusinessSponsor('');
      setSelectedSecondBusinessSponsor('');
      setJustificationForHighPriority('');
      
      setWorkflowInstanceId(null); // Clear workflow instance ID for new form
      setCurrentState(''); // Or set to an initial state for new forms if applicable
      setAllowedTransitions([]);
      setTransitionError(null); // Clear any previous errors
      // Ensure all relevant states are reset here
    }
  }, [id]); // This effect runs only when 'id' changes (or on initial mount)

  // Fetch workflow instance data
  const fetchWorkflowInstance = async (instanceId) => {
    try {
      if (!instanceId) {
        console.log('DEBUG: No workflow instance ID provided to fetchWorkflowInstance');
        return;
      }
      console.log(`DEBUG: Fetching full workflow instance object: ${instanceId}`);
      const { get } = await import('../../services/api');
      const response = await get(`/api/workflow-instances/${instanceId}/`);
      console.log('DEBUG: Full workflow instance object data:', response.data);
      setWorkflowInstance(response.data); // Set the full workflow instance object
    } catch (error) {
      console.error('DEBUG: Error in fetchWorkflowInstance (fetching full instance object):', error);
      // Consider setting an error state if this specific fetch fails,
      // as it's important for enabling transitions.
      setTransitionError('Failed to load essential workflow instance details. Transitions may be disabled.');
    }
  };

  // Fetch workflow instance when workflowInstanceId changes
  useEffect(() => {
    if (workflowInstanceId) {
      fetchWorkflowInstance(workflowInstanceId);
    }
  }, [workflowInstanceId, refetchTrigger]); // Added refetchTrigger dependency

  // Handler for transition button click
  const validateFormForSubmission = () => {
    const missingFields = [];
    if (!requestTitle) missingFields.push('Title'); // Corrected to use 'title' state variable
    if (!selectedCounterparty) missingFields.push('Counterparty'); // Corrected back
    if (!selectedBusinessSponsor) missingFields.push('Senior Business Sponsor'); // Corrected back
    if (!priority) missingFields.push('Priority');
    if (priority === 'HIGH' && !justificationForHighPriority) {
      missingFields.push('Justification for High Priority');
    }
    if (!requiredByDate) missingFields.push('Required By Date');
    
    // Check limits (the state variable for limit requests is `limits`)
    if (!limits || limits.length === 0) {
      missingFields.push('At least one Limit Request');
    } else {
      // Optional: Deeper validation for each limit can be added here
      // For example, ensure each limit has a type, proposed amount, and tenor
      limits.forEach((limit, index) => {
        if (!limit.limit_type_id) missingFields.push(`Limit Request ${index + 1}: Type`); // Corrected
        if (limit.proposed_amount === undefined || limit.proposed_amount === null || limit.proposed_amount === '') missingFields.push(`Limit Request ${index + 1}: Proposed Amount`); // Corrected
        if (!limit.proposed_tenor) missingFields.push(`Limit Request ${index + 1}: Proposed Tenor`); // Corrected
      });
    }

    // TODO: Add validation for documents if they are mandatory for submission

    if (missingFields.length > 0) {
      return `Submission failed: Please fill in the following required fields: ${missingFields.join(', ')}.`;
    }
    return null; // No errors
  };

  const handleTransition = async (transitionCode, comments) => { // Restored comments parameter
    setTransitionLoading(true);
    setTransitionError(null);

    const validationError = validateFormForSubmission();
    if (validationError) {
      setTransitionError(validationError);
      setTransitionLoading(false);
      console.error('Validation failed for submission:', validationError);
      return; // Stop the transition
    }
    console.log(`Attempting to perform transition: ${transitionCode}`);
    setTransitionLoading(true);
    setTransitionError(null);

    // If it's a new form (no id from URL params) and no workflow instance yet
    if (!id && !workflowInstance?.id) {
      const confirmSave = window.confirm(
        "This is a new application. It must be saved before it can be submitted. Would you like to save it now?"
      );
      if (confirmSave) {
        const saveResult = await handleSubmit(); // handleSubmit will navigate on successful POST for new applications
        if (!saveResult && !navigate.called) { // Check if handleSubmit failed AND didn't navigate
          console.log('Initial save for new application failed and did not navigate.');
          setTransitionLoading(false);
          return;
        }
        console.log('New application save initiated. If successful, user will be redirected. Transition can be performed on the new page.');
        setTransitionLoading(false); 
        return; 
      } else {
        console.log('User cancelled saving the new application.');
        setTransitionError('Save cancelled. Application must be saved to perform this action.');
        setTransitionLoading(false);
        return;
      }
    }

    // For existing applications, or if the new application was just saved and user is on the new page
    try {
      const { performWorkflowTransition } = await import('../../services/api');
      
      console.log('Ensuring form data is saved before transition (for existing or newly saved application)...');
      const saveSuccessful = await handleSubmit();
      
      if (!saveSuccessful) {
        console.log('Form save failed. Aborting transition.');
        setTransitionLoading(false);
        return;
      }

      if (!workflowInstance?.id) {
        console.error('Workflow instance ID not available after save. Aborting transition.');
        setTransitionError('Failed to retrieve workflow details after saving. Cannot perform transition.');
        setTransitionLoading(false);
        return;
      }
      
      const isSubWorkflow = currentState.includes('CREDIT_REQUEST');
      let finalTransitionCode = transitionCode;
      
      if (isSubWorkflow && currentState.includes('DRAFT')) {
        finalTransitionCode = 'CR_TR_5';
        console.log('Using CR_TR_5 for Credit Request sub-workflow transition');
      } else if (!isSubWorkflow && currentState.includes('CREDIT_PAPER_CREDIT_REQUEST')) {
        finalTransitionCode = 'PP_TR_1';
        console.log('Using PP_TR_1 for Credit Paper parent workflow transition');
      }
      
      console.log(`Performing transition ${finalTransitionCode} on workflow instance ${workflowInstance.id}`);
      const result = await performWorkflowTransition(
        workflowInstance.id, 
        finalTransitionCode,
        `Transition performed from Credit Request Form UI. Transition code: ${finalTransitionCode}`
      );
      
      console.log('Transition result:', result);
      alert(`Successfully performed transition: ${finalTransitionCode}`);
      setRefetchTrigger(prev => prev + 1); // Trigger refetch of workflow instance
      
      if (isSubWorkflow && result && result.detail === 'Transition performed successfully.') {
        console.log('Sub-workflow transition successful. Parent workflow may need to be transitioned next.');
      }
    } catch (error) {
      console.error('Error performing transition:', error);
      setTransitionError(`Error performing transition: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setTransitionLoading(false);
    }
  };

  // Handles form submission
  const handleSubmit = async (e, isSubmittingForReview = false) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (isSubmittingForReview) {
      console.log('handleSubmit: isSubmittingForReview is true, performing validation.');
      const validationError = validateFormForSubmission();
      if (validationError) {
        setTransitionError(validationError);
        setTransitionLoading(false);
        console.error('Validation failed during handleSubmit for submission:', validationError);
        return false; // Stop if validation fails for review submission
      }
    }

    console.log('Form submission started (validation passed or not a review submission).');
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      console.log('handleSubmit - Initial limits state:', JSON.stringify(limits, null, 2));
      const capitalizedPriority = priority?.charAt(0).toUpperCase() + priority?.slice(1).toLowerCase() || '';
      const validLimits = Array.isArray(limits) ? limits.filter(limit => limit.type) : [];
      console.log('handleSubmit - Filtered validLimits:', JSON.stringify(validLimits, null, 2));
      const formattedLimits = validLimits.map(limit => ({
        limit_type_id: limit.type.id, // Use limit.type.id as it's an object
        existing_amount: limit.existingAmount || "0",
        existing_tenor: limit.existingTenor || "0",
        proposed_amount: limit.proposedAmount || "0",
        proposed_tenor: limit.proposedTenor || "0",
        comments: limit.comments || ''
      }));
      console.log('handleSubmit - Formatted limits for payload:', JSON.stringify(formattedLimits, null, 2));

      // Define creditRequestFormData BEFORE payload
      const creditRequestFormData = {
        counterparty_cif: counterpartyCIF, // Added field
        guarantor_name: selectedGuarantorName, // Use selectedGuarantorName
        guarantor_cif: guarantorCIF,
        revenue_last_12m: revenueLast12Months,
        revenue_projected_12m: revenueProjected12Months,
        projected_rorwa_percent: projectedRorwa,
        country_risk_limit_available: typeof countryRiskLimitAvailable === 'string' && countryRiskLimitAvailable.toLowerCase() === 'yes',
        relationship_comments: relationshipComments,
        most_senior_contact: mostSeniorContact,
        last_client_visit_date: lastClientVisitDate || null,
        legal_documentation: legalDocumentType,
        positive_legal_opinion: positiveLegalOpinion === 'Yes',
        financial_statements_received: financialStatementsReceived,
        interim_statements_available: interimStatementsAvailable,
        account_executive: accountExecutive,
        senior_business_sponsor: selectedBusinessSponsor,
        second_business_sponsor: selectedSecondBusinessSponsor,
        high_priority_justification: justificationForHighPriority,
        date_form_completed: dateFormCompleted,
        reference_number: requestNumber, 
        documents: documents.map(doc => ({ name: doc.name, file_id: doc.id, description: doc.description || ''}))
      };
      
      // Now define payload, using creditRequestFormData
      const payload = {
        title: requestTitle,
        counterparty_id: selectedCounterparty,
        priority: capitalizedPriority,
        required_by_date: requiredByDate || null,
        description: detailedCommentsOnLimits,
        applicant_name: relationshipManager,
        limit_requests: formattedLimits,
        credit_request_form: creditRequestFormData // Correctly included and defined
      };


      console.log('handleSubmit - Final payload to be sent:', JSON.stringify(payload, null, 2));

      const { post, patch } = await import('../../services/api');
      let response;

      if (editMode && id) {
        console.log(`Updating existing credit application with ID: ${id}`);
        response = await patch(`/api/credit/credit-applications/${id}/`, payload);
      } else {
        console.log('Creating new credit application');
        response = await post('/api/credit/credit-applications/', payload);
        if (response?.data?.id) {
          const newId = response.data.id;
          console.log(`Credit application created successfully with ID: ${newId}`);
          setTransitionLoading(false);
          navigate(`/credit-requests/${newId}/edit`);
          return true; 
        } else {
          console.error('Error: New credit application POST request did not return an ID.');
          setTransitionError('Failed to save new application: No ID received.');
          setTransitionLoading(false);
          return false;
        }
      }

      console.log('API response (PATCH):', response.data);
      if (response?.data?.id) {
        console.log(`Credit application saved/updated with ID: ${response.data.id}`);
        if (response.data.workflow_instance_id) { 
          console.log(`Setting/Updating workflow instance ID: ${response.data.workflow_instance_id}`);
          setWorkflowInstanceId(response.data.workflow_instance_id);
        }
        if (editMode && id) {
            setRefetchTrigger(prev => prev + 1);
        }
        setTransitionLoading(false);
        return true;
      } else {
        console.error('Error: Save/Update request did not return a valid ID or data.');
        setTransitionError('Failed to save application: Invalid response from server.');
        setTransitionLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error during form submission:', err);
      setTransitionLoading(false);
      let errorDetailMessage = 'Failed to save application. Please try again.';
      if (err.response?.data) {
        console.log('Raw err.response.data from server:', JSON.stringify(err.response.data));
        if (typeof err.response.data === 'string') {
          errorDetailMessage = err.response.data;
        } else if (err.response.data.detail && typeof err.response.data.detail === 'string') {
          errorDetailMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          const messages = [];
          for (const key in err.response.data) {
            messages.push(`${key}: ${err.response.data[key].join ? err.response.data[key].join(', ') : err.response.data[key]}`);
          }
          errorDetailMessage = messages.join('; ');
        } else if (err.message) { 
          errorDetailMessage = err.message;
        }
      } else if (err.message) { 
        errorDetailMessage = err.message;
      } else {
        errorDetailMessage = 'An unknown error occurred during submission.';
      }
      setTransitionError(errorDetailMessage);
      return false;
    }
  }; // End of handleSubmit

  // Fetch Counterparties
  useEffect(() => {
    async function fetchCounterparties() {
      setLoadingCounterparties(true);
      setCounterpartyError(null);
      try {
        const { get } = await import('../../services/api');
        const response = await get('/api/credit/counterparties/');
        setCounterparties(response.data);
      } catch (err) {
        setCounterpartyError(err.message);
        setCounterparties([]); // Clear counterparties on error
      } finally {
        setLoadingCounterparties(false);
      }
    }
    fetchCounterparties();
  }, []); // Empty dependency array to run once on mount

  // Fetch Business Sponsors
  useEffect(() => {
    const loadBusinessSponsors = async () => {
      setLoadingBusinessSponsors(true);
      setBusinessSponsorError(null);
      try {
        const sponsors = await fetchUsersByRole('business_sponsor');
        setBusinessSponsors(sponsors || []);
      } catch (err) {
        console.error('Error fetching business sponsors:', err);
        setBusinessSponsorError(err.message || 'Failed to load business sponsors');
        setBusinessSponsors([]); // Clear sponsors on error
      } finally {
        setLoadingBusinessSponsors(false);
      }
    };
    loadBusinessSponsors();
  }, []);

  // Fetch Relationship Managers
  useEffect(() => {
    const loadRelationshipManagers = async () => {
      setLoadingRelationshipManagers(true);
      setRelationshipManagerError(null);
      try {
        // Assuming 'Relationship Manager' is the correct role name string for the backend.
        // Adjust if it's 'relationship_manager' or similar.
        const managers = await fetchUsersByRole('Relationship Manager'); 
        setRelationshipManagersList(managers || []);
      } catch (err) {
        console.error('Error fetching relationship managers:', err);
        setRelationshipManagerError(err.message || 'Failed to load relationship managers');
        setRelationshipManagersList([]);
      } finally {
        setLoadingRelationshipManagers(false);
      }
    };
    loadRelationshipManagers();
  }, []);

  // Fetch limit types
  useEffect(() => {
    async function fetchLimitTypes() {
      setLoadingLimitTypes(true);
      setLimitTypesError(null);
      try {
        const { get } = await import('../../services/api');
        const response = await get('/api/credit/limit-types/');
        setLimitTypes(response.data);
      } catch (err) {
        setLimitTypesError(err.message);
        setLimitTypes([]);
      } finally {
        setLoadingLimitTypes(false);
      }
    }
    fetchLimitTypes();
  }, []);

  // Fetch credit request data in edit mode
  useEffect(() => {
    if (!editMode || !id) return;
    async function fetchCreditRequest() {
      try {
        const { get } = await import('../../services/api');
        console.log('Fetching credit application with ID:', id);
        const response = await get(`/api/credit/credit-applications/${id}/`);
        const data = response.data;
        
        // For debugging - log the data we received
        console.log('Loaded credit application data:', JSON.stringify(data, null, 2));
        
        // Get data from both the CreditRequestForm model attributes and its form_data JSONField
        const creditRequestForm = data.credit_request_form || {};
        const formData = data.form_data || {};
        
        // Set basic form fields (from main CreditApplication model)
        setRequestTitle(data.title || '');
        setRequestNumber(data.reference_number || '');
        
        // Ensure priority is properly capitalized
        const rawPriority = data.priority || 'Medium';
        const capitalizedPriority = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1).toLowerCase();
        setPriority(capitalizedPriority);
        
        setRequiredByDate(data.required_by_date || '');
        setDetailedCommentsOnLimits(data.description || '');
        setRelationshipManager(data.applicant_name || '');
        
        // Set counterparty information
        if (data.counterparty?.id) {
          setSelectedCounterparty(data.counterparty.id);
          setCounterpartyCIF(data.counterparty.cif_number || '');
        }
        
        // Set guarantor information (from CreditRequestForm)
        setSelectedGuarantor(creditRequestForm.guarantor_name || formData.guarantor_name || '');
        setGuarantorCIF(creditRequestForm.guarantor_cif || formData.guarantor_cif || '');
        
        // Set limits information
        if (data.limit_requests && data.limit_requests.length > 0) {
          console.log('Loading limit requests:', data.limit_requests);
          
          // Map the limit requests to the format expected by the component
          const limitData = data.limit_requests.map((limit, index) => {
            // Handle both possible formats of limit_type (object or ID string)
            let limitType = '';
            if (limit.limit_type) {
              // If limit_type is an object with an id property
              limitType = typeof limit.limit_type === 'object' ? limit.limit_type.id : limit.limit_type;
            } else if (limit.limit_type_id) {
              // If limit_type_id is provided directly
              limitType = limit.limit_type_id;
            }
            
            return {
              id: index + 1,
              type: limitType,
              existingAmount: limit.existing_amount || '',
              existingTenor: limit.existing_tenor || '',
              proposedAmount: limit.proposed_amount || '',
              proposedTenor: limit.proposed_tenor || '',
              comments: limit.comments || ''
            };
          });
          
          console.log('Mapped limit data:', limitData);
          setLimits(limitData);
        } else {
          console.log('No limit requests found in the response');
        }
        
        // Set risk information (from CreditRequestForm)
        setCountryRiskLimitAvailable(
          creditRequestForm.country_risk_limit_available || formData.country_risk_limit_available ? 'Yes' : 'No'
        );
        
        // Set relationship information (from CreditRequestForm)
        setRevenueLast12Months(creditRequestForm.revenue_last_12m || formData.revenue_last_12_months || '');
        setRevenueProjected12Months(creditRequestForm.revenue_projected_12m || formData.revenue_projected_12_months || '');
        setProjectedRorwa(creditRequestForm.projected_rorwa_percent || formData.projected_rorwa || '');
        setMostSeniorContact(creditRequestForm.most_senior_contact || formData.most_senior_contact || '');
        setLastClientVisitDate(creditRequestForm.last_client_visit_date || formData.last_client_visit_date || '');
        setRelationshipComments(creditRequestForm.relationship_comments || formData.relationship_comments || '');
        
        // Set legal & financial documentation (from CreditRequestForm)
        setLegalDocumentType(creditRequestForm.legal_documentation || formData.legal_document_type || '');
        setPositiveLegalOpinion(
          creditRequestForm.positive_legal_opinion || formData.positive_legal_opinion ? 'Yes' : 'No'
        );
        setFinancialStatementsReceived(
          creditRequestForm.financial_statements_received || formData.financial_statements_received || false
        );
        setInterimStatementsAvailable(
          creditRequestForm.interim_statements_available || formData.interim_statements_available || false
        );
        
        // Set stakeholder information (from CreditRequestForm)
        setAccountExecutive(creditRequestForm.account_executive || formData.account_executive || '');
        setSelectedBusinessSponsor(creditRequestForm.senior_business_sponsor || formData.senior_business_sponsor || '');
        setSelectedSecondBusinessSponsor(creditRequestForm.second_business_sponsor || formData.second_business_sponsor || '');
        
        // For high priority justification, check both possible field names in both objects
        // Log the values to help debug
        console.log('High priority justification values:', {
          'creditRequestForm.high_priority_justification': creditRequestForm.high_priority_justification,
          'formData.high_priority_justification': formData.high_priority_justification,
          'formData.justification_for_high_priority': formData.justification_for_high_priority
        });
        
        // Try all possible field names to ensure we get the latest value
        setJustificationForHighPriority(
          creditRequestForm.high_priority_justification || 
          formData.high_priority_justification || 
          formData.justification_for_high_priority || 
          ''
        );
        
        // Set document uploads (from form_data JSONField)
        if (formData.documents && formData.documents.length > 0) {
          setDocuments(formData.documents);
        }
      } catch (error) {
        console.error('Error fetching credit request:', error);
      }
    fetchCreditRequest();
    }
  }, [editMode, id, counterparties]);

  // Add/remove limit rows
  const addLimit = () => {
    const newId = limits.length > 0 ? Math.max(...limits.map(l => l.id)) + 1 : 1;
    setLimits([...limits, {
      id: newId,
      type: '',
      existingAmount: '',
      existingTenor: '',
      proposedAmount: '',
      proposedTenor: '',
      comments: ''
    }]);
  };
  
  const removeLimit = (id) => {
    if (limits.length > 1) {
      setLimits(limits.filter(limit => limit.id !== id));
    }
  };

  // Section refs for scrolling
  const sectionRefs = [
    React.createRef(), // Counterparty information
    React.createRef(), // Limit Information
    React.createRef(), // Relationship Information
    React.createRef(), // Legal & Financial Documentation
    React.createRef()  // Prioritisation & Sponsorship
  ];

  // State for current wizard step (for highlighting)
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: colors.neutral800, maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      <TopNavBar LogoutButton={LogoutButton} />
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' }}>
        <VersionControlHeader colors={colors} />
      </div>
      
      <FormWizardNav 
        sectionRefs={sectionRefs} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
        colors={colors} 
      />
      
      <form onSubmit={handleSubmit}>
        {/* 1. Counterparty Information */}
        <div ref={sectionRefs[0]}></div>
        <FormSection 
          title="Counterparty Information" 
          description="Basic information about the credit request."
          colors={colors}
        >
          <CounterpartySection 
            counterparties={counterparties}
            loadingCounterparties={loadingCounterparties}
            counterpartyError={counterpartyError}
            selectedCounterparty={selectedCounterparty}
            setSelectedCounterparty={setSelectedCounterparty}
            counterpartyCIF={counterpartyCIF}
            setCounterpartyCIF={setCounterpartyCIF}
            selectedGuarantor={selectedGuarantor}
            setSelectedGuarantor={setSelectedGuarantor}
            guarantorCIF={guarantorCIF}
            setGuarantorCIF={setGuarantorCIF}
            selectedGuarantorName={selectedGuarantorName} // Pass state
            setSelectedGuarantorName={setSelectedGuarantorName} // Pass setter
            requestTitle={requestTitle}
            setRequestTitle={setRequestTitle}
            requestNumber={requestNumber}
            colors={colors}
          />
        </FormSection>
        
        {/* 2. Limits Information */}
        <div ref={sectionRefs[1]}></div>
        <FormSection 
          title="Limits Information" 
          description="Information about the limits."
          colors={colors}
        >
          <LimitsSection 
            limits={limits}
            setLimits={setLimits}
            addLimit={addLimit}
            removeLimit={removeLimit}
            limitTypes={limitTypes}
            loadingLimitTypes={loadingLimitTypes}
            limitTypesError={limitTypesError}
            countryRiskLimitAvailable={countryRiskLimitAvailable}
            setCountryRiskLimitAvailable={setCountryRiskLimitAvailable}
            detailedCommentsOnLimits={detailedCommentsOnLimits}
            setDetailedCommentsOnLimits={setDetailedCommentsOnLimits}
            colors={colors}
          />
        </FormSection>
        
        {/* 3. Relationship Information */}
        <div ref={sectionRefs[2]}></div>
        <FormSection 
          title="Relationship Information" 
          description="Information about the relationship."
          colors={colors}
        >
          <RelationshipSection 
            revenueLast12Months={revenueLast12Months}
            setRevenueLast12Months={setRevenueLast12Months}
            revenueProjected12Months={revenueProjected12Months}
            setRevenueProjected12Months={setRevenueProjected12Months}
            projectedRorwa={projectedRorwa}
            setProjectedRorwa={setProjectedRorwa}
            mostSeniorContact={mostSeniorContact}
            setMostSeniorContact={setMostSeniorContact}
            lastClientVisitDate={lastClientVisitDate}
            setLastClientVisitDate={setLastClientVisitDate}
            relationshipComments={relationshipComments}
            setRelationshipComments={setRelationshipComments}
            colors={colors}
          />
        </FormSection>
        
        {/* 4. Legal & Financial Documentation */}
        <div ref={sectionRefs[3]}></div>
        <FormSection 
          title="Legal & Financial Documentation" 
          description="Information about the legal and financial documentation."
          colors={colors}
        >
          <LegalSection 
            legalDocumentType={legalDocumentType}
            setLegalDocumentType={setLegalDocumentType}
            positiveLegalOpinion={positiveLegalOpinion}
            setPositiveLegalOpinion={setPositiveLegalOpinion}
            financialStatementsReceived={financialStatementsReceived}
            setFinancialStatementsReceived={setFinancialStatementsReceived}
            interimStatementsAvailable={interimStatementsAvailable}
            setInterimStatementsAvailable={setInterimStatementsAvailable}
            colors={colors}
          />
        </FormSection>
        
        {/* 5. Prioritisation & Business Sponsorship */}
        <div ref={sectionRefs[4]}></div>
        <FormSection 
          title="Prioritisation & Business Sponsorship" 
          description="Information about the prioritisation and business sponsorship."
          colors={colors}
        >
          <PrioritisationSection 
            priority={priority}
            setPriority={setPriority}
            requiredByDate={requiredByDate}
            setRequiredByDate={setRequiredByDate}
            accountExecutive={accountExecutive}
            setAccountExecutive={setAccountExecutive}
            relationshipManager={relationshipManager} // This will now be an ID
            relationshipManagersList={relationshipManagersList}
            loadingRelationshipManagers={loadingRelationshipManagers}
            relationshipManagerError={relationshipManagerError}
            setRelationshipManager={setRelationshipManager}
            businessSponsors={businessSponsors}
            loadingBusinessSponsors={loadingBusinessSponsors}
            businessSponsorError={businessSponsorError}
            selectedBusinessSponsor={selectedBusinessSponsor}
            setSelectedBusinessSponsor={setSelectedBusinessSponsor}
            selectedSecondBusinessSponsor={selectedSecondBusinessSponsor}
            setSelectedSecondBusinessSponsor={setSelectedSecondBusinessSponsor}
            justificationForHighPriority={justificationForHighPriority}
            setJustificationForHighPriority={setJustificationForHighPriority}
            colors={colors}
          />
        </FormSection>
        
        {/* 6. Document Uploads */}
        <FormSection 
          title="Document Uploads" 
          description="Upload supporting documents."
          colors={colors}
        >
          <DocumentsSection 
            colors={colors}
            documents={documents}
            setDocuments={setDocuments}
          />
          
          {/* Always show WorkflowActions for basic form actions */}
          <WorkflowActions
            key={id || 'new_form_workflow_actions'} // Ensure remount on ID change
            transitionLoading={transitionLoading}
            transitionError={transitionError}
            onSubmit={handleSubmit} /* Changed from handleSubmit to onSubmit to match WorkflowActions expectations */
            handleTransition={handleTransition}
            workflowInstance={workflowInstance}
            currentState={currentState}
            allowedTransitions={allowedTransitions || []}
            colors={colors}
          />
        </FormSection>
      </form>
    </div>
  );
};

export default CreditRequestForm;
