'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    quantity: 1,
    deadline: null as Date | null,
    requesterName: '',
    requesterEmail: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const submitData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      });

      // Add file if selected
      if (file) {
        submitData.append('file', file);
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Your 3D print request has been submitted successfully! You will receive a confirmation email shortly.',
        });

        // Reset form
        setFormData({
          partNumber: '',
          description: '',
          quantity: 1,
          deadline: null,
          requesterName: '',
          requesterEmail: '',
        });
        setFile(null);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit request. Please try again.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          3D Print Request Portal
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Submit your 3D printing requests and track their progress
        </Typography>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            New Print Request
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Part Number *"
                  value={formData.partNumber}
                  onChange={(e) => handleInputChange('partNumber', e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity *"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  inputProps={{ min: 1 }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional: Provide any additional details about the part..."
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Deadline (Optional)"
                  value={formData.deadline}
                  onChange={(date) => handleInputChange('deadline', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name *"
                  value={formData.requesterName}
                  onChange={(e) => handleInputChange('requesterName', e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  value={formData.requesterEmail}
                  onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      File Upload (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload your 3D model file (STL, OBJ, STEP, etc.). Maximum size: 100MB.
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ mb: 1 }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept=".stl,.obj,.step,.stp,.iges,.igs,.3ds,.dae,.fbx,.ply,.x3d,.gltf,.glb"
                        onChange={handleFileChange}
                      />
                    </Button>

                    {file && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5 }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            href="/requests"
            sx={{ mr: 2 }}
          >
            Track My Requests
          </Button>
          <Button
            variant="text"
            href="/admin"
            color="secondary"
          >
            Admin Dashboard
          </Button>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}