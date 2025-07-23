import { createTheme } from '@mui/material/styles';

// Credit Risk Workflow System Theme
// Based on Credit Workflow Design Brief - implementing ICBC + Standard Bank design system
const theme = createTheme({
  palette: {
    // Primary Colors
    primary: {
      main: '#0c4da2', // Standard Bank Blue
      light: '#e6edf7', // Blue Light
      dark: '#0b4491', // Hover variant
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#e31937', // ICBC Red
      light: '#fde8eb', // Red Light
      dark: '#cc1731', // Hover variant
      contrastText: '#FFFFFF',
    },
    // Functional Colors
    success: {
      main: '#38B2AC',
      dark: '#319795',
      light: '#d1fae5',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F6AD55',
      light: '#fef3c7',
      contrastText: '#92400e',
    },
    error: {
      main: '#E53E3E',
      light: '#fee2e2',
      contrastText: '#b91c1c',
    },
    info: {
      main: '#4299e1',
      light: '#dbeafe',
      contrastText: '#1e40af',
    },
    // Neutral Colors mapped to Material-UI grey scale
    grey: {
      50: '#FFFFFF',   // neutral100
      100: '#F5F7FA',  // neutral200
      200: '#E4E7EB',  // neutral300
      300: '#CBD2D9',  // neutral400
      400: '#9AA5B1',  // neutral500
      500: '#7B8794',  // neutral600
      600: '#4A5568',  // neutral700
      700: '#323F4B',  // neutral800
      800: '#1F2933',  // neutral900
    },
    background: {
      default: '#F5F7FA', // neutral200
      paper: '#FFFFFF',   // neutral100
    },
    text: {
      primary: '#323F4B',   // neutral800
      secondary: '#7B8794', // neutral600
      disabled: '#9AA5B1',  // neutral500
    },
    // Custom colors for backward compatibility
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
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    // Headings - as per design brief
    h1: {
      fontSize: '1.875rem', // 30px
      fontWeight: 700,
      lineHeight: '2.25rem',
      color: '#323F4B',
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 700,
      lineHeight: '2rem',
      color: '#323F4B',
    },
    h3: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: '1.75rem',
      color: '#323F4B',
    },
    // Body Text
    body1: {
      fontSize: '1rem', // 16px - Body Large
      fontWeight: 400,
      lineHeight: '1.5rem',
      color: '#323F4B',
    },
    body2: {
      fontSize: '0.875rem', // 14px - Standard body
      fontWeight: 400,
      lineHeight: '1.25rem',
      color: '#323F4B',
    },
    caption: {
      fontSize: '0.75rem', // 12px - Body Small
      fontWeight: 400,
      lineHeight: '1rem',
      color: '#7B8794',
    },
    // Special Text
    subtitle1: {
      fontSize: '0.875rem', // 14px - Label
      fontWeight: 500,
      lineHeight: '1.25rem',
      color: '#4A5568',
    },
    subtitle2: {
      fontSize: '0.75rem', // 12px - Caption/Badge
      fontWeight: 500,
      lineHeight: '1rem',
      color: '#4A5568',
    },
    // Custom typography variants for backward compatibility
    label: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: '1.25rem',
      color: '#4A5568',
    },
    badge: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: '1rem',
      color: '#4A5568',
    },
  },
  spacing: 4, // Base spacing unit (4px) - supports design brief spacing system
  shape: {
    borderRadius: 6, // 0.375rem
  },
  components: {
    // Button Overrides - Design Brief Specifications
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase transformation
          fontSize: '0.875rem',   // 14px
          fontWeight: 500,
          height: 38,
          borderRadius: 6,
          padding: '8px 16px',
          transition: 'all 200ms ease-out',
        },
        containedPrimary: {
          backgroundColor: '#0c4da2',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0b4491',
          },
        },
        containedSecondary: {
          backgroundColor: '#e31937',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#cc1731',
          },
        },
        outlined: {
          borderColor: '#E4E7EB',
          color: '#323F4B',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#F5F7FA',
            borderColor: '#CBD2D9',
          },
        },
      },
      variants: [
        {
          props: { variant: 'success' },
          style: {
            backgroundColor: '#38B2AC',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#319795',
            },
          },
        },
        {
          props: { variant: 'destructive' },
          style: {
            backgroundColor: '#e31937',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#cc1731',
            },
          },
        },
      ],
    },
    // Input Field Overrides - Design Brief Specifications
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            height: 38,
            fontSize: '0.875rem',
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#CBD2D9',
            },
            '&:hover fieldset': {
              borderColor: '#9AA5B1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0c4da2',
              boxShadow: '0 0 0 2px rgba(12, 77, 162, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#4A5568',
            '&.Mui-focused': {
              color: '#0c4da2',
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.75rem',
            color: '#7B8794',
          },
        },
      },
    },
    // Select Field Overrides
    MuiSelect: {
      styleOverrides: {
        root: {
          height: 38,
          fontSize: '0.875rem',
          backgroundColor: '#FFFFFF',
        },
        outlined: {
          borderColor: '#CBD2D9',
          '&:hover': {
            borderColor: '#9AA5B1',
          },
          '&.Mui-focused': {
            borderColor: '#0c4da2',
          },
        },
      },
    },
    // Paper/Card Overrides - Design Brief Specifications
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    // Tabs Overrides - Design Brief Specifications
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E4E7EB',
          minHeight: 48,
        },
        indicator: {
          backgroundColor: '#0c4da2',
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#7B8794',
          padding: '16px',
          '&.Mui-selected': {
            color: '#0c4da2',
          },
          '&:hover': {
            color: '#4A5568',
          },
        },
      },
    },
    // Form Control Styling
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: '1rem',
        },
      },
    },
    // Checkbox Overrides - Design Brief Specifications
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#CBD2D9',
          '&.Mui-checked': {
            color: '#0c4da2',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1rem',
            borderRadius: '0.25rem',
          },
        },
      },
    },
    // Radio Button Overrides - Design Brief Specifications
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#CBD2D9',
          '&.Mui-checked': {
            color: '#0c4da2',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1rem',
          },
        },
      },
    },
    // Legacy MuiCard for backward compatibility
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 8,
          padding: '1.5rem',
        },
      },
    },
  },
});

export default theme;
