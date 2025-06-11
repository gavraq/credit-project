import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchCreditRequest } from '../services/api';
import CreditRequestForm from './CreditRequestForm/index';
import CreditReviewForm from './CreditReviewForm/index';
import BusinessSponsorshipForm from './BusinessSponsorshipForm/index';
import CreditQuestionnaireForm from './CreditQuestionnaireForm/index';
import TopNavBar from './TopNavBar'; // Assuming TopNavBar is used on these pages
import LogoutButton from './LogoutButton'; // Assuming LogoutButton is part of TopNavBar

const ApplicationLoader = () => {
  const { id } = useParams();
  const [creditApplication, setCreditApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        const data = await fetchCreditRequest(id);
        setCreditApplication(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching credit application:', err);
        setError(err.message || 'Failed to load application data.');
        setCreditApplication(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadApplication();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <div>Loading application details...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <div>Error: {error}</div>
      </>
    );
  }

  if (!creditApplication) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <div>No application data found.</div>
      </>
    );
  }

  // Determine which form to render based on workflow state
  const workflowStateCode = creditApplication.workflow_state?.code;
  console.log(`[ApplicationLoader] Application ID: ${id}, Workflow State Code: ${workflowStateCode}`);

  let mainWorkflowStep = 1; // Default to 'Credit Request'
  let FormComponentToRender;

  // It's crucial to get the exact state codes from your backend workflow definition.
  // These are examples based on previous logs.
  if (workflowStateCode === 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING') {
    console.log('[ApplicationLoader] Routing to BusinessSponsorshipForm');
    FormComponentToRender = BusinessSponsorshipForm;
    mainWorkflowStep = 3; // 'Business Sponsorship' is step 3
  } else if (workflowStateCode === 'CREDIT_PAPER_ANALYSIS_PENDING') {
    console.log('[ApplicationLoader] Routing to CreditQuestionnaireForm');
    FormComponentToRender = CreditQuestionnaireForm;
    mainWorkflowStep = 4; // Assuming 'Credit Analysis / Questionnaire' is step 4
  } else if (workflowStateCode === 'CREDIT_PAPER_CREDIT_REVIEW_PENDING') {
    console.log('[ApplicationLoader] Routing to CreditReviewForm');
    FormComponentToRender = CreditReviewForm;
    mainWorkflowStep = 2; // 'Credit Review' is step 2
  } else {
    // Default to CreditRequestForm for other states (e.g., DRAFT, or if state is unexpected)
    // Or handle specific states like 'CREDIT_REQUEST_DRAFT', 'CREDIT_REQUEST_NEW_INSTANCE_PENDING_DATA_ENTRY' etc.
    console.log('[ApplicationLoader] Defaulting to CreditRequestForm (editMode=true)');
    FormComponentToRender = CreditRequestForm;
    mainWorkflowStep = 1; // 'Credit Request' is step 1
  }

  // Pass creditApplication data and mainWorkflowStep to the selected form component
  // CreditRequestForm expects editMode, others might expect the full application object or specific parts.
  // For simplicity and future flexibility, let's pass the whole creditApplication and mainWorkflowStep.
  // Individual forms can then destructure what they need.
  if (FormComponentToRender === CreditRequestForm) {
    return <FormComponentToRender creditApplication={creditApplication} mainWorkflowStep={mainWorkflowStep} editMode={true} />;
  }
  return <FormComponentToRender creditApplication={creditApplication} mainWorkflowStep={mainWorkflowStep} />;

};

export default ApplicationLoader;
