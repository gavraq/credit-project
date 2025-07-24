import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const WorkflowActions = ({
  allowedTransitions = [],
  handleTransition,
  transitionLoading,
  transitionError,
}) => {
  if (!allowedTransitions || allowedTransitions.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
        <Typography variant="subtitle1" gutterBottom>Form Actions</Typography>
        <Typography variant="body2" color="textSecondary">No actions currently available.</Typography>
        {transitionError && (
          <Typography color="error" sx={{ mt: 1 }}>
            {typeof transitionError === 'object' ? JSON.stringify(transitionError) : transitionError}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>Form Actions</Typography>
      
      {transitionError && (
        <Typography color="error" sx={{ mb: 2 }}>
           {typeof transitionError === 'object' ? JSON.stringify(transitionError) : transitionError}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {allowedTransitions.map((transition) => (
          <Button
            key={transition.code}
            variant="contained"
            onClick={() => handleTransition(transition.code, transition.name)} // Pass name as comment
            disabled={transitionLoading}
            sx={{ minWidth: '120px' }} 
          >
            {transitionLoading ? 'Processing...' : transition.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default WorkflowActions;
