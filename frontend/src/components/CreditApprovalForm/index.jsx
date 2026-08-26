import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchCreditArtifact, fetchCreditRequest, performWorkflowTransition, saveCreditApprovalForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import useCreditArtifactResource from '../../hooks/useCreditArtifactResource';

const CreditApprovalForm = ({ creditApplication: initialCreditApplication, currentStep = 6 }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(initialCreditApplication || null);
  const user = useSelector(state => state.auth.user);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [hasDAAuthorization, setHasDAAuthorization] = useState(true);

  // Form state - Phase 3 pattern
  const [formData, setFormData] = useState({});

  // Form metadata
  const [formStartDate, setFormStartDate] = useState('');
  const {
    detail: creditApprovalForm,
    loading: artifactLoading,
    error: artifactError,
  } = useCreditArtifactResource(
    id,
    creditApplication,
    'credit_approval_form',
    { refreshKey: refetchTrigger }
  );

  // Tab management
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const tabOptions = [
    "Approval Decision",
    "Committee Details"
  ];


  const populateFormData = useCallback((approvalForm, reviewForm) => {
    // Check DA authorization before proceeding
    const requiredDALevel = reviewForm?.delegated_authority_level;
    const userDALevel = user?.da_level;
    const userRole = user?.role?.name;

    let hasAuthorization = true; // Default to true, will be set to false if authorization fails

    if (userRole === 'Credit Analyst' && requiredDALevel && userDALevel) {
      // Extract numeric levels for comparison
      const extractDANumber = (daLevel) => {
        if (!daLevel) return null;
        if (daLevel.startsWith('DA')) return parseInt(daLevel.substring(2));
        return parseInt(daLevel);
      };

      const userLevel = extractDANumber(userDALevel);
      const requiredLevel = extractDANumber(requiredDALevel);

      // Lower number = higher authority (DA1 > DA5 > DA8)
      // User should be denied access only if their level is HIGHER (worse) than required
      if (userLevel && requiredLevel && userLevel > requiredLevel) {
        setTransitionError(`Insufficient authorization. This application requires ${requiredDALevel} approval level, but you have ${userDALevel}. Please contact a user with ${requiredDALevel} or higher authority.`);
        hasAuthorization = false;
      }
    }

    // Set the authorization state
    setHasDAAuthorization(hasAuthorization);

    const initialFormData = {};

    // Populate Credit Approval Form specific data - Phase 3 pattern
    if (approvalForm) {
      const caForm = approvalForm;
      
      // Use Credit Approval Form sub-process workflow - SAME PATTERN as other Phase 3 forms
      if (caForm.workflow_instance) {
        setWorkflowInstanceId(caForm.workflow_instance.id);
        setCurrentWorkflowState(caForm.workflow_instance.current_state || 'Draft');
      }
      
      // Use available_transitions from Credit Approval Form serializer, but filter based on DA authorization
      const transitions = hasAuthorization ? (caForm.available_transitions || []) : [];
      setAllowedTransitions(transitions);

      // Populate directly from model fields (Phase 3 pattern - explicit database fields)
      // With DA-level authorization, approver is always the current user
      // Handle approver field with proper UUID validation
      const approverFromBackend = caForm.approver;
      let validApprover = user?.id || ''; // Default fallback to current user

      // If backend has data, validate it's a UUID
      if (approverFromBackend) {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof approverFromBackend === 'string' && uuidRegex.test(approverFromBackend)) {
          validApprover = approverFromBackend;
        } else {
          validApprover = user?.id || '';
        }
      }

      initialFormData.approver = validApprover;
      
      initialFormData.approval_decision = caForm.approval_decision || '';
      initialFormData.approval_date = caForm.approval_date ? caForm.approval_date.split('T')[0] : '';
      
      // Pre-populate delegated authority level from Credit Review Form if not already set
      let delegatedAuthorityLevel = caForm.delegated_authority_level;
      if (!delegatedAuthorityLevel && reviewForm?.delegated_authority_level) {
        let reviewDA = reviewForm.delegated_authority_level;
        
        // Handle both formats: '5' and 'DA5' 
        if (reviewDA && !reviewDA.startsWith('DA') && !isNaN(reviewDA)) {
          reviewDA = `DA${reviewDA}`; // Convert '5' to 'DA5'
        }
        
        delegatedAuthorityLevel = reviewDA;
      }
      initialFormData.delegated_authority_level = delegatedAuthorityLevel || '';
      
      initialFormData.approval_comments = caForm.approval_comments || '';
      initialFormData.risk_assessment_summary = caForm.risk_assessment_summary || '';
      initialFormData.rejection_reason = caForm.rejection_reason || '';
      initialFormData.committee_meeting_date = caForm.committee_meeting_date || '';
      initialFormData.committee_members_present = caForm.committee_members_present || '';

    } else {
      // If no form data exists, set defaults
      setFormStartDate(new Date().toISOString().split('T')[0]);
      // For new forms, set approver to current user
      initialFormData.approver = user?.id || '';
    }
    setFormData(initialFormData);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setApplicationLoading(false);
        return;
      }

      setApplicationLoading(true);
      try {
        const application = await fetchCreditRequest(id);
        setCreditApplication(application);
        setTransitionError(null);
      } catch (error) {
        setTransitionError('Failed to load credit application data.');
        setCreditApplication(null);
      } finally {
        setApplicationLoading(false);
      }
    };

    fetchData();
  }, [id, refetchTrigger]);

  useEffect(() => {
    let isActive = true;

    const loadSupportingArtifacts = async () => {
      if (artifactError) {
        setTransitionError('Failed to load credit approval form data.');
        return;
      }

      if (!creditApprovalForm) {
        populateFormData(null, null);
        return;
      }

      try {
        const creditReviewForm = await fetchCreditArtifact(id, 'credit_review_form');
        if (isActive) {
          populateFormData(creditApprovalForm, creditReviewForm);
        }
      } catch (error) {
        if (isActive) {
          setTransitionError('Failed to load supporting credit review form data.');
        }
      }
    };

    loadSupportingArtifacts();

    return () => {
      isActive = false;
    };
  }, [artifactError, creditApprovalForm, id, populateFormData]);

  const buildPayload = useCallback(() => {
    const toIsoDateTime = (dateValue) => {
      if (!dateValue) {
        return null;
      }

      const normalizedValue = dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`;
      return new Date(normalizedValue).toISOString();
    };

    return {
      ...formData,
      approver: user?.id || null,
      approval_date: toIsoDateTime(formData.approval_date),
      delegated_authority_level: formData.delegated_authority_level || null,
      approved_amount: formData.approved_amount ? parseFloat(formData.approved_amount) : null,
      tenor_approved: formData.tenor_approved ? parseInt(formData.tenor_approved, 10) : null,
      committee_meeting_date: formData.committee_meeting_date || null,
      review_date: formData.review_date || null,
      expiry_date: formData.expiry_date || null,
      form_started_at: toIsoDateTime(formStartDate || new Date().toISOString().split('T')[0]),
    };
  }, [formData, formStartDate, user]);

  // Phase 3 handleTransition pattern - matches other forms exactly
  const handleTransition = async (transition, comments = '') => {
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    // Build payload like other Phase 3 forms
    const payload = buildPayload();

    try {
      // First save form data using proper API service
      await saveCreditApprovalForm(id, payload);
      
      // Then perform transition with proper Phase 3 payload structure - SAME AS OTHER FORMS
      const transitionPayload = { transition_code: transition.code, comments: comments };

      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'CA_SAVE_DRAFT' || transition.code === 'CA_BACK_TO_DRAFT' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('submit')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      // Use same error handling pattern as other forms
      let detailedError = 'An unexpected error occurred during transition.';
      if (error.response) {
        if (error.response.data) {
          const dataError = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
          detailedError = `Backend Error: ${dataError} (Status: ${error.response.status})`;
        } else {
          detailedError = `Backend Error: Status ${error.response.status}`;
        }
      } else if (error.message) {
        detailedError = error.message;
      }
      
      setTransitionError(detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  const workflowStatusProps = {
    currentStep: currentStep,
    workflowType: "CREDIT_APPROVAL",
    currentWorkflowState: { name: currentWorkflowState },
  };

  // Apply DA authorization check to transitions
  const finalAllowedTransitions = hasDAAuthorization ? (allowedTransitions || []) : [];
  
  const workflowActionsProps = {
    key: `${workflowInstanceId || 'new-approval-actions'}-${hasDAAuthorization}`, // Include DA state in key to force re-render
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: finalAllowedTransitions,
  };
  const loading = applicationLoading || artifactLoading;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <FormPageWrapper
      title="Credit Approval Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >
      {/* Application Details */}
      <CreditApplicationDetailsSection creditApplication={creditApplication} />

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          marginBottom: theme.spacing(6), // 24px
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
        {tabOptions.map((tab, index) => (
          <Tab key={index} label={tab} />
        ))}
      </Tabs>

      {/* Approval Decision Tab */}
      {activeTab === 0 && (
        <>
          <FormSection title="Approver Information" description="Details about the person making the approval decision">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing(4), marginBottom: theme.spacing(4) }}>
              <FormField
                label="Approver"
                type="text"
                value={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : ''}
                required
                disabled={true}
                helperText="Approver is set to the current logged-in user with appropriate DA level"
              />
              <FormField
                label="Delegated Authority Level"
                name="delegated_authority_level"
                type="select"
                value={formData.delegated_authority_level || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select DA Level' },
                  { value: 'DA1', label: 'DA1' },
                  { value: 'DA2', label: 'DA2' },
                  { value: 'DA3', label: 'DA3' },
                  { value: 'DA4', label: 'DA4' },
                  { value: 'DA5', label: 'DA5' },
                  { value: 'DA6', label: 'DA6' },
                  { value: 'DA7', label: 'DA7' },
                  { value: 'DA8', label: 'DA8' },
                  { value: 'CC', label: 'Credit Committee' }
                ]}
                required
              />
            </div>
          </FormSection>

          <FormSection title="Approval Decision" description="The final approval decision and details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing(4), marginBottom: theme.spacing(4) }}>
              <FormField
                label="Approval Decision"
                name="approval_decision"
                type="select"
                value={formData.approval_decision || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select decision' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'approved_with_conditions', label: 'Approved with Conditions' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'deferred', label: 'Deferred' },
                  { value: 'withdrawn', label: 'Withdrawn' }
                ]}
                required
              />
              <FormField
                label="Approval Date"
                name="approval_date"
                type="date"
                value={formData.approval_date || ''}
                onChange={handleChange}
                required
              />
            </div>
            <FormField
              label="Approval Comments"
              name="approval_comments"
              type="textarea"
              value={formData.approval_comments || ''}
              onChange={handleChange}
              placeholder="Comments and rationale for the approval decision"
              rows={4}
            />
            <FormField
              label="Risk Assessment Summary"
              name="risk_assessment_summary"
              type="textarea"
              value={formData.risk_assessment_summary || ''}
              onChange={handleChange}
              placeholder="Summary of key risks and mitigants considered"
              rows={3}
            />
            {formData.approval_decision === 'rejected' && (
              <div style={{ 
                backgroundColor: theme.palette.secondary.light, 
                padding: '1rem', 
                borderRadius: '6px', 
                border: `1px solid ${theme.palette.secondary.main}`, 
                marginTop: theme.spacing(4) // 16px 
              }}>
                <FormField
                  label="Rejection Reason"
                  name="rejection_reason"
                  type="textarea"
                  value={formData.rejection_reason || ''}
                  onChange={handleChange}
                  placeholder="Detailed reason for rejection"
                  rows={3}
                  required={formData.approval_decision === 'rejected'}
                />
              </div>
            )}
          </FormSection>
        </>
      )}


      {/* Committee Details Tab */}
      {activeTab === 1 && (
        <FormSection title="Credit Committee Details" description="Information about credit committee meeting (if applicable)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing(4), marginBottom: theme.spacing(4) }}>
            <FormField
              label="Committee Meeting Date"
              name="committee_meeting_date"
              type="date"
              value={formData.committee_meeting_date || ''}
              onChange={handleChange}
            />
          </div>
          <FormField
            label="Committee Members Present"
            name="committee_members_present"
            type="textarea"
            value={formData.committee_members_present || ''}
            onChange={handleChange}
            placeholder="Names of credit committee members present at the meeting"
            rows={3}
          />
        </FormSection>
      )}

    </FormPageWrapper>
  );
};

export default CreditApprovalForm;
