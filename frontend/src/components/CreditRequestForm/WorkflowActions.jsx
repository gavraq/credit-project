import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const WorkflowActions = ({ 
  onSubmit, 
  formRef, 
  workflowInstance,
  currentState,
  allowedTransitions = [],
  transitionLoading,
  transitionError,
  handleTransition,
  colors
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState(null);
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Use the provided workflow state and transitions
  useEffect(() => {
    if (currentState) {
      setWorkflowState(currentState);
    }
    if (allowedTransitions && allowedTransitions.length > 0) {
      setAvailableTransitions(allowedTransitions);
    }
  }, [currentState, allowedTransitions]);
  
  const handleSubmitForm = async (event) => {
    if (event) {
      event.preventDefault();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting form for review');
      
      // First, save the form data using the provided onSubmit handler
      if (onSubmit) {
        console.log('Calling onSubmit to save form data');
        const submitResult = await onSubmit(event);
        if (!submitResult) {
          throw new Error('Form submission failed');
        }
      } else if (formRef && formRef.current) {
        console.log('Submitting form via formRef');
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      } else {
        console.warn('No onSubmit handler or formRef provided');
        throw new Error('No way to submit the form');
      }
      
      // Check if we have a workflow instance
      if (!workflowInstance) {
        throw new Error('No workflow instance available');
      }
      
      const instanceId = typeof workflowInstance === 'object' ? 
        workflowInstance.id : workflowInstance;
      
      console.log(`Using workflow instance: ${instanceId}`);
      
      // Perform the workflow transition
      console.log('Transitioning workflow with code PP_TR_1');
      const transitionPayload = {
        transition_code: 'PP_TR_1',
        comments: 'Moving to credit review pending'
      };
      
      const { post } = await import('../../services/api');
      const transitionUrl = `/api/workflow-instances/${instanceId}/transition/`;
      console.log(`Making POST request to: ${transitionUrl} with payload:`, transitionPayload);
      
      const transitionResponse = await post(transitionUrl, transitionPayload);
      console.log('Transition response:', transitionResponse.data);
      
      // Navigate to dashboard without alert
      navigate('/');
    } catch (error) {
      console.error('Error submitting form for review:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveAsDraft = async (event) => {
    console.log('handleSaveAsDraft called with event:', event);
    if (event) {
      event.preventDefault();
    }
    console.log('Attempting to save form as draft');
    setLoading(true);
    setError(null);
    
    try {
      if (onSubmit) {
        console.log('Using onSubmit handler to save form');
        const submitResult = await onSubmit(event);
        console.log('Form saved successfully via onSubmit');
        navigate('/');
      } else if (formRef && formRef.current) {
        console.log('Using formRef to trigger form submission');
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        console.log('Form submitted via formRef');
        navigate('/');
      } else {
        console.error('No onSubmit handler or formRef provided - cannot save form');
        throw new Error('No way to submit the form');
      }
    } catch (error) {
      console.error('Error saving as draft:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('handleSaveAsDraft completed');
    }
  };
  
  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '15px', 
      border: `1px solid ${colors?.border || '#ddd'}`, 
      borderRadius: '5px', 
      backgroundColor: colors?.background || '#f9f9f9' 
    }}>
      <h3 style={{ marginTop: 0, color: colors?.text || '#333' }}>Form Actions</h3>
      
      {/* Show any errors from this component */}
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {/* Show any errors from parent component */}
      {transitionError && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {transitionError}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: colors?.secondaryButton || '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (loading || transitionLoading) ? 'not-allowed' : 'pointer', 
            opacity: (loading || transitionLoading) ? 0.65 : 1 
          }}
          onClick={handleSaveAsDraft} 
          disabled={loading || transitionLoading}
        >
          {(loading || transitionLoading) ? 'Saving...' : 'Save as Draft'}
        </button>
        
        <button 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: colors?.primaryButton || '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (loading || transitionLoading) ? 'not-allowed' : 'pointer', 
            opacity: (loading || transitionLoading) ? 0.65 : 1 
          }}
          onClick={handleSubmitForm} 
          disabled={loading || transitionLoading}
        >
          {(loading || transitionLoading) ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowActions;
