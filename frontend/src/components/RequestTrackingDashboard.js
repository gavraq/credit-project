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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError(null);
      try {
        const { get } = await import('../services/api');
        const response = await get('/credit/credit-applications/');
        setRequests(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  // Filtered requests (by search and filters)
  const filteredRequests = requests.filter(r =>
    (search === '' || (r.title || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || r.status === statusFilter) &&
    (priorityFilter === '' || r.priority === priorityFilter)
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
                <Typography variant="h4">{requests.filter(r => r.status === 'pending').length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Add more summary cards as needed */}
        </Grid>
        {/* Filter Options Section */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <SearchIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Filter Options
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Status"
                select
                SelectProps={{ native: true }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                fullWidth
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Priority"
                select
                SelectProps={{ native: true }}
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                fullWidth
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Counterparty"
                value={''} // Placeholder for future implementation
                onChange={() => {}}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Submitter"
                value={''} // Placeholder for future implementation
                onChange={() => {}}
                fullWidth
              />
            </Grid>
          </Grid>
          <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
            <Button variant="contained" color="primary" startIcon={<SearchIcon />}>Search</Button>
            <Button variant="outlined" color="inherit">Clear Filters</Button>
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
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{typeof r.counterparty === 'object' && r.counterparty !== null ? r.counterparty.name : r.counterparty || ''}</TableCell>
                    <TableCell>
                      <Chip label={r.status} color={statusColors[r.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{r.submittedBy}</TableCell>
                    <TableCell>{r.rank}</TableCell>
                    <TableCell>
                      <Chip label={r.priority} color={priorityColors[r.priority] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{r.submittedDate}</TableCell>
                    <TableCell>{r.requiredByDate}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="secondary" onClick={() => navigate(`/credit-requests/${r.id}/edit`)}>
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
