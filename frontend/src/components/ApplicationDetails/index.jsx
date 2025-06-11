import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Button, Divider } from '@mui/material';
import { get } from '../../services/api';
import TopNavBar from '../TopNavBar'; 
import LogoutButton from '../LogoutButton';
import WorkflowStatus from '../common/WorkflowStatus'; // Assuming this is the correct path

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/credit/credit-applications/${id}/`);
        setApplication(response.data);
      } catch (err) {
        setError('Failed to fetch application details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleNavigate = (formModelName, mode) => {
    // This will navigate to the generic loader, which will then load the correct form.
    navigate(`/credit-requests/${id}/edit?form_type=${formModelName}&mode=${mode}`);
  };

  if (loading) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <Container><Alert severity="error">{error}</Alert></Container>
      </>
    );
  }

  let mainWorkflowStep = 1; // Default
  if (application && application.workflow_state?.code) {
    const workflowStateCode = application.workflow_state.code;
    switch (workflowStateCode) {
      case 'CREDIT_PAPER_CREDIT_REQUEST':
        mainWorkflowStep = 1;
        break;
      case 'CREDIT_PAPER_CREDIT_REVIEW_PENDING':
        mainWorkflowStep = 2;
        break;
      case 'CREDIT_PAPER_BUSINESS_SPONSOR_PENDING':
        mainWorkflowStep = 3;
        break;
      case 'CREDIT_PAPER_ANALYSIS_PENDING':
        mainWorkflowStep = 4;
        break;
      // Future states can be added here
      default:
        mainWorkflowStep = 1;
        break;
    }
  }

  if (!application) {
    return (
      <>
        <TopNavBar LogoutButton={LogoutButton} />
        <Container><Typography>No application data found.</Typography></Container>
      </>
    );
  }

  return (
    <>
      <TopNavBar LogoutButton={LogoutButton} />
      {application && <WorkflowStatus creditApplication={application} currentStep={mainWorkflowStep} />}
      <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {application.title || 'Application Hub'}
        </Typography>
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" component="h2">
            Application: {application.reference_number}
          </Typography>
          <Typography>Status: {application.workflow_state?.name || 'N/A'}</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sub-Processes
          </Typography>
          <List>
            {application.sub_processes && application.sub_processes.length > 0 ? (
              application.sub_processes.map((process, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText 
                      primary={process.form_type} 
                      secondary={`Status: ${process.workflow_state || 'Not Started'}`}
                    />
                    <Button 
                      variant="contained" 
                      onClick={() => {
                        const mode = process.available_transitions?.length > 0 ? 'edit' : 'view';
                        handleNavigate(process.form_model_name, mode);
                      }}
                      // A simple logic to decide button text. Can be enhanced.
                      disabled={!process.form_model_name}
                    >
                      {process.available_transitions?.length > 0 ? 'Edit' : 'View'}
                    </Button>
                  </ListItem>
                  {index < application.sub_processes.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <Typography>No sub-processes found for this application.</Typography>
            )}
          </List>
        </Paper>
      </Box>
    </Container>
    </>
  );
};

export default ApplicationDetails;
