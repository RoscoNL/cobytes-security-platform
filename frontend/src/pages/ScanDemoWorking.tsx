import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  SecurityOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  ScannerOutlined,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ScanDemoWorking: React.FC = () => {
  const [target, setTarget] = useState('https://www.cobytes.com');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanId, setScanId] = useState<string | null>(null);

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const startScan = async () => {
    if (!target) {
      setError('Please enter a URL to scan');
      return;
    }

    if (!validateUrl(target)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setError('');
    setScanning(true);
    setScanResults(null);
    setScanProgress(0);

    try {
      // Create scan without authentication
      const response = await axios.post(`${API_URL}/scans/free`, {
        target,
        type: 'ssl',
      });

      const scan = response.data.data;
      setScanId(scan.id);
      
      // Poll for scan completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`${API_URL}/scans/free/${scan.id}`);
          const currentScan = statusResponse.data.data;
          
          setScanProgress(currentScan.progress || 0);
          
          if (currentScan.status === 'completed') {
            clearInterval(pollInterval);
            setScanResults(currentScan);
            setScanning(false);
          } else if (currentScan.status === 'failed') {
            clearInterval(pollInterval);
            setError('Scan failed: ' + (currentScan.error_message || 'Unknown error'));
            setScanning(false);
          }
        } catch (error) {
          console.error('Error polling scan status:', error);
          clearInterval(pollInterval);
          setError('Failed to get scan status');
          setScanning(false);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (scanning) {
          setError('Scan timed out');
          setScanning(false);
        }
      }, 60000);

    } catch (error: any) {
      console.error('Failed to start scan:', error);
      setError(error.response?.data?.error || 'Failed to start scan. Please try again.');
      setScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Free Security Scan Demo
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Try our free SSL security scan - no authentication required!
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              SSL Security Scanner
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Target URL"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={scanning}
                placeholder="https://example.com"
                helperText="Enter a URL to scan for SSL/TLS security issues"
              />
              <Button
                variant="contained"
                onClick={startScan}
                disabled={scanning || !target}
                startIcon={scanning ? <CircularProgress size={20} /> : <ScannerOutlined />}
                sx={{ minWidth: 150 }}
              >
                {scanning ? 'Scanning...' : 'Start Scan'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {scanning && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Scanning in progress... {Math.round(scanProgress)}%
                </Typography>
                <LinearProgress variant="determinate" value={scanProgress} />
                {scanId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Scan ID: {scanId}
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {scanResults && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleOutlined color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Scan Complete
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Target
                    </Typography>
                    <Typography variant="body1">
                      {scanResults.target}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Scan Duration
                    </Typography>
                    <Typography variant="body1">
                      {scanResults.completed_at && scanResults.created_at
                        ? `${Math.round((new Date(scanResults.completed_at).getTime() - new Date(scanResults.created_at).getTime()) / 1000)}s`
                        : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {scanResults.results && scanResults.results.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Security Findings
                  </Typography>
                  {scanResults.results.map((result: any, index: number) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Chip
                          label={result.severity.toUpperCase()}
                          size="small"
                          color={getSeverityColor(result.severity) as any}
                        />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {result.title}
                        </Typography>
                      </Box>
                      {result.description && (
                        <Typography variant="body2" color="text.secondary">
                          {result.description}
                        </Typography>
                      )}
                      {result.recommendation && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Recommendation:</strong> {result.recommendation}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="success" icon={<CheckCircleOutlined />}>
                  No security issues found! Your SSL/TLS configuration appears to be secure.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            What This Scan Checks
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  SSL/TLS Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Certificate validity and expiration
                  <br />• Protocol versions (TLS 1.2, 1.3)
                  <br />• Cipher suite strength
                  <br />• Certificate chain validation
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Security Headers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • HSTS (HTTP Strict Transport Security)
                  <br />• Content Security Policy
                  <br />• X-Frame-Options
                  <br />• X-Content-Type-Options
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Want more comprehensive scans?</strong> Sign up for a free account to access 40+ professional security scanners including WordPress, port scanning, subdomain discovery, and more!
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default ScanDemoWorking;