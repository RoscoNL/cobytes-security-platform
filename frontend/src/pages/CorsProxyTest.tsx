import React, { useState } from 'react';
import { Container, Typography, Box, Button, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { pentestToolsProxyService } from '../services/pentesttools-proxy.service';

const CorsProxyTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testTargetsAPI = async () => {
    setTesting(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing PentestTools API via corsproxy.io...');
      const targets = await pentestToolsProxyService.getTargets();
      setResult({ success: true, data: targets });
      console.log('API test successful:', targets);
    } catch (err: any) {
      console.error('API test failed:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const testWordPressScope = async () => {
    setTesting(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing WordPress scan via corsproxy.io...');
      // Just test creating a target first
      const targetResult = await pentestToolsProxyService.createTarget('https://www.cobytes.com', 'Test target for WordPress scan');
      setResult({ success: true, message: 'Target created successfully', data: targetResult });
      console.log('WordPress target test successful:', targetResult);
    } catch (err: any) {
      console.error('WordPress target test failed:', err);
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          CORS Proxy Test (thingproxy.freeboard.io)
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Test PentestTools API integration using thingproxy.freeboard.io as CORS proxy
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button 
            variant="contained" 
            onClick={testTargetsAPI}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : null}
          >
            Test Get Targets
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={testWordPressScope}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : null}
          >
            Test Create Target
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Error:</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{error}</pre>
          </Alert>
        )}

        {result && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                ✅ Test Successful
              </Typography>
              {result.message && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {result.message}
                </Typography>
              )}
              <Box 
                component="pre" 
                sx={{ 
                  backgroundColor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}
              >
                {JSON.stringify(result.data, null, 2)}
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Frontend makes requests to: <code>https://thingproxy.freeboard.io/fetch/https://app.pentest-tools.com/api/v2</code></li>
            <li>thingproxy forwards the request to PentestTools API</li>
            <li>CORS headers are automatically added by thingproxy</li>
            <li>Response is returned to frontend without CORS issues</li>
            <li>No API key needed for the proxy service</li>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default CorsProxyTest;