import React, { useState } from 'react';
import {
  Card, CardContent, Typography, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box, TextField, InputAdornment, Stack, Button
} from '@mui/material';
import { Search as SearchIcon, Visibility, Edit as EditIcon } from '@mui/icons-material';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Fetch real credit requests from backend


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

const RequestTrackingDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [requests, setRequests] = useState([]);
  const [awaitingApproval, setAwaitingApproval] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const { get } = await import('../services/api');
        const response = await get('/api/credit/credit-applications/');
        console.log('Fetched credit applications:', response.data);
        console.log('Total applications fetched:', response.data.length);
        console.log('Application IDs:', response.data.map(app => ({ id: app.id, ref: app.reference_number, title: app.title })));
        setRequests(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch requests');
        console.error('Failed to fetch requests:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAwaitingApproval = async () => {
      setApprovalLoading(true);
      try {
        const { getApplicationsAwaitingMyApproval } = await import('../services/api');
        const approvalApps = await getApplicationsAwaitingMyApproval();
        console.log('Fetched applications awaiting my approval:', approvalApps);
        setAwaitingApproval(approvalApps);
      } catch (err) {
        console.error('Failed to fetch applications awaiting approval:', err);
        // Don't set error state for approval section - it might not be available for all users
        setAwaitingApproval([]);
      } finally {
        setApprovalLoading(false);
      }
    };

    const fetchAllData = () => {
      fetchRequests();
      fetchAwaitingApproval();
    };

    fetchAllData(); // Initial fetch

    // Add event listener to refetch when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is visible, refetching data...');
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array ensures this sets up only once

  // Get unique statuses and priorities from the data (metadata-driven)
  const uniqueStatuses = [...new Set(requests.map(r => r.workflow_state?.code).filter(Boolean))];
  const uniquePriorities = [...new Set(requests.map(r => r.priority).filter(Boolean))];

  // Filtered requests (by search and filters)
  const filteredRequests = requests.filter(r =>
    (search === '' || (r.title || '').toLowerCase().includes(search.toLowerCase()) || 
     (r.reference_number || '').toLowerCase().includes(search.toLowerCase()) ||
     (typeof r.counterparty === 'object' && r.counterparty !== null ? r.counterparty.name : r.counterparty || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || (r.workflow_state?.code || 'draft') === statusFilter) &&
    (priorityFilter === '' || (r.priority || 'Medium') === priorityFilter)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Request Tracking Dashboard
      </Typography>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Example: Pending Requests */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Pending</Typography>
                <Typography variant="h4">{requests.filter(r => r.workflow_state?.code && r.workflow_state.code.includes('PENDING')).length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Awaiting My Approval */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                backgroundColor: '#fff3e0', 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#ffe0b2',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => navigate('/my-tasks')}
            >
              <CardContent>
                <Typography variant="h6" color="primary">Awaiting My Approval</Typography>
                <Typography variant="h4" color="primary">
                  {approvalLoading ? '...' : awaitingApproval.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Add more summary cards as needed */}
        </Grid>


        <Typography variant="h5" gutterBottom sx={{ mt: 3, mb: 2 }}>
          All Applications
        </Typography>
        {/* Filter Options Section */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <SearchIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Filter Options
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
            <Box sx={{ minWidth: 200 }}>
              <TextField
                select
                SelectProps={{ 
                  native: true,
                  displayEmpty: true
                }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {requests.find(r => r.workflow_state?.code === status)?.workflow_state?.name || status}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <TextField
                select
                SelectProps={{ 
                  native: true,
                  displayEmpty: true
                }}
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
              >
                <option value="">All Priorities</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ minWidth: 300, flexGrow: 1 }}>
              <TextField
                label="Search"
                placeholder="Search by title, ID, or counterparty"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                size="small"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Stack>
          <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPriorityFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>
        {/* Requests Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Counterparty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Required By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.reference_number || r.id}</TableCell>
                    <TableCell>{r.title || 'Untitled Request'}</TableCell>
                    <TableCell>{typeof r.counterparty === 'object' && r.counterparty !== null ? r.counterparty.name : r.counterparty || ''}</TableCell>
                    <TableCell>
                      <Chip label={r.workflow_state?.name || 'Draft'} color={statusColors[r.workflow_state?.code || 'draft'] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{r.created_by_name || ''}</TableCell>
                    <TableCell>{r.rank || ''}</TableCell>
                    <TableCell>
                      <Chip label={r.priority || 'Medium'} color={priorityColors[r.priority || 'Medium'] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString() : (r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '')}</TableCell>
                    <TableCell>{r.required_by_date ? new Date(r.required_by_date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="secondary" 
                        onClick={() => navigate(`/credit-requests/${r.id}/details`)}
                        title="View Application Details"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No matching requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
  </Box>
  );
};

export default RequestTrackingDashboard;
