import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const WorkflowActions = ({ onSubmit, formData, formRef, creditApplicationId }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState(null);
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Extract credit application ID from various sources
  const getCreditApplicationId = () => {
    // First, check if it was passed as a prop
    if (creditApplicationId) {
      console.log(`Using creditApplicationId from props: ${creditApplicationId}`);
      return creditApplicationId;
    }
    
    // Second, check if it's in the URL params
    if (params.id) {
      console.log(`Using creditApplicationId from URL params: ${params.id}`);
      return params.id;
    }
    
    // Third, try to extract from the URL path
    const pathSegments = location.pathname.split('/');
    const idFromPath = pathSegments[pathSegments.length - 1];
    if (idFromPath && idFromPath.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log(`Using creditApplicationId from URL path: ${idFromPath}`);
      return idFromPath;
    }
    
    console.error('No credit application ID available');
    return null;
  };
  
  useEffect(() => {
    const fetchWorkflowState = async () => {
      const id = getCreditApplicationId();
      if (!id) {
        console.error('Cannot fetch workflow state: No credit application ID');
        return;
      }
      
      try {
        const response = await axios.get(`/api/credit/credit-applications/${id}/`);
        const { workflow_state, available_transitions, workflow_instance } = response.data;
        
        console.log('Fetched workflow state:', workflow_state);
        console.log('Available transitions:', available_transitions);
        console.log('Workflow instance ID:', workflow_instance);
        
        setWorkflowState(workflow_state);
        setAvailableTransitions(available_transitions || []);
      } catch (err) {
        console.error('Error fetching workflow state:', err);
        setError('Failed to fetch workflow state');
      }
    };
    
    fetchWorkflowState();
  }, []);
  
  const handleSubmitForm = async (event) => {
    if (event) {
      event.preventDefault();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the credit application ID
      const id = getCreditApplicationId();
      if (!id) {
        throw new Error('No credit application ID available');
      }
      
      console.log('Submitting form with credit application ID:', id);
      
      // First, save the form data
      if (onSubmit) {
        console.log('Calling onSubmit to save form data');
        await onSubmit(event);
      } else if (formRef && formRef.current) {
        console.log('Submitting form via formRef');
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      } else {
        console.warn('No onSubmit handler or formRef provided');
      }
      
      // Now, fetch the credit application to get the workflow instance ID
      console.log(`Fetching credit application ${id} to get workflow instance ID`);
      const creditAppResponse = await axios.get(`/api/credit/credit-applications/${id}/`);
      const { workflow_instance: instanceId } = creditAppResponse.data;
      
      if (!instanceId) {
        throw new Error('Credit application has no workflow instance');
      }
      
      console.log(`Found workflow instance: ${instanceId}`);
      
      // Get the JWT token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Set up headers for the API calls
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Check if there's a credit request form with a workflow instance
      console.log('Checking for credit request form workflow instance');
      let creditRequestFormWorkflowId = null;
      
      try {
        // First, get the credit request form ID
        if (creditAppResponse.data.credit_request_form) {
          const creditRequestFormId = creditAppResponse.data.credit_request_form;
          console.log(`Found credit request form ID: ${creditRequestFormId}`);
          
          // Then, fetch the credit request form to get its workflow instance
          const formResponse = await axios.get(`/api/credit/credit-request-forms/${creditRequestFormId}/`);
          
          if (formResponse.data.workflow_instance) {
            creditRequestFormWorkflowId = formResponse.data.workflow_instance;
            console.log(`Found credit request form workflow instance: ${creditRequestFormWorkflowId}`);
          } else {
            console.warn('Credit request form has no workflow instance');
          }
        } else {
          console.warn('Credit application has no credit request form');
        }
      } catch (formError) {
        console.error('Error fetching credit request form:', formError);
        // Continue with parent process transition even if sub-process fails
      }
      
      // If we have the credit request form workflow ID, transition it
      if (creditRequestFormWorkflowId) {
        console.log(`Found sub-process workflow instance: ${creditRequestFormWorkflowId}`);
        
        // Transition the sub-process workflow
        console.log('Transitioning sub-process workflow with code CR_TR_5');
        const subProcessPayload = {
          transition_code: 'CR_TR_5',
          comments: 'Submitting credit request form'
        };
        
        // Make the direct API call for the sub-process
        const subProcessUrl = `/api/workflow-instances/${creditRequestFormWorkflowId}/transition/`;
        console.log(`Making POST request to: ${subProcessUrl} with payload:`, subProcessPayload);
        
        try {
          const subProcessResponse = await axios.post(subProcessUrl, subProcessPayload, { headers });
          console.log('Sub-process transition response:', subProcessResponse.data);
        } catch (subProcessError) {
          console.error('Error transitioning sub-process:', subProcessError);
          console.error('Error details:', subProcessError.response?.data || 'No response data');
        }
      }
      
      // Now transition the parent process
      console.log('Transitioning parent process with code PP_TR_1');
      const parentProcessPayload = {
        transition_code: 'PP_TR_1',
        comments: 'Moving to credit review pending'
      };
      
      // Make the direct API call for the parent process
      const parentProcessUrl = `/api/workflow-instances/${instanceId}/transition/`;
      console.log(`Making POST request to: ${parentProcessUrl} with payload:`, parentProcessPayload);
      
      try {
        const parentProcessResponse = await axios.post(parentProcessUrl, parentProcessPayload, { headers });
        console.log('Parent process transition response:', parentProcessResponse.data);
        alert('Credit request submitted for review successfully!');
        navigate('/');
      } catch (parentProcessError) {
        console.error('Error transitioning parent process:', parentProcessError);
        console.error('Error details:', parentProcessError.response?.data || 'No response data');
        alert('Credit request saved but parent workflow transition failed: ' + 
              (parentProcessError.response?.data?.detail || parentProcessError.message));
        navigate('/');
      }
    } catch (error) {
      console.error('Error in workflow transitions:', error);
      setError(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  const handleSaveAsDraft = async (event) => {
    if (event) {
      event.preventDefault();
    }
    
    try {
      if (onSubmit) {
        await onSubmit(event);
        alert('Credit request saved as draft');
        navigate('/');
      } else if (formRef && formRef.current) {
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        alert('Credit request saved as draft');
        navigate('/');
      } else {
        console.warn('No onSubmit handler or formRef provided');
      }
    } catch (error) {
      console.error('Error saving as draft:', error);
      setError(`Error: ${error.message}`);
    }
  };
  
  return (
    <div style={{ marginTop: '20px' }}>
      {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1 }}
          onClick={handleSaveAsDraft} 
          disabled={loading}
        >
          Save as Draft
        </button>
        
        <button 
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1 }}
          onClick={handleSubmitForm} 
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowActions;
