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

  // Mock scan results
  const scanResults = [
    {
      title: 'SSL Certificate Status',
      description: 'Your SSL certificate is properly configured and valid',
      severity: 'success' as const,
      details: [
        { label: 'Issuer', value: "Let's Encrypt" },
        { label: 'Valid Until', value: '2024-12-31' },
        { label: 'Protocol', value: 'TLS 1.3' },
        { label: 'Key Size', value: '2048 bit' },
      ],
      tags: ['SSL', 'Security', 'HTTPS'],
    },
    {
      title: 'Open Ports Scan',
      description: 'Found 3 open ports, 1 requires attention',
      severity: 'warning' as const,
      details: [
        { label: 'Total Ports', value: '65535' },
        { label: 'Open Ports', value: '3' },
        { label: 'Critical', value: '1' },
        { label: 'Last Scan', value: '2 hours ago' },
      ],
      tags: ['Network', 'Ports', 'Firewall'],
    },
    {
      title: 'Vulnerability Assessment',
      description: 'Critical vulnerability detected in outdated dependency',
      severity: 'danger' as const,
      details: [
        { label: 'CVE ID', value: 'CVE-2023-12345' },
        { label: 'CVSS Score', value: '9.8' },
        { label: 'Package', value: 'lodash@4.17.0' },
        { label: 'Fix Available', value: 'Yes' },
      ],
      tags: ['CVE', 'Dependencies', 'Critical'],
    },
  ];

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
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
          <Grid container spacing={3}>
            {scanResults.map((result, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <ScanResultCard {...result} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {scanResults
              .filter((r) => r.severity === 'danger')
              .map((result, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <ScanResultCard {...result} />
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {scanResults
              .filter((r) => r.severity === 'warning')
              .map((result, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <ScanResultCard {...result} />
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {scanResults
              .filter((r) => r.severity === 'success')
              .map((result, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <ScanResultCard {...result} />
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        {/* Summary Stats */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <SecurityStatusIndicator severity="danger" size="large" />
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
                  1
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
                  1
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
                  1
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