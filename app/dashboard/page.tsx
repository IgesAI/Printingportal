'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
  Checkbox,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

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
  fileName?: string | null;
  filePath?: string | null;
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

type SortField = 'partNumber' | 'createdAt' | 'deadline' | 'status' | 'requesterName' | 'quantity';
type SortDirection = 'asc' | 'desc';

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
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { showToast } = useToast();

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
      const errorMessage = 'Failed to load requests. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.partNumber.toLowerCase().includes(query) ||
          req.requesterName.toLowerCase().includes(query) ||
          req.requesterEmail.toLowerCase().includes(query) ||
          (req.description && req.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((req) => req.requestType === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'partNumber':
          aValue = a.partNumber.toLowerCase();
          bValue = b.partNumber.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
          bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'requesterName':
          aValue = a.requesterName.toLowerCase();
          bValue = b.requesterName.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [requests, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAndSortedRequests.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;

    setBulkUpdating(true);
    try {
      const updatePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus }),
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed === 0) {
        showToast(`Successfully updated ${selectedIds.size} request(s)`, 'success');
        setSelectedIds(new Set());
        setBulkActionDialog(false);
        setBulkStatus('');
        fetchRequests();
      } else {
        showToast(`Updated ${selectedIds.size - failed} request(s), ${failed} failed`, 'warning');
      }
    } catch (err) {
      showToast('Failed to update requests', 'error');
      console.error(err);
    } finally {
      setBulkUpdating(false);
    }
  };

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

      showToast('Request updated successfully! Status email sent to requester.', 'success');
      handleEditClose();
      fetchRequests();
    } catch (err) {
      showToast('Failed to update request. Please try again.', 'error');
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

      showToast('Request deleted successfully!', 'success');
      handleDeleteClose();
      fetchRequests();
    } catch (err) {
      showToast('Failed to delete request. Please try again.', 'error');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} request(s)? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/requests/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed === 0) {
        showToast(`Successfully deleted ${selectedIds.size} request(s)`, 'success');
        setSelectedIds(new Set());
        fetchRequests();
      } else {
        showToast(`Deleted ${selectedIds.size - failed} request(s), ${failed} failed`, 'warning');
      }
    } catch (err) {
      showToast('Failed to delete requests', 'error');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Part Number',
      'Quantity',
      'Description',
      'Requester Name',
      'Requester Email',
      'Status',
      'Type',
      'Deadline',
      'Submitted',
      'Last Updated',
      'Completed',
      'Notes',
    ];

    const rows = filteredAndSortedRequests.map((req) => [
      req.partNumber,
      req.quantity.toString(),
      req.description || '',
      req.requesterName,
      req.requesterEmail,
      statusLabels[req.status],
      req.requestType === 'work_order' ? 'Work Order' : 'R&D / Prototype',
      req.deadline ? formatDate(req.deadline) : '',
      formatDateTime(req.createdAt),
      formatDateTime(req.updatedAt),
      req.completedAt ? formatDateTime(req.completedAt) : '',
      req.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `print-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredAndSortedRequests.length} request(s) to CSV`, 'success');
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

  // Calculate stats from filtered data
  const stats = {
    total: filteredAndSortedRequests.length,
    pending: filteredAndSortedRequests.filter((r) => r.status === 'pending').length,
    inProgress: filteredAndSortedRequests.filter((r) => r.status === 'in_progress').length,
    completed: filteredAndSortedRequests.filter((r) => r.status === 'completed').length,
    workOrders: filteredAndSortedRequests.filter((r) => r.requestType === 'work_order').length,
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all 3D print requests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<HomeIcon />} component={Link} href="/">
            Back to Portal
          </Button>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchRequests} disabled={loading}>
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
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4">{stats.total}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                  {stats.pending}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4" sx={{ color: '#2196f3' }}>
                  {stats.inProgress}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4" sx={{ color: '#4caf50' }}>
                  {stats.completed}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Work Orders
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                <Typography variant="h4" sx={{ color: '#9c27b0' }}>
                  {stats.workOrders}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by part number, requester, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="rd_parts">R&D / Prototype</MenuItem>
                <MenuItem value="work_order">Work Order</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setBulkActionDialog(true)}
                    disabled={bulkUpdating}
                  >
                    Update Status ({selectedIds.size})
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={handleBulkDelete} disabled={deleting}>
                    Delete ({selectedIds.size})
                  </Button>
                </>
              )}
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
                Export CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Requests Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5">
            {'>'} All Requests_ ({filteredAndSortedRequests.length})
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : filteredAndSortedRequests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No requests match your filters.'
                : 'No requests found. Requests will appear here when submitted.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.size === filteredAndSortedRequests.length && filteredAndSortedRequests.length > 0}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAndSortedRequests.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('partNumber')}>
                      Part Number
                      <SortIcon field="partNumber" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                      Qty
                      <SortIcon field="quantity" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('requesterName')}>
                      Requester
                      <SortIcon field="requesterName" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                      Submitted
                      <SortIcon field="createdAt" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('deadline')}>
                      Deadline
                      <SortIcon field="deadline" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                      Status
                      <SortIcon field="status" />
                    </Box>
                  </TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onChange={(e) => handleSelectOne(request.id, e.target.checked)}
                      />
                    </TableCell>
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
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        component={Link}
                        href={`/request/${request.id}`}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
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
                      <Chip label={statusLabels[request.status]} color={statusColors[request.status]} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {request.notes ? request.notes.substring(0, 30) + (request.notes.length > 30 ? '...' : '') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit / Update Status">
                        <IconButton size="small" onClick={() => handleEditOpen(request)} sx={{ mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteOpen(request)} color="error">
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
        <DialogTitle>Edit Request: {editDialog?.partNumber}</DialogTitle>
        <DialogContent>
          {editDialog && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Details
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography>
                      <strong>Part:</strong> {editDialog.partNumber}
                    </Typography>
                    <Typography>
                      <strong>Quantity:</strong> {editDialog.quantity}
                    </Typography>
                    <Typography>
                      <strong>Requester:</strong> {editDialog.requesterName} ({editDialog.requesterEmail})
                    </Typography>
                    <Typography>
                      <strong>Type:</strong>{' '}
                      {editDialog.requestType === 'work_order' ? 'Needs Work Order' : 'R&D / Prototype'}
                    </Typography>
                    {editDialog.description && (
                      <Typography>
                        <strong>Description:</strong> {editDialog.description}
                      </Typography>
                    )}
                    {editDialog.deadline && (
                      <Typography>
                        <strong>Deadline:</strong> {formatDate(editDialog.deadline)}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : null}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Update Status for {selectedIds.size} Request(s)</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select value={bulkStatus} label="New Status" onChange={(e) => setBulkStatus(e.target.value)}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)} disabled={bulkUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkStatusUpdate}
            variant="contained"
            disabled={!bulkStatus || bulkUpdating}
            startIcon={bulkUpdating ? <CircularProgress size={20} /> : null}
          >
            {bulkUpdating ? 'Updating...' : 'Update'}
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
