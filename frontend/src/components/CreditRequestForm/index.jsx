import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsersByRole, fetchCreditRequest, performWorkflowTransition, fetchCounterpartyList, fetchLimitTypes, submitCreditRequest, updateCreditRequest } from '../../services/api'; // Combined imports

import FormPageWrapper from '../common/FormPageWrapper'; // Import the new wrapper
import FormWizardNav from './FormWizardNav';
import FormSection from './FormSection';
// WorkflowStatus and WorkflowActions are now part of FormPageWrapper, direct import might not be needed here unless used elsewhere
import FormField from '../common/FormField';
import CounterpartySection from './CounterpartySection';
import LimitsSection from './LimitsSection';
import RelationshipSection from './RelationshipSection';
import LegalSection from './LegalSection';
import PrioritisationSection from './PrioritisationSection';
import DocumentsSection from './DocumentsSection';

import LogoutButton from '../LogoutButton'; // Keep for footer if needed, or handle globally

const sections = [
  { id: 'counterparty-info', title: 'Counterparty' },
  { id: 'limits-info', title: 'Limits' },
  { id: 'relationship-info', title: 'Relationship' },
  { id: 'legal-docs', title: 'Legal & Docs' },
  { id: 'prioritisation', title: 'Prioritisation' },
  { id: 'documents', title: 'Documents' },
];

