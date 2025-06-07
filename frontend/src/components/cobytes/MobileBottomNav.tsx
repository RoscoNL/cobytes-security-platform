import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

interface MobileBottomNavProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  height: 56,
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  [theme.breakpoints.up('md')]: {
    display: 'none', // Hide on desktop
  },
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  minWidth: 80,
  padding: '6px 12px 8px',
  '&.Mui-selected': {
    color: '#FF6B35',
  },
  '& .MuiBottomNavigationAction-label': {
    fontSize: '0.75rem',
    fontWeight: 500,
    '&.Mui-selected': {
      fontSize: '0.75rem',
      fontWeight: 600,
    },
  },
  '& .MuiSvgIcon-root': {
    fontSize: 24,
  },
}));

const BottomNavContainer = styled(Box)(({ theme }) => ({
  paddingBottom: 56, // Add padding to prevent content from being hidden behind nav
  [theme.breakpoints.up('md')]: {
    paddingBottom: 0,
  },
}));

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  value,
  onChange,
}) => {
  return (
    <>
      <StyledBottomNavigation
        value={value}
        onChange={onChange}
        showLabels
      >
        <StyledBottomNavigationAction
          label="Scan"
          icon={<SecurityIcon />}
        />
        <StyledBottomNavigationAction
          label="Reports"
          icon={<DescriptionIcon />}
        />
        <StyledBottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
        />
      </StyledBottomNavigation>
    </>
  );
};

// Export a helper component to wrap content with bottom padding
export const MobileBottomNavWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <BottomNavContainer>{children}</BottomNavContainer>;
};