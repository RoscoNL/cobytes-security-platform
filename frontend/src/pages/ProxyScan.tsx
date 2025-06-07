import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PlayArrowOutlined as PlayIcon,
  StopOutlined as StopIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  Http as ProxyIcon,
} from '@mui/icons-material';
import { pentestToolsProxyService, ProxyPentestToolId } from '../services/pentesttools-proxy.service';

interface ScanResult {
  status: any;
  output: any;
}

const ProxyScan: React.FC = () => {
  const [target, setTarget] = useState('https://www.cobytes.com');
  const [scanType, setScanType] = useState('wordpress');
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const scanners = [
    { value: 'wordpress', label: 'WordPress Scanner', toolId: ProxyPentestToolId.WORDPRESS_SCANNER },
    { value: 'website', label: 'Website Scanner', toolId: ProxyPentestToolId.WEBSITE_SCANNER },
    { value: 'drupal', label: 'Drupal Scanner', toolId: ProxyPentestToolId.DRUPAL_SCANNER },
    { value: 'joomla', label: 'Joomla Scanner', toolId: ProxyPentestToolId.JOOMLA_SCANNER },
    { value: 'ssl', label: 'SSL Scanner', toolId: ProxyPentestToolId.SSL_SCANNER },
    { value: 'waf', label: 'WAF Detector', toolId: ProxyPentestToolId.WAF_DETECTOR },
  ];

  const testProxy = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      // Test the proxy by getting targets
      const targets = await pentestToolsProxyService.getTargets();
      setTestResult({
        success: true,
        message: 'Proxy is working!',
        targetsCount: targets.length,
        targets: targets.slice(0, 3) // Show first 3 targets
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Proxy test failed',
        error: err.message
      });
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const startScan = async () => {
    setError(null);
    setResult(null);
    setProgress(0);
    setScanning(true);

    try {
      const selectedScanner = scanners.find(s => s.value === scanType);
      if (!selectedScanner) {
        throw new Error('Invalid scanner selected');
      }

      let scanResult;
      if (scanType === 'wordpress') {
        scanResult = await pentestToolsProxyService.startWordPressScan(target, {
          scan_type: 'light',
          enumerate: ['users', 'plugins', 'themes']
        });
      } else if (scanType === 'website') {
        scanResult = await pentestToolsProxyService.startWebsiteScan(target, {
          scan_type: 'light'
        });
      } else {
        scanResult = await pentestToolsProxyService.startScan({
          tool_id: selectedScanner.toolId,
          target_name: target,
          tool_params: { scan_type: 'light' }
        });
      }

      setScanId(scanResult.scan_id);
      console.log('Scan started via proxy:', scanResult);

      // Poll for results
      const result = await pentestToolsProxyService.waitForScanCompletion(
        scanResult.scan_id,
        (prog) => setProgress(prog)
      );

      setResult(result);
      console.log('Scan completed:', result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to start scan');
    } finally {
      setScanning(false);
    }
  };

  const stopScan = async () => {
    if (scanId) {
      try {
        await pentestToolsProxyService.stopScan(scanId);
        setScanning(false);
        setError('Scan stopped by user');
      } catch (err: any) {
        console.error('Failed to stop scan:', err);
      }
    }
  };

  const formatOutput = (output: any) => {
    if (!output) return null;

    if (typeof output === 'string') {
      return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>;
    }

    return (
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ProxyIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          CORS Proxy Scanner
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          This page uses a CORS proxy on the backend to forward requests to the PentestTools API.
          This approach bypasses browser CORS restrictions while keeping the API key secure on the server.
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={testProxy}
                disabled={testing}
                startIcon={testing ? <CircularProgress size={20} /> : <ProxyIcon />}
              >
                Test Proxy Connection
              </Button>
              
              {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {testResult.message}
                  {testResult.targetsCount !== undefined && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Found {testResult.targetsCount} targets in your account
                    </Typography>
                  )}
                  {testResult.error && (
                    <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                      {testResult.error}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Security Scanner
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Target URL"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={scanning}
                placeholder="https://example.com"
              />
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Scanner Type</InputLabel>
                <Select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  disabled={scanning}
                  label="Scanner Type"
                >
                  {scanners.map(scanner => (
                    <MenuItem key={scanner.value} value={scanner.value}>
                      {scanner.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!scanning ? (
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={startScan}
                  disabled={!target}
                  sx={{ minWidth: 150 }}
                >
                  Start Scan
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopScan}
                  sx={{ minWidth: 150 }}
                >
                  Stop Scan
                </Button>
              )}
            </Box>

            {scanning && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                  <Typography variant="body2">
                    Scanning in progress... {progress > 0 && `${progress}%`}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {scanId && !scanning && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`Scan ID: ${scanId}`}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {result.status?.status === 'finished' ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">
                  Scan Results - Status: {result.status?.status}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto', maxHeight: 600 }}>
                {formatOutput(result.output)}
              </Box>
            </CardContent>
          </Card>
        )}

        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
          <Typography variant="subtitle2" gutterBottom>
            Proxy Configuration
          </Typography>
          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
{`Backend Proxy: http://localhost:3001/api/proxy/pentest-tools
PentestTools API: https://app.pentest-tools.com/api/v2
Method: Backend CORS proxy (secure API key storage)`}
          </pre>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProxyScan;