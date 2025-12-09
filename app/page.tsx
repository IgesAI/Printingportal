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

type PartForm = {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  deadline: Date | null;
  file: File | null;
  fileError: string | null;
};

export default function Home() {
  const [requestMeta, setRequestMeta] = useState({
    requesterName: '',
    requesterEmail: '',
    requestType: 'rd_parts' as 'rd_parts' | 'work_order',
    workOrderType: null as 'aero' | 'moto' | null,
  });

  const makePart = (): PartForm => ({
    id: crypto.randomUUID(),
    partNumber: '',
    description: '',
    quantity: 1,
    deadline: null,
    file: null,
    fileError: null,
  });

  const [parts, setParts] = useState<PartForm[]>([makePart()]);
  const [loading, setLoading] = useState(false);
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

  const handleMetaChange = (field: string, value: any) => {
    setRequestMeta(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePart = (id: string, updater: (prev: PartForm) => PartForm) => {
    setParts(prev =>
      prev.map(part => (part.id === id ? updater(part) : part))
    );
  };

  const addPart = () => {
    if (parts.length >= 5) {
      showToast('Limit 5 parts per submission. Please submit again for more.', 'warning');
      return;
    }
    setParts(prev => [...prev, makePart()]);
  };

  const removePart = (id: string) => {
    if (parts.length === 1) return;
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate work order type is selected when request type is work_order
    if (requestMeta.requestType === 'work_order' && !requestMeta.workOrderType) {
      showToast('Please select Aero or Moto for work order requests', 'error');
      return;
    }

    // Validate parts
    for (const part of parts) {
      if (!part.partNumber.trim()) {
        showToast('Each part needs a part number.', 'error');
        return;
      }
      if (!part.quantity || part.quantity < 1) {
        showToast('Each part needs a quantity of at least 1.', 'error');
        return;
      }
      if (part.fileError) {
        showToast(part.fileError, 'error');
        return;
      }
    }
    
    setLoading(true);

    try {
      let successCount = 0;

      for (const part of parts) {
        let uploadMeta: { fileUrl?: string; fileName?: string; fileSize?: number } = {};

        if (part.file) {
          // Step 1: request a client token and pathname
          const presignRes = await fetch('/api/uploads/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: part.file.name, fileSize: part.file.size }),
          });
          const presign = await presignRes.json();
          if (!presignRes.ok) {
            throw new Error(presign.error || 'Failed to prepare upload');
          }

          // Step 2: upload directly to Blob using client token
          const putResult = await blobPut(presign.pathname, part.file, {
            token: presign.token,
            access: 'public',
            contentType: part.file.type || 'application/octet-stream',
          });

          uploadMeta = {
            fileUrl: putResult.url,
            fileName: part.file.name,
            fileSize: part.file.size,
          };
        }

        const submitData = new FormData();
        // Shared fields
        submitData.append('requesterName', requestMeta.requesterName);
        submitData.append('requesterEmail', requestMeta.requesterEmail);
        submitData.append('requestType', requestMeta.requestType);
        if (requestMeta.requestType === 'work_order' && requestMeta.workOrderType) {
          submitData.append('workOrderType', requestMeta.workOrderType);
        }
        // Part-specific fields
        submitData.append('partNumber', part.partNumber);
        if (part.description) submitData.append('description', part.description);
        submitData.append('quantity', part.quantity.toString());
        if (part.deadline) submitData.append('deadline', part.deadline.toISOString());

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
        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit one of the requests.');
        }
        successCount += 1;
      }

      const isWorkOrder = requestMeta.requestType === 'work_order';
      const recipient =
        requestMeta.workOrderType === 'aero'
          ? 'Mike'
          : requestMeta.workOrderType === 'moto'
            ? 'Gunner'
            : '';

      showToast(
        isWorkOrder
          ? `Submitted ${successCount} request(s). Work order notification sent to ${recipient}.`
          : `Submitted ${successCount} request(s). Confirmation email(s) sent.`,
        'success'
      );

      // Reset form
      setRequestMeta({
        requesterName: '',
        requesterEmail: '',
        requestType: 'rd_parts',
        workOrderType: null,
      });
      setParts([makePart()]);
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, id: string) => {
    const selected = event.target.files?.[0];

    updatePart(id, prev => {
      if (!selected) {
        return { ...prev, file: null, fileError: null };
      }

      const extension = `.${selected.name.split('.').pop()?.toLowerCase() || ''}`;

      if (!allowedExtensions.has(extension)) {
        return {
          ...prev,
          file: null,
          fileError: 'Unsupported file type. Allowed: STEP, SLDPRT/SLDASM, 3MF, STL, OBJ, IGES',
        };
      }

      if (selected.size > MAX_UPLOAD_BYTES) {
        return {
          ...prev,
          file: null,
          fileError: `File is too large. Max allowed is ${MAX_UPLOAD_MB} MB.`,
        };
      }

      return { ...prev, file: selected, fileError: null };
    });
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
                    value={requestMeta.requestType}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        handleMetaChange('requestType', newValue);
                        if (newValue !== 'work_order') {
                          handleMetaChange('workOrderType', null);
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
                  {requestMeta.requestType === 'work_order' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Select Work Order Type:
                      </Typography>
                      <ToggleButtonGroup
                        value={requestMeta.workOrderType}
                        exclusive
                        onChange={(e, newValue) => {
                          if (newValue !== null) {
                            handleMetaChange('workOrderType', newValue);
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
                        {requestMeta.workOrderType === 'aero' 
                          ? 'This request will notify Mike to create a work order for Aero.'
                          : requestMeta.workOrderType === 'moto'
                          ? 'This request will notify Gunner to create a work order for Moto.'
                          : 'Please select Aero or Moto to proceed.'}
                      </Alert>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                    {'>'} Parts
                  </Typography>
                  <Button variant="outlined" size="small" onClick={addPart}>
                    Add another part
                  </Button>
                </Box>
              </Grid>

              {parts.map((part, idx) => (
                <Grid key={part.id} size={12}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1">Part {idx + 1}</Typography>
                      {parts.length > 1 && (
                        <Button size="small" color="secondary" onClick={() => removePart(part.id)}>
                          Remove
                        </Button>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Part Number"
                          value={part.partNumber}
                          onChange={(e) =>
                            updatePart(part.id, prev => ({ ...prev, partNumber: e.target.value }))
                          }
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
                          value={part.quantity}
                          onChange={(e) =>
                            updatePart(part.id, prev => ({
                              ...prev,
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                          required
                          inputProps={{ min: 1 }}
                          variant="outlined"
                          helperText="How many do you need?"
                        />
                      </Grid>

                      <Grid size={12}>
                        <Paper
                          variant="outlined"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            borderRadius: 2,
                            p: 2,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <UploadFileIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Attach CAD file (optional)
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Accepted: STEP (.step/.stp), SolidWorks (.sldprt/.sldasm), 3MF, STL, OBJ, IGES. Max {MAX_UPLOAD_MB} MB.
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                              {part.file ? 'Change File' : 'Choose File'}
                              <input
                                type="file"
                                hidden
                                onChange={(e) => handleFileChange(e, part.id)}
                                accept=".step,.stp,.sldprt,.sldasm,.3mf,.stl,.obj,.iges,.igs"
                              />
                            </Button>
                            {part.file && (
                              <>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                  {part.file.name} ({formatFileSize(part.file.size)})
                                </Typography>
                                <Button
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    updatePart(part.id, prev => ({ ...prev, file: null, fileError: null }))
                                  }
                                >
                                  Remove
                                </Button>
                              </>
                            )}
                          </Box>
                          {part.fileError && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {part.fileError}
                            </Alert>
                          )}
                        </Paper>
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Description / Notes"
                          multiline
                          rows={3}
                          value={part.description}
                          onChange={(e) =>
                            updatePart(part.id, prev => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Material preferences, special requirements, etc."
                          variant="outlined"
                          helperText="Any additional details about the print (optional)"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="Needed By (Optional)"
                          value={part.deadline}
                          onChange={(date) =>
                            updatePart(part.id, prev => ({ ...prev, deadline: date }))
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: 'outlined',
                              helperText: 'When do you need this completed?',
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={requestMeta.requesterName}
                  onChange={(e) => handleMetaChange('requesterName', e.target.value)}
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
                  value={requestMeta.requesterEmail}
                  onChange={(e) => handleMetaChange('requesterEmail', e.target.value)}
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
