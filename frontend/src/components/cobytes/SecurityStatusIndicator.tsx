import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

export type SeverityLevel = 'success' | 'warning' | 'danger';

interface SecurityStatusIndicatorProps {
  severity: SeverityLevel;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const severityConfig = {
  success: {
    color: '#10B981',
    icon: CheckCircleIcon,
    label: 'Secure',
  },
  warning: {
    color: '#F59E0B',
    icon: WarningIcon,
    label: 'Warning',
  },
  danger: {
    color: '#EF4444',
    icon: ErrorIcon,
    label: 'Critical',
  },
};

const sizeConfig = {
  small: {
    iconSize: 16,
    fontSize: '0.75rem',
  },
  medium: {
    iconSize: 20,
    fontSize: '0.875rem',
  },
  large: {
    iconSize: 24,
    fontSize: '1rem',
  },
};

export const SecurityStatusIndicator: React.FC<SecurityStatusIndicatorProps> = ({
  severity,
  label,
  size = 'medium',
}) => {
  const config = severityConfig[severity];
  const sizeSettings = sizeConfig[size];
  const Icon = config.icon;

  return (
    <StatusContainer>
      <Icon
        sx={{
          color: config.color,
          fontSize: sizeSettings.iconSize,
        }}
      />
      {(label || config.label) && (
        <Typography
          variant="body2"
          sx={{
            color: config.color,
            fontSize: sizeSettings.fontSize,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label || config.label}
        </Typography>
      )}
    </StatusContainer>
  );
};