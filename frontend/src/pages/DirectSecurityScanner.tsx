import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';

// Direct CORS API configuration
const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const API_URL = 'https://app.pentest-tools.com/api/v2';

const TOOLS = {
  'WordPress Scanner': 270,
  'SSL Scanner': 110,
  'Website Scanner': 170,
  'Subdomain Finder': 20,
  'DNS Lookup': 50,
  'TCP Port Scanner': 70,
  'WAF Detector': 180,
  'Drupal Scanner': 280,
  'Joomla Scanner': 290,
};

const DirectSecurityScanner: React.FC = () => {
  const [target, setTarget] = useState('https://www.cobytes.com');
  const [selectedTool, setSelectedTool] = useState<string>('WordPress Scanner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanId, setScanId] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Direct CORS request to Security Scanner API
  const makeDirectRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_URL}${endpoint}`;
    addLog(`Making CORS request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error: any) {
      addLog(`❌ Request failed: ${error.message}`);
      throw error;
    }
  };

  const startScan = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setScanId(null);
    setScanStatus(null);
    setLogs([]);

    try {
      const toolId = TOOLS[selectedTool as keyof typeof TOOLS];
      addLog(`Starting ${selectedTool} scan for ${target}`);
      addLog(`Tool ID: ${toolId}`);

      // First, try to create a target
      addLog('Creating target...');
      let targetId;
      
      try {
        const targetResponse = await makeDirectRequest('/targets', {
          method: 'POST',
          body: JSON.stringify({
            name: target,
            description: `Target for ${selectedTool} scan`
          }),
        });
        
        targetId = targetResponse.data?.id;
        addLog(`✅ Target created with ID: ${targetId}`);
      } catch (err: any) {
        addLog('⚠️  Could not create target, will use target_name parameter');
      }

      // Start the scan
      addLog('Starting scan...');
      const scanPayload = {
        tool_id: toolId,
        target_name: target,
        ...(targetId && { target_id: targetId }),
        tool_params: {}
      };
      
      addLog(`Scan payload: ${JSON.stringify(scanPayload)}`);
      
      const scanResponse = await makeDirectRequest('/scans', {
        method: 'POST',
        body: JSON.stringify(scanPayload),
      });

      const createdScanId = scanResponse.data?.created_id || scanResponse.data?.id;
      setScanId(createdScanId);
      setSuccess(`Scan started successfully! ID: ${createdScanId}`);
      addLog(`✅ Scan created with ID: ${createdScanId}`);
      
      // Start polling for status
      pollScanStatus(createdScanId);

    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
      
      if (err.message.includes('Failed to fetch')) {
        addLog('🔍 This might be a CORS issue. Check browser console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const pollScanStatus = async (id: number) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        addLog('⏱️  Polling timeout reached');
        return;
      }
      
      try {
        attempts++;
        addLog(`Checking scan status (attempt ${attempts})...`);
        
        const statusResponse = await makeDirectRequest(`/scans/${id}`);
        const status = statusResponse.data;
        
        setScanStatus(status);
        addLog(`Status: ${status.status}, Progress: ${status.progress || 0}%`);
        
        if (status.status === 'finished') {
          addLog('✅ Scan completed!');
          // Get scan output
          try {
            const outputResponse = await makeDirectRequest(`/scans/${id}/output`);
            addLog(`Scan results: ${JSON.stringify(outputResponse.data).substring(0, 200)}...`);
          } catch (err) {
            addLog('Could not fetch scan output');
          }
          return;
        }
        
        if (status.status === 'failed') {
          addLog('❌ Scan failed');
          return;
        }
        
        // Continue polling
        setTimeout(poll, 5000);
      } catch (err: any) {
        addLog(`Error polling status: ${err.message}`);
      }
    };
    
    poll();
  };

  const checkStatus = async () => {
    if (!scanId) return;
    
    try {
      addLog(`Manually checking status for scan ${scanId}...`);
      const statusResponse = await makeDirectRequest(`/scans/${scanId}`);
      setScanStatus(statusResponse.data);
      addLog(`Current status: ${statusResponse.data.status}`);
    } catch (err: any) {
      addLog(`❌ Status check failed: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Direct Security Scanner API v2 - CORS Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page makes direct CORS requests to the Security Scanner API v2 without any proxy or backend.
        Check the browser console (F12) for detailed logs and any CORS errors.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configure Scan
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://example.com"
          />
          
          <FormControl fullWidth>
            <InputLabel>Scanner Type</InputLabel>
            <Select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              label="Scanner Type"
            >
              {Object.keys(TOOLS).map(tool => (
                <MenuItem key={tool} value={tool}>
                  {tool} (ID: {TOOLS[tool as keyof typeof TOOLS]})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={startScan}
              disabled={loading || !target}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Start Scan
            </Button>
            
            {scanId && (
              <Button
                variant="outlined"
                onClick={checkStatus}
              >
                Check Status
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {scanStatus && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Scan Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip 
                    label={scanStatus.status} 
                    color={scanStatus.status === 'finished' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                {scanStatus.progress !== undefined && (
                  <Box>
                    <Typography variant="body2">Progress: {scanStatus.progress}%</Typography>
                    <LinearProgress variant="determinate" value={scanStatus.progress} />
                  </Box>
                )}
                <Typography variant="body2">
                  Created: {new Date(scanStatus.created_at).toLocaleString()}
                </Typography>
                {scanStatus.finished_at && (
                  <Typography variant="body2">
                    Finished: {new Date(scanStatus.finished_at).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Logs
        </Typography>
        <Box 
          sx={{ 
            bgcolor: 'grey.900', 
            color: 'common.white',
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            maxHeight: 400,
            overflow: 'auto'
          }}
        >
          {logs.length === 0 ? (
            <Typography>No logs yet...</Typography>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          API URL: {API_URL}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          API Key: ***{API_KEY.slice(-4)}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          Mode: CORS (Direct Browser Requests)
        </Typography>
      </Paper>
    </Container>
  );
};

export default DirectSecurityScanner;