import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Shield, PlayArrow, Description } from '@mui/icons-material';
import {
  SecurityStatusIndicator,
  ScanProgressBar,
  ScanResultCard,
  MobileBottomNav,
  MobileBottomNavWrapper,
} from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SecurityDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Real scan results would be fetched from the API
  const scanResults: any[] = [];

  const handleStartScan = () => {
    // Real scan would be initiated through the API
    alert('Real scan integration required - no mock scanning available');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <MobileBottomNavWrapper>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              color: cobytesColors.navy,
              mb: 2,
            }}
          >
            Security Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your application's security posture
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background: `linear-gradient(135deg, ${cobytesColors.orange} 0%, ${cobytesColors.coral} 100%)`,
            color: 'white',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Shield sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Security Scan
                  </Typography>
                  <Typography variant="body2">
                    Run a comprehensive security scan to identify vulnerabilities
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleStartScan}
                disabled={isScanning}
                sx={{
                  bgcolor: 'white',
                  color: cobytesColors.orange,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
                fullWidth
              >
                {isScanning ? 'Scanning...' : 'Start Scan'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Scan Progress */}
        {(isScanning || scanProgress > 0) && (
          <Box sx={{ mb: 4 }}>
            <ScanProgressBar
              progress={scanProgress}
              label="Security Scan Progress"
              animated={isScanning}
            />
          </Box>
        )}

        {/* Results Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Results" />
            <Tab label="Critical" />
            <Tab label="Warnings" />
            <Tab label="Passed" />
          </Tabs>
        </Box>

        {/* Results Grid */}
        <TabPanel value={tabValue} index={0}>
          <Alert severity="info">
            No scan results available. Run a real security scan to see results.
          </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="info">
            No critical issues found. Run a real security scan to see results.
          </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info">
            No warnings found. Run a real security scan to see results.
          </Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Alert severity="info">
            No passed checks found. Run a real security scan to see results.
          </Alert>
        </TabPanel>

        {/* Summary Stats */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <SecurityStatusIndicator severity="danger" size="large" />
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Issues
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <SecurityStatusIndicator severity="warning" size="large" />
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Warnings
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <SecurityStatusIndicator severity="success" size="large" />
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Passed Checks
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        value={bottomNavValue} 
        onChange={(event, newValue) => setBottomNavValue(newValue)} 
      />
    </MobileBottomNavWrapper>
  );
};

export default SecurityDashboard;