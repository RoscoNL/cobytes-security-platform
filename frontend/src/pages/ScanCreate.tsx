import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Language as WebIcon,
  Dns as DnsIcon,
  VpnLock as NetworkIcon,
  Code as CodeIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Available scan types
const SCAN_TYPES = [
  {
    category: 'CMS Security',
    icon: <WebIcon />,
    types: [
      { id: 'wordpress', name: 'WordPress Scanner', description: 'Scan WordPress sites for vulnerabilities' },
      { id: 'drupal', name: 'Drupal Scanner', description: 'Scan Drupal sites for vulnerabilities' },
      { id: 'joomla', name: 'Joomla Scanner', description: 'Scan Joomla sites for vulnerabilities' },
    ]
  },
  {
    category: 'Web Security',
    icon: <SecurityIcon />,
    types: [
      { id: 'website', name: 'Website Scanner', description: 'Comprehensive website vulnerability scan' },
      { id: 'ssl', name: 'SSL Scanner', description: 'SSL/TLS configuration analysis' },
      { id: 'headers', name: 'HTTP Headers', description: 'Security headers analysis' },
    ]
  },
  {
    category: 'Network Security',
    icon: <NetworkIcon />,
    types: [
      { id: 'network', name: 'Network Scanner', description: 'Comprehensive network vulnerability scanning' },
      { id: 'port_scan', name: 'Port Scanner', description: 'Scan TCP/UDP ports' },
    ]
  },
  {
    category: 'Domain & DNS',
    icon: <DnsIcon />,
    types: [
      { id: 'subdomain', name: 'Subdomain Finder', description: 'Discover subdomains' },
      { id: 'dns_lookup', name: 'DNS Lookup', description: 'DNS records analysis' },
      { id: 'whois', name: 'Whois Lookup', description: 'Domain registration information' },
    ]
  },
];

const ScanCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [target, setTarget] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdScan, setCreatedScan] = useState<any>(null);

  const steps = ['Enter Target', 'Select Scan Type', 'Confirm & Start'];

  const handleNext = () => {
    if (activeStep === 0 && !target) {
      setError('Please enter a target URL or IP address');
      return;
    }
    if (activeStep === 1 && !selectedType) {
      setError('Please select a scan type');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleStartScan = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/scans`,
        {
          target,
          type: selectedType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const scan = response.data.data;
      setCreatedScan(scan);
      
      // Redirect to scan detail page after 2 seconds
      setTimeout(() => {
        navigate(`/scans/${scan.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating scan:', err);
      setError(err.response?.data?.message || 'Failed to create scan');
      setLoading(false);
    }
  };

  const getSelectedTypeInfo = () => {
    for (const category of SCAN_TYPES) {
      const type = category.types.find(t => t.id === selectedType);
      if (type) return type;
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New Security Scan
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {createdScan && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Scan created successfully! Redirecting to scan details...
        </Alert>
      )}

      {/* Step 1: Enter Target */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enter Target URL or IP Address
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter the website URL, domain name, or IP address you want to scan.
          </Typography>
          
          <TextField
            fullWidth
            label="Target"
            placeholder="https://example.com or 192.168.1.1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            sx={{ mb: 3 }}
            helperText="Make sure you have permission to scan this target"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!target}
            >
              Next
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 2: Select Scan Type */}
      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Scan Type
          </Typography>
          
          <Grid container spacing={3}>
            {SCAN_TYPES.map((category) => (
              <Grid item xs={12} key={category.category}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {category.icon}
                  <span style={{ marginLeft: 8 }}>{category.category}</span>
                </Typography>
                
                <Grid container spacing={2}>
                  {category.types.map((type) => (
                    <Grid item xs={12} md={6} lg={4} key={type.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedType === type.id ? '2px solid' : '1px solid',
                          borderColor: selectedType === type.id ? 'primary.main' : 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2,
                          },
                        }}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {type.name}
                            </Typography>
                            {selectedType === type.id && (
                              <CheckIcon color="primary" />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedType}
            >
              Next
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 3: Confirm & Start */}
      {activeStep === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Confirm Scan Details
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Target
            </Typography>
            <Typography variant="h6" gutterBottom>
              {target}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Scan Type
            </Typography>
            <Typography variant="h6">
              {getSelectedTypeInfo()?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getSelectedTypeInfo()?.description}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            The scan will start immediately after confirmation. You'll be redirected to the scan details page where you can monitor progress.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleStartScan}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
            >
              {loading ? 'Creating Scan...' : 'Start Scan'}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ScanCreate;