import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditRequest, fetchUsersByRole, performWorkflowTransition, fetchCounterpartyList, fetchLimitTypes, saveCreditRequestForm, submitCreditRequest, updateCreditRequest } from '../../services/api'; // Combined imports

import FormPageWrapper from '../common/FormPageWrapper'; // Import the new wrapper
import FormSection from '../common/FormSection';
// WorkflowStatus and WorkflowActions are now part of FormPageWrapper, direct import might not be needed here unless used elsewhere
import FormField from '../common/FormField';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import CounterpartySection from './CounterpartySection';
import LimitsSection from './LimitsSection';
import RelationshipSection from './RelationshipSection';
import LegalSection from './LegalSection';
import PrioritisationSection from './PrioritisationSection';
import DocumentsSection from './DocumentsSection';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

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
  const theme = useTheme();

  // Workflow state logic
  const [currentState, setCurrentState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [isNewForm, setIsNewForm] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] = useState(!!id);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);

  // Basic form fields
  const [dateFormStarted, setDateFormStarted] = useState(() => new Date().toISOString().slice(0, 16));
  const [dateFormCompleted, setDateFormCompleted] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNumber, setRequestNumber] = useState('');

  // Dynamic form title, depends on requestNumber being populated
  const formTitle = id ? `Credit Application ${requestNumber || ''}`.trim() : 'New Credit Application';

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
  const [kycApprovalStatus, setKycApprovalStatus] = useState('');
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

  // Tab Navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const {
    detail: creditRequestForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'credit_request_form',
    { refreshKey: refetchTrigger }
  );

  const handleNavClick = (sectionId, index) => {
    setCurrentSectionIndex(index);
  };


  const booleanize = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'yes') return true;
      if (value.toLowerCase() === 'no') return false;
    }
    return null;
  };

  const formatDateTime = (date) => {
    return date ? new Date(date).toISOString() : null;
  };

  const formatDateOnly = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const buildLimitRequestsPayload = () => (
    limits
      .map(limit => {
        const limitTypeId = typeof limit.type === 'object' && limit.type?.id
          ? limit.type.id
          : (typeof limit.type === 'string' && limit.type.length > 0)
            ? limit.type
            : limit.limit_type_id || null;

        return {
          limit_type_id: limitTypeId,
          existing_amount: limit.existingAmount || null,
          existing_tenor: limit.existingTenor || null,
          proposed_amount: limit.proposedAmount || null,
          proposed_tenor: limit.proposedTenor || null,
          comments: limit.comments || null,
        };
      })
      .filter(limit => limit.limit_type_id)
  );

  const buildParentPayload = () => ({
    title: requestTitle,
    counterparty_id: selectedCounterparty,
    priority,
    required_by_date: formatDateOnly(requiredByDate),
    relationship_manager: relationshipManager,
    description: detailedCommentsOnLimits,
    limit_requests: buildLimitRequestsPayload(),
  });

  const buildArtifactPayload = () => ({
    form_started_at: formatDateTime(dateFormStarted),
    form_completed_at: formatDateTime(dateFormCompleted),
    counterparty_cif: counterpartyCIF,
    counterparty_name: counterpartyName,
    guarantor_cif: guarantorCIF,
    guarantor_name: selectedGuarantorName || guarantorName,
    country_risk_limit_available: booleanize(countryRiskLimitAvailable),
    kyc_approval_status: booleanize(kycApprovalStatus),
    revenue_last_12m: revenueLast12Months,
    revenue_projected_12m: revenueProjected12Months,
    projected_rorwa_percent: projectedRorwa,
    most_senior_contact: mostSeniorContact,
    last_client_visit_date: formatDateOnly(lastClientVisitDate),
    relationship_comments: relationshipComments,
    legal_documentation: legalDocumentType,
    positive_legal_opinion: booleanize(positiveLegalOpinion),
    financial_statements_received: booleanize(financialStatementsReceived),
    interim_statements_available: booleanize(interimStatementsAvailable),
    account_executive: accountExecutive,
    senior_business_sponsor_id: selectedBusinessSponsor || null,
    second_business_sponsor_id: selectedSecondBusinessSponsor || null,
    high_priority_justification: justificationForHighPriority,
  });

  const buildCreatePayload = () => {
    const parentPayload = buildParentPayload();
    const artifactPayload = buildArtifactPayload();

    return {
      ...parentPayload,
      credit_request_form_form_started_at: artifactPayload.form_started_at,
      credit_request_form_form_completed_at: artifactPayload.form_completed_at,
      credit_request_form_counterparty_cif: artifactPayload.counterparty_cif,
      credit_request_form_counterparty_name: artifactPayload.counterparty_name,
      credit_request_form_guarantor_cif: artifactPayload.guarantor_cif,
      credit_request_form_guarantor_name: artifactPayload.guarantor_name,
      credit_request_form_country_risk_limit_available: artifactPayload.country_risk_limit_available,
      credit_request_form_kyc_approval_status: artifactPayload.kyc_approval_status,
      credit_request_form_revenue_last_12m: artifactPayload.revenue_last_12m,
      credit_request_form_revenue_projected_12m: artifactPayload.revenue_projected_12m,
      credit_request_form_projected_rorwa_percent: artifactPayload.projected_rorwa_percent,
      credit_request_form_most_senior_contact: artifactPayload.most_senior_contact,
      credit_request_form_last_client_visit_date: artifactPayload.last_client_visit_date,
      credit_request_form_relationship_comments: artifactPayload.relationship_comments,
      credit_request_form_legal_documentation: artifactPayload.legal_documentation,
      credit_request_form_positive_legal_opinion: artifactPayload.positive_legal_opinion,
      credit_request_form_financial_statements_received: artifactPayload.financial_statements_received,
      credit_request_form_interim_statements_available: artifactPayload.interim_statements_available,
      credit_request_form_account_executive: artifactPayload.account_executive,
      credit_request_form_senior_business_sponsor_id: artifactPayload.senior_business_sponsor_id,
      credit_request_form_second_business_sponsor_id: artifactPayload.second_business_sponsor_id,
      credit_request_form_high_priority_justification: artifactPayload.high_priority_justification,
    };
  };

  const handleSave = async () => {
    try {
      setTransitionLoading(true);
      setTransitionError(null); // Clear any previous errors
      
      // Validate required fields
      if (!selectedCounterparty) {
        setTransitionError('Please select a counterparty');
        setTransitionLoading(false); // Stop loading
        return;
      }
      
      if (id) {
        await updateCreditRequest(id, buildParentPayload());
        await saveCreditRequestForm(id, buildArtifactPayload());
        navigate('/');
      } else {
        await submitCreditRequest(buildCreatePayload());
        navigate('/');
      }
    } catch (error) {
      // Handle validation errors from the API
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Format validation errors for display
          const errorMessages = [];
          Object.keys(errorData).forEach(key => {
            const fieldErrors = errorData[key];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(`${key}: ${fieldErrors.join(', ')}`);
            } else if (typeof fieldErrors === 'object') {
              // Handle nested errors
              Object.keys(fieldErrors).forEach(nestedKey => {
                const nestedErrors = fieldErrors[nestedKey];
                errorMessages.push(`${key}.${nestedKey}: ${Array.isArray(nestedErrors) ? nestedErrors.join(', ') : nestedErrors}`);
              });
            } else {
              errorMessages.push(`${key}: ${fieldErrors}`);
            }
          });
          setTransitionError(errorMessages.join('\n'));
        } else {
          setTransitionError(errorData.detail || JSON.stringify(errorData));
        }
      } else {
        setTransitionError(error.message || 'Failed to save form');
      }
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (transition, comments) => {
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    try {
      if (id) {
        await updateCreditRequest(id, buildParentPayload());
        await saveCreditRequestForm(id, buildArtifactPayload());
      } else {
        await submitCreditRequest(buildCreatePayload());
      }
      
      // Then perform transition
      await performWorkflowTransition(workflowInstanceId, { transition_code: transition.code, comments });
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'CR_TR_1' || transition.name.toLowerCase().includes('save')) {
        // For Save as Draft transitions, navigate back to the hub
        navigate(`/credit-requests/${id}/details`);
      } else {
        // Refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
    } catch (error) {
      let detailedError = 'An unexpected error occurred during transition.';
      if (error.response) {
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: (Status: ${error.response.status}) - No additional data.`;
        }
      } else if (error.request) {
        detailedError = 'Transition error: No response received from server.';
      } else {
        detailedError = `Error: ${error.message}`;
      }
      setTransitionError(detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLookupLoading(true);
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
        setBusinessSponsorError('Failed to load sponsors.');
        setRelationshipManagerError('Failed to load managers.');
        setCounterpartyError('Failed to load counterparties.');
        setLimitTypesError('Failed to load limit types.');
      } finally {
        setLookupLoading(false);
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
        setApplicationLoading(true);
        try {
          const data = await fetchCreditRequest(id);
          setCreditApplication(data);
          // Main fields
          setRequestTitle(data.title || '');
          setRequestNumber(data.reference_number || '');
          setPriority(data.priority || 'Medium');
          // Handle counterparty - it might be an object or just an ID
          if (data.counterparty) {
            if (typeof data.counterparty === 'object' && data.counterparty.id) {
              setSelectedCounterparty(data.counterparty.id);
            } else {
              setSelectedCounterparty(data.counterparty);
            }
          } else {
            setSelectedCounterparty('');
          }
          setRequiredByDate(data.required_by_date || '');
          
          // Set relationship manager from the main application data
          // relationship_manager can be either an ID or an object
          if (data.relationship_manager) {
            if (typeof data.relationship_manager === 'object' && data.relationship_manager.id) {
              setRelationshipManager(data.relationship_manager.id);
            } else {
              setRelationshipManager(data.relationship_manager);
            }
          }

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
          setTransitionError(`Failed to load application data. Please try again.`);
        } finally {
          setApplicationLoading(false);
        }
      }
    };

    if (id) {
      fetchAppData();
    }
  }, [id, refetchTrigger, limitTypes, counterparties]); // Re-run if lookup data is loaded after initial render

  useEffect(() => {
    if (!id) {
      return;
    }

    if (artifactError) {
      setTransitionError('Failed to load credit request form data. Please try again.');
      return;
    }

    const crf = creditRequestForm || {};

    if (crf.workflow_instance) {
      setWorkflowInstanceId(crf.workflow_instance.id);
      setCurrentState(crf.workflow_instance.current_state || 'Draft');
    } else {
      setWorkflowInstanceId(null);
      setCurrentState('');
    }

    setAllowedTransitions(crf.available_transitions || []);
    setDateFormStarted(crf.form_started_at || new Date().toISOString().slice(0, 16));
    setDateFormCompleted(crf.form_completed_at || '');
    setCounterpartyCIF(crf.counterparty_cif || '');
    setCounterpartyName(crf.counterparty_name || '');
    setGuarantorName(crf.guarantor_name || '');
    setSelectedGuarantorName(crf.guarantor_name || '');
    setGuarantorCIF(crf.guarantor_cif || '');

    if (crf.guarantor_name && counterparties.length > 0) {
      const guarantor = counterparties.find((cp) => cp.name === crf.guarantor_name);
      if (guarantor) {
        setSelectedGuarantor(guarantor.id);
      }
    }

    setCountryRiskLimitAvailable(
      crf.country_risk_limit_available === true ? 'yes' :
      crf.country_risk_limit_available === false ? 'no' : ''
    );
    setKycApprovalStatus(
      crf.kyc_approval_status === true ? 'yes' :
      crf.kyc_approval_status === false ? 'no' : ''
    );
    setPositiveLegalOpinion(
      crf.positive_legal_opinion === true ? 'Yes' :
      crf.positive_legal_opinion === false ? 'No' : ''
    );
    setFinancialStatementsReceived(!!crf.financial_statements_received);
    setInterimStatementsAvailable(!!crf.interim_statements_available);
    setRevenueLast12Months(crf.revenue_last_12m || '');
    setRevenueProjected12Months(crf.revenue_projected_12m || '');
    setProjectedRorwa(crf.projected_rorwa_percent || '');
    setMostSeniorContact(crf.most_senior_contact || '');
    setLastClientVisitDate(crf.last_client_visit_date || '');
    setRelationshipComments(crf.relationship_comments || '');
    setLegalDocumentType(crf.legal_documentation || '');
    setAccountExecutive(crf.account_executive || '');
    setSelectedBusinessSponsor(crf.senior_business_sponsor_id || '');
    setSelectedSecondBusinessSponsor(crf.second_business_sponsor_id || '');
    setJustificationForHighPriority(crf.high_priority_justification || '');
    setDetailedCommentsOnLimits(crf.detailed_limit_comments || '');
  }, [artifactError, counterparties, creditRequestForm, id]);

  // Reset transition error and set isNewForm flag on ID change
  useEffect(() => {
    setTransitionError(null);
    setIsNewForm(!id);
  }, [id]);

  const addLimit = () => setLimits([...limits, { id: limits.length + 1, type: '', existingAmount: '', existingTenor: '', proposedAmount: '', proposedTenor: '', comments: '' }]);
  const removeLimit = (limitId) => setLimits(limits.filter(l => l.id !== limitId));

  const loading = lookupLoading || applicationLoading || (id ? artifactLoading : false);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <FormPageWrapper
      title={formTitle}
      workflowStatusProps={{
        currentStep: mainWorkflowStep,
        workflowType: "CREDIT_REQUEST",
        currentWorkflowState: { name: currentState },
      }}
      workflowActionsProps={{
        key: id || 'new_form_workflow_actions',
        allowedTransitions,
        handleTransition,
        transitionLoading,
        transitionError,
        isNewForm,
        handleSubmit: handleSave, // Pass handleSave for new forms
      }}
    >
      <div style={{ flex: 1, padding: '0', backgroundColor: theme.palette.background.default, overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem', minHeight: '100vh' }}>
          {/* Credit Application Details */}
          <CreditApplicationDetailsSection
            requestNumber={requestNumber}
            requestTitle={requestTitle}
            counterpartyName={counterpartyName}
            priority={priority}
            requiredByDate={requiredByDate}
          />
          
          <Tabs
            value={currentSectionIndex}
            onChange={(event, newValue) => handleNavClick(sections[newValue].id, newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.palette.grey[200]}`,
              marginBottom: '1.5rem',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.grey[500],
                padding: '16px',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '&:hover': {
                  color: theme.palette.grey[600],
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 2,
              },
            }}
          >
            {sections.map((section, index) => (
              <Tab key={section.id} label={section.title} />
            ))}
          </Tabs>

          {/* Application Header Fields */}
          <div style={{ display: 'flex', gap: theme.spacing(6), marginTop: theme.spacing(4), marginBottom: theme.spacing(8) }}>
            <div style={{ flex: 1 }}>
              <FormField
                label="Request Title"
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="Enter a title for this credit request"
                required
                disabled={!editMode}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FormField
                label="Request Number"
                type="text"
                value={requestNumber}
                disabled
                helperText="Auto-generated after saving"
              />
            </div>
          </div>

          {/* Tab Content */}
          {currentSectionIndex === 0 && (
            <div>
              <FormSection title="Counterparty Information" description="Details about the main counterparty and any guarantors.">
                <CounterpartySection {...{counterparties, selectedCounterparty, setSelectedCounterparty, counterpartyCIF, setCounterpartyCIF, selectedGuarantor, setSelectedGuarantor, selectedGuarantorName, setSelectedGuarantorName, guarantorCIF, setGuarantorCIF, counterpartyName, setCounterpartyName, guarantorName, loadingCounterparties, counterpartyError, disabled: !editMode}} />
              </FormSection>
            </div>
          )}

          {currentSectionIndex === 1 && (
            <div>
              <FormSection title="Limits Information" description="Details about existing and proposed limits.">
                <LimitsSection {...{limits, setLimits, limitTypes, loadingLimitTypes, limitTypesError, addLimit, removeLimit, countryRiskLimitAvailable, setCountryRiskLimitAvailable, kycApprovalStatus, setKycApprovalStatus, detailedCommentsOnLimits, setDetailedCommentsOnLimits, disabled: !editMode}} />
              </FormSection>
            </div>
          )}

          {currentSectionIndex === 2 && (
            <div>
              <FormSection title="Relationship Information" description="Information about the client relationship.">
                <RelationshipSection {...{revenueLast12Months, setRevenueLast12Months, revenueProjected12Months, setRevenueProjected12Months, projectedRorwa, setProjectedRorwa, mostSeniorContact, setMostSeniorContact, lastClientVisitDate, setLastClientVisitDate, relationshipComments, setRelationshipComments, disabled: !editMode}} />
              </FormSection>
            </div>
          )}

          {currentSectionIndex === 3 && (
            <div>
              <FormSection title="Legal & Financial Documentation" description="Information about the legal and financial documentation.">
                <LegalSection {...{legalDocumentType, setLegalDocumentType, positiveLegalOpinion, setPositiveLegalOpinion, financialStatementsReceived, setFinancialStatementsReceived, interimStatementsAvailable, setInterimStatementsAvailable, disabled: !editMode}} />
              </FormSection>
            </div>
          )}
          
          {currentSectionIndex === 4 && (
            <div>
              <FormSection title="Prioritisation & Business Sponsorship" description="Information about the prioritisation and business sponsorship.">
                <PrioritisationSection {...{priority, setPriority, requiredByDate, setRequiredByDate, accountExecutive, setAccountExecutive, relationshipManager, setRelationshipManager, relationshipManagersList, loadingRelationshipManagers, relationshipManagerError, businessSponsors, loadingBusinessSponsors, businessSponsorError, selectedBusinessSponsor, setSelectedBusinessSponsor, selectedSecondBusinessSponsor, setSelectedSecondBusinessSponsor, justificationForHighPriority, setJustificationForHighPriority, disabled: !editMode}} />
              </FormSection>
            </div>
          )}
          
          {currentSectionIndex === 5 && (
            <div>
              <FormSection title="Document Uploads" description="Upload supporting documents.">
                <DocumentsSection {...{documents, setDocuments, disabled: !editMode, creditApplicationId: id}} />
              </FormSection>
            </div>
          )}

          {/* Workflow Actions are now handled by FormPageWrapper */}
        </div>
      </div>
    </FormPageWrapper>
  );
};

export default CreditRequestForm;
