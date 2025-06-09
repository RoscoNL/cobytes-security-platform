import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as WaitingIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material';

const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const SECURITY_API = 'https://app.pentest-tools.com/api/v2';
const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';

const ScanStatusSimple: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<any>(null);
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const makeProxyRequest = async (method: string, endpoint: string) => {
    const url = `${PROXY_URL}${SECURITY_API}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Request failed');
    }

    return responseData;
  };

  const loadScanStatus = async () => {
    if (!scanId) return;

    try {
      setError(null);
      
      // Get scan status
      const statusResponse = await makeProxyRequest('GET', `/scans/${scanId}`);
      const scanData = statusResponse.data;
      setScan(scanData);

      // Check if scan is complete
      if (scanData.status === 'finished' || scanData.status_name === 'finished') {
        setIsPolling(false);
        
        // Try to get scan output
        try {
          const outputResponse = await makeProxyRequest('GET', `/scans/${scanId}/output`);
          setOutput(outputResponse.data);
        } catch (err) {
          console.error('Could not get scan output:', err);
        }
      } else if (scanData.status === 'failed') {
        setIsPolling(false);
        setError('Scan failed');
      }
      
    } catch (err: any) {
      console.error('Failed to load scan status:', err);
      setError(err.message || 'Failed to load scan status');
      setIsPolling(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanStatus();
  }, [scanId]);

  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      loadScanStatus();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [scanId, isPolling]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
      case 'in_progress':
        return <RunningIcon color="primary" />;
      case 'waiting':
      case 'pending':
        return <WaitingIcon color="action" />;
      default:
        return <WaitingIcon />;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'finished':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading && !scan) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Scan Status
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadScanStatus}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          {scan && scan.status === 'finished' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Generate PDF report
                window.print(); // For now, use browser print. Later implement proper PDF generation
              }}
            >
              Download Report
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {scan && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scan Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getStatusIcon(scan.status || scan.status_name)}
                  <Chip
                    label={scan.status || scan.status_name || 'Unknown'}
                    color={getStatusColor(scan.status || scan.status_name)}
                    sx={{ ml: 1 }}
                  />
                  {scan.progress !== undefined && scan.progress !== null && (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {scan.progress}% complete
                    </Typography>
                  )}
                </Box>

                {(scan.status === 'running' || scan.status === 'in_progress') && scan.progress !== undefined && (
                  <LinearProgress 
                    variant="determinate" 
                    value={scan.progress || 0} 
                    sx={{ mb: 2 }}
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Scan ID
                  </Typography>
                  <Typography variant="body1">
                    {scan.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tool ID
                  </Typography>
                  <Typography variant="body1">
                    {scan.tool_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {scan.created_at ? new Date(scan.created_at).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Finished
                  </Typography>
                  <Typography variant="body1">
                    {scan.finished_at ? new Date(scan.finished_at).toLocaleString() : 'Not yet'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {output && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Scan Results
                </Typography>
                
                {output.vulnerabilities && output.vulnerabilities.length > 0 ? (
                  <List>
                    {output.vulnerabilities.map((vuln: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={vuln.name || vuln.title || `Vulnerability ${index + 1}`}
                            secondary={
                              <>
                                {vuln.severity && (
                                  <Chip 
                                    label={vuln.severity} 
                                    size="small" 
                                    color={
                                      vuln.severity === 'high' ? 'error' :
                                      vuln.severity === 'medium' ? 'warning' :
                                      'default'
                                    }
                                    sx={{ mr: 1 }}
                                  />
                                )}
                                {vuln.description}
                              </>
                            }
                          />
                        </ListItem>
                        {index < output.vulnerabilities.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success">
                    No vulnerabilities found! Your target appears to be secure.
                  </Alert>
                )}

                {/* Raw output display */}
                {output && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Raw Output
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ 
                        overflow: 'auto', 
                        maxHeight: '400px',
                        fontSize: '0.875rem',
                        margin: 0 
                      }}>
                        {JSON.stringify(output, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/dashboard/scans/new')}
                  >
                    Start New Scan
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/dashboard/scans')}
                  >
                    View All Scans
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ScanStatusSimple;