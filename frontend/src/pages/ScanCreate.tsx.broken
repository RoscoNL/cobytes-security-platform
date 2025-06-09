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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Language as WebIcon,
  Dns as DnsIcon,
  VpnLock as NetworkIcon,
  Code as ApiIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';

// Import the proxy service since direct CORS doesn't work
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const PENTEST_API = 'https://app.pentest-tools.com/api/v2';
const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';

// All available scanners
const SCANNERS = [
  {
    category: 'CMS Security',
    icon: <WebIcon />,
    tools: [
      { id: 270, name: 'WordPress Scanner', description: 'Scan WordPress sites for vulnerabilities' },
      { id: 280, name: 'Drupal Scanner', description: 'Scan Drupal sites for vulnerabilities' },
      { id: 290, name: 'Joomla Scanner', description: 'Scan Joomla sites for vulnerabilities' },
      { id: 260, name: 'SharePoint Scanner', description: 'Scan SharePoint sites for vulnerabilities' },
    ]
  },
  {
    category: 'Web Security',
    icon: <SecurityIcon />,
    tools: [
      { id: 170, name: 'Website Scanner', description: 'Comprehensive website vulnerability scan' },
      { id: 110, name: 'SSL Scanner', description: 'SSL/TLS configuration analysis' },
      { id: 120, name: 'HTTP Headers', description: 'Security headers analysis' },
      { id: 180, name: 'WAF Detector', description: 'Web Application Firewall detection' },
      { id: 310, name: 'Website Recon', description: 'Website reconnaissance and information gathering' },
      { id: 90, name: 'URL Fuzzer', description: 'Discover hidden files and directories' },
    ]
  },
  {
    category: 'Network Security',
    icon: <NetworkIcon />,
    tools: [
      { id: 350, name: 'Network Scanner', description: 'Comprehensive network vulnerability scanning' },
      { id: 70, name: 'TCP Port Scanner', description: 'Scan TCP ports' },
      { id: 80, name: 'UDP Port Scanner', description: 'Scan UDP ports' },
      { id: 100, name: 'Ping Host', description: 'Check host availability' },
    ]
  },
  {
    category: 'Domain & DNS',
    icon: <DnsIcon />,
    tools: [
      { id: 20, name: 'Subdomain Finder', description: 'Discover subdomains' },
      { id: 50, name: 'DNS Lookup', description: 'DNS records analysis' },
      { id: 60, name: 'DNS Zone Transfer', description: 'Check for DNS zone transfer' },
      { id: 40, name: 'Whois Lookup', description: 'Domain registration information' },
      { id: 390, name: 'Domain Finder', description: 'Find related domains' },
    ]
  },
  {
    category: 'Advanced Security',
    icon: <ShieldIcon />,
    tools: [
      { id: 490, name: 'Sniper', description: 'Advanced vulnerability scanner' },
      { id: 510, name: 'API Scanner', description: 'API security testing' },
      { id: 520, name: 'Cloud Scanner', description: 'Cloud infrastructure security' },
      { id: 540, name: 'Kubernetes Scanner', description: 'Kubernetes security assessment' },
      { id: 400, name: 'Password Auditor', description: 'Password strength testing' },
    ]
  },
];

const ScanCreate: React.FC = () => {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [selectedTool, setSelectedTool] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeProxyRequest = async (method: string, endpoint: string, data?: any) => {
    const url = `${PROXY_URL}${PENTEST_API}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Request failed');
    }

    return responseData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !target) return;

    setLoading(true);
    setError(null);

    try {
      // First, create or find target
      let targetId;
      try {
        // Try to get existing targets
        const targetsResponse = await makeProxyRequest('GET', '/targets');
        const existingTarget = targetsResponse.data?.find((t: any) => t.name === target);
        
        if (existingTarget) {
          targetId = existingTarget.id;
        } else {
          // Create new target
          const targetResponse = await makeProxyRequest('POST', '/targets', {
            name: target,
            description: `Target for security scan`
          });
          targetId = targetResponse.data.id;
        }
      } catch (err) {
        console.log('Could not create target, using target_name');
      }

      // Start the scan
      const scanPayload = {
        tool_id: selectedTool,
        target_name: target,
        ...(targetId && { target_id: targetId }),
        tool_params: {}
      };

      const scanResponse = await makeProxyRequest('POST', '/scans', scanPayload);
      const scanId = scanResponse.data?.created_id || scanResponse.data?.id;

      // Store scan info in localStorage for tracking
      const scanInfo = {
        id: scanId,
        toolId: selectedTool,
        target,
        createdAt: new Date().toISOString(),
        pentestToolsScanId: scanId
      };
      
      const existingScans = JSON.parse(localStorage.getItem('pentesttools_scans') || '[]');
      existingScans.push(scanInfo);
      localStorage.setItem('pentesttools_scans', JSON.stringify(existingScans));

      // Navigate to scan detail page
      navigate(`/scan-status/${scanId}`);

    } catch (err: any) {
      console.error('Scan creation error:', err);
      setError(err.message || 'Failed to create scan');
    } finally {
      setLoading(false);
    }
  };

  const selectedToolInfo = SCANNERS.flatMap(cat => cat.tools).find(tool => tool.id === selectedTool);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Start New Security Scan
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Target URL or Domain"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com or example.com"
                  helperText="Enter the URL or domain you want to scan"
                />

                <FormControl fullWidth required>
                  <InputLabel>Select Scanner</InputLabel>
                  <Select
                    value={selectedTool || ''}
                    onChange={(e) => setSelectedTool(Number(e.target.value))}
                    label="Select Scanner"
                  >
                    {SCANNERS.map(category => (
                      <MenuItem key={category.category} disabled sx={{ fontWeight: 'bold' }}>
                        {category.category}
                      </MenuItem>
                    )).concat(
                      SCANNERS.flatMap(category => 
                        category.tools.map(tool => (
                          <MenuItem key={tool.id} value={tool.id} sx={{ pl: 4 }}>
                            {tool.name}
                          </MenuItem>
                        ))
                      )
                    )}
                  </Select>
                </FormControl>

                {selectedToolInfo && (
                  <Alert severity="info">
                    {selectedToolInfo.description}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !target || !selectedTool}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Starting Scan...' : 'Start Scan'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Available Scanners
          </Typography>
          
          {SCANNERS.map(category => (
            <Card key={category.category} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {category.icon}
                  <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {category.category}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {category.tools.map(tool => (
                    <Chip
                      key={tool.id}
                      label={tool.name}
                      size="small"
                      onClick={() => setSelectedTool(tool.id)}
                      color={selectedTool === tool.id ? 'primary' : 'default'}
                      clickable
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ScanCreate;