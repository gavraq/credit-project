import React from 'react';

// Workflow actions component for handling form submission and workflow transitions
const WorkflowActions = ({ 
  transitionLoading, 
  transitionError, 
  handleSubmit, 
  handleTransition, 
  workflowInstance, 
  currentState, 
  allowedTransitions,
  colors 
}) => {
  return (
    <>
      {/* Form actions footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button
          style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', color: colors.neutral800, fontWeight: '500', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: `1px solid ${colors.neutral400}`, cursor: 'pointer' }}
          type="button"
          onClick={() => window.history.back()}
        >
          <span style={{ marginRight: '0.5rem' }}>←</span>Back
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Save as Draft: Just saves the form, keeps state as DRAFT */}
          <button
            style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
            type="button"
            disabled={transitionLoading}
            onClick={handleSubmit}
          >
            {transitionLoading ? 'Saving...' : 'Save as Draft'}
          </button>
          {/* Update Credit Paper: triggers CR_TR_2 transition */}
          <button
            style={{ backgroundColor: colors.standardBankBlue, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
            type="button"
            disabled={transitionLoading}
            onClick={() => handleTransition('CR_TR_2')}
          >
            {transitionLoading ? 'Updating...' : 'Update Credit Paper'}
          </button>
          {/* Submit for Credit Review: triggers CR_TR_4 transition */}
          <button
            style={{ backgroundColor: colors.standardBankBlue, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: transitionLoading ? 'not-allowed' : 'pointer', opacity: transitionLoading ? 0.7 : 1 }}
            type="button"
            disabled={transitionLoading}
            onClick={() => handleTransition('CR_TR_4')}
          >
            {transitionLoading ? 'Submitting...' : 'Submit for Credit Review'}
          </button>
        </div>
        {/* Error feedback for footer actions */}
        {transitionError && (
          <div style={{ color: colors.error, marginTop: '1rem' }}>{transitionError}</div>
        )}
      </div>
      
      {/* Workflow State & Actions */}
      {workflowInstance && (
        <div style={{ margin: '2rem 0', padding: '1rem', background: colors.blueLight, borderRadius: '0.5rem', border: `1px solid ${colors.standardBankBlue}` }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: colors.standardBankBlue }}>
            Workflow State: <span style={{ fontWeight: 600 }}>{currentState}</span>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {allowedTransitions.length === 0 ? (
              <span style={{ color: colors.neutral600 }}>No actions available for your role at this state.</span>
            ) : (
              allowedTransitions.map(tr => (
                <button
                  key={tr.code}
                  disabled={transitionLoading}
                  style={{
                    backgroundColor: colors.standardBankBlue,
                    color: 'white',
                    padding: '0.5rem 1.25rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    cursor: transitionLoading ? 'not-allowed' : 'pointer',
                    opacity: transitionLoading ? 0.8 : 1,
                  }}
                  title={tr.description}
                  onClick={() => handleTransition(tr.code)}
                >
                  {tr.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowActions;