// Replacement Content for CreditRequestForm component
const CreditRequestForm = ({ creditApplication: initialCreditApplication, mainWorkflowStep = 1, editMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Workflow state logic
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);

  // Basic form fields
  const [dateFormStarted, setDateFormStarted] = useState(() => new Date().toISOString().slice(0, 16));
  const [dateFormCompleted, setDateFormCompleted] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNumber, setRequestNumber] = useState('');

  // Dynamic form title, depends on requestNumber being populated
  const formTitle = id ? `Edit Credit Application ${requestNumber || ''}`.trim() : 'New Credit Application';

  // Counterparty information
  const [counterparties, setCounterparties] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [counterpartyCIF, setCounterpartyCIF] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [selectedGuarantor, setSelectedGuarantor] = useState('');
  const [guarantorCIF, setGuarantorCIF] = useState('');
  const [selectedGuarantorName, setSelectedGuarantorName] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [loadingCounterparties, setLoadingCounterparties] = useState(true);
  const [counterpartyError, setCounterpartyError] = useState(null);

  // Limits information
  const [limits, setLimits] = useState([
    { id: 1, type: '', existingAmount: '', existingTenor: '', proposedAmount: '', proposedTenor: '', comments: '' }
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
  const [financialStatementsReceived, setFinancialStatementsReceived] = useState('');
  const [interimStatementsAvailable, setInterimStatementsAvailable] = useState('');

  // Prioritisation & Business Sponsorship
  const [priority, setPriority] = useState('Medium');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [accountExecutive, setAccountExecutive] = useState('');
  const [relationshipManager, setRelationshipManager] = useState('');
  const [relationshipManagersList, setRelationshipManagersList] = useState([]);
  const [loadingRelationshipManagers, setLoadingRelationshipManagers] = useState(true);
  const [relationshipManagerError, setRelationshipManagerError] = useState(null);
  const [businessSponsors, setBusinessSponsors] = useState([]);
  const [loadingBusinessSponsors, setLoadingBusinessSponsors] = useState(true);
  const [businessSponsorError, setBusinessSponsorError] = useState(null);
  const [selectedBusinessSponsor, setSelectedBusinessSponsor] = useState('');
  const [selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor] = useState('');
  const [justificationForHighPriority, setJustificationForHighPriority] = useState('');

  // Document Uploads
  const [documents, setDocuments] = useState([]);

  // Wizard Navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // Create refs at the top level
  const section0Ref = useRef(null);
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  const section5Ref = useRef(null);
  
  // Combine refs into an array for easier access
  const sectionRefs = [section0Ref, section1Ref, section2Ref, section3Ref, section4Ref, section5Ref];

  const handleNavClick = (sectionId, index) => {
    setCurrentSectionIndex(index);
    sectionRefs[index].current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Define colors for reuse
  const colors = {
    primary: '#007bff', neutral100: '#f8f9fa', neutral200: '#e9ecef', neutral300: '#dee2e6',
    neutral400: '#ced4da', neutral500: '#adb5bd', neutral600: '#6c757d', neutral700: '#495057',
    neutral800: '#343a40', neutral900: '#212529',
  };

  const buildPayload = () => {
    // Convert boolean-like strings to actual booleans
    const booleanize = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    };

    // Format date fields properly
    const formatDate = (dateString) => {
      return dateString ? dateString : null;
    };

    // Create payload with direct fields for CreditApplication
    const payload = {
      title: requestTitle || 'New Credit Application',
      counterparty: selectedCounterparty || null,
      priority: priority || 'Medium',
      required_by_date: formatDate(requiredByDate),
      
      // Add credit_request_form object with direct fields matching the model
      credit_request_form: {
        form_started_at: formatDate(dateFormStarted),
        form_completed_at: formatDate(dateFormCompleted),
        counterparty_cif: counterpartyCIF || null,
        guarantor_name: selectedGuarantorName || null,
        guarantor_cif: guarantorCIF || null,
        revenue_last_12m: revenueLast12Months || null,
        revenue_projected_12m: revenueProjected12Months || null,
        projected_rorwa_percent: projectedRorwa || null,
        country_risk_limit_available: booleanize(countryRiskLimitAvailable),
        relationship_comments: relationshipComments || '',
        most_senior_contact: mostSeniorContact || '',
        last_client_visit_date: formatDate(lastClientVisitDate),
        legal_documentation: legalDocumentType || '',
        positive_legal_opinion: booleanize(positiveLegalOpinion),
        financial_statements_received: booleanize(financialStatementsReceived),
        interim_statements_available: booleanize(interimStatementsAvailable),
        account_executive: accountExecutive || '',
        senior_business_sponsor_id: selectedBusinessSponsor || null,
        second_business_sponsor_id: selectedSecondBusinessSponsor || null,
        high_priority_justification: justificationForHighPriority || '',
        // Add relationship_manager_id to be used by the backend
        relationship_manager_id: relationshipManager || null,
        detailed_limit_comments: detailedCommentsOnLimits || ''
      },
      
      // Limit requests remain the same
      limit_requests: limits
        .filter(l => l.type && (l.proposedAmount || l.existingAmount))
        .map(l => ({
          limit_type_id: l.type.id,
          existing_amount: l.existingAmount || null,
          existing_tenor: l.existingTenor || null,
          proposed_amount: l.proposedAmount || null,
          proposed_tenor: l.proposedTenor || null,
          comments: l.comments || '',
        })),
    };

    return payload;
  };

  const handleSaveDraft = async () => {
    setTransitionLoading(true);
    setTransitionError(null);
    const payload = buildPayload();
    try {
      // First save the form data
      const savedApplication = id ? await updateCreditRequest(id, payload) : await submitCreditRequest(payload);
      console.log('Draft saved successfully', savedApplication);
      
      // Then trigger the workflow transition if we have a workflow instance
      // This follows the pattern used in other forms (BusinessSponsorshipForm, LegalReviewForm, etc.)
      if (savedApplication.credit_request_form && savedApplication.credit_request_form.workflow_instance) {
        const workflowInstanceId = savedApplication.credit_request_form.workflow_instance.id;
        
        // Find the "Save as Draft" transition dynamically from allowed transitions
        const draftTransition = savedApplication.available_transitions?.find(t => 
          t.name.toLowerCase().includes('draft') || 
          t.description?.toLowerCase().includes('draft')
        );
        
        if (draftTransition) {
          console.log(`Triggering ${draftTransition.code} (Save as Draft) transition on workflow instance:`, workflowInstanceId);
          
          try {
            await performWorkflowTransition(
              workflowInstanceId,
              draftTransition.code,
              'Saved as draft by user'
            );
            console.log(`Workflow transition ${draftTransition.code} completed successfully`);
          } catch (transitionError) {
            console.warn('Non-critical error during workflow transition:', transitionError);
            // We don't want to fail the entire save operation if just the transition fails
            // The data is already saved at this point
          }
        } else {
          console.warn('No draft transition found in available transitions:', savedApplication.available_transitions);
        }
      } else {
        console.warn('No workflow instance available for CreditRequestForm, skipping transition');
      }
      
      navigate('/');
    } catch (error) {
      let detailedError = 'An unexpected error occurred while saving.';
      if (error.response) {
        console.error('Backend error response data:', error.response.data);
        console.error('Backend error response status:', error.response.status);
        console.error('Backend error response headers:', error.response.headers);
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: (Status: ${error.response.status}) - No additional data.`;
        }
      } else if (error.request) {
        console.error('Error saving draft: No response received:', error.request);
        detailedError = 'Error saving draft: No response received from server.';
      } else {
        console.error('Error saving draft:', error.message);
        detailedError = `Error: ${error.message}`;
      }
      setTransitionError(detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transitionCode, comments) => {
    if (!id) {
      setTransitionError('Cannot perform transitions on an unsaved application.');
      return;
    }
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      const result = await performWorkflowTransition(workflowInstanceId, transitionCode, comments);
      console.log('Transition successful', result);
      setRefetchTrigger(prev => prev + 1); // Trigger re-fetch
    } catch (error) {
      let detailedError = 'An unexpected error occurred during transition.';
      if (error.response) {
        console.error('Backend error response data:', error.response.data);
        console.error('Backend error response status:', error.response.status);
        console.error('Backend error response headers:', error.response.headers);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sponsors, managers, counterpartiesData, limitsData] = await Promise.all([
          fetchUsersByRole('business_sponsor'),
          fetchUsersByRole('relationship_manager'),
          fetchCounterpartyList(),
          fetchLimitTypes(),
        ]);
        setBusinessSponsors(sponsors);
        setRelationshipManagersList(managers);
        setCounterparties(counterpartiesData);
        setLimitTypes(limitsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setBusinessSponsorError('Failed to load sponsors.');
        setRelationshipManagerError('Failed to load managers.');
        setCounterpartyError('Failed to load counterparties.');
        setLimitTypesError('Failed to load limit types.');
      } finally {
        setLoading(false);
        setLoadingBusinessSponsors(false);
        setLoadingRelationshipManagers(false);
        setLoadingCounterparties(false);
        setLoadingLimitTypes(false);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    const fetchAppData = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await fetchCreditRequest(id);
          // Main fields
          setRequestTitle(data.title || '');
          setRequestNumber(data.reference_number || '');
          setPriority(data.priority || 'Medium');
          setSelectedCounterparty(data.counterparty || '');
          setWorkflowInstanceId(data.workflow_instance?.id || null);
          setRequiredByDate(data.required_by_date || '');

          // State and transitions from workflow instance
          if (data.workflow_instance) {
            setCurrentState(data.workflow_state_name || 'Draft');
            setAllowedTransitions(data.available_transitions || []);
          }

          // Credit Request Form fields - now direct from credit_request_form object
          const crf = data.credit_request_form || {};
          console.log('Credit Request Form data:', crf);
          
          setDateFormStarted(crf.form_started_at || new Date().toISOString().slice(0, 16));
          setDateFormCompleted(crf.form_completed_at || '');
          
          // Counterparty fields - including denormalized display fields
          setCounterpartyCIF(crf.counterparty_cif || '');
          setCounterpartyName(crf.counterparty_name || ''); // Set denormalized counterparty name
          setGuarantorName(crf.guarantor_name || ''); // Set denormalized guarantor name
          setSelectedGuarantorName(crf.guarantor_name || '');
          setGuarantorCIF(crf.guarantor_cif || '');
          
          // Convert booleans to strings for form controls
          // For select dropdowns, we need 'yes'/'no' strings
          setCountryRiskLimitAvailable(crf.country_risk_limit_available === true ? 'yes' : 
                                      crf.country_risk_limit_available === false ? 'no' : '');
          
          // For positive legal opinion, convert boolean to 'Yes'/'No' string
          setPositiveLegalOpinion(crf.positive_legal_opinion === true ? 'Yes' : 
                                 crf.positive_legal_opinion === false ? 'No' : '');
          
          // For checkboxes, we need actual boolean values
          setFinancialStatementsReceived(!!crf.financial_statements_received);
          setInterimStatementsAvailable(!!crf.interim_statements_available);
          
          // Financial fields
          setRevenueLast12Months(crf.revenue_last_12m || '');
          setRevenueProjected12Months(crf.revenue_projected_12m || '');
          setProjectedRorwa(crf.projected_rorwa_percent || '');
          
          // Relationship fields
          setMostSeniorContact(crf.most_senior_contact || '');
          setLastClientVisitDate(crf.last_client_visit_date || '');
          setRelationshipComments(crf.relationship_comments || '');
          
          // Legal fields
          setLegalDocumentType(crf.legal_documentation || '');
          
          // Business sponsorship fields
          setAccountExecutive(crf.account_executive || '');
          setSelectedBusinessSponsor(crf.senior_business_sponsor_id || '');
          setSelectedSecondBusinessSponsor(crf.second_business_sponsor_id || '');
          setJustificationForHighPriority(crf.high_priority_justification || '');
          
          // Detailed comments - use the denormalized field from credit_request_form
          setDetailedCommentsOnLimits(crf.detailed_limit_comments || '');
          
          // Set relationship manager from the denormalized field or from the ID
          setRelationshipManager(data.relationship_manager || crf.relationship_manager_id || '');

          // Limits
          if (data.limit_requests && data.limit_requests.length > 0) {
            setLimits(data.limit_requests.map((l, index) => ({
              id: l.id || index + 1,
              type: limitTypes.find(lt => lt.id === l.limit_type?.id) || '',
              existingAmount: l.existing_amount || '',
              existingTenor: l.existing_tenor || '',
              proposedAmount: l.proposed_amount || '',
              proposedTenor: l.proposed_tenor || '',
              comments: l.comments || '',
            })));
          } else {
            setLimits([{ id: 1, type: '', existingAmount: '', existingTenor: '', proposedAmount: '', proposedTenor: '', comments: '' }]);
          }
          
          // Documents
          if (data.documents) {
            setDocuments(data.documents);
          }

        } catch (error) {
          console.error(`Failed to fetch credit application ${id}:`, error);
          setTransitionError(`Failed to load application data. Please try again.`);
        } finally {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchAppData();
    }
  }, [id, refetchTrigger, limitTypes]); // Re-run if limitTypes are loaded after initial render

  // Reset transition error on ID change
  useEffect(() => {
    setTransitionError(null);
  }, [id]);

  const addLimit = () => setLimits([...limits, { id: limits.length + 1, type: '', existingAmount: '', existingTenor: '', proposedAmount: '', proposedTenor: '', comments: '' }]);
  const removeLimit = (limitId) => setLimits(limits.filter(l => l.id !== limitId));

  if (loading && !id) setLoading(false); // Ensure form is not stuck in loading on 'new'

  return (
    <FormPageWrapper
      title={formTitle}
      workflowStatus={currentState}
      allowedTransitions={id ? allowedTransitions : []} // No transitions on new form
      onTransition={handleTransition}
      isLoading={transitionLoading}
      error={transitionError}
      workflowInstanceId={workflowInstanceId}
    >
            <div style={{ flex: 1, padding: '2rem', backgroundColor: colors.neutral100, overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <FormWizardNav
            sections={sections}
            onNavClick={handleNavClick}
            currentSectionIndex={currentSectionIndex}
            colors={colors}
          />
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Request Title</label>
              <input
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="Enter a title for this credit request"
                required
                disabled={!editMode}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Request Number</label>
              <input
                type="text"
                value={requestNumber}
                disabled
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e9ecef' }}
              />
            </div>
          </div>

          <div ref={sectionRefs[0]}></div>
          <FormSection title="Counterparty Information" description="Details about the main counterparty and any guarantors." colors={colors}>
            <CounterpartySection {...{counterparties, selectedCounterparty, setSelectedCounterparty, counterpartyCIF, setCounterpartyCIF, selectedGuarantor, setSelectedGuarantor, selectedGuarantorName, setSelectedGuarantorName, guarantorCIF, setGuarantorCIF, counterpartyName, guarantorName, loadingCounterparties, counterpartyError, colors, disabled: !editMode}} />
          </FormSection>

          <div ref={sectionRefs[1]}></div>
          <FormSection title="Limits Information" description="Details about existing and proposed limits." colors={colors}>
            <LimitsSection {...{limits, setLimits, limitTypes, loadingLimitTypes, limitTypesError, addLimit, removeLimit, countryRiskLimitAvailable, setCountryRiskLimitAvailable, detailedCommentsOnLimits, setDetailedCommentsOnLimits, colors, disabled: !editMode}} />
          </FormSection>

          <div ref={sectionRefs[2]}></div>
          <FormSection title="Relationship Information" description="Information about the client relationship." colors={colors}>
            <RelationshipSection {...{revenueLast12Months, setRevenueLast12Months, revenueProjected12Months, setRevenueProjected12Months, projectedRorwa, setProjectedRorwa, mostSeniorContact, setMostSeniorContact, lastClientVisitDate, setLastClientVisitDate, relationshipComments, setRelationshipComments, colors, disabled: !editMode}} />
          </FormSection>

          <div ref={sectionRefs[3]}></div>
          <FormSection title="Legal & Financial Documentation" description="Information about the legal and financial documentation." colors={colors}>
            <LegalSection {...{legalDocumentType, setLegalDocumentType, positiveLegalOpinion, setPositiveLegalOpinion, financialStatementsReceived, setFinancialStatementsReceived, interimStatementsAvailable, setInterimStatementsAvailable, colors, disabled: !editMode}} />
          </FormSection>
          
          <div ref={sectionRefs[4]}></div>
          <FormSection title="Prioritisation & Business Sponsorship" description="Information about the prioritisation and business sponsorship." colors={colors}>
            <PrioritisationSection {...{priority, setPriority, requiredByDate, setRequiredByDate, accountExecutive, setAccountExecutive, relationshipManager, setRelationshipManager, relationshipManagersList, loadingRelationshipManagers, relationshipManagerError, businessSponsors, loadingBusinessSponsors, businessSponsorError, selectedBusinessSponsor, setSelectedBusinessSponsor, selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor, justificationForHighPriority, setJustificationForHighPriority, colors, disabled: !editMode}} />
          </FormSection>
          
          <div ref={sectionRefs[5]}></div> 
          <FormSection title="Document Uploads" description="Upload supporting documents." colors={colors}>
            <DocumentsSection {...{colors, documents, setDocuments, disabled: !editMode, creditApplicationId: id}} />
          </FormSection>

          {/* Manual Save Button Area */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveDraft}
              disabled={transitionLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.neutral600,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: transitionLoading ? 'not-allowed' : 'pointer',
                opacity: transitionLoading ? 0.6 : 1,
              }}
            >
              {transitionLoading ? 'Saving...' : 'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </FormPageWrapper>
  );
};

export default CreditRequestForm;