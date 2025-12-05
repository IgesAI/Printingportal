'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import Link from 'next/link';
import { useToast } from '@/lib/toast';

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
  fileSize?: number | null;
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

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<PrintRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/requests/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Request not found');
          }
          throw new Error('Failed to fetch request');
        }
        const data = await response.json();
        setRequest(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id, showToast]);

  const handleDownload = async () => {
    if (!request?.filePath || !request?.fileName) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/files/${id}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = request.fileName || 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('File downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download file', 'error');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <CancelIcon />;
      case 'in_progress':
        return <BuildIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getTimelineEvents = () => {
    if (!request) return [];

    const events = [
      {
        time: request.createdAt,
        label: 'Request Submitted',
        description: 'Request was created',
        status: 'success',
      },
    ];

    if (request.updatedAt !== request.createdAt) {
      events.push({
        time: request.updatedAt,
        label: 'Last Updated',
        description: 'Request was last modified',
        status: 'info',
      });
    }

    if (request.completedAt) {
      events.push({
        time: request.completedAt,
        label: 'Completed',
        description: 'Request was marked as completed',
        status: 'success',
      });
    } else if (request.status === 'cancelled') {
      events.push({
        time: request.updatedAt,
        label: 'Cancelled',
        description: 'Request was cancelled',
        status: 'error',
      });
    }

    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} variant="outlined">
          Back to Portal
        </Button>
      </Container>
    );
  }

  if (!request) {
    return null;
  }

  const timelineEvents = getTimelineEvents();
  const isOverdue = request.deadline && new Date(request.deadline) < new Date() && request.status !== 'completed';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button component={Link} href="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {request.partNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Request ID: {request.id}
                </Typography>
              </Box>
              <Chip label={statusLabels[request.status]} color={statusColors[request.status]} size="medium" />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Quantity
                  </Typography>
                  <Typography variant="h5">{request.quantity}</Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Request Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {request.requestType === 'work_order' ? (
                      <DescriptionIcon sx={{ color: '#9c27b0' }} />
                    ) : (
                      <BuildIcon sx={{ color: 'primary.main' }} />
                    )}
                    <Typography variant="body1">
                      {request.requestType === 'work_order' ? 'Work Order' : 'R&D / Prototype'}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Deadline
                  </Typography>
                  <Typography variant="body1" sx={{ color: isOverdue ? 'error.main' : 'inherit' }}>
                    {formatDate(request.deadline)}
                    {isOverdue && (
                      <Chip label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Card>
              </Grid>

              {request.fileName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Attached File
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.fileName}
                      </Typography>
                      {request.fileSize && (
                        <Typography variant="caption" color="text.secondary">
                          ({formatFileSize(request.fileSize)})
                        </Typography>
                      )}
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        disabled={downloading}
                        variant="outlined"
                      >
                        {downloading ? 'Downloading...' : 'Download'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              )}

              {request.description && (
                <Grid size={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">{request.description}</Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Request Timeline
            </Typography>
            <Box sx={{ position: 'relative', pl: 3 }}>
              {timelineEvents.map((event, index) => (
                <Box key={index} sx={{ position: 'relative', pb: index < timelineEvents.length - 1 ? 3 : 0 }}>
                  {/* Timeline line */}
                  {index < timelineEvents.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '-15px',
                        top: '24px',
                        bottom: '-12px',
                        width: '2px',
                        bgcolor: 'divider',
                      }}
                    />
                  )}
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '-21px',
                      top: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      border: '2px solid',
                      borderColor: `${event.status}.main`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '10px',
                        color: `${event.status}.main`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {event.status === 'success' ? <CheckCircleIcon sx={{ fontSize: '12px' }} /> :
                       event.status === 'error' ? <CancelIcon sx={{ fontSize: '12px' }} /> :
                       event.status === 'info' ? <BuildIcon sx={{ fontSize: '12px' }} /> :
                       <PendingIcon sx={{ fontSize: '12px' }} />}
                    </Box>
                  </Box>
                  {/* Timeline content */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle2">{event.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        {formatDateTime(event.time)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {event.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Requester Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requester Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{request.requesterName}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                <a href={`mailto:${request.requesterEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {request.requesterEmail}
                </a>
              </Typography>
            </Box>
          </Paper>

          {/* Admin Notes */}
          {request.notes && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Admin Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">{request.notes}</Typography>
            </Paper>
          )}

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Submitted:
              </Typography>
              <Typography variant="body2">{formatDateTime(request.createdAt)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Last Updated:
              </Typography>
              <Typography variant="body2">{formatDateTime(request.updatedAt)}</Typography>
            </Box>
            {request.completedAt && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Completed:
                </Typography>
                <Typography variant="body2">{formatDateTime(request.completedAt)}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
