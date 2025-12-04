'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';

interface StatusHistoryItem {
  id: string;
  oldStatus: string;
  newStatus: string;
  comment: string | null;
  changedAt: string;
  changedBy: {
    name: string;
  };
}

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
  requester: {
    id: string;
    name: string;
    email: string;
  };
  statusHistory: StatusHistoryItem[];
}

// For Chip components
const chipStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  New: 'info',
  InProgress: 'warning',
  OnPrinter: 'secondary',
  Completed: 'success',
  OnHold: 'default',
  Canceled: 'error',
};

// For TimelineDot components
const timelineDotColors: Record<string, 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'grey'> = {
  New: 'info',
  InProgress: 'warning',
  OnPrinter: 'secondary',
  Completed: 'success',
  OnHold: 'grey',
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

export default function RequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<PrintRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/requests/${id}`);
        if (!response.ok) throw new Error('Failed to fetch request');

        const data = await response.json();
        setRequest(data);
        setError(null);
      } catch {
        setError('Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading request details...</Typography>
      </Container>
    );
  }

  if (error || !request) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Request not found'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} href="/">
          Back to Home
        </Button>
      </Container>
    );
  }

  const ticketId = request.id.slice(-8).toUpperCase();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} href="/">
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Request #{ticketId}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    {request.partNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submitted {new Date(request.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  label={statusLabels[request.status] || request.status}
                  color={chipStatusColors[request.status] || 'default'}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>
                  </Box>
                  <Typography variant="h6">{request.quantity}</Typography>
                </Grid>

                <Grid size={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Required Date
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </Typography>
                </Grid>

                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Priority
                  </Typography>
                  <Chip
                    label={request.priority}
                    color={priorityColors[request.priority] || 'default'}
                    size="small"
                  />
                </Grid>

                {request.fileReference && (
                  <Grid size={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        File Reference
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}
                    >
                      {request.fileReference}
                    </Typography>
                  </Grid>
                )}

                {request.description && (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">{request.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Status History */}
          {request.statusHistory && request.statusHistory.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status History
                </Typography>
                <Timeline sx={{ p: 0 }}>
                  {request.statusHistory.map((item, index) => (
                    <TimelineItem key={item.id}>
                      <TimelineSeparator>
                        <TimelineDot color={timelineDotColors[item.newStatus] || 'grey'} />
                        {index < request.statusHistory.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {statusLabels[item.newStatus] || item.newStatus}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.changedAt).toLocaleString()} by {item.changedBy.name}
                        </Typography>
                        {item.comment && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {item.comment}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Requested by
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {request.requester.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.requester.email}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ticket ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  #{ticketId}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(request.updatedAt).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
