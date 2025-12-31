import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchCreditRequest } from '../services/api';
import CreditRequestForm from './CreditRequestForm/index';
import CreditReviewForm from './CreditReviewForm/index';
import BusinessSponsorshipForm from './BusinessSponsorshipForm/index';
import CreditQuestionnaireForm from './CreditQuestionnaireForm/index';
import LegalReviewForm from './LegalReviewForm/index';
import CreditAnalysisForm from './CreditAnalysisForm/index';
import CreditCompilationForm from './CreditCompilationForm/index';
import CreditApprovalForm from './CreditApprovalForm/index';
import ClimateScorecard from './ClimateScorecard/index';
import TopNavBar from './TopNavBar'; // Assuming TopNavBar is used on these pages
import LogoutButton from './LogoutButton'; // Assuming LogoutButton is part of TopNavBar

const ApplicationLoader = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const formTypeFromQuery = queryParams.get('form_type');
  const modeFromQuery = queryParams.get('mode'); // 'edit' or 'view'
  const editMode = modeFromQuery !== 'view'; // Default to true unless explicitly 'view'
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

  const formComponentMap = {
    'creditrequestform': CreditRequestForm,
    'creditreviewform': CreditReviewForm,
    'businesssponsorshipform': BusinessSponsorshipForm,
    'creditquestionnaireform': CreditQuestionnaireForm,
    'legalreviewform': LegalReviewForm,
    'creditanalysisform': CreditAnalysisForm,
    'creditcompilationform': CreditCompilationForm,
    'creditapprovalform': CreditApprovalForm,
    'climatescorecard': ClimateScorecard,
  };

  let formKeyToUse = null;
  if (formTypeFromQuery) {
    formKeyToUse = formTypeFromQuery.toLowerCase().replace(/_/g, '');
  } else if (creditApplication && creditApplication.sub_processes && creditApplication.sub_processes.length > 0) {
    const firstSubProcess = creditApplication.sub_processes[0];
    if (firstSubProcess && firstSubProcess.form_key) {
      formKeyToUse = firstSubProcess.form_key.toLowerCase().replace(/_/g, '');
    }
  }

  const FormComponentToRender = formKeyToUse ? formComponentMap[formKeyToUse] : null;
  const mainWorkflowStep = 1; // This might need to be dynamic based on the form or state

  if (!FormComponentToRender) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <div>Error: Could not determine which form to load. Please check the URL or go back.</div>
      </>
    );
  }

  // Pass creditApplication data, mainWorkflowStep, and editMode to the selected form component.
  return <FormComponentToRender creditApplication={creditApplication} mainWorkflowStep={mainWorkflowStep} editMode={editMode} />;

};

export default ApplicationLoader;
