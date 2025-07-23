import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopNavBar from './TopNavBar';

const MyTasks = () => {
  const navigate = useNavigate();
  const [awaitingApproval, setAwaitingApproval] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(true);

  useEffect(() => {
    const fetchAwaitingApproval = async () => {
      setApprovalLoading(true);
      try {
        const { getApplicationsAwaitingMyApproval } = await import('../services/api');
        const approvalApps = await getApplicationsAwaitingMyApproval();
        console.log('Fetched applications awaiting my approval:', approvalApps);
        setAwaitingApproval(approvalApps);
      } catch (err) {
        console.error('Failed to fetch applications awaiting approval:', err);
        setAwaitingApproval([]);
      } finally {
        setApprovalLoading(false);
      }
    };

    fetchAwaitingApproval();

    // Add event listener to refetch when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is visible, refetching approval data...');
        fetchAwaitingApproval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div>
      <TopNavBar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Tasks
        </Typography>
        
        {/* Summary Card */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h6" color="primary">Applications Awaiting My Approval</Typography>
                <Typography variant="h4" color="primary">
                  {approvalLoading ? '...' : awaitingApproval.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Applications Awaiting My Approval Section */}
        {approvalLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading applications awaiting your approval...</Typography>
          </Box>
        ) : awaitingApproval.length > 0 ? (
          <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Applications Awaiting My Approval
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Counterparty</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>DA Level Required</strong></TableCell>
                    <TableCell><strong>Submitted Date</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awaitingApproval.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.reference_number || r.id}</TableCell>
                      <TableCell>{r.title || 'Untitled Request'}</TableCell>
                      <TableCell>{typeof r.counterparty === 'object' && r.counterparty !== null ? r.counterparty.name : r.counterparty || ''}</TableCell>
                      <TableCell>
                        <Chip label={r.workflow_state?.name || 'Draft'} color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={r.credit_review_form?.delegated_authority_level || 'Not Set'} 
                          color="info" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ''}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/credit-requests/${r.id}/details`)}
                        >
                          Review & Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No applications currently awaiting your approval
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Applications requiring your approval will appear here based on your delegated authority level and role.
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default MyTasks;