import React, { useState, useRef } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';

const WorkflowActions = ({
  allowedTransitions = [],
  handleTransition,
  transitionLoading = false,
  transitionError = null,
  isNewForm = false,
  handleSubmit, // For new forms
  currentState = '', // Current workflow state name
}) => {
  const [selectedTransition, setSelectedTransition] = useState(null);
  // Use ref to prevent double-clicks (React state updates can be batched)
  const isProcessingRef = useRef(false);

  const handleTransitionClick = async (transition) => {
    // Use ref for immediate check (prevents race condition with React state batching)
    if (transitionLoading || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      setSelectedTransition(transition.code);
      await handleTransition(transition, '');
      setSelectedTransition(null);
    } catch (error) {
      setSelectedTransition(null);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const getButtonColor = (transition) => {
    const code = transition.code.toLowerCase();
    const name = transition.name.toLowerCase();
    
    // Determine button color based on transition type
    if (code.includes('submit') || name.includes('submit')) {
      return 'success';
    } else if (code.includes('reject') || name.includes('reject')) {
      return 'error';
    } else if (code.includes('approve') || name.includes('approve')) {
      return 'success';
    } else if (code.includes('save') || name.includes('save') || code.includes('draft')) {
      return 'primary';
    } else {
      return 'primary';
    }
  };

  // For new forms, show Save as Draft button
  if (isNewForm) {
    return (
      <Box sx={{ 
        mt: 2, 
        p: 3, 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: '#333',
            fontWeight: 600,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Workflow Actions
        </Typography>
        
        {transitionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof transitionError === 'object' ? JSON.stringify(transitionError) : transitionError}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={transitionLoading}
            sx={{ 
              minWidth: '140px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            {transitionLoading ? 'Saving...' : 'Save as Draft'}
          </Button>
          
          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
            Additional workflow actions will be available after saving.
          </Typography>
        </Box>
      </Box>
    );
  }
  
  // For existing forms with no transitions
  if (!allowedTransitions || allowedTransitions.length === 0) {
    return (
      <Box sx={{ 
        mt: 2, 
        p: 3, 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: '#333',
            fontWeight: 600,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Workflow Actions
        </Typography>
        
        {currentState && (
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={`Current State: ${currentState}`} 
              color="info" 
              variant="outlined"
              size="small"
            />
          </Box>
        )}
        
        {transitionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof transitionError === 'object' ? JSON.stringify(transitionError) : transitionError}
          </Alert>
        )}
        
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No workflow actions are currently available for your role and the current state.
        </Typography>
      </Box>
    );
  }

  // For existing forms with available transitions
  return (
    <Box sx={{ 
      mt: 2, 
      p: 3, 
      border: '1px solid #e0e0e0', 
      borderRadius: 2, 
      backgroundColor: '#f8f9fa',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          color: '#333',
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
        >
        Workflow Actions
      </Typography>
      
      {currentState && (
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`Current State: ${currentState}`} 
            color="info" 
            variant="outlined"
            size="small"
          />
        </Box>
      )}
      
      {transitionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof transitionError === 'object' ? JSON.stringify(transitionError) : transitionError}
        </Alert>
      )}
      
      {/* Dynamic buttons based on allowed transitions */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        {allowedTransitions.map((transition) => {
          const buttonColor = getButtonColor(transition);
          const isProcessing = transitionLoading && selectedTransition === transition.code;
          
          return (
            <Button
              key={transition.code}
              variant="contained"
              color={buttonColor}
              onClick={() => handleTransitionClick(transition)}
              disabled={transitionLoading}
              title={transition.description}
              sx={{ 
                minWidth: '132px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                transition.name
              )}
            </Button>
          );
        })}
      </Box>
      
      {allowedTransitions.length > 0 && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            mt: 3,
            fontStyle: 'italic',
            color: '#7B8794', // neutral600 from theme
            fontSize: '0.75rem',
            lineHeight: '1rem'
          }}
        >
          Available actions are based on your role and the current workflow state.
        </Typography>
      )}
    </Box>
  );
};

export default WorkflowActions;
