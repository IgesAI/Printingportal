'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

interface PrintRequest {
  id: string;
  partNumber: string;
  quantity: number;
  requiredDate: string;
  priority: string;
  fileReference: string | null;
  description: string | null;
  status: string;
  operatorNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number | null;
  requester: {
    id: string;
    name: string;
    email: string;
  };
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  New: 'info',
  InProgress: 'warning',
  OnPrinter: 'secondary',
  Completed: 'success',
  OnHold: 'default',
  Canceled: 'error',
};

const statusLabels: Record<string, string> = {
  New: 'New',
  InProgress: 'In Progress',
  OnPrinter: 'On Printer',
  Completed: 'Completed',
  OnHold: 'On Hold',
  Canceled: 'Canceled',
};

const priorityColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Low: 'success',
  Normal: 'info',
  High: 'warning',
  Critical: 'error',
};

export default function DashboardPage() {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    request: PrintRequest | null;
  }>({ open: false, request: null });
  const [editForm, setEditForm] = useState({
    status: '',
    operatorNotes: '',
    comment: '',
    reminderEnabled: false,
    reminderDaysBefore: 1,
  });
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    request: PrintRequest | null;
  }>({ open: false, request: null });
  const [deleting, setDeleting] = useState(false);

  // New request dialog
  const [newRequestDialog, setNewRequestDialog] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterStatus === 'active') {
        // Don't pass status - we'll filter client-side
      } else if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/requests?${params}`);
      if (!response.ok) throw new Error('Failed to fetch requests');

      let data = await response.json();

      // Filter for active (non-completed, non-canceled) if needed
      if (filterStatus === 'active') {
        data = data.filter(
          (r: PrintRequest) => r.status !== 'Completed' && r.status !== 'Canceled'
        );
      }

      setRequests(data);
      setError(null);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusUpdate = async () => {
    if (!editDialog.request) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/requests/${editDialog.request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editForm.status,
          operatorNotes: editForm.operatorNotes,
          comment: editForm.comment || undefined,
          reminderEnabled: editForm.reminderEnabled,
          reminderDaysBefore: editForm.reminderEnabled ? editForm.reminderDaysBefore : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update request');

      await fetchRequests();
      setEditDialog({ open: false, request: null });
      setSnackbar({ open: true, message: 'Request updated successfully', severity: 'success' });
    } catch (err) {
      console.error('Error updating request:', err);
      setSnackbar({ open: true, message: 'Failed to update request', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.request) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/requests/${deleteDialog.request.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete request');

      await fetchRequests();
      setDeleteDialog({ open: false, request: null });
      setSnackbar({ open: true, message: 'Request deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting request:', err);
      setSnackbar({ open: true, message: 'Failed to delete request', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (request: PrintRequest) => {
    setEditForm({
      status: request.status,
      operatorNotes: request.operatorNotes || '',
      comment: '',
      reminderEnabled: request.reminderEnabled || false,
      reminderDaysBefore: request.reminderDaysBefore || 1,
    });
    setEditDialog({ open: true, request });
  };

  const openDeleteDialog = (request: PrintRequest) => {
    setDeleteDialog({ open: true, request });
  };

  const isOverdue = (requiredDate: string, status: string) => {
    if (status === 'Completed' || status === 'Canceled') return false;
    return new Date(requiredDate) < new Date();
  };

  const isDueSoon = (requiredDate: string, status: string) => {
    if (status === 'Completed' || status === 'Canceled') return false;
    const daysUntilDue = Math.ceil(
      (new Date(requiredDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          #{params.value.slice(-8).toUpperCase()}
        </Typography>
      ),
    },
    {
      field: 'partNumber',
      headerName: 'Part Number',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 70,
      align: 'center',
    },
    {
      field: 'requiredDate',
      headerName: 'Due Date',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const overdue = isOverdue(params.value, params.row.status);
        const dueSoon = isDueSoon(params.value, params.row.status);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {overdue && (
              <Tooltip title="Overdue">
                <WarningIcon color="error" fontSize="small" />
              </Tooltip>
            )}
            <Typography
              variant="body2"
              sx={{
                color: overdue ? 'error.main' : dueSoon ? 'warning.main' : 'inherit',
                fontWeight: overdue || dueSoon ? 600 : 400,
              }}
            >
              {new Date(params.value).toLocaleDateString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={priorityColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={statusLabels[params.value] || params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'requester',
      headerName: 'Requester',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value.email}>
          <Typography variant="body2">{params.value.name}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'reminderEnabled',
      headerName: 'Reminder',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value ? `Reminder ${params.row.reminderDaysBefore} day(s) before` : 'No reminder'}>
          {params.value ? (
            <NotificationsIcon color="primary" fontSize="small" />
          ) : (
            <NotificationsOffIcon color="disabled" fontSize="small" />
          )}
        </Tooltip>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditDialog(params.row)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => openDeleteDialog(params.row)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === 'New').length,
    inProgress: requests.filter((r) => r.status === 'InProgress').length,
    onPrinter: requests.filter((r) => r.status === 'OnPrinter').length,
    overdue: requests.filter((r) => isOverdue(r.requiredDate, r.status)).length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Image
            src="/COBRA+AERO+LOGO+-+MAIN_white_outline_nobackground.png"
            alt="Cobra Aero Logo"
            width={160}
            height={80}
            priority
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Operator Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<HomeIcon />} href="/">
            Request Form
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewRequestDialog(true)}
          >
            Manual Entry
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="text.secondary" variant="body2">
                Total Active
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="text.secondary" variant="body2">
                New
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.new}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="text.secondary" variant="body2">
                In Progress
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="text.secondary" variant="body2">
                On Printer
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {stats.onPrinter}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ bgcolor: stats.overdue > 0 ? 'error.light' : 'inherit' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography color={stats.overdue > 0 ? 'error.contrastText' : 'text.secondary'} variant="body2">
                Overdue
              </Typography>
              <Typography variant="h4" color={stats.overdue > 0 ? 'error.contrastText' : 'error.main'}>
                {stats.overdue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <IconButton onClick={fetchRequests} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2">Filter:</Typography>
          <Tabs value={tabValue} onChange={(_, v) => {
            setTabValue(v);
            const statuses = ['active', 'New', 'InProgress', 'OnPrinter', 'OnHold', 'Completed', 'all'];
            setFilterStatus(statuses[v]);
          }}>
            <Tab label="Active" />
            <Tab label="New" />
            <Tab label="In Progress" />
            <Tab label="On Printer" />
            <Tab label="On Hold" />
            <Tab label="Completed" />
            <Tab label="All" />
          </Tabs>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={requests}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, request: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Request: {editDialog.request?.partNumber}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editDialog.request && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Requester:</strong> {editDialog.request.requester.name} ({editDialog.request.requester.email})
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {editDialog.request.quantity}
                </Typography>
                <Typography variant="body2">
                  <strong>Due:</strong> {new Date(editDialog.request.requiredDate).toLocaleDateString()}
                </Typography>
                {editDialog.request.fileReference && (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    <strong>File:</strong> {editDialog.request.fileReference}
                  </Typography>
                )}
                {editDialog.request.description && (
                  <Typography variant="body2">
                    <strong>Notes:</strong> {editDialog.request.description}
                  </Typography>
                )}
              </Box>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="InProgress">In Progress</MenuItem>
                <MenuItem value="OnPrinter">On Printer</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="OnHold">On Hold</MenuItem>
                <MenuItem value="Canceled">Canceled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Comment for Requester (sent in email)"
              multiline
              rows={2}
              value={editForm.comment}
              onChange={(e) => setEditForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="e.g. Printed in Ti-6Al-4V, ready for pickup at lab."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Internal Notes (not sent to requester)"
              multiline
              rows={2}
              value={editForm.operatorNotes}
              onChange={(e) => setEditForm((prev) => ({ ...prev, operatorNotes: e.target.value }))}
              placeholder="Internal notes for yourself..."
              sx={{ mb: 3 }}
            />

            {/* Reminder Settings */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon fontSize="small" />
                Email Reminder
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.reminderEnabled}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                  />
                }
                label="Enable email reminder before due date"
              />
              {editForm.reminderEnabled && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Remind me</InputLabel>
                  <Select
                    value={editForm.reminderDaysBefore}
                    label="Remind me"
                    onChange={(e) => setEditForm((prev) => ({ ...prev, reminderDaysBefore: Number(e.target.value) }))}
                  >
                    <MenuItem value={1}>1 day before</MenuItem>
                    <MenuItem value={2}>2 days before</MenuItem>
                    <MenuItem value={3}>3 days before</MenuItem>
                    <MenuItem value={5}>5 days before</MenuItem>
                    <MenuItem value={7}>1 week before</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, request: null })}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, request: null })}>
        <DialogTitle>Delete Request?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the request for <strong>{deleteDialog.request?.partNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The requester will not be notified.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, request: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Entry Dialog - redirects to form */}
      <Dialog open={newRequestDialog} onClose={() => setNewRequestDialog(false)} maxWidth="xs">
        <DialogTitle>Manual Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Use this to log verbal requests, Slack pings, or walk-up requests.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You&apos;ll be taken to the request form where you can enter the details.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" href="/">
            Open Request Form
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
