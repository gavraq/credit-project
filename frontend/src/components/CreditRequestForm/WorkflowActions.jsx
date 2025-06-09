import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const WorkflowActions = ({ 
  onSubmit, 
  formRef, // Consider if formRef is still needed if onSubmit is primary
  workflowInstanceId, // CHANGED from workflowInstance
  currentState, // Prop for current state name
  allowedTransitions = [], // Prop for available transitions
  transitionLoading, // Prop for parent's transition loading state
  transitionError,   // Prop for parent's transition error message
  handleTransition,  // Prop for parent's function to call for a transition
  colors
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // const params = useParams(); // Not used
  // const location = useLocation(); // Not used
  console.log('WorkflowActions rendered/updated. Props received - workflowInstanceId:', workflowInstanceId, 'currentState:', currentState, 'allowedTransitions:', allowedTransitions);
  
  // Directly use props: currentState, allowedTransitions. Internal state for these is removed.
  
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
        const submitResult = await onSubmit(event); // onSubmit is handleSubmit in CreditRequestForm
        // Assuming onSubmit (parent's handleSubmit) now returns an object like { success: true } or { success: false, error: 'message' }
        // or throws an error on failure.
        if (submitResult && submitResult.success === false) { 
          throw new Error(submitResult.error || 'Form save failed before transition');
        }
        // If onSubmit throws, it will be caught by the catch block.
      } else if (formRef && formRef.current) {
        console.log('Submitting form via formRef');
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      } else {
        console.warn('No onSubmit handler or formRef provided');
        throw new Error('No way to submit the form');
      }
      
      // Check if we have a workflow instance
      // The parent (e.g., CreditRequestForm) is responsible for having the workflowInstanceId.
      // The parent's handleTransition function will use its own workflowInstanceId.

      // Find the appropriate transition code for 'Submit for Review'.
      // This logic might need to be more robust or configurable depending on actual transition names/codes.
      const submitTransition = allowedTransitions.find(
        t => (t.name && t.name.toLowerCase().includes('submit')) || 
             (t.code && (t.code === 'CR_TR_5' || t.code.toLowerCase().includes('submit'))) // Example codes
      );

      if (!submitTransition) {
        console.error('WorkflowActions: "Submit for Review" transition not found in allowedTransitions:', allowedTransitions);
        throw new Error('"Submit for Review" action is not currently available.');
      }

      console.log(`WorkflowActions: Found submit transition: ${submitTransition.code}. Calling handleTransition.`);
      if (handleTransition) {
        // Call the parent's handleTransition function
        // It will use its own workflowInstanceId and perform the API call.
        await handleTransition(submitTransition.code, 'Submitted for review'); // Pass the dynamic code
        
        // Navigation should ideally be handled by the parent form after a successful transition,
        // or based on the result of handleTransition.
        // navigate('/'); // Consider removing navigation from here or making it conditional.
      } else {
        console.error('WorkflowActions: handleTransition prop is not provided.');
        throw new Error('Cannot perform transition: handler not available.');
      }
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
