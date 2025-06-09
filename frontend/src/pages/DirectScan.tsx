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
} from '@mui/material';
import {
  PlayArrowOutlined as PlayIcon,
  StopOutlined as StopIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import securityScannerService, { SecurityToolId } from '../services/security-scanner.service';

interface ScanResult {
  status: string;
  output: any;
}

const DirectScan: React.FC = () => {
  const [target, setTarget] = useState('https://www.cobytes.com');
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const startScan = async () => {
    setError(null);
    setResult(null);
    setProgress(0);
    setScanning(true);

    try {
      // Start WordPress scan directly via CORS
      const { scan_id, target_id } = await securityScannerService.startWordPressScan(target, {
        scan_type: 'deep',
        enumerate: ['users', 'plugins', 'themes', 'timthumbs', 'config_backups', 'db_exports', 'media'],
      });

      setScanId(scan_id);
      console.log('Scan started:', { scan_id, target_id });

      // Poll for results
      const result = await securityScannerService.waitForScanCompletion(scan_id, (prog: number) => {
        setProgress(prog);
      });

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
        await securityScannerService.stopScan(scanId);
        setScanning(false);
        setError('Scan stopped by user');
      } catch (err: any) {
        console.error('Failed to stop scan:', err);
      }
    }
  };

  const formatOutput = (output: any) => {
    if (!output) return null;

    // Convert output to readable format
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
          Direct PentestTools API Scanner
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This page demonstrates direct CORS-enabled API calls to PentestTools from the browser.
          No backend proxy is used - all requests go directly to the PentestTools API.
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              WordPress Security Scanner
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
                {result.status === 'finished' ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">
                  Scan Results - Status: {result.status}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto' }}>
                {formatOutput(result.output)}
              </Box>
            </CardContent>
          </Card>
        )}

        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
          <Typography variant="subtitle2" gutterBottom>
            API Configuration
          </Typography>
          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
{`API_URL: https://app.pentest-tools.com/api/v2
Tool ID: ${SecurityToolId.WORDPRESS_SCANNER} (WordPress Scanner)
Method: Direct CORS request from browser`}
          </pre>
        </Paper>
      </Box>
    </Container>
  );
};

export default DirectScan;