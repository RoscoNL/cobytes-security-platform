import React from 'react';
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SecurityStatusIndicator, SeverityLevel } from './SecurityStatusIndicator';

interface ScanResultCardProps {
  title: string;
  severity: SeverityLevel;
  description?: string;
  details?: Array<{
    label: string;
    value: string | number;
  }>;
  tags?: string[];
  onClick?: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)',
  },
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

const DetailsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  title,
  severity,
  description,
  details,
  tags,
  onClick,
}) => {
  return (
    <StyledCard onClick={onClick}>
      <CardContent sx={{ padding: 3 }}>
        <CardHeader>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                color: 'text.primary',
                marginBottom: 1,
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
          <SecurityStatusIndicator severity={severity} size="medium" />
        </CardHeader>

        {details && details.length > 0 && (
          <DetailsContainer>
            {details.map((detail, index) => (
              <DetailItem key={index}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    color: 'text.secondary',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {detail.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                >
                  {detail.value}
                </Typography>
              </DetailItem>
            ))}
          </DetailsContainer>
        )}

        {tags && tags.length > 0 && (
          <TagsContainer>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  color: '#FF6B35',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 107, 53, 0.2)',
                  },
                }}
              />
            ))}
          </TagsContainer>
        )}
      </CardContent>
    </StyledCard>
  );
};