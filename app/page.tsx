'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function NewRequestPage() {
  const [formData, setFormData] = useState({
    partNumber: '',
    quantity: 1,
    requiredDate: null as Date | null,
    priority: 'Normal',
    fileReference: '',
    description: '',
    requesterName: '',
    requesterEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ show: boolean; ticketId: string }>({
    show: false,
    ticketId: '',
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.partNumber || !formData.requiredDate || !formData.requesterName || !formData.requesterEmail) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        const ticketId = result.id.slice(-8).toUpperCase();
        setSuccess({ show: true, ticketId });

        // Reset form
        setFormData({
          partNumber: '',
          quantity: 1,
          requiredDate: null,
          priority: 'Normal',
          fileReference: '',
          description: '',
          requesterName: '',
          requesterEmail: '',
        });
      } else {
        setError(result.error || 'Failed to submit request. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Image
            src="/COBRA+AERO+LOGO+-+MAIN_white_outline_nobackground.png"
            alt="Cobra Aero Logo"
            width={280}
            height={140}
            priority
            style={{ objectFit: 'contain' }}
          />
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 600 }}>
          3D Print Request
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Submit a new print request
        </Typography>

        {success.show ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Request Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Your ticket ID is:
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'primary.main',
                mb: 3,
              }}
            >
              #{success.ticketId}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You&apos;ll receive a confirmation email shortly. We&apos;ll notify you when the status changes.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setSuccess({ show: false, ticketId: '' })}
              sx={{ mr: 2 }}
            >
              Submit Another Request
            </Button>
            <Button variant="outlined" href="/dashboard">
              View Dashboard
            </Button>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Part Number */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Part Number *"
                    value={formData.partNumber}
                    onChange={(e) => handleInputChange('partNumber', e.target.value)}
                    required
                    placeholder="e.g. EXH-12345"
                    variant="outlined"
                  />
                </Grid>

                {/* Quantity */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Quantity *"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))
                    }
                    required
                    slotProps={{ htmlInput: { min: 1 } }}
                    variant="outlined"
                  />
                </Grid>

                {/* Required Date */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Required Date *"
                    value={formData.requiredDate}
                    onChange={(date) => handleInputChange('requiredDate', date)}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        required: true,
                      },
                    }}
                  />
                </Grid>

                {/* Priority */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Normal">Normal</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* File Reference */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="File Reference (Optional)"
                    value={formData.fileReference}
                    onChange={(e) => handleInputChange('fileReference', e.target.value)}
                    placeholder="e.g. \\server\projects\exhaust\EXH-12345_revD.SLDPRT"
                    variant="outlined"
                    helperText="Path to the CAD file in your system (PDM, SharePoint, network drive, etc.)"
                  />
                </Grid>

                {/* Description */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description / Notes (Optional)"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Any additional details about the print..."
                    variant="outlined"
                  />
                </Grid>

                {/* Divider */}
                <Grid size={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Your Information
                  </Typography>
                </Grid>

                {/* Requester Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Your Name *"
                    value={formData.requesterName}
                    onChange={(e) => handleInputChange('requesterName', e.target.value)}
                    required
                    variant="outlined"
                  />
                </Grid>

                {/* Requester Email */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    type="email"
                    value={formData.requesterEmail}
                    onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
                    required
                    variant="outlined"
                    helperText="You'll receive status updates at this email"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  disabled={loading}
                  sx={{ minWidth: 200, py: 1.5 }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" href="/dashboard">
            Operator Dashboard
          </Button>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
