import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  PlayArrowOutlined as TestIcon,
} from '@mui/icons-material';

interface CorsTestResult {
  url: string;
  method: string;
  success: boolean;
  status?: number;
  headers?: Record<string, string>;
  error?: string;
  corsHeaders?: {
    'access-control-allow-origin'?: string;
    'access-control-allow-credentials'?: string;
    'access-control-allow-methods'?: string;
    'access-control-allow-headers'?: string;
  };
}

const CorsTest: React.FC = () => {
  const [testResults, setTestResults] = useState<CorsTestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
  const API_URL = 'https://app.pentest-tools.com/api/v2';

  const runCorsTests = async () => {
    setTesting(true);
    setTestResults([]);
    const results: CorsTestResult[] = [];

    // Test 1: Simple GET request without credentials
    try {
      const response1 = await fetch(`${API_URL}/wordlists`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const headers1: Record<string, string> = {};
      response1.headers.forEach((value, key) => {
        headers1[key.toLowerCase()] = value;
      });

      results.push({
        url: `${API_URL}/wordlists`,
        method: 'GET (no auth)',
        success: response1.ok,
        status: response1.status,
        headers: headers1,
        corsHeaders: {
          'access-control-allow-origin': headers1['access-control-allow-origin'],
          'access-control-allow-credentials': headers1['access-control-allow-credentials'],
          'access-control-allow-methods': headers1['access-control-allow-methods'],
          'access-control-allow-headers': headers1['access-control-allow-headers'],
        },
      });
    } catch (error: any) {
      results.push({
        url: `${API_URL}/wordlists`,
        method: 'GET (no auth)',
        success: false,
        error: error.message,
      });
    }

    // Test 2: GET request with Authorization header
    try {
      const response2 = await fetch(`${API_URL}/wordlists`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      const headers2: Record<string, string> = {};
      response2.headers.forEach((value, key) => {
        headers2[key.toLowerCase()] = value;
      });

      results.push({
        url: `${API_URL}/wordlists`,
        method: 'GET (with Bearer auth)',
        success: response2.ok,
        status: response2.status,
        headers: headers2,
        corsHeaders: {
          'access-control-allow-origin': headers2['access-control-allow-origin'],
          'access-control-allow-credentials': headers2['access-control-allow-credentials'],
          'access-control-allow-methods': headers2['access-control-allow-methods'],
          'access-control-allow-headers': headers2['access-control-allow-headers'],
        },
      });
    } catch (error: any) {
      results.push({
        url: `${API_URL}/wordlists`,
        method: 'GET (with Bearer auth)',
        success: false,
        error: error.message,
      });
    }

    // Test 3: OPTIONS preflight request
    try {
      const response3 = await fetch(`${API_URL}/wordlists`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      });

      const headers3: Record<string, string> = {};
      response3.headers.forEach((value, key) => {
        headers3[key.toLowerCase()] = value;
      });

      results.push({
        url: `${API_URL}/wordlists`,
        method: 'OPTIONS (preflight)',
        success: response3.ok,
        status: response3.status,
        headers: headers3,
        corsHeaders: {
          'access-control-allow-origin': headers3['access-control-allow-origin'],
          'access-control-allow-credentials': headers3['access-control-allow-credentials'],
          'access-control-allow-methods': headers3['access-control-allow-methods'],
          'access-control-allow-headers': headers3['access-control-allow-headers'],
        },
      });
    } catch (error: any) {
      results.push({
        url: `${API_URL}/wordlists`,
        method: 'OPTIONS (preflight)',
        success: false,
        error: error.message,
      });
    }

    // Test 4: POST request with credentials
    try {
      const response4 = await fetch(`${API_URL}/scans`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          tool_id: 130,
          target_name: 'https://www.example.com',
          tool_params: { scan_type: 'light' },
        }),
      });

      const headers4: Record<string, string> = {};
      response4.headers.forEach((value, key) => {
        headers4[key.toLowerCase()] = value;
      });

      results.push({
        url: `${API_URL}/scans`,
        method: 'POST (create scan)',
        success: response4.ok,
        status: response4.status,
        headers: headers4,
        corsHeaders: {
          'access-control-allow-origin': headers4['access-control-allow-origin'],
          'access-control-allow-credentials': headers4['access-control-allow-credentials'],
          'access-control-allow-methods': headers4['access-control-allow-methods'],
          'access-control-allow-headers': headers4['access-control-allow-headers'],
        },
      });
    } catch (error: any) {
      results.push({
        url: `${API_URL}/scans`,
        method: 'POST (create scan)',
        success: false,
        error: error.message,
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          CORS Test for PentestTools API
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          This page tests CORS headers and API accessibility directly from the browser.
          Current origin: <strong>{window.location.origin}</strong>
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Configuration
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
              API URL: {API_URL}<br />
              API Key: {API_KEY.substring(0, 10)}...{API_KEY.substring(API_KEY.length - 5)}
            </Typography>
            <Button
              variant="contained"
              startIcon={<TestIcon />}
              onClick={runCorsTests}
              disabled={testing}
            >
              {testing ? 'Testing...' : 'Run CORS Tests'}
            </Button>
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>CORS Headers</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {result.method}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {result.success ? (
                          <CheckIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                        <Chip
                          label={result.status || 'Failed'}
                          color={result.success ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {result.corsHeaders && (
                        <Box sx={{ fontSize: '0.75rem' }}>
                          {Object.entries(result.corsHeaders).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {value || 'Not set'}
                            </div>
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.error && (
                        <Typography variant="caption" color="error">
                          {result.error}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.100' }}>
          <Typography variant="subtitle2" gutterBottom>
            CORS Requirements
          </Typography>
          <Typography variant="body2" paragraph>
            For the API to work from the browser, it needs to include proper CORS headers:
          </Typography>
          <ul style={{ margin: 0 }}>
            <li><code>Access-Control-Allow-Origin: *</code> or <code>{window.location.origin}</code></li>
            <li><code>Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS</code></li>
            <li><code>Access-Control-Allow-Headers: Authorization, Content-Type</code></li>
            <li><code>Access-Control-Allow-Credentials: true</code> (if cookies are needed)</li>
          </ul>
        </Paper>
      </Box>
    </Container>
  );
};

export default CorsTest;