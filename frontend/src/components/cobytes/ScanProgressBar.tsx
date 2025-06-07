import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

interface ScanProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

const progressAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
`;

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(1),
}));

const ProgressLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const StyledLinearProgress = styled(LinearProgress)<{ animated?: boolean }>(
  ({ theme, animated }) => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.grey[200],
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#FF6B35',
      borderRadius: 4,
      ...(animated && {
        backgroundImage: `linear-gradient(
          90deg,
          #FF6B35 0%,
          #FF8A65 50%,
          #FF6B35 100%
        )`,
        backgroundSize: '200% 100%',
        animation: `${progressAnimation} 2s ease-in-out infinite`,
      }),
    },
  })
);

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  progress,
  label = 'Scanning...',
  showPercentage = true,
  animated = true,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <ProgressContainer>
      <ProgressLabel>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {label}
        </Typography>
        {showPercentage && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#FF6B35',
            }}
          >
            {clampedProgress}%
          </Typography>
        )}
      </ProgressLabel>
      <StyledLinearProgress
        variant="determinate"
        value={clampedProgress}
        animated={animated && clampedProgress < 100}
      />
    </ProgressContainer>
  );
};