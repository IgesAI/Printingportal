'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565c0', // Darker blue for better contrast
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7b1fa2', // Purple with better contrast
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32', // Darker green
      contrastText: '#ffffff',
    },
    warning: {
      main: '#e65100', // Darker orange for better contrast
      contrastText: '#ffffff',
    },
    error: {
      main: '#c62828', // Darker red
      contrastText: '#ffffff',
    },
    info: {
      main: '#0277bd', // Darker blue
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    // Ensure Chip has good contrast
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        filled: {
          '&.MuiChip-colorDefault': {
            backgroundColor: '#616161',
            color: '#ffffff',
          },
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
