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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [request, setRequest] = useState<PrintRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Portal
        </Button>
      </Container>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Portal
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Request Details
          </Typography>
          <Chip
            label={statusLabels[request.status]}
            color={statusColors[request.status]}
            size="medium"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Part Number
            </Typography>
            <Typography variant="h6">{request.partNumber}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="h6">{request.quantity}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Request Type
            </Typography>
            <Chip
              label={request.requestType === 'work_order' ? 'Work Order' : 'R&D / Prototype'}
              color={request.requestType === 'work_order' ? 'secondary' : 'primary'}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Deadline
            </Typography>
            <Typography variant="body1">{formatDate(request.deadline)}</Typography>
          </Box>

          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">
              {request.description || 'No description provided'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Requester Information
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{request.requesterName}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{request.requesterEmail}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Timeline
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Submitted
            </Typography>
            <Typography variant="body1">{formatDateTime(request.createdAt)}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">{formatDateTime(request.updatedAt)}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="body1">
              {request.completedAt ? formatDateTime(request.completedAt) : '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

