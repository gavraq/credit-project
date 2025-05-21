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
        const { get } = await import('../services/api');
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
      const { post } = await import('../services/api');
      await post(`/workflow-instances/${workflowInstanceId}/transition/`, {
        transition_code: transitionCode
      });
      // Refetch workflow instance to update state and allowed transitions
      const { get } = await import('../services/api');
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
      // Collect form data for all required fields
      const payload = {
        title: requestTitle || (selectedCounterparty ? `${counterparties.find(c => c.id === selectedCounterparty)?.name || ''} - Credit Request` : ''),
        counterparty_id: selectedCounterparty,
        amount: limits?.[0]?.proposedAmount || '',
        description: detailedCommentsOnLimits || '',
        applicant_name: relationshipManager || '',
        applicant_email: '',
        applicant_phone: '',
        priority: priority || 'Medium',
        required_by_date: requiredByDate || null,
        // Include the limits data as required by the backend
        limit_requests: limits
          .filter(limit => limit.type && limit.type !== '') // Only include limits with a valid type
          .map(limit => ({
            limit_type_id: limit.type, // Must be a valid UUID from the limit types
            existing_amount: limit.existingAmount || 0,
            existing_tenor: limit.existingTenor || 0,
            proposed_amount: limit.proposedAmount || 0,
            proposed_tenor: limit.proposedTenor || 0,
            comments: limit.comments || ''
          })),
      };
      
      // Create form_data object for CreditRequestForm model
      const formData = {
        guarantor_name: selectedGuarantor ? counterparties.find(c => c.id === selectedGuarantor)?.name || '' : '',
        guarantor_cif: guarantorCIF || '',
        revenue_last_12m: revenueLast12Months || 0,
        revenue_projected_12m: revenueProjected12Months || 0,
        projected_rorwa_percent: projectedRorwa || 0,
        relationship_comments: relationshipComments || '',
        most_senior_contact: mostSeniorContact || '',
        last_client_visit_date: lastClientVisitDate || null,
        legal_documentation: legalDocumentType || '',
        positive_legal_opinion: positiveLegalOpinion || false,
        financial_statements_received: financialStatementsReceived || false,
        interim_statements_available: interimStatementsAvailable || false,
        country_risk_limit_available: countryRiskLimitAvailable === 'yes',
        account_executive: accountExecutive || '',
        relationship_manager: relationshipManager || '',
        senior_business_sponsor: selectedBusinessSponsor || '',
        second_business_sponsor: selectedSecondBusinessSponsor || '',
        high_priority_justification: justificationForHighPriority || '',
      };
      
      // Add form_data to payload
      payload.form_data = formData;
      
      // If workflowInstance exists, PATCH; else POST
      const { post, patch } = await import('../services/api');
      if (editMode && id) {
        await patch(`/credit/credit-applications/${id}/`, payload);
      } else {
        await post('/credit/credit-applications/', payload);
      }
      
      // Show success message
      alert('Credit request saved successfully');
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
        const { get } = await import('../services/api');
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
        const { get } = await import('../services/api');
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
        const { get } = await import('../services/api');
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
        const { get } = await import('../services/api');
        const response = await get(`/credit/credit-applications/${id}/`);
        const data = response.data;
        
        // Populate form fields with fetched data
        setRequestTitle(data.title || '');
        setSelectedCounterparty(data.counterparty?.id || data.counterparty || '');
        setCounterpartyCIF(data.counterparty?.cif_number || '');
        
        // Correctly map limit request fields
        setLimits(
          (data.limit_requests || []).map(lr => ({
            id: lr.id,
            type: lr.limit_type?.id || lr.limit_type_id || '',
            existingAmount: lr.existing_amount || '',
            existingTenor: lr.existing_tenor || '',
            proposedAmount: lr.proposed_amount || '',
            proposedTenor: lr.proposed_tenor || '',
            comments: lr.comments || ''
          }))
        );
        
        // Set priority and required by date
        setPriority(data.priority || 'Medium');
        setRequiredByDate(data.required_by_date || '');
        
        // Set form_data fields if available
        if (data.form_data) {
          // Guarantor information
          if (data.form_data.guarantor_name) {
            const guarantor = counterparties.find(c => c.name === data.form_data.guarantor_name);
            if (guarantor) {
              setSelectedGuarantor(guarantor.id);
              setGuarantorCIF(data.form_data.guarantor_cif || '');
            }
          }
          
          // Relationship information
          setRevenueLast12Months(data.form_data.revenue_last_12m || '');
          setRevenueProjected12Months(data.form_data.revenue_projected_12m || '');
          setProjectedRorwa(data.form_data.projected_rorwa_percent || '');
          setMostSeniorContact(data.form_data.most_senior_contact || '');
          setLastClientVisitDate(data.form_data.last_client_visit_date || '');
          setRelationshipComments(data.form_data.relationship_comments || '');
          
          // Legal & Financial Documentation
          setLegalDocumentType(data.form_data.legal_documentation || '');
          setPositiveLegalOpinion(data.form_data.positive_legal_opinion || '');
          setFinancialStatementsReceived(data.form_data.financial_statements_received || false);
          setInterimStatementsAvailable(data.form_data.interim_statements_available || false);
          
          // Country Risk Limit availability
          setCountryRiskLimitAvailable(data.form_data.country_risk_limit_available ? 'yes' : 'no');
          setDetailedCommentsOnLimits(data.description || '');
          
          // Prioritisation & Business Sponsorship
          setAccountExecutive(data.form_data.account_executive || '');
          setRelationshipManager(data.form_data.relationship_manager || '');
          setSelectedBusinessSponsor(data.form_data.senior_business_sponsor || '');
          setSelectedSecondBusinessSponsor(data.form_data.second_business_sponsor || '');
          setJustificationForHighPriority(data.form_data.high_priority_justification || '');
        }
      } catch (err) {
        // Handle error
        console.error("Error fetching credit request:", err);
      }
    }
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
