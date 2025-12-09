'use client';

import { useState, ChangeEvent } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SendIcon from '@mui/icons-material/Send';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import FlightIcon from '@mui/icons-material/Flight';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useToast } from '@/lib/toast';
import { put as blobPut } from '@vercel/blob/client';

export default function Home() {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    quantity: 1,
    deadline: null as Date | null,
    requesterName: '',
    requesterEmail: '',
    requestType: 'rd_parts' as 'rd_parts' | 'work_order',
    workOrderType: null as 'aero' | 'moto' | null,
  });

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { showToast } = useToast();

  const MAX_UPLOAD_MB =
    Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 200) || 200;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
  const allowedExtensions = new Set([
    '.stl',
    '.step',
    '.stp',
    '.sldprt',
    '.sldasm',
    '.3mf',
    '.obj',
    '.iges',
    '.igs',
  ]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate work order type is selected when request type is work_order
    if (formData.requestType === 'work_order' && !formData.workOrderType) {
      showToast('Please select Aero or Moto for work order requests', 'error');
      return;
    }

    if (fileError) {
      showToast(fileError, 'error');
      return;
    }
    
    setLoading(true);

    try {
      let uploadMeta: { fileUrl?: string; fileName?: string; fileSize?: number } = {};

      if (file) {
        // Step 1: request a client token and pathname
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
        });
        const presign = await presignRes.json();
        if (!presignRes.ok) {
          throw new Error(presign.error || 'Failed to prepare upload');
        }

        // Step 2: upload directly to Blob using client token
        const putResult = await blobPut(presign.pathname, file, {
          token: presign.token,
          access: 'public',
          contentType: file.type || 'application/octet-stream',
        });

        uploadMeta = {
          fileUrl: putResult.url,
          fileName: file.name,
          fileSize: file.size,
        };
      }

      const submitData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      });

      if (uploadMeta.fileUrl) {
        submitData.append('fileUrl', uploadMeta.fileUrl);
        submitData.append('fileName', uploadMeta.fileName || '');
        submitData.append('fileSize', uploadMeta.fileSize?.toString() || '');
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        const isWorkOrder = formData.requestType === 'work_order';
        const recipient = formData.workOrderType === 'aero' ? 'Mike' : formData.workOrderType === 'moto' ? 'Gunner' : '';
        showToast(
          isWorkOrder
            ? `Request submitted! Work order notification sent to ${recipient} for approval.`
            : 'Request submitted successfully! You will receive a confirmation email shortly.',
          'success'
        );

        // Reset form
        setFormData({
          partNumber: '',
          description: '',
          quantity: 1,
          deadline: null,
          requesterName: '',
          requesterEmail: '',
          requestType: 'rd_parts',
          workOrderType: null,
        });
        setFile(null);
        setFileError(null);
      } else {
        showToast(`Error: ${result.error || 'Failed to submit request. Please try again.'}`, 'error');
      }
    } catch (error) {
      showToast('Connection error. Please check your network and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }

    const extension = `.${selected.name.split('.').pop()?.toLowerCase() || ''}`;

    if (!allowedExtensions.has(extension)) {
      setFile(null);
      setFileError(
        'Unsupported file type. Allowed: STEP, SLDPRT/SLDASM, 3MF, STL, OBJ, IGES'
      );
      return;
    }

    if (selected.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setFileError(`File is too large. Max allowed is ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setFile(selected);
    setFileError(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Terminal Header with ASCII Art Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box 
            component="pre"
            sx={{ 
              fontFamily: 'monospace',
              fontSize: { xs: '3px', sm: '5px', md: '6px', lg: '7px' },
              lineHeight: 1.1,
              color: 'primary.main',
              textShadow: '0 0 10px #00aaff',
              overflow: 'hidden',
              whiteSpace: 'pre',
              mb: 2,
              letterSpacing: '-0.5px',
            }}
          >
{`                                                                                                                   +[                                                                           
                                                                                                                    =@%                                                                         
                                                                                                                     :@@>                                                                       
                                                                                                                      +@@]                                                                      
                                                                                                                       ]@@]                                                                     
                                                                                                                        @@@)                                                                    
                                                                                                                        :@@%*                                                                   
                                                                                                                        =@@@>                                                                   
                                                                                           -=*]}%@@@%#[<*==-            =@@@@*                                                                  
                                                                                         :::-*)#@@@@@@@@@@@@@@@@@<-     #@@@@+                                                                  
                                                                                              -+     :-=)@@@@@@@@@@@@@@@@@@@@[-                                                                 
                                                                                                 -)##)>-     *]#@@@@@@@@@@@@@@-                                                                 
                                                                                                      <@@@@]:      <%@@@@@@@@@-                                                                 
                                             -<}@@@@@@@@@@@@@@@@@@@@@@%]                                  @@@@@@}:      }@@@@#=                                                                 
                                     +]}@@@@@@}]]][}}}}[[[][[[}}}}[)[@@)=   %%%%%%%%%%%%%%%%%]:             *@@@@@@@}=    :)%=                                                                  
                               :=]@@@@%})<[%}])<<<<<<<<<<<<<<<<<<<[}]@@=   [@@}]]][[[[][[)}@@                 +@@@@@@@@#                                                                        
                            >@@@@#>[%[<<<<<<<<<<<<<<<<<<<<<<<<<<<)%<@@*    @@#*}<<<<<<<)#}@@]+                 -[@@@@@@@#                                                                       
                        =#@@@)}#])<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<}##@%>   @@@<%<<<<<<<<]%)@@+                    }@@@@@@#                                   :=*>>>*=                            
                     +#@@#]}[)<<<<<<<<<<<<<<<<<<<<<<<<)))))<<<<<)@+@@>   +@@%]}<<<<<<<<%*@@@@@@@@@@@@@@@@@@@}<-  <@@@@@@%      ->)[#@@@@@@@@@@@@@> +<[@@@@@@@@@@@@@@@@@@@@}<=                   
                   ]@@@)}[<<<<<<<<<<<<<<<<<)]}@@@@@@%#####%@@@@@@]%@@@@] @@@:%<<<<<<<<[%<<><}%@@@@@@@@%[>=)%@@@@%=}@@@@@=  *%@@@@@%]<>>******-@@@@@@@#<*>[%@%#####%@@}<*<#@@@@@<                
                 [@@]]%<<<<<<<<<<<<<<<<[@@@#]<<<<<<<<<<<<<<<<<<<<)#@<>@@@@@}@]<<<<<<<<[)<<<<<<<<<<<<<<<<<<)}@[+%@@@@@@@@%@@@]<%%[))<<<<<<<<]@]@%<]%})<<<<<<<<<<<<<<<<<<<<]#@><@@@@>             
               )@@][#<<<<<<<<<<<<<<)#@@})<<<<<<<<<<<<<<<<<<<<<<<<<<<)}#>@@@-@<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<[#)[@@@@@@#]#})<<<<<<<<<<<<<<@:]#[)<<<<<<<<<<<<<<<<<<<<<<<<<<<<}%<}@@@:           
             -}@%)#)<<<<<<<<<<<<<[@@})<<<<<<<<)]}}##}}}}###}]<<<<<<<<<<#[[+@<<<<<<<<<<<<<)[}}}#%####[)<<<<<<<<<<[%>@@@]]#<<<<<<<<<<)][[[[[%@}<<<<<<<<<)]}}##}}}}###})<<<<<<<<<)#]]@@@           
             @@[[}<<<<<<<<<<<<<]@@#<<<<<<<<)%]<@@@@@@@@@@@@@*}%<<<<<<<<<@>]%<<<<<<<<<<##*[@@@@@@@@@@@*)@)<<<<<<<<}@[#)%<<<<<<<<)@]*#@@@@*#]<<<<<<<<)@<>@@@@@@@@@@@@@>[#<<<<<<<<)#)}@@:          
            @@#]}<<<<<<<<<<<<<#@@]<<<<<<<)@+@@@@@@@@@@@@@@@@@%<@<<<<<<<<}#@<<<<<<<<)@=@@@@@@@@@@@@@@@@@>%)<<<<<<<]@=[[<<<<<<<<%+@@@@@@@]#)<<<<<<<]}]@@@@@@@@@@@@@@@@@[]}<<<<<<<<}]}@@           
           ]@@[}})<<<<<<<<<<][@@#]<<<<<<]@:@@@@@@@@@@@@@@@@@@%[#]<<<<<<]@@[)<<<<<))@ @@@@@@@@@@@@@@@@@@)%[<<<<<<)%>-@[<<<<<<)#<%@@@@@@)}#)<<<<<)[%[@@@@@@@@@@@@@@@@@@}[#)<<<<<)[}[@@[           
           @@#)%}#####}#####}#@@}#######[@=@@@@@@@@@@@@@@@@@]#########}@*@)#######[@+@@@@@@@@@@@@@@@@}[########}%):%]#######[%]@@@@@@@[##}######[%>}@@@@@@@@@@@@@@@%]}}}###}##}#}}@@:           
           @@#)%}############[@@@[#######}[@>+%@@@@@@@@@]*[%}}######}#%<]#@}#######}[@)=#@@@@@@@@}*[@}}#######}%]}##}######}%+%@@@@@@@<]}}#######}}@[=[@@@@@@@@<+[@}}########}}[]@@>:           
           @@%]##############}[@@@}}########}####}}[}}###}}#######}#}]%@@)]@[#########}}###}}}####}}#######}##<}@>}}########}#@@@@@@@@@][%[#########}}####}####}}#############}}}@@-            
           }@@[)#}#############}}@@@}}}######################}}##}][@@@@@@@+[%}}}#####################}}###])@@@}}}}######[#)#@@@@@@@@@@@<[@}}}#############################}}#)@@>             
            @@@<)%}###############[}@@@%[[}#}#########}#}}[#@[+]@@@@@@@@@@@@@@>*%%}[}#}##}##}#}##}[[#@[*[@@@@@@@}##}#}}##}%][@@@@@@@@@@@@@@@>+%%}[}#}#######}}#}[[}@@}########]%@#=             
            :@@@}*%}}################}}}}}%@@@@@@@@@@@@%}%)]@@@@@@@@@@@@@@@@@@@@@@@}<==*<)]])>*+>[%@@@@@@@@@@@@@}}}}}}}}}}}#@@@@@@@@@@@@@@@@@@@@@}<+=*<)]))>**>]%@#[}}}}}}}}}}#@@<              
              )@@@[*%#[}#################################}}@@@@@@@@@@@@@@@%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@}=              
                <@@@@)<##}}}###########################}}[[@@@@@@@@@@@@)        [@@@@@@@@@@+     -------------------+@@@     --------------:     [@@-                         @@)               
                   >@@@@@)*%@[[}######################}##)@@@@@@@@@%-   )@@@@@=   )@@@@@@@<                        #@@@-   :%@@@@@@@@@@@@@@@    +@@[   @@@@@@@@@@@@@@@@@@@*  *@}:               
                      -*#@@@@%#]<)#@%#}}[[}}}}}}}}}[[}}#}%@@@@@@<    :::::::::::    -@@@@]     @@@@@@@@@@@@@@@@@@@@@@@[    >}}}}}}}<      <#%@@@@@@:  =[[[[[[[[[[[[[[[[[[<   @@<                
                           -)}%@@@@@@@}))))))))))))])[#@@@@@@#*=+*#@@@@@@@@@@@@@@@<==+<@@>------------------------}@@@=---)@@@@@@@@@@@@@]=---=)%@@@}>*+++++++++++++++++++++)@@%                 
                                    =<[%@@@@@@@@@@@%})*-`}
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              letterSpacing: '0.1em',
              mt: 2,
            }}
          >
            3D Print Request Portal
          </Typography>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'primary.main',
              pb: 1,
              mb: 3,
            }}
          >
            {'>'} New Print Request_
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Request Type Toggle */}
              <Grid size={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
                    {'>'} Select Request Type:
                  </Typography>
                  <ToggleButtonGroup
                    value={formData.requestType}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        handleInputChange('requestType', newValue);
                        // Reset workOrderType when switching away from work_order
                        if (newValue !== 'work_order') {
                          handleInputChange('workOrderType', null);
                        }
                      }
                    }}
                    aria-label="request type"
                    sx={{ 
                      width: '100%',
                      '& .MuiToggleButton-root': {
                        flex: 1,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        minHeight: '56px',
                      }
                    }}
                  >
                    <ToggleButton 
                      value="rd_parts" 
                      aria-label="R&D / Prototype"
                    >
                      <BuildIcon />
                      <span>R&D / Prototype</span>
                    </ToggleButton>
                    <ToggleButton 
                      value="work_order" 
                      aria-label="Needs Work Order"
                    >
                      <DescriptionIcon />
                      <span>Needs Work Order</span>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {formData.requestType === 'work_order' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Select Work Order Type:
                      </Typography>
                      <ToggleButtonGroup
                        value={formData.workOrderType}
                        exclusive
                        onChange={(e, newValue) => {
                          if (newValue !== null) {
                            handleInputChange('workOrderType', newValue);
                          }
                        }}
                        aria-label="work order type"
                        fullWidth
                      >
                        <ToggleButton 
                          value="aero" 
                          aria-label="Aero"
                        >
                          <FlightIcon sx={{ mr: 1 }} />
                          <span>Aero (Mike)</span>
                        </ToggleButton>
                        <ToggleButton 
                          value="moto" 
                          aria-label="Moto"
                        >
                          <TwoWheelerIcon sx={{ mr: 1 }} />
                          <span>Moto (Gunner)</span>
                        </ToggleButton>
                      </ToggleButtonGroup>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {formData.workOrderType === 'aero' 
                          ? 'This request will notify Mike to create a work order for Aero.'
                          : formData.workOrderType === 'moto'
                          ? 'This request will notify Gunner to create a work order for Moto.'
                          : 'Please select Aero or Moto to proceed.'}
                      </Alert>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Part Number"
                  value={formData.partNumber}
                  onChange={(e) => handleInputChange('partNumber', e.target.value)}
                  required
                  variant="outlined"
                  placeholder="e.g., CA-3D-001"
                  helperText="Enter the part number or identifier"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  inputProps={{ min: 1 }}
                  variant="outlined"
                  helperText="How many do you need?"
                />
              </Grid>

              <Grid size={12}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <UploadFileIcon color="primary" />
                    <Typography variant="subtitle1">
                      Attach CAD file (optional)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Accepted: STEP (.step/.stp), SolidWorks (.sldprt/.sldasm), 3MF, STL, OBJ, IGES. Max {MAX_UPLOAD_MB} MB.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                      {file ? 'Change File' : 'Choose File'}
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept=".step,.stp,.sldprt,.sldasm,.3mf,.stl,.obj,.iges,.igs"
                      />
                    </Button>
                    {file && (
                      <>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {file.name} ({formatFileSize(file.size)})
                        </Typography>
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() => {
                            setFile(null);
                            setFileError(null);
                          }}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </Box>
                  {fileError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {fileError}
                    </Alert>
                  )}
                </Box>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Description / Notes"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Material preferences, special requirements, etc."
                  variant="outlined"
                  helperText="Any additional details about the print (optional)"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Needed By (Optional)"
                  value={formData.deadline}
                  onChange={(date) => handleInputChange('deadline', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      helperText: 'When do you need this completed?',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={formData.requesterName}
                  onChange={(e) => handleInputChange('requesterName', e.target.value)}
                  required
                  variant="outlined"
                  placeholder="John Smith"
                  helperText="Who is requesting this print?"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.requesterEmail}
                  onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
                  required
                  variant="outlined"
                  placeholder="john@cobra-aero.com"
                  helperText="For status updates and notifications"
                />
              </Grid>

            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading}
                sx={{ 
                  minWidth: 250, 
                  py: 2,
                  fontSize: '1.3rem',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            href="/dashboard"
            sx={{ mr: 2 }}
          >
            Admin Dashboard
          </Button>
        </Box>

        {/* Terminal footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Divider sx={{ mb: 2, borderColor: 'primary.main', opacity: 0.3 }} />
          <Typography variant="body2" color="text.secondary">
            TERMINAL STATUS: ONLINE | SYSTEM INTEGRITY: 100%
          </Typography>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
