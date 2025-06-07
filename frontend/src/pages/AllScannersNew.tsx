import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  SecurityOutlined,
  WebOutlined,
  DnsOutlined,
  VpnKeyOutlined,
  CloudOutlined,
  CodeOutlined,
  NetworkCheckOutlined,
  BugReportOutlined,
  LockOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import { pentestToolsProxyService, ProxyPentestToolId } from '../services/pentesttools-proxy.service';

interface Scanner {
  id: number;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  requiresTarget: boolean;
  targetPlaceholder?: string;
  parameters?: any;
}

const AllScannersNew: React.FC = () => {
  const navigate = useNavigate();
  const [selectedScanner, setSelectedScanner] = useState<Scanner | null>(null);
  const [target, setTarget] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const scanners: Scanner[] = [
    // Reconnaissance & Discovery
    {
      id: ProxyPentestToolId.SUBDOMAIN_FINDER,
      name: 'Subdomain Finder',
      category: 'Reconnaissance',
      description: 'Discover subdomains for a target domain',
      icon: <DnsOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'example.com'
    },
    {
      id: ProxyPentestToolId.DOMAIN_FINDER,
      name: 'Domain Finder',
      category: 'Reconnaissance',
      description: 'Find related domains and assets',
      icon: <SearchOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'company name or domain'
    },
    {
      id: ProxyPentestToolId.WEBSITE_RECON,
      name: 'Website Recon',
      category: 'Reconnaissance',
      description: 'Comprehensive website reconnaissance',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://example.com'
    },
    
    // Network Scanning
    {
      id: ProxyPentestToolId.TCP_PORT_SCANNER,
      name: 'TCP Port Scanner',
      category: 'Network',
      description: 'Scan TCP ports on target systems',
      icon: <NetworkCheckOutlined />,
      requiresTarget: true,
      targetPlaceholder: '192.168.1.1 or example.com'
    },
    {
      id: ProxyPentestToolId.UDP_PORT_SCANNER,
      name: 'UDP Port Scanner',
      category: 'Network',
      description: 'Scan UDP ports on target systems',
      icon: <NetworkCheckOutlined />,
      requiresTarget: true,
      targetPlaceholder: '192.168.1.1 or example.com'
    },
    {
      id: ProxyPentestToolId.NETWORK_SCANNER,
      name: 'Network Scanner',
      category: 'Network',
      description: 'Comprehensive network vulnerability scanning',
      icon: <NetworkCheckOutlined />,
      requiresTarget: true,
      targetPlaceholder: '192.168.1.0/24'
    },
    
    // Web Application Scanners
    {
      id: ProxyPentestToolId.WEBSITE_SCANNER,
      name: 'Website Scanner',
      category: 'Web Application',
      description: 'Scan websites for vulnerabilities',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://example.com'
    },
    {
      id: ProxyPentestToolId.API_SCANNER,
      name: 'API Scanner',
      category: 'Web Application',
      description: 'Test API endpoints for security issues',
      icon: <CodeOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://api.example.com'
    },
    {
      id: ProxyPentestToolId.URL_FUZZER,
      name: 'URL Fuzzer',
      category: 'Web Application',
      description: 'Discover hidden files and directories',
      icon: <SearchOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://example.com'
    },
    
    // CMS Scanners
    {
      id: ProxyPentestToolId.WORDPRESS_SCANNER,
      name: 'WordPress Scanner',
      category: 'CMS',
      description: 'Scan WordPress sites for vulnerabilities',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://wordpress-site.com'
    },
    {
      id: ProxyPentestToolId.DRUPAL_SCANNER,
      name: 'Drupal Scanner',
      category: 'CMS',
      description: 'Scan Drupal sites for vulnerabilities',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://drupal-site.com'
    },
    {
      id: ProxyPentestToolId.JOOMLA_SCANNER,
      name: 'Joomla Scanner',
      category: 'CMS',
      description: 'Scan Joomla sites for vulnerabilities',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://joomla-site.com'
    },
    {
      id: ProxyPentestToolId.SHARE_POINT_SCANNER,
      name: 'SharePoint Scanner',
      category: 'CMS',
      description: 'Scan SharePoint sites for vulnerabilities',
      icon: <WebOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://sharepoint-site.com'
    },
    
    // Security & Cryptography
    {
      id: ProxyPentestToolId.SSL_SCANNER,
      name: 'SSL/TLS Scanner',
      category: 'Cryptography',
      description: 'Analyze SSL/TLS configuration',
      icon: <LockOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'example.com or https://example.com'
    },
    {
      id: ProxyPentestToolId.WAF_DETECTOR,
      name: 'WAF Detector',
      category: 'Security',
      description: 'Detect Web Application Firewalls',
      icon: <SecurityOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://example.com'
    },
    {
      id: ProxyPentestToolId.PASSWORD_AUDITOR,
      name: 'Password Auditor',
      category: 'Security',
      description: 'Audit password strength and policies',
      icon: <VpnKeyOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'Enter password or hash'
    },
    
    // Advanced Scanners
    {
      id: ProxyPentestToolId.SNIPER,
      name: 'Sniper',
      category: 'Advanced',
      description: 'Advanced vulnerability scanner',
      icon: <BugReportOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'https://example.com'
    },
    {
      id: ProxyPentestToolId.CLOUD_SCANNER,
      name: 'Cloud Scanner',
      category: 'Cloud',
      description: 'Scan cloud infrastructure',
      icon: <CloudOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'cloud.example.com'
    },
    {
      id: ProxyPentestToolId.KUBERNETES_SCANNER,
      name: 'Kubernetes Scanner',
      category: 'Cloud',
      description: 'Scan Kubernetes clusters',
      icon: <CloudOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'k8s.example.com'
    },
    {
      id: ProxyPentestToolId.FIND_VHOSTS,
      name: 'Virtual Host Finder',
      category: 'Discovery',
      description: 'Find virtual hosts on a server',
      icon: <DnsOutlined />,
      requiresTarget: true,
      targetPlaceholder: 'example.com or IP address'
    },
  ];

  const categories = Array.from(new Set(scanners.map(s => s.category))).sort();

  const handleScannerClick = (scanner: Scanner) => {
    setSelectedScanner(scanner);
    setTarget('');
    setScanResult(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleStartScan = async () => {
    if (!selectedScanner || !target) return;

    setScanning(true);
    setError(null);
    setScanResult(null);
    setScanProgress(0);

    try {
      // Create or get target
      let targetId;
      try {
        const targets = await pentestToolsProxyService.getTargets();
        const existingTarget = targets.find(t => t.name === target);
        
        if (existingTarget) {
          targetId = existingTarget.id;
        } else {
          const newTarget = await pentestToolsProxyService.createTarget(target);
          targetId = newTarget.id;
        }
      } catch (err) {
        // If targets API fails, try with target_name parameter
        console.log('Using target_name parameter instead of target_id');
      }

      // Start the scan
      const scanOptions = {
        tool_id: selectedScanner.id,
        target_name: target,
        target_id: targetId,
        tool_params: {}
      };

      console.log('Starting scan with options:', scanOptions);
      const { scan_id } = await pentestToolsProxyService.startScan(scanOptions);

      // Save scan to localStorage for dashboard
      const scanRecord = {
        scanId: scan_id,
        toolId: selectedScanner.id,
        toolName: selectedScanner.name,
        target: target,
        status: 'running',
        progress: 0,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const existingScans = JSON.parse(localStorage.getItem('pentesttools_scans') || '[]');
      localStorage.setItem('pentesttools_scans', JSON.stringify([scanRecord, ...existingScans].slice(0, 50)));
      
      // Also call the global method if available
      if ((window as any).savePentestToolsScan) {
        (window as any).savePentestToolsScan(scanRecord);
      }

      // Show success message and option to view status
      setScanResult({
        scan_id,
        message: 'Scan started successfully!'
      });
      setScanning(false);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setError(err.message || 'Scan failed');
      setScanning(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedScanner(null);
    setScanResult(null);
    setError(null);
    setScanProgress(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All PentestTools Scanners
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          All {scanners.length} scanners are now available with real API integration. No mock data!
        </Alert>

        {categories.map(category => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {category}
            </Typography>
            
            <Grid container spacing={2}>
              {scanners
                .filter(scanner => scanner.category === category)
                .map(scanner => (
                  <Grid item xs={12} sm={6} md={4} key={scanner.id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3,
                        }
                      }}
                      onClick={() => handleScannerClick(scanner)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box sx={{ color: 'primary.main', mr: 1 }}>
                            {scanner.icon}
                          </Box>
                          <Typography variant="h6" component="h3">
                            {scanner.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {scanner.description}
                        </Typography>
                        <Box mt={2}>
                          <Chip 
                            label={`Tool ID: ${scanner.id}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        ))}
      </Box>

      {/* Scan Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedScanner?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!scanResult && !scanning && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {selectedScanner?.description}
                </Typography>

                <TextField
                  fullWidth
                  label="Target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={selectedScanner?.targetPlaceholder}
                  disabled={scanning}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {scanning && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Scanning in progress...
                </Typography>
                <LinearProgress variant="determinate" value={scanProgress} sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {scanProgress}% complete
                </Typography>
              </Box>
            )}

            {scanResult && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {scanResult.message}
                </Alert>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Scan ID: {scanResult.scan_id}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate(`/scan-status/${scanResult.scan_id}`)}
                  >
                    View Scan Status
                  </Button>
                  <Button 
                    variant="outlined" 
                    component="a"
                    href={`https://app.pentest-tools.com/scans/${scanResult.scan_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View in PentestTools
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!scanResult && !scanning && (
            <Button 
              onClick={handleStartScan} 
              variant="contained" 
              disabled={!target || scanning}
            >
              Start Scan
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AllScannersNew;