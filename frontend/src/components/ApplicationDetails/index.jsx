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
        console.log('ApplicationDetails - Fetched application:', response.data);
        console.log('ApplicationDetails - Sub-processes:', response.data.sub_processes);
        console.log('ApplicationDetails - Workflow state:', response.data.workflow_state);
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

  // Get workflow step dynamically from metadata (metadata-driven approach)
  let mainWorkflowStep = 1; // Default
  
  if (application && application.workflow_state) {
    console.log('ApplicationDetails - Workflow state:', application.workflow_state);
    console.log('ApplicationDetails - State metadata:', application.workflow_state.metadata);
    
    if (application.workflow_state.metadata?.step_number) {
      // Use metadata-driven step number (preferred approach)
      mainWorkflowStep = application.workflow_state.metadata.step_number;
      console.log('ApplicationDetails - Using metadata step_number:', mainWorkflowStep);
    } else if (application.workflow_state.code) {
      // Fallback: derive step from state name if metadata not available
      const workflowStateCode = application.workflow_state.code;
      console.log('ApplicationDetails - No step_number in metadata, falling back to string matching for:', workflowStateCode);
      
      if (workflowStateCode.includes('CREDIT_REQUEST')) {
        mainWorkflowStep = 1;
      } else if (workflowStateCode.includes('CREDIT_REVIEW') || workflowStateCode.includes('REVIEW_PENDING')) {
        mainWorkflowStep = 2;
      } else if (workflowStateCode.includes('BUSINESS_SPONSOR') || workflowStateCode.includes('SPONSOR_PENDING')) {
        mainWorkflowStep = 3;
      } else if (workflowStateCode.includes('ANALYSIS') || workflowStateCode.includes('ANALYSIS_PENDING')) {
        mainWorkflowStep = 4;
      } else if (workflowStateCode.includes('COMPILATION')) {
        mainWorkflowStep = 5;
      } else if (workflowStateCode.includes('APPROVAL_PENDING') || workflowStateCode.includes('APPROVED') || workflowStateCode.includes('REJECTED')) {
        mainWorkflowStep = 6;
      }
      
      console.log('ApplicationDetails - Fallback determined step:', mainWorkflowStep, 'for state:', workflowStateCode);
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
      <Container maxWidth="lg">
        {application && (
          <Box sx={{ px: 3, pt: 2 }}>
            <WorkflowStatus creditApplication={application} currentStep={mainWorkflowStep} />
          </Box>
        )}
        <Box sx={{ my: 4, px: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {application.title || 'Application Hub'}
        </Typography>
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" component="h2">
            Application: {application.reference_number}
          </Typography>
          <Typography>Status: {application.workflow_state?.name || 'N/A'}</Typography>
          {application.current_user_role && (
            <Typography variant="body2" color="text.secondary">
              Your Role: {application.current_user_role.name}
            </Typography>
          )}
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
                      primary={process.form_name} 
                      secondary={`Status: ${process.data?.workflow_instance?.current_state || 'Not Started'}`}
                    />
                    <Button 
                      variant="contained" 
                      onClick={() => {
                        // Use backend-determined permission for edit/view mode
                        const mode = process.can_edit ? 'edit' : 'view';
                        handleNavigate(process.form_key, mode);
                      }}
                      disabled={!process.form_key}
                    >
                      {process.can_edit ? 'Edit' : 'View'}
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
