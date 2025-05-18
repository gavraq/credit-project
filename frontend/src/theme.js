import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0c4da2', // Standard Bank Blue
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#e31937', // ICBC Red
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E53E3E',
    },
    warning: {
      main: '#F6AD55',
    },
    success: {
      main: '#38B2AC',
    },
    info: {
      main: '#4299e1',
    },
    background: {
      default: '#F5F7FA', // Neutral 200
      paper: '#FFFFFF',   // Neutral 100
    },
    neutral: {
      100: '#FFFFFF',
      200: '#F5F7FA',
      300: '#E4E7EB',
      400: '#CBD2D9',
      500: '#9AA5B1',
      600: '#7B8794',
      700: '#4A5568',
      800: '#323F4B',
      900: '#1F2933',
    },
    interactive: {
      main: '#1e40af',
    },
    link: {
      main: '#3182ce',
    },
    blueLight: {
      main: '#e6edf7',
    },
    redLight: {
      main: '#fde8eb',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.875rem', // 30px
      fontWeight: 700,
      lineHeight: '2.25rem',
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 700,
      lineHeight: '2rem',
    },
    h3: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: '1.75rem',
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: '1.5rem',
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: '1.25rem',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: '1rem',
    },
    label: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: '1.25rem',
    },
    badge: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: '1rem',
    },
  },
  shape: {
    borderRadius: 6, // 0.375rem
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: 38,
          padding: '8px 16px',
          fontWeight: 500,
          borderRadius: 6,
        },
        containedPrimary: {
          backgroundColor: '#0c4da2',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#0b4491',
          },
        },
        containedSecondary: {
          backgroundColor: '#e31937',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#cc1731',
          },
        },
        containedSuccess: {
          backgroundColor: '#38B2AC',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#319795',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    // Add more component overrides as needed...
  },
});

export default theme;
