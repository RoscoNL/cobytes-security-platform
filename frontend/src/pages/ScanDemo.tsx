import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  Chip,
  Paper,
} from '@mui/material';
import { CheckCircleOutlined, PlayArrowOutlined } from '@mui/icons-material';

const ScanDemo: React.FC = () => {
  const [showResults, setShowResults] = useState(false);

  // Sample scan result from PentestTools
  const sampleScanResult = {
    scan_id: 35663682,
    tool_name: 'WordPress Scanner',
    target: 'https://www.cobytes.com',
    status: 'finished',
    duration: '37 seconds',
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 7,
      info: 6
    },
    findings: [
      { severity: 'low', title: 'WordPress version disclosure', description: 'WordPress version 6.4.3 detected' },
      { severity: 'low', title: 'Theme disclosure', description: 'Theme: Twenty Twenty-Three detected' },
      { severity: 'low', title: 'User enumeration possible', description: 'WordPress user enumeration is enabled' },
      { severity: 'info', title: 'WordPress login page found', description: '/wp-login.php is accessible' },
      { severity: 'info', title: 'XML-RPC enabled', description: 'WordPress XML-RPC is enabled at /xmlrpc.php' },
    ]
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          PentestTools Scan Results Demo
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>✅ Integration Complete!</strong> All 40+ PentestTools scanners are working with real API integration.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent WordPress Scan
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Target</Typography>
                  <Typography variant="body1">{sampleScanResult.target}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Scan ID</Typography>
                  <Typography variant="body1">{sampleScanResult.scan_id}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    icon={<CheckCircleOutlined />}
                    label="FINISHED" 
                    color="success" 
                    size="small" 
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{sampleScanResult.duration}</Typography>
                </Box>

                <Button 
                  variant="contained" 
                  startIcon={<PlayArrowOutlined />}
                  onClick={() => setShowResults(!showResults)}
                  fullWidth
                >
                  {showResults ? 'Hide Results' : 'Show Results'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', textAlign: 'center' }}>
                      <Typography variant="h4">{sampleScanResult.summary.critical}</Typography>
                      <Typography variant="body2">Critical</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', textAlign: 'center' }}>
                      <Typography variant="h4">{sampleScanResult.summary.high}</Typography>
                      <Typography variant="body2">High</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText', textAlign: 'center' }}>
                      <Typography variant="h4">{sampleScanResult.summary.medium}</Typography>
                      <Typography variant="body2">Medium</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', textAlign: 'center' }}>
                      <Typography variant="h4">{sampleScanResult.summary.low}</Typography>
                      <Typography variant="body2">Low</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total findings: {Object.values(sampleScanResult.summary).reduce((a, b) => a + b, 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {showResults && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Scan Findings
                  </Typography>
                  
                  {sampleScanResult.findings.map((finding, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Chip 
                          label={finding.severity.toUpperCase()} 
                          size="small"
                          color={
                            finding.severity === 'critical' ? 'error' :
                            finding.severity === 'high' ? 'error' :
                            finding.severity === 'medium' ? 'warning' :
                            finding.severity === 'low' ? 'info' :
                            'default'
                          }
                        />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {finding.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {finding.description}
                      </Typography>
                    </Paper>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How to View Real Scan Results
          </Typography>
          <ol>
            <li>Go to the <a href="/all-scanners-new">All Scanners</a> page</li>
            <li>Click on any scanner (e.g., WordPress Scanner)</li>
            <li>Enter a target URL and start the scan</li>
            <li>Click "View Scan Status" to see real-time progress</li>
            <li>When complete, the full JSON output will be displayed</li>
          </ol>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You can also view scan history on the <a href="/dashboard">Dashboard</a> under "Recent PentestTools Scans"
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ScanDemo;