import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopNavBar from '../TopNavBar';
import { fetchCreditRequest, submitCreditReview } from '../../services/api';
import { useSelector } from 'react-redux';
import LogoutButton from '../LogoutButton';

// Import sub-components
import WorkflowStatus from './WorkflowStatus';
import FormField from './FormField';
import FormSection from './FormSection';

const CreditReviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [creditApplication, setCreditApplication] = useState(null);
  const user = useSelector(state => state.auth.user);

  // Form state
  const [creditReviewer, setCreditReviewer] = useState('');
  const [assignedAnalyst, setAssignedAnalyst] = useState('');
  const [delegatedAuthority, setDelegatedAuthority] = useState('');
  const [needQuestionnaire, setNeedQuestionnaire] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchCreditRequest(id);
        setCreditApplication(data);
        
        // Set form start date if it's a new form
        if (!formStartDate) {
          setFormStartDate(new Date().toISOString().split('T')[0]);
        }
        
        // If we have existing credit review form data, populate the form
        if (data.credit_review_form) {
          const formData = data.credit_review_form;
          
          // Populate form fields from existing data
          setCreditReviewer(formData.credit_reviewer || user?.name || '');
          setAssignedAnalyst(formData.assigned_analyst || '');
          setDelegatedAuthority(formData.delegated_authority || '');
          setNeedQuestionnaire(formData.need_questionnaire || '');
          setAdditionalInfo(formData.additional_info || '');
          setRejectionReason(formData.rejection_reason || '');
          setFormStartDate(formData.form_start_date || new Date().toISOString().split('T')[0]);
          setFormCompletionDate(formData.form_completion_date || '');
        } else {
          // Default the credit reviewer to the current user
          setCreditReviewer(user?.name || '');
        }
      } catch (error) {
        console.error('Error fetching credit application:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setTransitionLoading(true);
    setTransitionError(null);
    
    try {
      // Log form values for debugging
      console.log('Form values before submission:', {
        creditReviewer,
        assignedAnalyst,
        delegatedAuthority,
        needQuestionnaire,
        additionalInfo,
        rejectionReason
      });
      
      // Prepare the payload
      const payload = {
        credit_review_form: {
          credit_reviewer: creditReviewer,
          assigned_analyst: assignedAnalyst,
          delegated_authority: delegatedAuthority,
          need_questionnaire: needQuestionnaire === 'yes',
          additional_info: additionalInfo,
          rejection_reason: rejectionReason,
          form_start_date: formStartDate,
          form_completion_date: isDraft ? '' : new Date().toISOString().split('T')[0]
        }
      };
      
      // If not a draft, set the completion date
      if (!isDraft) {
        payload.credit_review_form.form_completion_date = new Date().toISOString().split('T')[0];
      }
      
      // Submit the form
      const response = await submitCreditReview(id, payload);
      
      // Handle successful submission
      if (isDraft) {
        alert('Draft saved successfully');
      } else {
        alert('Credit Review submitted successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting credit review:', error);
      setTransitionError(error.message || 'An error occurred while submitting the form');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    // Handle rejection logic
    handleSubmit({ preventDefault: () => {} }, false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <TopNavBar>
        <LogoutButton />
      </TopNavBar>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600',
          color: colors.neutral800,
          marginBottom: '0.5rem'
        }}>
          Credit Review Form
        </h1>
        <p style={{ color: colors.neutral600 }}>
          Review and assess the credit application
        </p>
      </div>
      
      <WorkflowStatus currentStep={2} />
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <FormSection title="Credit Application Details" description="Review the credit application details">
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Reference Number:</strong> {creditApplication?.reference_number}</p>
            <p><strong>Title:</strong> {creditApplication?.title}</p>
            <p><strong>Counterparty:</strong> {creditApplication?.counterparty?.name}</p>
            <p><strong>Priority:</strong> {creditApplication?.priority}</p>
            <p><strong>Required By:</strong> {creditApplication?.required_by_date}</p>
          </div>
        </FormSection>
        
        <FormSection title="Credit Reviewer Information" description="Provide information about the credit reviewer">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <FormField 
              label="Credit Reviewer" 
              placeholder="Enter credit reviewer name" 
              value={creditReviewer}
              onChange={(e) => setCreditReviewer(e.target.value)}
              colors={colors}
              required
            />
            <FormField 
              label="Assigned Credit Analyst" 
              placeholder="Enter assigned credit analyst name" 
              value={assignedAnalyst}
              onChange={(e) => setAssignedAnalyst(e.target.value)}
              colors={colors}
              required
            />
          </div>
        </FormSection>
        
        <FormSection title="Delegated Authority" description="Specify the delegated authority level required for approval">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }}>
            <FormField 
              label="Delegated Authority (DA) Level" 
              type="select"
              options={[
                { value: "", label: "Select DA Level" },
                { value: "1", label: "DA1 - Board" },
                { value: "2", label: "DA2 - Credit Committee" },
                { value: "3", label: "DA3 - Chief Risk Officer" },
                { value: "4", label: "DA4 - Head of Credit" },
                { value: "5", label: "DA5 - Department Head" },
                { value: "6", label: "DA6 - Senior Credit Analyst" },
                { value: "7", label: "DA7 - Credit Analyst" },
                { value: "8", label: "DA8 - Junior Credit Analyst" }
              ]} 
              value={delegatedAuthority}
              onChange={(e) => setDelegatedAuthority(e.target.value)}
              colors={colors}
              required
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem' 
            }}>
              Need for additional Credit Questionnaire? <span style={{ color: colors.icbcRed }}>*</span>
            </p>
            <FormField 
              type="radio" 
              name="needQuestionnaire"
              value={needQuestionnaire}
              onChange={(e) => setNeedQuestionnaire(e.target.value)}
              options={[
                { value: "yes", label: "Yes - additional questionnaire required" },
                { value: "no", label: "No - sufficient information provided" }
              ]} 
              colors={colors}
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <FormField 
              label="Request additional information from Front Office" 
              type="textarea" 
              placeholder="Specify any additional information required from the Front Office" 
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              colors={colors}
            />
          </div>
          
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: colors.redLight,
            borderRadius: '0.5rem'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              color: colors.icbcRed
            }}>
              Rejection Details
            </p>
            <FormField 
              label="Rejection Reason" 
              type="textarea" 
              placeholder="If rejecting this credit request, please provide detailed reasons" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              colors={colors}
            />
          </div>
        </FormSection>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '2rem' 
        }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'white',
              color: colors.neutral800,
              fontWeight: '500',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.neutral400}`,
              cursor: 'pointer'
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>←</span>
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={(e) => handleSubmit(e, true)}
              disabled={transitionLoading}
              style={{ 
                backgroundColor: 'white',
                border: `1px solid ${colors.neutral400}`,
                color: colors.neutral800,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: transitionLoading ? 'not-allowed' : 'pointer',
                opacity: transitionLoading ? 0.7 : 1
              }}
            >
              Save as Draft
            </button>
            
            {rejectionReason ? (
              <button 
                onClick={handleReject}
                disabled={transitionLoading}
                style={{ 
                  backgroundColor: colors.icbcRed,
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: transitionLoading ? 'not-allowed' : 'pointer',
                  opacity: transitionLoading ? 0.7 : 1
                }}
              >
                Reject Application
              </button>
            ) : (
              <button 
                onClick={(e) => handleSubmit(e, false)}
                disabled={transitionLoading}
                style={{ 
                  backgroundColor: colors.standardBankBlue,
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: transitionLoading ? 'not-allowed' : 'pointer',
                  opacity: transitionLoading ? 0.7 : 1
                }}
              >
                Submit for Business Sponsorship
              </button>
            )}
          </div>
        </div>
        
        {transitionError && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: colors.redLight, 
            color: colors.icbcRed,
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}>
            {transitionError}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditReviewForm;
