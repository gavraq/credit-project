import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

// Placeholder data - in a real app, this would come from props or state
const versionInfo = {
  version: 'Draft - v0.2',
  lastSaved: 'May 6, 2025, 09:30 AM',
};

const VersionControlHeader = ({ version = versionInfo.version, lastSaved = versionInfo.lastSaved }) => {
  const handleSaveVersion = () => undefined;

  const handleViewHistory = () => undefined;

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem', // Corresponds to mb-6 in Tailwind
      paddingY: 1 // Added some vertical padding for better spacing
    }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium', marginRight: 1 }}>
            Version:
          </Typography>
          <Chip label={version} size="small" sx={{ backgroundColor: 'grey.200', color: 'grey.800' }} />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Last saved: {lastSaved}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}> {/* Corresponds to gap-3 */}
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleSaveVersion}
          sx={{ textTransform: 'none', fontSize: '0.75rem' }} // text-xs
        >
          {/* Using text instead of icons for simplicity, can be enhanced later */}
          Save Version
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleViewHistory}
          sx={{ textTransform: 'none', fontSize: '0.75rem' }} // text-xs
        >
          View History
        </Button>
      </Box>
    </Box>
  );
};

export default VersionControlHeader;
