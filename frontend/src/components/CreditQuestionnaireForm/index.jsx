import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchCreditRequest, performWorkflowTransition, saveCreditQuestionnaireForm } from '../../services/api'; 
import FormPageWrapper from '../common/FormPageWrapper';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import CreditApplicationDetailsSection from '../common/CreditApplicationDetailsSection';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';

const CreditQuestionnaireForm = ({ creditApplication: initialCreditApplication }) => {
  const { id } = useParams(); // This is credit_application_id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Workflow state for the CreditQuestionnaireForm itself - Phase 3 pattern
  const [workflowInstanceId, setWorkflowInstanceId] = useState(null);
  const [currentWorkflowState, setCurrentWorkflowState] = useState('');
  const [allowedTransitions, setAllowedTransitions] = useState([]);

  // Form state
  const [formStartDate, setFormStartDate] = useState('');
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

    // Populate Credit Questionnaire Form specific data - Phase 3 pattern
    if (data.credit_questionnaire_form) {
      console.log('Found credit_questionnaire_form, available_transitions:', data.credit_questionnaire_form.available_transitions);
      const cqForm = data.credit_questionnaire_form;
      
      // Use Credit Questionnaire Form sub-process workflow - SAME PATTERN as other Phase 3 forms
      if (cqForm.workflow_instance) {
        setWorkflowInstanceId(cqForm.workflow_instance.id);
        setCurrentWorkflowState(cqForm.workflow_instance.current_state || 'Draft');
      }
      
      // Use available_transitions from Credit Questionnaire Form serializer
      console.log('Available transitions from API:', cqForm.available_transitions);
      setAllowedTransitions(cqForm.available_transitions || []);
      console.log('Setting allowedTransitions state to:', cqForm.available_transitions || []);

      // Populate directly from model fields (Phase 3 pattern - explicit database fields)
      // Tab 1: Business Model
      initialFormData.business_model_description = cqForm.business_model_description || '';
      initialFormData.key_suppliers_customers = cqForm.key_suppliers_customers || '';
      
      // Tab 2: Trading Activities - Core Trading
      initialFormData.primary_products = cqForm.primary_products || '';
      initialFormData.trading_flow_drivers = cqForm.trading_flow_drivers || '';
      initialFormData.position_size_drivers = cqForm.position_size_drivers || '';
      initialFormData.typical_max_tenor = cqForm.typical_max_tenor || '';
      initialFormData.strategic_vs_proprietary = cqForm.strategic_vs_proprietary || '';
      
      // Tab 2: Trading Activities - Physical Positions
      initialFormData.icbcs_financing = cqForm.icbcs_financing || '';
      initialFormData.total_counterparty_financing_lines = cqForm.total_counterparty_financing_lines || '';
      initialFormData.repo_hedging_management = cqForm.repo_hedging_management || '';
      initialFormData.location_grade_details = cqForm.location_grade_details || '';
      initialFormData.exit_risk_limits = cqForm.exit_risk_limits || '';
      initialFormData.other_secured_trade_finance = cqForm.other_secured_trade_finance || '';
      initialFormData.repo_balance_sheet_treatment = cqForm.repo_balance_sheet_treatment || '';
      
      // Tab 2: Trading Activities - Notional Positions
      initialFormData.notional_value_requested = cqForm.notional_value_requested || '';
      initialFormData.icbcs_proportion_total_book = cqForm.icbcs_proportion_total_book || '';
      initialFormData.total_position_capacity = cqForm.total_position_capacity || '';
      initialFormData.position_business_context = cqForm.position_business_context || '';
      
      // Tab 3: Risk Management - Hedge Effectiveness
      initialFormData.material_basis_risk = cqForm.material_basis_risk || '';
      initialFormData.hedge_accounting = cqForm.hedge_accounting || '';
      
      // Tab 3: Risk Management - Stress Testing
      initialFormData.market_stress_tests = cqForm.market_stress_tests || '';
      initialFormData.stress_management = cqForm.stress_management || '';
      initialFormData.stress_governance = cqForm.stress_governance || '';
      initialFormData.stress_assumptions = cqForm.stress_assumptions || '';
      
      // Tab 3: Risk Management - Policies & Governance
      initialFormData.trading_policy_governance = cqForm.trading_policy_governance || '';
      
      // Tab 4: Funding & Liquidity
      initialFormData.other_counterparties_count = cqForm.other_counterparties_count || '';
      initialFormData.available_derivative_lines = cqForm.available_derivative_lines || '';
      initialFormData.cash_banking_lines = cqForm.cash_banking_lines || '';
      initialFormData.treasury_management_structure = cqForm.treasury_management_structure || '';
      initialFormData.usd_cash_location = cqForm.usd_cash_location || '';
      initialFormData.china_parent_restrictions = cqForm.china_parent_restrictions || '';
      initialFormData.margining_vs_unmargined = cqForm.margining_vs_unmargined || '';

    } else {
      // If no form data exists, set defaults
      setFormStartDate(new Date().toISOString().split('T')[0]);
    }
    setFormData(initialFormData);
  };

  useEffect(() => {
    if (initialCreditApplication) {
      populateFormData(initialCreditApplication);
      setLoading(false);
    } else if (id) {
      setLoading(true);
      fetchCreditRequest(id)
        .then(response => {
          populateFormData(response.data);
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
  }, [id, initialCreditApplication, user, refetchTrigger]);

  // Save function - returns true/false for success
  const handleSave = async () => {
    setLoading(true);
    setTransitionError(null);

    // Use FLAT PREFIXED FIELDS to match backend expectation
    const payload = {
      credit_questionnaire_form_start_date: formStartDate || new Date().toISOString().split('T')[0],
      // form_completion_date is set on final submission via workflow
    };

    // Add all form data fields with prefix - MUST match backend metadata
    Object.keys(formData).forEach(key => {
      payload[`credit_questionnaire_form_${key}`] = formData[key];
    });

    if (!workflowInstanceId) {
      payload.credit_questionnaire_create_workflow_instance = true;
    }

    try {
      const response = await saveCreditQuestionnaireForm(id, payload);
      populateFormData(response.data); // Update state with response
      setLoading(false);
      return true; // Indicate success
    } catch (error) {
      console.error('Error saving Credit Questionnaire form:', error);
      setTransitionError(error.response?.data?.detail || 'Failed to save form.');
      setLoading(false);
      return false; // Indicate failure
    }
  };

  // Phase 3 handleTransition pattern - matches other forms exactly
  const handleTransition = async (transition, comments = '') => {
    console.log('Credit Questionnaire Form - handleTransition called with:', { transition, comments });
    
    if (!workflowInstanceId) {
      setTransitionError('Cannot perform transitions - workflow instance not found.');
      return;
    }
    
    setTransitionLoading(true);
    setTransitionError(null);
    
    // Build payload like other Phase 3 forms
    const payload = {
      credit_questionnaire_form_start_date: formStartDate || new Date().toISOString().split('T')[0],
    };

    // Add all form data fields with prefix - MUST match backend metadata
    Object.keys(formData).forEach(key => {
      payload[`credit_questionnaire_form_${key}`] = formData[key];
    });

    if (!workflowInstanceId) {
      payload.credit_questionnaire_create_workflow_instance = true;
    }
    
    try {
      console.log('Credit Questionnaire Form - Saving form data first...');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      // First save form data using proper API service
      await saveCreditQuestionnaireForm(id, payload);
      console.log('Credit Questionnaire Form - Form data saved successfully');
      
      // Then perform transition with proper Phase 3 payload structure - SAME AS OTHER FORMS
      const transitionPayload = { transition_code: transition.code, comments: comments };
      
      console.log('Credit Questionnaire Form - Performing transition...');
      console.log('Transition payload:', JSON.stringify(transitionPayload, null, 2));
      console.log('Workflow instance ID:', workflowInstanceId);
      
      await performWorkflowTransition(workflowInstanceId, transitionPayload);
      console.log('Credit Questionnaire Form - Transition performed successfully');
      
      // Navigate on success if metadata specifies a path
      const navigatePath = transition.metadata?.ui_behavior?.navigate_on_success;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (transition.code === 'CQ_SAVE_DRAFT' || transition.code === 'CQ_BACK_TO_DRAFT' || (transition.name.toLowerCase().includes('save') || transition.name.toLowerCase().includes('draft')) && !transition.name.toLowerCase().includes('submit')) {
        // For Save as Draft transitions, navigate back to dashboard
        navigate('/');
      } else {
        // For other transitions, refresh data to get new state
        setRefetchTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      // Use same error handling pattern as BusinessSponsorshipForm
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
      console.error('Credit Questionnaire Form - Transition failed:', detailedError);
    } finally {
      setTransitionLoading(false);
    }
  };

  // Workflow status props for FormPageWrapper
  const workflowStatusProps = {
    currentStep: creditApplication?.workflow_state?.metadata?.step_number || 5, // Credit Questionnaire is typically step 5
    workflowType: "CREDIT_QUESTIONNAIRE",
    colors: colors,
    currentWorkflowState: { name: currentWorkflowState },
  };

  // Workflow actions props for FormPageWrapper
  const workflowActionsProps = {
    key: workflowInstanceId || 'new-questionnaire-actions',
    transitionLoading: transitionLoading,
    transitionError: transitionError,
    workflowInstanceId: workflowInstanceId,
    handleTransition: handleTransition,
    allowedTransitions: allowedTransitions || [],
    colors: colors,
  };
  
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Credit Questionnaire Form...</div>;

  return (
    <FormPageWrapper
      title="Credit Questionnaire Form"
      workflowStatusProps={workflowStatusProps}
      workflowActionsProps={workflowActionsProps}
    >

      {/* Form content - FormPageWrapper handles the white card styling */}
      <div>
        {/* Title is handled by FormPageWrapper */}
        
        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading form data...</div>}
        {!loading && !creditApplication && id && <div style={{ textAlign: 'center', padding: '2rem', color: '#E53E3E' }}>Could not load application data for ID: {id}.</div>}
        {!loading && !creditApplication && !id && <div style={{ textAlign: 'center', padding: '2rem', color: '#E53E3E' }}>No application ID provided.</div>}

        {creditApplication && !loading && (
        <>
          <CreditApplicationDetailsSection creditApplication={creditApplication} />
          
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
              <FormSection title="Business Model" description="Provide details on the counterparty's business model and key relationships.">
                <FormField 
                  label="Business Model Description" 
                  name="business_model_description" 
                  type="textarea" 
                  value={formData.business_model_description || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Basic details of counterparty business model (what do they do, how do they make money?)" 
                />
                <FormField 
                  label="Key Suppliers & Customers" 
                  name="key_suppliers_customers" 
                  type="textarea" 
                  value={formData.key_suppliers_customers || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Key suppliers and/or customers, typical terms of trade or credit provided to customers" 
                />
              </FormSection>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Core Trading" description="Details on primary trading activities and strategies.">
                <FormField 
                  label="Primary Products" 
                  name="primary_products" 
                  type="textarea" 
                  value={formData.primary_products || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What metals/products do they trade primarily (e.g., LME outrights, OTC averages, loco London gold)?" 
                />
                <FormField 
                  label="Trading Flow Drivers" 
                  name="trading_flow_drivers" 
                  type="textarea" 
                  value={formData.trading_flow_drivers || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What is that trading flow driven by (e.g., hedging inventory or OPs, their own clients' trading flows)?" 
                />
                <FormField 
                  label="Position Size Drivers" 
                  name="position_size_drivers" 
                  type="textarea" 
                  value={formData.position_size_drivers || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What determines the size/type of positions taken?" 
                />
                <FormField 
                  label="Typical & Maximum Tenor" 
                  name="typical_max_tenor" 
                  type="textarea" 
                  value={formData.typical_max_tenor || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Typical and maximum expected tenor of trades and/or hedges for each metal?" 
                />
                <FormField 
                  label="Strategic vs Proprietary Trading" 
                  name="strategic_vs_proprietary" 
                  type="select" 
                  value={formData.strategic_vs_proprietary || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  options={[
                    {value: '', label: 'Select option'},
                    {value: 'strategic', label: 'Strategic Hedging'},
                    {value: 'proprietary', label: 'Proprietary Trading'},
                    {value: 'both', label: 'Both'}
                  ]}
                />
              </FormSection>

              <FormSection title="Physical Positions" description="Details on physical metal financing and repo arrangements.">
                <FormField 
                  label="ICBCS Financing" 
                  name="icbcs_financing" 
                  type="textarea" 
                  value={formData.icbcs_financing || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Size ($ and equivalent volume) of ICBCS financing line?" 
                />
                <FormField 
                  label="Total Counterparty Financing Lines" 
                  name="total_counterparty_financing_lines" 
                  type="textarea" 
                  value={formData.total_counterparty_financing_lines || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Size ($ and volume) of client's total metal financing lines with all counterparties?" 
                />
                <FormField 
                  label="Repo Hedging Management" 
                  name="repo_hedging_management" 
                  type="textarea" 
                  value={formData.repo_hedging_management || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="How does the facility basis close the client and ICBCS manage hedging of the metal financed under repo?" 
                />
                <FormField 
                  label="Location & Grade Details" 
                  name="location_grade_details" 
                  type="textarea" 
                  value={formData.location_grade_details || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Metal, material grade (e.g., LGD) and financing locus for each transit?" 
                />
                <FormField 
                  label="Exit Risk Limits" 
                  name="exit_risk_limits" 
                  type="textarea" 
                  value={formData.exit_risk_limits || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Size of exit risk limits in place and assumed exit tenor?" 
                />
                <FormField 
                  label="Other Secured Trade Finance" 
                  name="other_secured_trade_finance" 
                  type="textarea" 
                  value={formData.other_secured_trade_finance || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Any other secured trade finance used by client?" 
                />
                <FormField 
                  label="Repo Balance Sheet Treatment" 
                  name="repo_balance_sheet_treatment" 
                  type="select" 
                  value={formData.repo_balance_sheet_treatment || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  options={[
                    {value: '', label: 'Select option'},
                    {value: 'on_balance_sheet', label: 'On balance sheet secured financing'},
                    {value: 'off_balance_sheet', label: 'Off balance sheet'}
                  ]}
                />
              </FormSection>

              <FormSection title="Notional Positions" description="Details on notional values and position capacity.">
                <FormField 
                  label="Notional Value Requested" 
                  name="notional_value_requested" 
                  type="textarea" 
                  value={formData.notional_value_requested || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What notional value do the requested IMPL or PFE lines rise to at current prices?" 
                />
                <FormField 
                  label="ICBCS Proportion of Total Book" 
                  name="icbcs_proportion_total_book" 
                  type="textarea" 
                  value={formData.icbcs_proportion_total_book || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Approximately what proportion of their total metals trading or hedge book could ICBCS account for?" 
                />
                <FormField 
                  label="Total Position Capacity" 
                  name="total_position_capacity" 
                  type="textarea" 
                  value={formData.total_position_capacity || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Including limits at other banks or brokers, what is the total size of position in oz/tonnes and USD they can run?" 
                />
                <FormField 
                  label="Position Business Context" 
                  name="position_business_context" 
                  type="textarea" 
                  value={formData.position_business_context || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Does that make sense in context of their underlying business?" 
                />
              </FormSection>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Hedge Effectiveness" description="Details on material basis risk and hedge accounting.">
                <FormField 
                  label="Material Basis Risk" 
                  name="material_basis_risk" 
                  type="textarea" 
                  value={formData.material_basis_risk || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What is the volume/value of any material basis risk that the counterparty cannot hedge?" 
                />
                <FormField 
                  label="Hedge Accounting" 
                  name="hedge_accounting" 
                  type="textarea" 
                  value={formData.hedge_accounting || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Is hedge accounting (IFRS 9 or ASC 815) applied to the metal hedges? Cash flow or fair value hedges?" 
                />
              </FormSection>

              <FormSection title="Stress Testing" description="Details on stress testing and risk management procedures.">
                <FormField 
                  label="Market Stress Tests" 
                  name="market_stress_tests" 
                  type="select" 
                  value={formData.market_stress_tests || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  options={[
                    {value: '', label: 'Select option'},
                    {value: 'yes', label: 'Yes'},
                    {value: 'no', label: 'No'}
                  ]}
                />
                <FormField 
                  label="Stress Management" 
                  name="stress_management" 
                  type="textarea" 
                  value={formData.stress_management || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="How do the results inform cash/liquid assets or risk management actions?" 
                />
                <FormField 
                  label="Stress Governance" 
                  name="stress_governance" 
                  type="textarea" 
                  value={formData.stress_governance || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Who sets/governs the stress/VaR levels?" 
                />
                <FormField 
                  label="Stress Assumptions" 
                  name="stress_assumptions" 
                  type="textarea" 
                  value={formData.stress_assumptions || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What are the stress assumptions?" 
                />
              </FormSection>

              <FormSection title="Policies & Governance" description="Details on trading policies and governance structure.">
                <FormField 
                  label="Trading Policy Governance" 
                  name="trading_policy_governance" 
                  type="textarea" 
                  value={formData.trading_policy_governance || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Who determines trading/hedge policies (e.g., Board)?" 
                />
              </FormSection>
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ width: '100%' }}>
              <FormSection title="Liquidity Management" description="Details on counterparty relationships and liquidity management.">
                <FormField 
                  label="Number of Other Counterparties" 
                  name="other_counterparties_count" 
                  type="number" 
                  value={formData.other_counterparties_count || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="How many other counterparties does the client use?" 
                />
                <FormField 
                  label="Available Derivative Lines" 
                  name="available_derivative_lines" 
                  type="textarea" 
                  value={formData.available_derivative_lines || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What are their total available derivative lines?" 
                />
                <FormField 
                  label="Cash & Banking Lines" 
                  name="cash_banking_lines" 
                  type="textarea" 
                  value={formData.cash_banking_lines || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="What available cash and banking lines (committed & uncommitted) does the client have available? How much is unutilized?" 
                />
                <FormField 
                  label="Treasury Management Structure" 
                  name="treasury_management_structure" 
                  type="select" 
                  value={formData.treasury_management_structure || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  options={[
                    {value: '', label: 'Select option'},
                    {value: 'centralized', label: 'Centralized'},
                    {value: 'entity_level', label: 'At entity level'}
                  ]}
                />
                <FormField 
                  label="USD Cash Location" 
                  name="usd_cash_location" 
                  type="textarea" 
                  value={formData.usd_cash_location || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Where is USD cash available for margin calls held and managed from?" 
                />
                <FormField 
                  label="China Parent Restrictions" 
                  name="china_parent_restrictions" 
                  type="textarea" 
                  value={formData.china_parent_restrictions || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="For entities reliant on a nonshore China parent, give details of USD cash position/terms/restrictions" 
                />
                <FormField 
                  label="Margining vs Unmargined" 
                  name="margining_vs_unmargined" 
                  type="textarea" 
                  value={formData.margining_vs_unmargined || ''} 
                  onChange={handleChange} 
                  colors={colors} 
                  placeholder="Are all hedging facilities subject to margining or are unmargined OTC lines also provided?" 
                />
              </FormSection>

              {/* Supporting Documentation Section */}
              <Box sx={{
                backgroundColor: colors.blueLight,
                padding: 2,
                borderRadius: 1,
                marginBottom: 2,
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <Typography sx={{ marginRight: 1.5, color: colors.standardBankBlue, marginTop: '0.125rem' }}>ℹ️</Typography>
                <Typography variant="body2" sx={{ color: colors.standardBankBlue }}>
                  Please attach any supporting documentation relevant to the credit questionnaire. Supporting documentation can be uploaded by clicking the &quot;Attach Document&quot; button below.
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
        </> 
        )} {/* End of conditional rendering for creditApplication */}
      </div>
    </FormPageWrapper>
  );
};

export default CreditQuestionnaireForm;
