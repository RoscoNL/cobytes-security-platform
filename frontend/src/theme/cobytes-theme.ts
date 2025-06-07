import { createTheme } from '@mui/material/styles';

// Cobytes Design System Colors
export const cobytesColors = {
  // Primary Colors
  orange: '#FF6B35',
  coral: '#FF5733',
  
  // Secondary Colors
  navy: '#3D3B5C',
  purple: '#4A4870',
  
  // Neutral Colors
  gray900: '#1F2937',
  gray700: '#374151',
  gray400: '#9CA3AF',
  gray100: '#F3F4F6',
  white: '#FFFFFF',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};

// Spacing based on 8px grid
export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64
};

// Create Cobytes theme
export const cobytesTheme = createTheme({
  palette: {
    primary: {
      main: cobytesColors.orange,
      light: cobytesColors.coral,
      dark: '#E55A2B',
      contrastText: cobytesColors.white,
    },
    secondary: {
      main: cobytesColors.navy,
      light: cobytesColors.purple,
      dark: '#2D2B4C',
      contrastText: cobytesColors.white,
    },
    error: {
      main: cobytesColors.danger,
      light: '#FEE2E2',
      dark: '#DC2626',
      contrastText: cobytesColors.white,
    },
    warning: {
      main: cobytesColors.warning,
      light: '#FEF3C7',
      dark: '#D97706',
      contrastText: cobytesColors.white,
    },
    success: {
      main: cobytesColors.success,
      light: '#D1FAE5',
      dark: '#059669',
      contrastText: cobytesColors.white,
    },
    info: {
      main: cobytesColors.info,
      light: '#DBEAFE',
      dark: '#1E40AF',
      contrastText: cobytesColors.white,
    },
    grey: {
      50: cobytesColors.gray100,
      100: cobytesColors.gray100,
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: cobytesColors.gray400,
      500: '#6B7280',
      600: '#4B5563',
      700: cobytesColors.gray700,
      800: '#1F2937',
      900: cobytesColors.gray900,
    },
    background: {
      default: cobytesColors.gray100,
      paper: cobytesColors.white,
    },
    text: {
      primary: cobytesColors.gray900,
      secondary: cobytesColors.gray700,
      disabled: cobytesColors.gray400,
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '1.875rem', // 30px
      fontWeight: 700,
      lineHeight: 1.2,
      color: cobytesColors.navy,
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      color: cobytesColors.navy,
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      color: cobytesColors.navy,
    },
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.4,
      color: cobytesColors.navy,
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      color: cobytesColors.navy,
    },
    h6: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      lineHeight: 1.5,
      color: cobytesColors.navy,
    },
    body1: {
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      color: cobytesColors.gray900,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
      color: cobytesColors.gray700,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      color: cobytesColors.gray700,
    },
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            backgroundColor: cobytesColors.orange,
            boxShadow: '0 2px 4px rgba(255, 107, 53, 0.2)',
            '&:hover': {
              backgroundColor: cobytesColors.coral,
              boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)',
            },
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
          '&.MuiButton-outlinedSecondary': {
            borderColor: cobytesColors.navy,
            color: cobytesColors.navy,
            '&:hover': {
              backgroundColor: 'rgba(61, 59, 92, 0.04)',
              borderColor: cobytesColors.navy,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${cobytesColors.gray100}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
        colorSuccess: {
          backgroundColor: '#D1FAE5',
          color: cobytesColors.success,
        },
        colorWarning: {
          backgroundColor: '#FEF3C7',
          color: cobytesColors.warning,
        },
        colorError: {
          backgroundColor: '#FEE2E2',
          color: cobytesColors.danger,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: cobytesColors.gray100,
        },
        bar: {
          borderRadius: 4,
          backgroundColor: cobytesColors.orange,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#D1FAE5',
          color: cobytesColors.success,
        },
        standardWarning: {
          backgroundColor: '#FEF3C7',
          color: cobytesColors.warning,
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: cobytesColors.danger,
        },
        standardInfo: {
          backgroundColor: '#DBEAFE',
          color: cobytesColors.info,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: cobytesColors.white,
          color: cobytesColors.navy,
          boxShadow: 'none',
          borderBottom: `1px solid ${cobytesColors.gray100}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${cobytesColors.gray100}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: cobytesColors.orange,
            },
            '&.Mui-focused fieldset': {
              borderColor: cobytesColors.orange,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default cobytesTheme;