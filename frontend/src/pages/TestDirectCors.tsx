import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import pentestToolsDirectService, { ToolId } from '../services/pentesttools-direct.service';

const TestDirectCors: React.FC = () => {
  const [target, setTarget] = useState('https://www.cobytes.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanId, setScanId] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testDirectCors = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setScanId(null);
    setScanStatus(null);
    setLogs([]);

    try {
      addLog('Starting WordPress scan via direct CORS...');
      addLog(`Target: ${target}`);
      
      // Start WordPress scan
      const result = await pentestToolsDirectService.startWordPressScan(target);
      
      setScanId(result.scan_id);
      setSuccess(`Scan started successfully! Scan ID: ${result.scan_id}`);
      addLog(`✅ Scan created with ID: ${result.scan_id}`);
      
      // Poll for status
      addLog('Polling scan status...');
      
      await pentestToolsDirectService.waitForScanCompletion(
        result.scan_id,
        (status) => {
          setScanStatus(status);
          addLog(`Status: ${status.status}, Progress: ${status.progress || 0}%`);
        },
        60000 // 1 minute for testing
      );
      
      addLog('✅ Scan completed!');
      
    } catch (err: any) {
      console.error('Direct CORS test failed:', err);
      setError(err.message || 'Failed to start scan');
      addLog(`❌ Error: ${err.message}`);
      
      // Check if it's a CORS error
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        addLog('⚠️  CORS error detected - API may not be configured for browser access');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkScanStatus = async () => {
    if (!scanId) return;
    
    try {
      addLog(`Checking status for scan ${scanId}...`);
      const status = await pentestToolsDirectService.getScanStatus(scanId);
      setScanStatus(status);
      addLog(`Current status: ${status.status}`);
    } catch (err: any) {
      addLog(`❌ Failed to get status: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        PentestTools Direct CORS Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page tests direct CORS requests to the PentestTools API v2 without using a proxy.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test WordPress Scanner
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Target URL"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://example.com"
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={testDirectCors}
            disabled={loading || !target}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Start WordPress Scan'}
          </Button>
          
          {scanId && (
            <Button
              variant="outlined"
              onClick={checkScanStatus}
              disabled={loading}
            >
              Check Status
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {scanStatus && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Scan Status
              </Typography>
              <Typography variant="body2">
                Status: <strong>{scanStatus.status}</strong>
              </Typography>
              <Typography variant="body2">
                Progress: <strong>{scanStatus.progress || 0}%</strong>
              </Typography>
              {scanStatus.created_at && (
                <Typography variant="body2">
                  Started: {new Date(scanStatus.created_at).toLocaleString()}
                </Typography>
              )}
              {scanStatus.finished_at && (
                <Typography variant="body2">
                  Finished: {new Date(scanStatus.finished_at).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Console Logs
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No logs yet...
            </Typography>
          ) : (
            logs.map((log, index) => (
              <Typography key={index} variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
                {log}
              </Typography>
            ))
          )}
        </Paper>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          API URL: https://app.pentest-tools.com/api/v2
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          API Key: {process.env.REACT_APP_PENTEST_TOOLS_API_KEY ? '***' + process.env.REACT_APP_PENTEST_TOOLS_API_KEY.slice(-4) : 'Not configured'}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          CORS Mode: Enabled
        </Typography>
      </Paper>
    </Container>
  );
};

export default TestDirectCors;