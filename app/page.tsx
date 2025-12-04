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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SendIcon from '@mui/icons-material/Send';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';

export default function Home() {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    quantity: 1,
    deadline: null as Date | null,
    requesterName: '',
    requesterEmail: '',
    requestType: 'rd_parts' as 'rd_parts' | 'work_order',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        const isWorkOrder = formData.requestType === 'work_order';
        setMessage({
          type: 'success',
          text: isWorkOrder 
            ? '> Request submitted! Work order notification sent to Mike and Gunner for approval.'
            : '> Request submitted successfully! You will receive a confirmation email shortly.',
        });

        // Reset form
        setFormData({
          partNumber: '',
          description: '',
          quantity: 1,
          deadline: null,
          requesterName: '',
          requesterEmail: '',
          requestType: 'rd_parts',
        });
      } else {
        setMessage({
          type: 'error',
          text: `> Error: ${result.error || 'Failed to submit request. Please try again.'}`,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '> Connection error. Please check your network and try again.',
      });
    } finally {
      setLoading(false);
    }
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
              textShadow: '0 0 10px #15ff00',
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

          {message && (
            <Alert 
              severity={message.type} 
              sx={{ 
                mb: 3,
                fontFamily: '"VT323", monospace',
              }}
            >
              {message.text}
            </Alert>
          )}

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
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This request will notify Mike and Gunner to create a work order.
                    </Alert>
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
