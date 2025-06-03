import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
  const editMode = props.editMode || !!id;
  
  // Workflow state logic
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);

  // Debug mode toggle
  const [showDebugTools, setShowDebugTools] = useState(false);

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
  
  // Debug: Log limits state changes
  useEffect(() => {
    console.log('Limits state updated:', limits);
  }, [limits]);

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
  const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState('');
  const [selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor] = useState('');
  const [loadingBusinessSponsors, setLoadingBusinessSponsors] = useState(true);
  const [businessSponsorError, setBusinessSponsorError] = useState(null);
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
            type: limit.limit_type_id, // This is the ID, ensure LimitsSection dropdown can handle it
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
          // Counterparty Section (Guarantor)
          setSelectedGuarantor(formData.guarantor_name || '');
          setGuarantorCIF(formData.guarantor_cif || '');
          
          // Limits Section (additional fields, not the table itself)
          setCountryRiskLimitAvailable(formData.country_risk_limit_available ? 'Yes' : 'No');
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
        if (creditApp.workflow_instance) {
          console.log('Credit application workflow instance:', creditApp.workflow_instance);
          // The workflow_instance might be an object with an id property or just the ID string
          const instanceId = typeof creditApp.workflow_instance === 'object' ? 
            creditApp.workflow_instance.id : creditApp.workflow_instance;
          
          if (instanceId) {
            console.log(`Setting workflow instance ID to: ${instanceId}`);
            setWorkflowInstanceId(instanceId);
          } else {
            console.error('Credit application has workflow_instance but no ID');
          }
          
          // Set workflow state directly from the credit application response
          if (creditApp.workflow_state) {
            console.log('Setting current state from credit application:', creditApp.workflow_state);
            setCurrentState(creditApp.workflow_state.name || '');
          }
          
          if (creditApp.available_transitions) {
            console.log('Setting allowed transitions from credit application:', creditApp.available_transitions);
            setAllowedTransitions(creditApp.available_transitions || []);
          }
        } else {
          console.error('Credit application has no workflow instance');
        }
      } catch (err) {
        console.error('Error fetching credit application:', err);
      }
    }
    
    fetchCreditApplication();
  }, [id]);

  // Fetch workflow instance data
  const fetchWorkflowInstance = async (instanceId) => {
    try {
      if (!instanceId) {
        console.log('DEBUG: No workflow instance ID provided');
        return;
      }

      console.log(`DEBUG: Fetching workflow instance: ${instanceId}`);
      const { get } = await import('../../services/api');
      
      // Fetch workflow instance
      try {
        const response = await get(`/api/workflow-instances/${instanceId}/`);
        console.log('DEBUG: Workflow instance data:', response.data);
        
        // Set workflow instance state
        setWorkflowInstance(response.data);
        setCurrentState(response.data.current_state?.name || 'Unknown');
      } catch (instanceError) {
        console.error('DEBUG: Error fetching workflow instance:', instanceError);
      }
      
      // Fetch allowed transitions
      try {
        const transitionsResponse = await get(`/api/workflow-instances/${instanceId}/allowed-transitions/`);
        console.log('DEBUG: Allowed transitions:', transitionsResponse.data);
        setAllowedTransitions(transitionsResponse.data);
      } catch (transitionsError) {
        console.error('DEBUG: Error fetching transitions:', transitionsError);
      }
      
    } catch (error) {
      console.error('DEBUG: Error in fetchWorkflowInstance:', error);
      setTransitionError('Failed to load workflow data. Please refresh the page.');
    }
  };

  // Fetch workflow instance when workflowInstanceId changes
  useEffect(() => {
    if (workflowInstanceId) {
      fetchWorkflowInstance(workflowInstanceId);
    }
  }, [workflowInstanceId]);

  // Handler for transition button click
  const handleTransition = async (transitionCode) => {
    console.log(`Attempting to perform transition: ${transitionCode}`);
    
    if (!workflowInstance?.id) {
      console.error('No workflow instance available');
      setTransitionError('No workflow instance available. Please save the form first.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    try {
      const { performWorkflowTransition } = await import('../../services/api');
      
      // First save the form to ensure all data is up to date
      console.log('Saving form data before transition...');
      await handleSubmit();
      
      // Determine if this is a sub-workflow or parent workflow instance
      // If the current state contains CREDIT_REQUEST, it's the sub-workflow
      const isSubWorkflow = currentState.includes('CREDIT_REQUEST');
      
      // Override transition code if needed to ensure correct codes are used
      let finalTransitionCode = transitionCode;
      
      // If submitting the credit request form (sub-workflow)
      if (isSubWorkflow && currentState.includes('DRAFT')) {
        finalTransitionCode = 'CR_TR_5'; // From PRD: Credit Request DRAFT to SUBMITTED
        console.log('Using CR_TR_5 for Credit Request sub-workflow transition');
      } 
      // If submitting for credit review (parent workflow)
      else if (!isSubWorkflow && currentState.includes('CREDIT_PAPER_CREDIT_REQUEST')) {
        finalTransitionCode = 'PP_TR_1'; // From PRD: Parent process to CREDIT_REVIEW_PENDING
        console.log('Using PP_TR_1 for Credit Paper parent workflow transition');
      }
      
      // Then perform the transition
      console.log(`Performing transition ${finalTransitionCode} on workflow instance ${workflowInstance.id}`);
      const result = await performWorkflowTransition(
        workflowInstance.id, 
        finalTransitionCode,
        `Transition performed from Credit Request Form UI. Transition code: ${finalTransitionCode}`
      );
      
      console.log('Transition result:', result);
      
      // Show success message
      alert(`Successfully performed transition: ${finalTransitionCode}`);
      
      // Refetch workflow instance to update state and allowed transitions
      await fetchWorkflowInstance(workflowInstance.id);
      
      // If this was a sub-workflow transition and it succeeded, check if we need to transition the parent
      if (isSubWorkflow && result && result.detail === 'Transition performed successfully.') {
        // We could automatically trigger the parent workflow transition here if needed
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
  const handleSubmit = async (e) => {
    console.log('handleSubmit called with event:', e);
    if (e && e.preventDefault) e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);
    console.log('Form submission started - saving as draft');
    try {
      // Debug: Log the current limits state and form values
      console.log('Current limits state before submission:', JSON.stringify(limits, null, 2));
      console.log('Form values before submission:', {
        positiveLegalOpinion,
        positiveLegalOpinionBoolean: positiveLegalOpinion === 'Yes',
        legalDocumentType,
        financialStatementsReceived,
        interimStatementsAvailable
      });
      
      // Ensure priority is properly capitalized
      const capitalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      
      // Filter valid limits (those with a type)
      const validLimits = limits.filter(limit => limit.type);
      console.log(`Found ${validLimits.length} valid limits with types:`, validLimits);
      
      // Map limits to the format expected by the backend
      const formattedLimits = validLimits.map(limit => {
        // Get the limit type information
        let limitTypeId;
        
        // First, try to get the ID directly
        if (typeof limit.type === 'object' && limit.type.id) {
          // If it's an object with an id property
          limitTypeId = limit.type.id;
          console.log(`Limit type is an object with ID: ${limitTypeId}`);
        } else if (typeof limit.type === 'string') {
          // If it's a string (could be UUID or name)
          limitTypeId = limit.type;
          console.log(`Limit type is a string: ${limitTypeId}`);
        } else {
          // Fallback - this shouldn't happen with proper validation
          console.warn('Limit type is in an unexpected format:', limit.type);
          limitTypeId = limit.type;
        }
        
        // Ensure we have a valid limit type ID
        if (!limitTypeId) {
          console.error('Missing limit type ID for limit:', limit);
        }
        
        const formattedLimit = {
          limit_type_id: limitTypeId,
          existing_amount: limit.existingAmount || "0",
          existing_tenor: limit.existingTenor || "0",
          proposed_amount: limit.proposedAmount || "0",
          proposed_tenor: limit.proposedTenor || "0",
          comments: limit.comments || ''
        };
        console.log('Formatted limit for submission:', formattedLimit);
        return formattedLimit;
      });
      
      // Debug log for the final formatted limits
      console.log('Final formatted limits for submission:', formattedLimits);
      
      const payload = {
        // Core CreditApplication fields
        title: requestTitle,
        counterparty_id: selectedCounterparty,
        priority: capitalizedPriority, // Ensure it's capitalized: 'Low', 'Medium', or 'High'
        required_by_date: requiredByDate,
        description: detailedCommentsOnLimits,
        applicant_name: relationshipManager,
        
        // Include the limits data as required by the backend
        limit_requests: formattedLimits,
        
        // CreditRequestForm fields as a nested object
        credit_request_form: {
          // Counterparty Information
          guarantor_name: selectedGuarantor,
          guarantor_cif: guarantorCIF,
          
          // Financial Information
          revenue_last_12m: revenueLast12Months,
          revenue_projected_12m: revenueProjected12Months,
          projected_rorwa_percent: projectedRorwa,
          
          // Risk and Compliance
          country_risk_limit_available: countryRiskLimitAvailable === 'Yes',
          
          // Relationship Information
          relationship_comments: relationshipComments,
          most_senior_contact: mostSeniorContact,
          last_client_visit_date: lastClientVisitDate,
          
          // Documentation
          legal_documentation: legalDocumentType,
          // Debug positive legal opinion
          positive_legal_opinion: positiveLegalOpinion === 'Yes', // Convert to boolean
          financial_statements_received: financialStatementsReceived,
          interim_statements_available: interimStatementsAvailable,
          
          // Stakeholders
          account_executive: accountExecutive,
          senior_business_sponsor: selectedBusinessSponsor,
          second_business_sponsor: selectedSecondBusinessSponsor,
          
          // Additional Information
          high_priority_justification: justificationForHighPriority
        }
      };
      
      console.log('Frontend payload being sent:', JSON.stringify(payload, null, 2));

    // For backward compatibility during migration
      // We'll also include the form_data object
      payload.form_data = {
        ...payload.credit_request_form,
        title: requestTitle,
        priority: capitalizedPriority, // Use the same capitalized priority value
        required_by_date: requiredByDate,
        date_form_started: dateFormStarted,
        date_form_completed: dateFormCompleted,
        reference_number: requestNumber,
        documents: documents.map(doc => ({
          name: doc.name,
          file: doc.file,
          description: doc.description || ''
        }))
      };
      
      const { post, patch } = await import('../../services/api');
      
      let response;
      if (editMode && id) {
        console.log(`Updating existing credit application with ID: ${id}`);
        console.log('Payload being sent:', JSON.stringify(payload, null, 2));
        
        // Update the credit application with all data
        // The backend will handle updating the related credit request form
        response = await patch(`/api/credit/credit-applications/${id}/`, payload);
      } else {
        console.log('Creating new credit application');
        console.log('Payload being sent:', JSON.stringify(payload, null, 2));
        response = await post('/api/credit/credit-applications/', payload);
      }
      
      // Log the response for debugging
      console.log('API response:', response.data);
      
      // Store the credit application ID from the response
      if (response?.data?.id) {
        console.log(`Credit application saved with ID: ${response.data.id}`);
      }
      
      console.log('Form submission successful');
      
      // Update workflow instance ID if it's in the response
      if (response.data.workflow_instance) {
        const instanceId = typeof response.data.workflow_instance === 'object' ? 
          response.data.workflow_instance.id : response.data.workflow_instance;
        console.log(`Setting workflow instance ID: ${instanceId}`);
        setWorkflowInstanceId(instanceId);
        await fetchWorkflowInstance(instanceId);
      }
      
      // Return true to indicate success to WorkflowActions
      return true;
    } catch (err) {
      console.error('Error in form submission:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      setTransitionError(err.message || 'Failed to save draft');
    } finally {
      setTransitionLoading(false);
    }
  };

  // Fetch counterparties
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
        setCounterparties([]);
      } finally {
        setLoadingCounterparties(false);
      }
    }
    fetchCounterparties();
  }, []);

  // Fetch Business Sponsors
  useEffect(() => {
    async function fetchBusinessSponsors() {
      setLoadingBusinessSponsors(true);
      setBusinessSponsorError(null);
      try {
        const { get } = await import('../../services/api');
        const response = await get('/api/users/?role=business_sponsor');
        setBusinessSponsors(response.data);
      } catch (err) {
        setBusinessSponsorError(err.message);
        setBusinessSponsors([]);
      } finally {
        setLoadingBusinessSponsors(false);
      }
    }
    fetchBusinessSponsors();
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
            relationshipManager={relationshipManager}
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
        
        {/* Debug toggle button */}
        <div style={{ textAlign: 'center', margin: '2rem 0 0.5rem' }}>
          <button 
            type="button"
            onClick={() => setShowDebugTools(!showDebugTools)}
            style={{ 
              backgroundColor: 'transparent', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: '#666'
            }}
          >
            {showDebugTools ? 'Hide Debug Tools' : 'Show Debug Tools'}
          </button>
        </div>
        
        {/* Debug section - only shown when showDebugTools is true */}
        {showDebugTools && (
          <DebugPanel
            id={id}
            workflowInstanceId={workflowInstanceId}
            setWorkflowInstanceId={setWorkflowInstanceId}
            currentState={currentState}
            allowedTransitions={allowedTransitions}
            fetchWorkflowInstance={fetchWorkflowInstance}
            fetchCreditApp={async () => {
              try {
                if (!id) {
                  alert('No credit application ID available');
                  return;
                }
                
                const { get } = await import('../../services/api');
                const response = await get(`/api/credit/credit-applications/${id}/`);
                console.log('DEBUG: Credit application data:', response.data);
                
                // Set the workflow instance ID if available
                if (response.data.workflow_instance) {
                  const instanceId = typeof response.data.workflow_instance === 'object' ? 
                    response.data.workflow_instance.id : response.data.workflow_instance;
                  console.log(`DEBUG: Workflow instance ID from credit app: ${instanceId}`);
                  setWorkflowInstanceId(instanceId);
                  
                  // Also fetch the workflow instance to get current state and transitions
                  fetchWorkflowInstance(instanceId);
                } else {
                  console.log('DEBUG: No workflow instance found for this credit application');
                }
                
                alert(`Fetched credit application: ${response.data.title}`);
              } catch (error) {
                console.error('DEBUG: Error fetching credit application:', error);
                alert('Error fetching credit application: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
              }
            }}
            createWorkflowInstance={async () => {
              try {
                if (!id) {
                  alert('No credit application ID available');
                  return;
                }
                
                // Show loading state
                const button = document.getElementById('create-workflow-btn');
                if (button) button.textContent = 'Creating workflow instance...';
                
                const { patch, get } = await import('../../services/api');
                
                // First, create a workflow instance
                console.log('DEBUG: Creating workflow instance for credit application:', id);
                
                // We'll use the patch endpoint to update the credit application
                // This will trigger the backend to create a workflow instance if it doesn't exist
                const payload = {
                  // This will trigger the workflow instance creation in the backend
                  create_workflow_instance: true
                };
                
                console.log('DEBUG: Sending payload to create workflow instance:', payload);
                
                try {
                  const response = await patch(`/api/credit/credit-applications/${id}/`, payload);
                  console.log('DEBUG: Update response:', response.data);
                } catch (patchError) {
                  console.error('DEBUG: Error in PATCH request:', patchError);
                  console.error('DEBUG: Error response:', patchError.response?.data);
                  throw patchError;
                }
                
                // Now fetch the updated credit application to get the workflow instance ID
                try {
                  const updatedResponse = await get(`/api/credit/credit-applications/${id}/`);
                  console.log('DEBUG: Updated credit application:', updatedResponse.data);
                  
                  if (updatedResponse.data.workflow_instance) {
                    const instanceId = typeof updatedResponse.data.workflow_instance === 'object' ? 
                      updatedResponse.data.workflow_instance.id : updatedResponse.data.workflow_instance;
                    console.log(`DEBUG: New workflow instance ID: ${instanceId}`);
                    setWorkflowInstanceId(instanceId);
                    alert(`Created workflow instance with ID: ${instanceId}`);
                    
                    // Refresh the page to show the updated workflow state
                    window.location.reload();
                  } else {
                    console.error('DEBUG: Failed to create workflow instance');
                    alert('Failed to create workflow instance - no workflow instance ID returned');
                  }
                } catch (getError) {
                  console.error('DEBUG: Error fetching updated credit application:', getError);
                  throw getError;
                }
              } catch (error) {
                console.error('DEBUG: Error creating workflow instance:', error);
                alert('Error creating workflow instance: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
              } finally {
                // Reset button state
                const button = document.getElementById('create-workflow-btn');
                if (button) button.textContent = 'TEST: Create Workflow Instance';
              }
            }}
          />
        )}
      </form>
    </div>
  );
};

export default CreditRequestForm;
