import React from 'react';

/**
 * Debug panel component for testing workflow functionality
 * Only used during development
 */
const DebugPanel = ({ 
  id,
  workflowInstanceId, 
  setWorkflowInstanceId, 
  currentState, 
  allowedTransitions,
  fetchWorkflowInstance,
  fetchCreditApp,
  createWorkflowInstance
}) => {
  // Function to perform a direct workflow transition
  const doDirectTransition = async () => {
    if (!workflowInstanceId) {
      alert('No workflow instance ID available');
      return;
    }
    
    console.log('TEST BUTTON: Performing direct transition with PP_TR_1');
    try {
      const { post } = await import('../../services/api');
      const payload = {
        transition_code: 'PP_TR_1',
        comments: 'Test transition'
      };
      const url = `/api/workflow-instances/${workflowInstanceId}/transition/`;
      const result = await post(url, payload);
      console.log('TEST BUTTON: Transition result:', result);
      alert('Transition successful!');
    } catch (error) {
      console.error('TEST BUTTON: Error performing transition:', error);
      alert('Transition failed: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    }
  };

  return (
    <div className="debug-section" style={{ marginTop: '0.5rem', padding: '1rem', border: '1px dashed #ccc', borderRadius: '0.5rem', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Debug Tools</h3>
    
      <div style={{ marginBottom: '0.5rem' }}>
        <div>Workflow Instance ID: <span id="workflow-instance-id">{workflowInstanceId || 'Not loaded'}</span></div>
        <div>Current State: <span id="current-state">{currentState || 'Unknown'}</span></div>
        <div>Available Transitions: <span id="available-transitions">
          {allowedTransitions && allowedTransitions.length > 0 
            ? allowedTransitions.map(t => t.code).join(', ') 
            : 'None'}
        </span></div>
      </div>
      
      <button 
        id="fetch-credit-app-btn"
        style={{ backgroundColor: '#4caf50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', marginRight: '1rem' }}
        onClick={fetchCreditApp}
      >
        TEST: Fetch Credit Application
      </button>
      
      <button 
        id="create-workflow-btn"
        style={{ backgroundColor: '#4caf50', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', marginRight: '1rem' }}
        onClick={createWorkflowInstance}
      >
        TEST: Create Workflow Instance
      </button>
      
      <button 
        style={{ backgroundColor: '#ff5722', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem' }}
        onClick={doDirectTransition}
      >
        TEST: Direct Transition (PP_TR_1)
      </button>
    </div>
  );
};

export default DebugPanel;
