import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchUsersByRole, fetchCreditRequest, performWorkflowTransition, saveCreditApprovalForm } from '../../services/api';
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';

const CreditApprovalForm = ({ creditApplication: initialCreditApplication, currentStep = 6 }) => {
  console.log('🚀 CREDIT APPROVAL FORM LOADED - VERSION 2025-06-29-11:00');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
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
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);

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


  const populateFormData = useCallback((data) => {
    if (!data) return;
    setCreditApplication(data); // Store the whole application object

    // Check DA authorization before proceeding
    const requiredDALevel = data.credit_review_form?.delegated_authority_level;
    const userDALevel = user?.da_level;
    const userRole = user?.role?.name;

    console.log('=== DEBUG: DA Authorization Check ===');
    console.log('User role:', userRole);
    console.log('User DA level:', userDALevel);
    console.log('Required DA level:', requiredDALevel);
    console.log('🔍 Condition check:');
    console.log('  userRole === "Credit Analyst":', userRole === 'Credit Analyst');
    console.log('  requiredDALevel truthy:', !!requiredDALevel);
    console.log('  userDALevel truthy:', !!userDALevel);
    console.log('  All conditions met:', userRole === 'Credit Analyst' && requiredDALevel && userDALevel);

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

      console.log('User level (numeric):', userLevel);
      console.log('Required level (numeric):', requiredLevel);
      console.log('🔢 Numeric comparison details:');
      console.log('  userLevel > requiredLevel:', userLevel > requiredLevel);
      console.log('  Condition (userLevel && requiredLevel && userLevel > requiredLevel):', userLevel && requiredLevel && userLevel > requiredLevel);

      // Lower number = higher authority (DA1 > DA5 > DA8)
      // User should be denied access only if their level is HIGHER (worse) than required
      if (userLevel && requiredLevel && userLevel > requiredLevel) {
        console.log('🚫 DA AUTHORIZATION FAILED - SETTING hasDAAuthorization to FALSE');
        console.log('🚫 User level:', userLevel, 'Required level:', requiredLevel);
        console.log('🚫 Explanation: User has DA' + userLevel + ' but application requires DA' + requiredLevel + ' or better');
        setTransitionError(`Insufficient authorization. This application requires ${requiredDALevel} approval level, but you have ${userDALevel}. Please contact a user with ${requiredDALevel} or higher authority.`);
        hasAuthorization = false;
        console.log('🚫 hasDAAuthorization set to:', false);
      } else {
        console.log('✅ DA AUTHORIZATION PASSED - SETTING hasDAAuthorization to TRUE');
        console.log('✅ User level:', userLevel, 'Required level:', requiredLevel);
        console.log('✅ Explanation: User has DA' + userLevel + ' which is sufficient for DA' + requiredLevel + ' requirement');
        hasAuthorization = true;
      }
    }

    // Set the authorization state
    setHasDAAuthorization(hasAuthorization);

    // Debug logging for DA level pre-population
    console.log('=== DEBUG: DA Level Pre-population ===');
    console.log('Full data received:', data);
    console.log('Credit Review Form data:', data.credit_review_form);
    console.log('Credit Review DA Level:', data.credit_review_form?.delegated_authority_level);
    console.log('Credit Approval Form data:', data.credit_approval_form);
    console.log('Credit Approval DA Level:', data.credit_approval_form?.delegated_authority_level);

    const initialFormData = {};

    // Populate Credit Approval Form specific data - Phase 3 pattern
    if (data.credit_approval_form) {
      console.log('Found credit_approval_form, available_transitions:', data.credit_approval_form.available_transitions);
      const caForm = data.credit_approval_form;
      
      // Use Credit Approval Form sub-process workflow - SAME PATTERN as other Phase 3 forms
      if (caForm.workflow_instance) {
        setWorkflowInstanceId(caForm.workflow_instance.id);
        setCurrentWorkflowState(caForm.workflow_instance.current_state || 'Draft');
      }
      
      // Use available_transitions from Credit Approval Form serializer, but filter based on DA authorization
      console.log('Available transitions from API:', caForm.available_transitions);
      const transitions = hasAuthorization ? (caForm.available_transitions || []) : [];
      setAllowedTransitions(transitions);
      console.log('Setting allowedTransitions state to:', transitions);
      console.log('DA Authorization status:', hasAuthorization);

      // Populate directly from model fields (Phase 3 pattern - explicit database fields)
      // With DA-level authorization, approver is always the current user
      console.log('=== DEBUG: Setting approver field ===');
      console.log('Current user:', user);
      console.log('Current user ID:', user?.id);
      console.log('Backend approver data:', caForm.approver);
      
      // Handle approver field with proper UUID validation
      const approverFromBackend = caForm.approver;
      let validApprover = user?.id || ''; // Default fallback to current user

      console.log('=== DEBUG: Approver Field Validation ===');
      console.log('Backend approver data:', approverFromBackend);
      console.log('Backend approver type:', typeof approverFromBackend);
      console.log('Current user ID:', user?.id);

      // If backend has data, validate it's a UUID
      if (approverFromBackend) {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof approverFromBackend === 'string' && uuidRegex.test(approverFromBackend)) {
          validApprover = approverFromBackend;
          console.log('✅ Valid UUID from backend, using:', validApprover);
        } else {
          console.warn(`⚠️ Invalid approver data from backend: "${approverFromBackend}" (type: ${typeof approverFromBackend}), using current user instead`);
          validApprover = user?.id || '';
        }
      } else {
        console.log('📝 No approver in backend data, using current user:', validApprover);
      }

      initialFormData.approver = validApprover;
      console.log('Final approver value in formData:', validApprover);
      
      initialFormData.approval_decision = caForm.approval_decision || '';
      initialFormData.approval_date = caForm.approval_date ? caForm.approval_date.split('T')[0] : '';
      
      // Pre-populate delegated authority level from Credit Review Form if not already set
      let delegatedAuthorityLevel = caForm.delegated_authority_level;
      if (!delegatedAuthorityLevel && data.credit_review_form?.delegated_authority_level) {
        let reviewDA = data.credit_review_form.delegated_authority_level;
        
        // Handle both formats: '5' and 'DA5' 
        if (reviewDA && !reviewDA.startsWith('DA') && !isNaN(reviewDA)) {
          reviewDA = `DA${reviewDA}`; // Convert '5' to 'DA5'
        }
        
        delegatedAuthorityLevel = reviewDA;
        console.log(`Pre-populating DA level from Credit Review Form: '${data.credit_review_form.delegated_authority_level}' -> '${delegatedAuthorityLevel}'`);
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
      console.log('New form: setting approver to current user:', user?.id);
    }
    setFormData(initialFormData);
  }, [user]);

  const fetchAndSetApprovers = useCallback(async () => {
    setLoadingApprovers(true);
    try {
      // With DA-level authorization, the approver is the current logged-in Credit Analyst
      // No need to fetch other users since DA authorization determines who can approve
      if (user) {
        setApprovers([user]); // Just use the current user
      } else {
        setApprovers([]);
      }
    } catch (error) {
      console.error('Failed to set approver:', error);
    } finally {
      setLoadingApprovers(false);
    }
  }, [user]);

  useEffect(() => {
    // Always fetch fresh data - don't rely on potentially stale initialCreditApplication
    // This ensures workflow transitions are always up-to-date
    if (id) {
      setLoading(true);
      fetchCreditRequest(id)
        .then(data => {
          populateFormData(data);
        })
        .catch(error => {
          console.error('Error fetching credit application:', error);
          setTransitionError('Failed to load credit application data.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    fetchAndSetApprovers();
  }, [id, refetchTrigger, populateFormData, fetchAndSetApprovers]);

  // Debug effect to track DA authorization changes
  useEffect(() => {
    console.log('🔄 DA Authorization state changed:', hasDAAuthorization);
    console.log('🔄 Current allowedTransitions:', allowedTransitions);
    console.log('🔄 Final transitions after DA filter:', hasDAAuthorization ? allowedTransitions : []);
  }, [hasDAAuthorization, allowedTransitions]);

  const buildPayload = useCallback(() => {
    // Use FLAT PREFIXED FIELDS to match backend expectation - Phase 3 pattern
    const payload = {
      credit_approval_form_start_date: formStartDate || new Date().toISOString().split('T')[0],
      // form_completion_date is set on final submission via workflow
    };

    // Add all form data fields with prefix - MUST match backend metadata
    Object.keys(formData).forEach(key => {
      payload[`credit_approval_form_${key}`] = formData[key];
    });

    // DOUBLE-CHECK: Force approver to always be current user UUID to prevent any "holmes" issues
    payload.credit_approval_form_approver = user?.id;
    
    // Validate the UUID format one more time
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!payload.credit_approval_form_approver || !uuidRegex.test(payload.credit_approval_form_approver)) {
      console.error('❌ CRITICAL: Invalid approver UUID detected!', payload.credit_approval_form_approver);
      console.error('❌ User object:', user);
      payload.credit_approval_form_approver = user?.id || '';
    }

    // Debug logging to check approver field
    console.log('=== DEBUG: Credit Approval Form Payload (FINAL) ===');
    console.log('formData.approver:', formData.approver);
    console.log('user.id:', user?.id);
    console.log('payload credit_approval_form_approver (FINAL):', payload.credit_approval_form_approver);
    console.log('UUID validation passed:', uuidRegex.test(payload.credit_approval_form_approver));
    console.log('Full payload:', payload);

    return payload;
  }, [formData, formStartDate, user]);

  // Save function - returns true/false for success
  const handleSave = async () => {
    setLoading(true);
    setTransitionError(null);

    const payload = buildPayload();

    if (!workflowInstanceId) {
      payload.credit_approval_create_workflow_instance = true;
    }

    try {
      const response = await saveCreditApprovalForm(id, payload);
      populateFormData(response.data); // Update state with response
      setLoading(false);
      return true; // Indicate success
    } catch (error) {
      console.error('Error saving Credit Approval form:', error);
      setTransitionError(error.response?.data?.detail || 'Failed to save form.');
      setLoading(false);
      return false; // Indicate failure
    }
  };

  // Phase 3 handleTransition pattern - matches other forms exactly
  const handleTransition = async (transition, comments = '') => {
    console.log('🎯 HANDLE TRANSITION CALLED - VERSION 2025-06-29-11:15');
    console.log('Credit Approval Form - handleTransition called with:', { transition, comments });
    console.log('Current formData before transition:', formData);
    console.log('Current user in transition:', user);
    console.log('formData.approver specifically:', formData.approver);
    
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    // Build payload like other Phase 3 forms
    console.log('About to build payload...');
    const payload = buildPayload();
    console.log('Payload built:', payload);

    if (!workflowInstanceId) {
      payload.credit_approval_create_workflow_instance = true;
    }
    
    try {
      console.log('🚨 CRITICAL DEBUG - PAYLOAD BEING SENT:');
      console.log('credit_approval_form_approver in payload:', payload.credit_approval_form_approver);
      console.log('Current user.id:', user?.id);
      console.log('Full payload being sent to API:', JSON.stringify(payload, null, 2));
      
      // First save form data using proper API service
      await saveCreditApprovalForm(id, payload);
      console.log('Credit Approval Form - Form data saved successfully');
      
      // Then perform transition with proper Phase 3 payload structure - SAME AS OTHER FORMS
      const transitionPayload = { transition_code: transition.code, comments: comments };
      
      console.log('Credit Approval Form - Performing transition...');
      console.log('Transition payload:', JSON.stringify(transitionPayload, null, 2));
      console.log('Workflow instance ID:', workflowInstanceId);
      
      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      console.log('Credit Approval Form - Transition performed successfully');
      
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
        console.error('Backend error response data:', error.response.data);
        console.error('Backend error response status:', error.response.status);
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
      console.error('Credit Approval Form - Transition failed:', detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  const workflowStatusProps = {
    currentStep: currentStep,
    workflowType: "CREDIT_APPROVAL",
    currentWorkflowState: { name: currentWorkflowState },
  };

  console.log('🔧 Setting up workflowActionsProps with handleTransition:', typeof handleTransition);
  console.log('🔐 DA Authorization Status:', hasDAAuthorization);
  console.log('🔄 Original allowedTransitions:', allowedTransitions);
  
  // Apply DA authorization check to transitions
  const finalAllowedTransitions = hasDAAuthorization ? (allowedTransitions || []) : [];
  console.log('🔄 Final allowedTransitions after DA check:', finalAllowedTransitions);
  
  const workflowActionsProps = {
    key: `${workflowInstanceId || 'new-approval-actions'}-${hasDAAuthorization}`, // Include DA state in key to force re-render
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: finalAllowedTransitions,
  };

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