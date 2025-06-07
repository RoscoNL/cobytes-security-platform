import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Button,
  TextField,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  KeyOutlined as KeyIcon,
} from '@mui/icons-material';
import { apiClient } from '../services/api';

interface ApiStatusInfo {
  apiConfigured: boolean;
  apiUrl: string;
  authMethod: string;
  lastError?: string;
  sampleRequest?: string;
}

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<ApiStatusInfo>({
    apiConfigured: false,
    apiUrl: 'https://app.pentest-tools.com/api/v2',
    authMethod: 'Bearer Token',
  });

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await apiClient.get('/system/api-status');
      setStatus(response.data);
    } catch (error: any) {
      setStatus({
        apiConfigured: false,
        apiUrl: 'https://app.pentest-tools.com/api/v2',
        authMethod: 'Bearer Token',
        lastError: error.response?.data?.error || 'Unable to check API status',
      });
    }
  };

  const testApiConnection = async () => {
    try {
      await apiClient.post('/system/test-api');
      await checkApiStatus();
    } catch (error) {
      console.error('API test failed:', error);
      await checkApiStatus();
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          PentestTools API Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                This application integrates with the PentestTools API to perform real security scans.
                You need a valid API key from{' '}
                <a href="https://pentest-tools.com" target="_blank" rel="noopener noreferrer">
                  pentest-tools.com
                </a>
                {' '}to use all features.
              </Typography>
            </Alert>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {status.apiConfigured ? (
                    <CheckIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="h6">
                    API Status: {status.apiConfigured ? 'Connected' : 'Not Connected'}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API Endpoint
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {status.apiUrl}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Authentication Method
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {status.authMethod}
                </Typography>

                {status.lastError && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last Error
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {status.lastError}
                    </Alert>
                  </>
                )}

                <Button
                  variant="contained"
                  onClick={testApiConnection}
                  startIcon={<KeyIcon />}
                  fullWidth
                >
                  Test API Connection
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuration Instructions
                </Typography>
                
                <Typography variant="body2" paragraph>
                  1. Sign up for an account at{' '}
                  <a href="https://pentest-tools.com" target="_blank" rel="noopener noreferrer">
                    pentest-tools.com
                  </a>
                </Typography>
                
                <Typography variant="body2" paragraph>
                  2. Get your API key from your account dashboard
                </Typography>
                
                <Typography variant="body2" paragraph>
                  3. Update the backend .env file with:
                </Typography>
                
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    PENTEST_TOOLS_API_KEY=your-api-key-here<br />
                    PENTEST_TOOLS_API_URL=https://app.pentest-tools.com/api/v2
                  </Typography>
                </Paper>

                <Typography variant="body2" sx={{ mt: 2 }}>
                  4. Restart the backend server to apply changes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sample API Request (CORS-enabled)
                </Typography>
                
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100' }}>
                  <pre style={{ margin: 0, overflow: 'auto' }}>
{`const API_KEY = "your-api-key-here";
const API_URL = "https://app.pentest-tools.com/api/v2";
const HEADERS = {
  "Authorization": \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json"
};

// Example: Start a WordPress scan
fetch(\`\${API_URL}/scans\`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({
    tool_id: 130,  // WordPress Scanner
    target_name: "https://www.example.com",
    tool_params: {
      scan_type: "deep",
      enumerate: ["users", "plugins", "themes"]
    }
  })
});`}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Note:</strong> Without a valid API key, scans will fail with "401 Unauthorized" errors.
                The API key provided in the demo (sk-FBjMQcPq8jJ97Eu5nVgLhA) appears to be invalid or expired.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ApiStatus;