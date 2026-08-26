import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Box, Button, Alert, CircularProgress, Chip, IconButton
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon, DragIndicator } from '@mui/icons-material';
import api from '../services/api';

const statusColors = {
  draft: 'default',
  pending: 'warning',
  'in-progress': 'info',
  approved: 'success',
  rejected: 'error'
};

const priorityColors = {
  High: 'error',
  Medium: 'warning',
  Low: 'success'
};

const PrioritizationDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch open applications (not APPROVED)
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' }); // Clear any previous messages
      
      const response = await api.get('/api/credit/credit-applications/');
      
      // Filter out APPROVED applications
      const openApplications = response.data.filter(app => 
        app.workflow_state_name !== 'Approved'
      );
      
      // Sort by current rank, then by priority and required_by_date for unranked items
      const sortedApplications = openApplications.sort((a, b) => {
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        }
        if (a.rank && !b.rank) return -1;
        if (!a.rank && b.rank) return 1;
        
        // Both unranked, sort by priority then required_by_date
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const aPriority = priorityOrder[a.priority] || 999;
        const bPriority = priorityOrder[b.priority] || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(a.required_by_date) - new Date(b.required_by_date);
      });
      
      setApplications(sortedApplications);
      setHasChanges(false);
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in.' });
      } else if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'API endpoint not found. Please check server configuration.' });
      } else {
        setMessage({ type: 'error', text: `Failed to load applications: ${error.response?.data?.detail || error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle drag events
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const items = Array.from(applications);
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, reorderedItem);

    setApplications(items);
    setHasChanges(true);
    setMessage({ type: '', text: '' });
    setDraggedIndex(null);
  };

  // Save rank changes
  const saveRanks = async () => {
    try {
      setSaving(true);
      
      // Create rank updates payload
      const rankUpdates = applications.map((app, index) => ({
        id: app.id,
        rank: index + 1
      }));

      await api.post('/api/credit/credit-applications/bulk-update-ranks/', rankUpdates);
      
      setMessage({ type: 'success', text: `Successfully updated ranks for ${applications.length} applications` });
      setHasChanges(false);
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchApplications();
      }, 1000);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to save ranks' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                Prioritization Dashboard
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchApplications}
                  disabled={saving}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveRanks}
                  disabled={!hasChanges || saving}
                  color="primary"
                >
                  {saving ? 'Saving...' : 'Save Rankings'}
                </Button>
              </Box>
            </Box>

            {message.text && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop applications to reorder their priority. Applications at the top will have rank 1.
              Currently showing {applications.length} open applications.
            </Typography>

            {applications.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No open applications found.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '40px' }}></TableCell>
                      <TableCell sx={{ width: '60px' }}>Rank</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Counterparty</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Required By</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((app, index) => (
                      <TableRow
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        sx={{
                          backgroundColor: draggedIndex === index ? 'action.hover' : 'inherit',
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' },
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <IconButton size="small" sx={{ cursor: 'grab' }}>
                            <DragIndicator />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" color="primary">
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>{app.reference_number}</TableCell>
                        <TableCell>{app.title}</TableCell>
                        <TableCell>{app.counterparty?.name || '-'}</TableCell>
                        <TableCell>{formatCurrency(app.amount)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={app.priority} 
                            color={priorityColors[app.priority]} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatDate(app.required_by_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={app.workflow_state_name} 
                            color={statusColors[app.workflow_state_name?.toLowerCase()]} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{app.created_by_name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PrioritizationDashboard;
