import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopNavBar from '../TopNavBar';
import { fetchCreditRequest, performWorkflowTransition, saveCreditQuestionnaireForm } from '../../services/api'; 
import LogoutButton from '../LogoutButton';
import WorkflowStatus from '../common/WorkflowStatus';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import VersionControlHeader from '../common/VersionControlHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

const CreditQuestionnaireForm = ({ creditApplication: initialCreditApplication }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [userGuidanceMessage, setUserGuidanceMessage] = useState(null);
  const [transitionSuccessMessage, setTransitionSuccessMessage] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);
  const [mainWorkflowStep, setMainWorkflowStep] = useState(1);

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
        case 'CREDIT_PAPER_ANALYSIS_PENDING':
          step = 4;
          break;
        case 'CREDIT_PAPER_CREDIT_COMMITTEE_PAPER_PENDING':
          step = 5;
          break;
        case 'CREDIT_PAPER_FINAL_APPROVAL_PENDING':
          step = 6;
          break;
        default:
          step = 1; // Or a sensible default if the state is unknown
          break;
      }
      setMainWorkflowStep(step);
    }
  }, [creditApplication]);

  // Workflow state for the CreditQuestionnaireForm itself
  const [cqWorkflowInstanceId, setCqWorkflowInstanceId] = useState(null);
  const [currentCqWorkflowState, setCurrentCqWorkflowState] = useState(null);
  const [allowedCqTransitionsList, setAllowedCqTransitionsList] = useState([]);

  // Form state - based on UI-examples/credit-questionnaire-form.tsx
  const [applicantName, setApplicantName] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [relationshipManager, setRelationshipManager] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    const initialFormData = {};

    // Populate Credit Questionnaire Form specific data
    if (data.credit_questionnaire_form) {
      console.log('Found credit_questionnaire_form, available_transitions:', data.credit_questionnaire_form.available_transitions);
      const cqForm = data.credit_questionnaire_form;
      setCqWorkflowInstanceId(cqForm.workflow_instance_id || null);
      setCurrentCqWorkflowState(cqForm.workflow_state_name || null);
      setAllowedCqTransitionsList(cqForm.available_transitions || []);

      if (cqForm.form_data) {
        const cqApiFormData = cqForm.form_data;
        // Populate from cqForm.form_data, then fall back to other sources or defaults
        initialFormData.applicant_name = cqApiFormData.applicant_name || data.applicant?.name || '';
        initialFormData.application_date = cqApiFormData.application_date || data.submission_date?.split('T')[0] || new Date().toISOString().split('T')[0];
        initialFormData.relationship_manager = cqApiFormData.relationship_manager || user?.name || '';
        initialFormData.loan_amount = cqApiFormData.loan_amount || '';
        initialFormData.loan_purpose = cqApiFormData.loan_purpose || '';
        initialFormData.form_start_date = cqApiFormData.form_start_date || new Date().toISOString().split('T')[0];
        initialFormData.form_completion_date = cqApiFormData.form_completion_date || '';

        // Fields for 'Business Model & Strategy' tab from UI example
        // Business Model
        initialFormData.business_model_details = cqApiFormData.business_model_details || '';
        initialFormData.key_suppliers_customers = cqApiFormData.key_suppliers_customers || '';

        // Trading Activities
        initialFormData.trading_activity_rationale = cqApiFormData.trading_activity_rationale || '';
        initialFormData.trading_flow_drivers = cqApiFormData.trading_flow_drivers || '';
        initialFormData.position_size_determinants = cqApiFormData.position_size_determinants || '';
        initialFormData.trading_policy_governance = cqApiFormData.trading_policy_governance || '';

        // Risk Management
        initialFormData.hedge_effectiveness = cqApiFormData.hedge_effectiveness || '';
        initialFormData.hedge_accounting_approach = cqApiFormData.hedge_accounting_approach || '';
        initialFormData.stress_testing_methodology = cqApiFormData.stress_testing_methodology || '';
        initialFormData.var_methodology = cqApiFormData.var_methodology || '';
        initialFormData.risk_management_system = cqApiFormData.risk_management_system || '';

        // Funding & Liquidity
        initialFormData.cash_management_approach = cqApiFormData.cash_management_approach || '';
        initialFormData.notional_position_details = cqApiFormData.notional_position_details || '';
        initialFormData.liquidity_management = cqApiFormData.liquidity_management || '';
        initialFormData.banking_relationships = cqApiFormData.banking_relationships || '';

      } else {
        // Fallback if form_data is null/undefined
        initialFormData.applicant_name = data.applicant?.name || '';
        setApplicantName(data.applicant?.name || '');
        setApplicationDate(data.submission_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setRelationshipManager(user?.name || '');
        setFormStartDate(new Date().toISOString().split('T')[0]);
        // Default empty strings for new form fields if not in cqForm.form_data
        initialFormData.business_model_details = initialFormData.business_model_details || '';
        initialFormData.key_suppliers_customers = initialFormData.key_suppliers_customers || '';

        initialFormData.trading_activity_rationale = initialFormData.trading_activity_rationale || '';
        initialFormData.trading_flow_drivers = initialFormData.trading_flow_drivers || '';
        initialFormData.position_size_determinants = initialFormData.position_size_determinants || '';
        initialFormData.trading_policy_governance = initialFormData.trading_policy_governance || '';

        initialFormData.hedge_effectiveness = initialFormData.hedge_effectiveness || '';
        initialFormData.hedge_accounting_approach = initialFormData.hedge_accounting_approach || '';
        initialFormData.stress_testing_methodology = initialFormData.stress_testing_methodology || '';
        initialFormData.var_methodology = initialFormData.var_methodology || '';
        initialFormData.risk_management_system = initialFormData.risk_management_system || '';

        initialFormData.cash_management_approach = initialFormData.cash_management_approach || '';
        initialFormData.notional_position_details = initialFormData.notional_position_details || '';
        initialFormData.liquidity_management = initialFormData.liquidity_management || '';
        initialFormData.banking_relationships = initialFormData.banking_relationships || '';
      }
    } else {
      // If no form data exists, set defaults
      setApplicantName(data.applicant?.name || '');
      setApplicationDate(data.submission_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setRelationshipManager(user?.name || '');
      setFormStartDate(new Date().toISOString().split('T')[0]);
      // Default empty strings for new form fields if not in cqForm.form_data
      initialFormData.business_model_details = initialFormData.business_model_details || '';
      initialFormData.key_suppliers_customers = initialFormData.key_suppliers_customers || '';

      initialFormData.trading_activity_rationale = initialFormData.trading_activity_rationale || '';
      initialFormData.trading_flow_drivers = initialFormData.trading_flow_drivers || '';
      initialFormData.position_size_determinants = initialFormData.position_size_determinants || '';
      initialFormData.trading_policy_governance = initialFormData.trading_policy_governance || '';

      initialFormData.hedge_effectiveness = initialFormData.hedge_effectiveness || '';
      initialFormData.hedge_accounting_approach = initialFormData.hedge_accounting_approach || '';
      initialFormData.stress_testing_methodology = initialFormData.stress_testing_methodology || '';
      initialFormData.var_methodology = initialFormData.var_methodology || '';
      initialFormData.risk_management_system = initialFormData.risk_management_system || '';

      initialFormData.cash_management_approach = initialFormData.cash_management_approach || '';
      initialFormData.notional_position_details = initialFormData.notional_position_details || '';
      initialFormData.liquidity_management = initialFormData.liquidity_management || '';
      initialFormData.banking_relationships = initialFormData.banking_relationships || '';
    }
    setFormData(initialFormData);
  };

  useEffect(() => {
    setLoading(true);
    if (initialCreditApplication) {
      populateFormData(initialCreditApplication);
      setLoading(false);
    } else if (id) {
      fetchCreditRequest(id)
        .then(response => {
          populateFormData(response.data);
        })
        .catch(error => {
          console.error('Error fetching credit application:', error);
          setSaveError('Failed to load credit application data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, user]);

  // This function now ONLY saves data and returns true/false for success.
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);

    const questionnairePayload = {
      ...formData,
      form_start_date: formStartDate || new Date().toISOString().split('T')[0],
      // form_completion_date is set on final submission via workflow
    };

    if (!cqWorkflowInstanceId) {
      questionnairePayload.create_workflow_instance = true;
    }

    const payload = {
      credit_questionnaire_form: questionnairePayload
    };

    try {
      const response = await saveCreditQuestionnaireForm(id, payload);
      populateFormData(response.data); // Update state with response
      setSaveLoading(false);
      return true; // Indicate success
    } catch (error) {
      console.error('Error saving Credit Questionnaire form:', error);
      setSaveError(error.response?.data?.detail || 'Failed to save form.');
      setSaveLoading(false);
      return false; // Indicate failure
    }
  };

  const handleWorkflowAction = async (actualTransitionCode, actualComments = '') => {
    console.log('--- handleWorkflowAction called ---');
    console.log('Received transition code:', actualTransitionCode, '(type:', typeof actualTransitionCode, ')');
    console.log('Received comments:', actualComments);
    // Clear previous messages
    setUserGuidanceMessage(null);
    setTransitionSuccessMessage(null);
    setTransitionError(null);

    // Step 1: Save the latest form data first.
    const saveSuccessful = await handleSave();

    if (saveSuccessful) {
      // Step 2: If save was successful, perform the transition.
      setTransitionLoading(true);
      try {
        const transitionResponse = await performWorkflowTransition(cqWorkflowInstanceId, actualTransitionCode, actualComments);
        setTransitionSuccessMessage(transitionResponse.detail || 'Action completed successfully!');

        // Step 3: Re-fetch the application to get the latest state after transition.
        const updatedAppData = await fetchCreditRequest(id);
        populateFormData(updatedAppData.data);

        // Step 4: Navigate to dashboard if this was a submit action
        if (actualTransitionCode === 'CQ_TR_1' || actualTransitionCode === 'CQ_TR_2') {
          setTimeout(() => {
            navigate('/');
          }, 1500); // 1.5-second delay
        }

      } catch (workflowError) {
        console.error('Error during workflow transition:', workflowError);
        const errorMessage = workflowError.response?.data?.detail || workflowError.message || 'An unexpected error occurred during the transition.';
        setTransitionError(errorMessage);
      } finally {
        setTransitionLoading(false);
      }
    } else {
      // If save failed, do not proceed with transition.
      setTransitionError('Could not perform action because the form failed to save.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Credit Questionnaire Form...</div>;

  return (
    <div style={{
      maxWidth: '1300px',
      margin: '0 auto',
      padding: '1rem',
      backgroundColor: colors.neutral200, // Page background color
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <TopNavBar LogoutButton={LogoutButton} />

      {/* Title Block */}
      <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: colors.neutral800,
          marginBottom: '0.5rem'
        }}>
          Credit Questionnaire Form
        </h1>
        {/* Optional: Add a subtitle like in BusinessSponsorshipForm if needed */}
        {/* <p style={{ color: colors.neutral600 }}>
          Complete the credit questionnaire details.
        </p> */}
      </div>

      {/* Main WorkflowStatus after title block, before form card */}
      <WorkflowStatus currentStep={mainWorkflowStep} />

      {/* Inner white card for the form content */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        marginTop: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {/* Removed the Typography title from here as it's in the title block above */}
        
        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading form data...</div>}
        {!loading && !creditApplication && id && <div style={{ textAlign: 'center', padding: '2rem', color: colors.error }}>Could not load application data for ID: {id}.</div>}
        {!loading && !creditApplication && !id && <div style={{ textAlign: 'center', padding: '2rem', color: colors.error }}>No application ID provided.</div>}

        {creditApplication && !loading && (
        <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: '1rem' }}>
        <Paper elevation={3} sx={{ /*padding: 3,*/ marginTop: 2, width: '100%' }}> {/* Padding removed from Paper, will be handled by Box or FormSection */}
          <VersionControlHeader 
            version={creditApplication?.credit_questionnaire_form?.version_info || 'Draft v0.1'} 
            lastSaved={creditApplication?.credit_questionnaire_form?.last_saved_at ? new Date(creditApplication.credit_questionnaire_form.last_saved_at).toLocaleString() : new Date().toLocaleString()} 
          />
          <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="credit questionnaire form tabs" variant="fullWidth">
              <Tab label="Business Model" />
              <Tab label="Trading Activities" />
              <Tab label="Risk Management" />
              <Tab label="Funding & Liquidity" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Business Model Overview" description="Provide details on the counterparty's business model and operations.">
                <FormField label="Business Model Details *" name="business_model_details" type="textarea" value={formData.business_model_details || ''} onChange={handleChange} colors={colors} placeholder="Describe the counterparty's core business model, key products/services, and market position" />
                <FormField label="Key Suppliers and Customers *" name="key_suppliers_customers" type="textarea" value={formData.key_suppliers_customers || ''} onChange={handleChange} colors={colors} placeholder="List major suppliers and customers, including concentration percentages if available" />
              </FormSection>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Trading Activities" description="Provide details on the counterparty's trading activities and rationale.">
                <FormField label="Trading Activity Rationale *" name="trading_activity_rationale" type="textarea" value={formData.trading_activity_rationale || ''} onChange={handleChange} colors={colors} placeholder="Explain the business rationale behind the counterparty's trading activities" />
                <FormField label="Trading Flow Drivers *" name="trading_flow_drivers" type="textarea" value={formData.trading_flow_drivers || ''} onChange={handleChange} colors={colors} placeholder="Describe the key drivers of trading flows and volumes" />
                <FormField label="Position Size Determinants *" name="position_size_determinants" type="textarea" value={formData.position_size_determinants || ''} onChange={handleChange} colors={colors} placeholder="Explain how position sizes are determined and what limits are in place" />
                <FormField label="Trading Policy & Governance *" name="trading_policy_governance" type="textarea" value={formData.trading_policy_governance || ''} onChange={handleChange} colors={colors} placeholder="Describe the governance structure and oversight of trading activities" />
              </FormSection>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Risk Management" description="Provide details on the counterparty's risk management approach.">
                <FormField label="Hedge Effectiveness *" name="hedge_effectiveness" type="textarea" value={formData.hedge_effectiveness || ''} onChange={handleChange} colors={colors} placeholder="Describe how the effectiveness of hedges is measured and monitored" />
                <FormField label="Hedge Accounting Approach *" name="hedge_accounting_approach" type="textarea" value={formData.hedge_accounting_approach || ''} onChange={handleChange} colors={colors} placeholder="Explain the accounting treatment for hedging activities" />
                <FormField label="Stress Testing Methodology *" name="stress_testing_methodology" type="textarea" value={formData.stress_testing_methodology || ''} onChange={handleChange} colors={colors} placeholder="Detail the stress testing approaches used to assess risk exposures" />
                <FormField label="Value at Risk (VaR) Methodology" name="var_methodology" type="select" value={formData.var_methodology || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select methodology'}, {value: 'historical', label: 'Historical Simulation'}, {value: 'parametric', label: 'Parametric (Variance-Covariance)'}, {value: 'monte_carlo', label: 'Monte Carlo Simulation'}]} />
                <FormField label="Risk Management System" name="risk_management_system" type="select" value={formData.risk_management_system || ''} onChange={handleChange} colors={colors} options={[{value: '', label: 'Select system'}, {value: 'in_house', label: 'In-house System'}, {value: 'vendor', label: 'Third-party Vendor System'}]} />
              </FormSection>
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Funding & Liquidity" description="Provide details on the counterparty's funding sources and liquidity management.">
                <FormField label="Cash Management Approach *" name="cash_management_approach" type="textarea" value={formData.cash_management_approach || ''} onChange={handleChange} colors={colors} placeholder="Describe how cash positions are managed across the organization" />
                <FormField label="Notional Position Details *" name="notional_position_details" type="textarea" value={formData.notional_position_details || ''} onChange={handleChange} colors={colors} placeholder="Provide details on typical notional position sizes and distribution" />
                <FormField label="Liquidity Management *" name="liquidity_management" type="textarea" value={formData.liquidity_management || ''} onChange={handleChange} colors={colors} placeholder="Explain liquidity management strategies and contingency planning" />
                <FormField label="Banking Relationships *" name="banking_relationships" type="textarea" value={formData.banking_relationships || ''} onChange={handleChange} colors={colors} placeholder="List key banking relationships and credit facilities" />
              </FormSection>

              {/* Supporting Documentation Section from UI Example */}
              <Box sx={{
                backgroundColor: colors.blueLight, // Or a direct hex like '#e6edf7'
                padding: 2,
                borderRadius: 1,
                marginBottom: 2,
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <Typography sx={{ marginRight: 1.5, color: colors.standardBankBlue, marginTop: '0.125rem' }}>ℹ️</Typography>
                <Typography variant="body2" sx={{ color: colors.standardBankBlue }}>
                  Please attach the latest liquidity reports and covenant compliance certificates if available. Supporting documentation can be uploaded by clicking the &quot;Attach Document&quot; button below.
                </Typography>
              </Box>

              <Button 
                variant="outlined" 
                startIcon={<span role="img" aria-label="attach">📎</span>} 
                sx={{ textTransform: 'none', marginBottom: 2 }}
                onClick={() => console.log('Attach Document clicked - placeholder')}
              >
                Attach Document
              </Button>
            </Box>
          )}
        </Paper>

          {/* Action buttons and messages are part of the main form */}

          
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
        </form> 
        )} {/* End of conditional rendering for creditApplication */}

        {/* Action Buttons and Back to Dashboard Link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, px: 3, pb: 3 }}>
          <Button
            variant="text"
            onClick={() => navigate('/dashboard')}
            sx={{ color: colors.neutral700, textTransform: 'none' }}
          >
            Back to Dashboard
          </Button>
          <Box>
            {allowedCqTransitionsList && allowedCqTransitionsList.map((transition) => (
              <Button
                key={transition.code}
                variant="contained"
                color="primary"
                onClick={() => {
                  console.log('--- Workflow Button Clicked ---');
                  console.log('Full transition object:', JSON.stringify(transition, null, 2));
                  console.log('transition.code value:', transition.code);
                  console.log('Type of transition.code:', typeof transition.code);

                  const code = (typeof transition.code === 'object' && transition.code !== null) ? transition.code.transition_code : transition.code;
                  const comments = (typeof transition.code === 'object' && transition.code !== null && transition.code.comments !== undefined) ? transition.code.comments : '';
                  
                  console.log('Extracted code for handler:', code);
                  console.log('Extracted comments for handler:', comments);

                  handleWorkflowAction(code, comments);
                }}
                disabled={transitionLoading}
                sx={{ ml: 2, textTransform: 'none' }}
              >
                {transitionLoading ? 'Processing...' : transition.name}
              </Button>
            ))}
          </Box>
        </Box>
      </div> {/* End of inner white card */}
    </div>
  );
};

export default CreditQuestionnaireForm;
