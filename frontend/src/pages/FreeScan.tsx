import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  SecurityOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  WarningOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const FreeScan: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [target, setTarget] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  const steps = ['Enter Target', 'Scanning', 'View Results'];

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const startFreeScan = async () => {
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
    setActiveStep(1);
    setScanProgress(0);

    try {
      // Create scan without authentication - backend should allow SSL scans without auth
      const response = await axios.post(`${API_URL}/scans/free`, {
        target,
        type: 'ssl', // Free scans are limited to SSL checks
      });

      const scan = response.data.data || response.data;
      
      // Poll for scan completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`${API_URL}/scans/free/${scan.id}`);
          const currentScan = statusResponse.data.data || statusResponse.data;
          
          setScanProgress(currentScan.progress || 0);
          
          if (currentScan.status === 'completed') {
            clearInterval(pollInterval);
            setScanResults(currentScan);
            setActiveStep(2);
            setScanning(false);
          } else if (currentScan.status === 'failed') {
            clearInterval(pollInterval);
            setError('Scan failed: ' + (currentScan.error_message || 'Unknown error'));
            setScanning(false);
            setActiveStep(0);
          }
        } catch (error) {
          console.error('Error polling scan status:', error);
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (scanning) {
          setError('Scan timed out. Please try again.');
          setScanning(false);
          setActiveStep(0);
        }
      }, 120000);

    } catch (error: any) {
      console.error('Scan error:', error);
      setError(error.response?.data?.error || 'Failed to start scan. Please try again.');
      setScanning(false);
      setActiveStep(0);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <ErrorOutlined color="error" />;
      case 'medium':
        return <WarningOutlined color="warning" />;
      case 'low':
        return <InfoOutlined color="info" />;
      default:
        return <CheckCircleOutlined color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <SecurityOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Free SSL Security Scan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Instantly check your website's SSL certificate and security headers
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Enter Website URL
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Website URL"
                placeholder="https://example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                error={!!error}
                helperText={error}
                sx={{ mb: 3 }}
              />
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={startFreeScan}
                disabled={scanning}
              >
                Start Free Scan
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Free Scan includes:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>SSL certificate validation</li>
                <li>Security headers check</li>
                <li>Basic vulnerability detection</li>
              </ul>
              For comprehensive scanning including WordPress, network, and API testing, 
              <Button 
                size="small" 
                onClick={() => navigate('/login')}
                sx={{ ml: 1 }}
              >
                upgrade to Professional
              </Button>
            </Alert>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Scanning {target}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                This usually takes 30-60 seconds
              </Typography>
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress variant="determinate" value={scanProgress} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {scanProgress}% Complete
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && scanResults && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Scan Complete
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckCircleOutlined />} 
                  label="Scan Completed" 
                  color="success" 
                />
                <Chip 
                  label={`Target: ${scanResults.target}`} 
                  variant="outlined" 
                />
              </Box>

              {scanResults.results && scanResults.results.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Findings
                  </Typography>
                  
                  <List>
                    {scanResults.results.map((result: any, index: number) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getSeverityIcon(result.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={result.title}
                          secondary={result.description}
                        />
                        <Chip
                          label={result.severity}
                          size="small"
                          color={getSeverityColor(result.severity) as any}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setActiveStep(0);
                    setScanResults(null);
                    setTarget('');
                  }}
                >
                  Scan Another Site
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Get Full Report
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="success">
            <strong>Want more detailed analysis?</strong> Professional scans include:
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>40+ different security scanners</li>
              <li>WordPress/Joomla/Drupal vulnerability scanning</li>
              <li>Network and port scanning</li>
              <li>API security testing</li>
              <li>Detailed PDF reports</li>
            </ul>
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => navigate('/pricing')}
              sx={{ mt: 2 }}
            >
              View Pricing
            </Button>
          </Alert>
        </>
      )}
    </Container>
  );
};

export default FreeScan;