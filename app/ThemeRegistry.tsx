'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Blue terminal theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00aaff',
      light: '#4daaff',
      dark: '#0066aa',
      contrastText: '#0a0a0a',
    },
    secondary: {
      main: '#0088ff',
      light: '#4daaff',
      dark: '#0055aa',
      contrastText: '#0a0a0a',
    },
    warning: {
      main: '#00aaff',
      light: '#4daaff',
      dark: '#0066aa',
      contrastText: '#0a0a0a',
    },
    error: {
      main: '#ff3300',
      light: '#ff6644',
      dark: '#cc2900',
    },
    background: {
      default: '#0a0a0a',
      paper: '#0d131a',
    },
    text: {
      primary: '#00aaff',
      secondary: '#0088cc',
      disabled: '#003366',
    },
    divider: '#0066aa',
  },
  typography: {
    fontFamily: '"VT323", "Share Tech Mono", monospace',
    fontSize: 18,
    h1: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h4: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    h5: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    h6: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    body1: {
      fontFamily: '"VT323", monospace',
      fontSize: '1.2rem',
      letterSpacing: '0.02em',
    },
    body2: {
      fontFamily: '"VT323", monospace',
      fontSize: '1.1rem',
      letterSpacing: '0.02em',
    },
    button: {
      fontFamily: '"VT323", monospace',
      fontWeight: 400,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontFamily: '"VT323", monospace',
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
          color: '#00aaff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(13, 19, 26, 0.9)',
          border: '2px solid #00aaff',
          boxShadow: '0 0 10px #00aaff, inset 0 0 20px rgba(0, 170, 255, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #00aaff, transparent)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid #00aaff',
          boxShadow: '0 0 5px #00aaff',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.5)',
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
            border: '2px solid #00aaff',
          },
        },
        contained: {
          backgroundColor: 'rgba(0, 170, 255, 0.2)',
          color: '#00aaff',
          '&:hover': {
            backgroundColor: 'rgba(0, 170, 255, 0.3)',
          },
        },
        outlined: {
          borderColor: '#00aaff',
          color: '#00aaff',
          '&:hover': {
            borderColor: '#00aaff',
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
          },
        },
        text: {
          color: '#00aaff',
          '&:hover': {
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#0066aa',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#00aaff',
              boxShadow: '0 0 5px #00aaff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00aaff',
              boxShadow: '0 0 10px #00aaff',
            },
          },
          '& .MuiInputBase-input': {
            color: '#00aaff',
            fontFamily: '"VT323", monospace',
            fontSize: '1.2rem',
            '&::placeholder': {
              color: '#003366',
              opacity: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#0088cc',
            fontFamily: '"VT323", monospace',
            fontSize: '1.2rem',
            '&.Mui-focused': {
              color: '#00aaff',
            },
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: '2px solid #0066aa',
          color: '#0066aa',
          fontFamily: '"VT323", monospace',
          fontSize: '1.2rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
            borderColor: '#00aaff',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 170, 255, 0.2)',
            color: '#00aaff',
            borderColor: '#00aaff',
            boxShadow: '0 0 10px #00aaff, inset 0 0 10px rgba(0, 170, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 170, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          '& .MuiToggleButton-root': {
            '&:not(:first-of-type)': {
              borderLeft: '2px solid #0066aa',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          border: '2px solid',
          fontFamily: '"VT323", monospace',
          fontSize: '1.1rem',
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 170, 255, 0.1)',
          borderColor: '#00aaff',
          color: '#00aaff',
          '& .MuiAlert-icon': {
            color: '#00aaff',
          },
        },
        standardSuccess: {
          backgroundColor: 'rgba(0, 170, 255, 0.1)',
          borderColor: '#00aaff',
          color: '#00aaff',
          '& .MuiAlert-icon': {
            color: '#00aaff',
          },
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 170, 0, 0.1)',
          borderColor: '#ffaa00',
          color: '#ffaa00',
          '& .MuiAlert-icon': {
            color: '#ffaa00',
          },
        },
        standardError: {
          backgroundColor: 'rgba(255, 51, 0, 0.1)',
          borderColor: '#ff3300',
          color: '#ff3300',
          '& .MuiAlert-icon': {
            color: '#ff3300',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(13, 19, 26, 0.8)',
          border: '2px solid #0066aa',
          boxShadow: '0 0 5px rgba(0, 170, 255, 0.3)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          textShadow: '0 0 5px currentColor',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#00aaff',
          textShadow: '0 0 5px #00aaff',
          '&:hover': {
            textShadow: '0 0 10px #00aaff, 0 0 20px #00aaff',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00aaff',
          filter: 'drop-shadow(0 0 5px #00aaff)',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          filter: 'drop-shadow(0 0 2px currentColor)',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
            color: '#00aaff',
            fontWeight: 'bold',
            borderBottom: '2px solid #00aaff',
            fontFamily: '"VT323", monospace',
            fontSize: '1.1rem',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: 'rgba(0, 170, 255, 0.05)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #0066aa',
          color: '#00aaff',
          fontFamily: '"VT323", monospace',
          fontSize: '1rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          fontSize: '1rem',
          border: '1px solid',
        },
        colorWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          borderColor: '#ff9800',
          color: '#ff9800',
        },
        colorInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderColor: '#2196f3',
          color: '#2196f3',
        },
        colorSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: '#4caf50',
          color: '#4caf50',
        },
        colorError: {
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderColor: '#f44336',
          color: '#f44336',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0d131a',
          border: '2px solid #00aaff',
          boxShadow: '0 0 30px #00aaff',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          fontSize: '1.5rem',
          borderBottom: '1px solid #0066aa',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0066aa',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00aaff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00aaff',
            boxShadow: '0 0 10px #00aaff',
          },
        },
        icon: {
          color: '#00aaff',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          fontSize: '1.1rem',
          '&:hover': {
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 170, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 170, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          color: '#0088cc',
          '&.Mui-focused': {
            color: '#00aaff',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: '"VT323", monospace',
          color: '#0066aa',
          fontSize: '0.9rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#00aaff',
          '&:hover': {
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0d131a',
          border: '1px solid #00aaff',
          fontFamily: '"VT323", monospace',
          fontSize: '1rem',
          boxShadow: '0 0 10px #00aaff',
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
