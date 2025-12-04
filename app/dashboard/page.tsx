'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';

interface PrintRequest {
  id: string;
  partNumber: string;
  description: string | null;
  quantity: number;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  requestType: 'rd_parts' | 'work_order';
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  notes: string | null;
}

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function Dashboard() {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<PrintRequest | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<PrintRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleEditOpen = (request: PrintRequest) => {
    setEditDialog(request);
    setEditStatus(request.status);
    setEditNotes(request.notes || '');
  };

  const handleEditClose = () => {
    setEditDialog(null);
    setEditStatus('');
    setEditNotes('');
  };

  const handleSave = async () => {
    if (!editDialog) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/requests/${editDialog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update request');
      }

      setSuccessMessage('Request updated successfully! Status email sent to requester.');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      handleEditClose();
      fetchRequests();
    } catch (err) {
      setError('Failed to update request. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpen = (request: PrintRequest) => {
    setDeleteDialog(request);
  };

  const handleDeleteClose = () => {
    setDeleteDialog(null);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/requests/${deleteDialog.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      setSuccessMessage('Request deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      handleDeleteClose();
      fetchRequests();
    } catch (err) {
      setError('Failed to delete request. Please try again.');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    workOrders: requests.filter(r => r.requestType === 'work_order').length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all 3D print requests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            href="/"
          >
            Back to Portal
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchRequests}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" sx={{ color: '#2196f3' }}>{stats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Work Orders
              </Typography>
              <Typography variant="h4" sx={{ color: '#9c27b0' }}>{stats.workOrders}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Requests Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5">
            {'>'} All Requests_
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No requests found. Requests will appear here when submitted.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Requester</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Tooltip title={request.requestType === 'work_order' ? 'Needs Work Order' : 'R&D / Prototype'}>
                        {request.requestType === 'work_order' ? (
                          <DescriptionIcon sx={{ color: '#9c27b0' }} />
                        ) : (
                          <BuildIcon sx={{ color: 'primary.main' }} />
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.partNumber}
                      </Typography>
                      {request.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {request.description.substring(0, 50)}
                          {request.description.length > 50 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{request.requesterName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.requesterEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                    <TableCell>{formatDate(request.deadline)}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[request.status]}
                        color={statusColors[request.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {request.notes ? request.notes.substring(0, 30) + (request.notes.length > 30 ? '...' : '') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit / Update Status">
                        <IconButton
                          size="small"
                          onClick={() => handleEditOpen(request)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOpen(request)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Request: {editDialog?.partNumber}
        </DialogTitle>
        <DialogContent>
          {editDialog && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary">Request Details</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography><strong>Part:</strong> {editDialog.partNumber}</Typography>
                    <Typography><strong>Quantity:</strong> {editDialog.quantity}</Typography>
                    <Typography><strong>Requester:</strong> {editDialog.requesterName} ({editDialog.requesterEmail})</Typography>
                    <Typography><strong>Type:</strong> {editDialog.requestType === 'work_order' ? 'Needs Work Order' : 'R&D / Prototype'}</Typography>
                    {editDialog.description && (
                      <Typography><strong>Description:</strong> {editDialog.description}</Typography>
                    )}
                    {editDialog.deadline && (
                      <Typography><strong>Deadline:</strong> {formatDate(editDialog.deadline)}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editStatus}
                      label="Status"
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    multiline
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    helperText="Notes are for internal use and won't be sent to the requester"
                  />
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                Changing the status will send an email notification to the requester.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>Delete Request?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the request for <strong>{deleteDialog?.partNumber}</strong>?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Divider sx={{ mb: 2, borderColor: 'primary.main', opacity: 0.3 }} />
        <Typography variant="body2" color="text.secondary">
          TERMINAL STATUS: ONLINE | SYSTEM INTEGRITY: 100%
        </Typography>
      </Box>
    </Container>
  );
}

