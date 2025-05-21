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

const CreditRequestForm = (props) => {
  const { id } = useParams();
  const editMode = props.editMode || !!id;
  
  // Workflow state logic
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const workflowInstanceId = id || 'REPLACE_WITH_INSTANCE_ID';

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

  // Fetch workflow instance on mount
  useEffect(() => {
    async function fetchWorkflowInstance() {
      try {
        const { get } = await import('../../services/api');
        const response = await get(`/workflow-instances/${workflowInstanceId}/`);
        setWorkflowInstance(response.data);
        setCurrentState(response.data.current_state?.name || response.data.current_state || '');
        setAllowedTransitions(response.data.allowed_transitions || []);
      } catch (err) {
        setWorkflowInstance(null);
        setAllowedTransitions([]);
      }
    }
    if (workflowInstanceId && workflowInstanceId !== 'REPLACE_WITH_INSTANCE_ID') {
      fetchWorkflowInstance();
    }
  }, [workflowInstanceId]);

  // Handler for transition button click
  const handleTransition = async (transitionCode) => {
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      const { post } = await import('../../services/api');
      await post(`/workflow-instances/${workflowInstanceId}/transition/`, {
        transition_code: transitionCode
      });
      // Refetch workflow instance to update state and allowed transitions
      const { get } = await import('../../services/api');
      const response = await get(`/workflow-instances/${workflowInstanceId}/`);
      setWorkflowInstance(response.data);
      setCurrentState(response.data.current_state?.name || response.data.current_state || '');
      setAllowedTransitions(response.data.allowed_transitions || []);
    } catch (err) {
      setTransitionError(err.message || 'Transition failed');
    } finally {
      setTransitionLoading(false);
    }
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);
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
        const formattedLimit = {
          limit_type_id: limit.type,
          existing_amount: limit.existingAmount || "0",
          existing_tenor: limit.existingTenor || "0",
          proposed_amount: limit.proposedAmount || "0",
          proposed_tenor: limit.proposedTenor || "0",
          comments: limit.comments || ''
        };
        console.log('Formatted limit for submission:', formattedLimit);
        return formattedLimit;
      });
      
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
      
      if (editMode && id) {
        await patch(`/credit/credit-applications/${id}/`, payload);
      } else {
        await post('/credit/credit-applications/', payload);
      }
      
      // Redirect directly to dashboard after successful submission
      window.location.href = '/';
    } catch (err) {
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
        const response = await get('/credit/counterparties/');
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
        const response = await get('/users/?role=business_sponsor');
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
        const response = await get('/credit/limit-types/');
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
        const response = await get(`/credit/credit-applications/${id}/`);
        const data = response.data;
        
        // For debugging - log the data we received
        console.log('Loaded credit application data:', JSON.stringify(data, null, 2));
        
        // Get data from either credit_request_form (new structure) or form_data (legacy)
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
          const limitData = data.limit_requests.map((limit, index) => ({
            id: index + 1,
            type: limit.limit_type?.id || limit.limit_type_id || '',
            existingAmount: limit.existing_amount || '',
            existingTenor: limit.existing_tenor || '',
            proposedAmount: limit.proposed_amount || '',
            proposedTenor: limit.proposed_tenor || '',
            comments: limit.comments || ''
          }));
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
        setJustificationForHighPriority(creditRequestForm.high_priority_justification || formData.justification_for_high_priority || '');
        
        // Set document uploads (from legacy form_data)
        if (formData.documents && formData.documents.length > 0) {
          setDocuments(formData.documents);
        }
      } catch (error) {
        console.error('Error fetching credit request:', error);
      }
    };
    fetchCreditRequest();
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
        </FormSection>
        
        {/* Footer and workflow actions */}
        <WorkflowActions 
          transitionLoading={transitionLoading}
          transitionError={transitionError}
          handleSubmit={handleSubmit}
          handleTransition={handleTransition}
          workflowInstance={workflowInstance}
          currentState={currentState}
          allowedTransitions={allowedTransitions}
          colors={colors}
        />
      </form>
    </div>
  );
};

export default CreditRequestForm;
