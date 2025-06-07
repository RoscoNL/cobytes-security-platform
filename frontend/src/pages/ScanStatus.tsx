import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { SecurityStatusIndicator, ScanProgressBar, ScanResultCard } from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';
import { pentestToolsProxyService } from '../services/pentesttools-proxy.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ScanStatus: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<any>(null);
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (scanId) {
      loadScanStatus();
    }
  }, [scanId]);

  useEffect(() => {
    if (scanId && polling) {
      const interval = setInterval(() => {
        loadScanStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [scanId, polling]);

  const loadScanStatus = async () => {
    if (!scanId) return;

    try {
      setError(null);
      const scanData = await pentestToolsProxyService.getScanStatus(parseInt(scanId));
      setScan(scanData);

      if (scanData.status === 'finished' || scanData.status_name === 'finished') {
        setPolling(false);
        try {
          const outputData = await pentestToolsProxyService.getScanOutput(parseInt(scanId));
          setOutput(outputData);
        } catch (err) {
          console.error('Failed to get scan output:', err);
        }
      } else if (scanData.status === 'running' || scanData.status === 'pending' || scanData.status_name === 'running' || scanData.status_name === 'pending') {
        setPolling(true);
      } else {
        setPolling(false);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load scan status:', err);
      setError(err.message || 'Failed to load scan status');
      setLoading(false);
      setPolling(false);
    }
  };

  const handleStop = async () => {
    if (!scanId || !window.confirm('Are you sure you want to stop this scan?')) return;

    try {
      await pentestToolsProxyService.stopScan(parseInt(scanId));
      await loadScanStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to stop scan');
    }
  };

  const handleDelete = async () => {
    if (!scanId || !window.confirm('Are you sure you want to delete this scan?')) return;

    try {
      await pentestToolsProxyService.deleteScan(parseInt(scanId));
      navigate('/dashboard/scans');
    } catch (err: any) {
      setError(err.message || 'Failed to delete scan');
    }
  };

  const getSeverity = (status: string | undefined): 'success' | 'warning' | 'danger' => {
    if (!status) return 'warning';
    switch (status.toLowerCase()) {
      case 'finished':
        return 'success';
      case 'failed':
      case 'error':
        return 'danger';
      case 'running':
      case 'pending':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = (format: string) => {
    if (!output) return;
    
    const dataStr = JSON.stringify(output, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `scan-${scanId}-${format}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress sx={{ bgcolor: cobytesColors.gray100, '& .MuiLinearProgress-bar': { bgcolor: cobytesColors.orange } }} />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: cobytesColors.gray700 }}>
            Loading scan details...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: cobytesColors.navy }}>
              Scan Status
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Real-time monitoring of your security scan
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadScanStatus} disabled={polling} sx={{ color: cobytesColors.orange }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {scan?.status === 'running' && (
              <Tooltip title="Stop Scan">
                <IconButton onClick={handleStop} sx={{ color: cobytesColors.warning }}>
                  <StopIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete Scan">
              <IconButton onClick={handleDelete} sx={{ color: cobytesColors.danger }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View in PentestTools">
              <IconButton
                component="a"
                href={`https://app.pentest-tools.com/scans/${scanId}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: cobytesColors.info }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {scan && (
          <>
            {/* Progress Section */}
            {(scan.status === 'running' || scan.status_name === 'running') && (
              <Box sx={{ mb: 4 }}>
                <ScanProgressBar
                  progress={scan.progress || 0}
                  label={`Scanning ${scan.tool_id || 'Security Tool'}`}
                  animated
                />
              </Box>
            )}

            {/* Main Content Grid */}
            <Grid container spacing={3}>
              {/* Status Card */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <SecurityIcon sx={{ fontSize: 40, color: cobytesColors.orange, mr: 2 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Scan #{scanId}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <SecurityStatusIndicator severity={getSeverity(scan.status || scan.status_name)} size="small" />
                          <Chip 
                            label={(scan.status || scan.status_name || 'Unknown').toUpperCase()} 
                            size="small"
                            sx={{
                              bgcolor: getSeverity(scan.status || scan.status_name) === 'success' ? '#D1FAE5' :
                                      getSeverity(scan.status || scan.status_name) === 'warning' ? '#FEF3C7' :
                                      getSeverity(scan.status || scan.status_name) === 'danger' ? '#FEE2E2' : '#DBEAFE',
                              color: getSeverity(scan.status || scan.status_name) === 'success' ? cobytesColors.success :
                                     getSeverity(scan.status || scan.status_name) === 'warning' ? cobytesColors.warning :
                                     getSeverity(scan.status || scan.status_name) === 'danger' ? cobytesColors.danger : cobytesColors.info,
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <List sx={{ p: 0 }}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="Tool"
                          secondary={scan.tool_id || 'N/A'}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="Target ID"
                          secondary={scan.target_id || 'N/A'}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="Started"
                          secondary={formatDate(scan.created_at || scan.start_time)}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                        />
                      </ListItem>
                      {(scan.finished_at || scan.end_time) && (
                        <>
                          <Divider />
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText 
                              primary="Finished"
                              secondary={formatDate(scan.finished_at || scan.end_time)}
                              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                              secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                            />
                          </ListItem>
                        </>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions Card */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Actions
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<RefreshIcon />}
                        onClick={loadScanStatus}
                        disabled={polling}
                        sx={{
                          bgcolor: cobytesColors.orange,
                          '&:hover': { bgcolor: cobytesColors.coral },
                        }}
                      >
                        {polling ? 'Auto-refreshing...' : 'Refresh Status'}
                      </Button>

                      {(scan.status === 'running' || scan.status_name === 'running') && (
                        <Button
                          variant="outlined"
                          fullWidth
                          color="warning"
                          startIcon={<StopIcon />}
                          onClick={handleStop}
                        >
                          Stop Scan
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<OpenInNewIcon />}
                        component="a"
                        href={`https://app.pentest-tools.com/scans/${scanId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderColor: cobytesColors.navy,
                          color: cobytesColors.navy,
                          '&:hover': {
                            borderColor: cobytesColors.navy,
                            bgcolor: 'rgba(61, 59, 92, 0.04)',
                          },
                        }}
                      >
                        View in PentestTools
                      </Button>

                      {output && (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<DownloadIcon />}
                          onClick={() => handleExport('json')}
                          sx={{
                            borderColor: cobytesColors.info,
                            color: cobytesColors.info,
                            '&:hover': {
                              borderColor: cobytesColors.info,
                              bgcolor: 'rgba(59, 130, 246, 0.04)',
                            },
                          }}
                        >
                          Export Results
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        fullWidth
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                      >
                        Delete Scan
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Summary Card */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Summary
                    </Typography>
                    
                    {output ? (
                      <Box>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Findings
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 600, color: cobytesColors.orange }}>
                            {typeof output === 'object' && output.findings ? output.findings.length : '0'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<BugReportIcon />} 
                            label="Critical: 0" 
                            size="small"
                            sx={{ bgcolor: '#FEE2E2', color: cobytesColors.danger }}
                          />
                          <Chip 
                            icon={<WarningIcon />} 
                            label="High: 0" 
                            size="small"
                            sx={{ bgcolor: '#FEF3C7', color: cobytesColors.warning }}
                          />
                          <Chip 
                            icon={<InfoIcon />} 
                            label="Medium: 0" 
                            size="small"
                            sx={{ bgcolor: '#E0E7FF', color: '#4338CA' }}
                          />
                        </Box>
                      </Box>
                    ) : scan.status === 'running' || scan.status_name === 'running' ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <HourglassIcon sx={{ fontSize: 48, color: cobytesColors.gray400, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Scan in progress...
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <InfoIcon sx={{ fontSize: 48, color: cobytesColors.gray400, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          No results available yet
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Results Section */}
            {output && (
              <Box sx={{ mt: 4 }}>
                <Paper>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                      <Tab label="Formatted Results" />
                      <Tab label="Raw Output" />
                    </Tabs>
                  </Box>
                  
                  <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Scan Results
                      </Typography>
                      
                      {typeof output === 'object' && output.findings && Array.isArray(output.findings) ? (
                        <Grid container spacing={2}>
                          {output.findings.map((finding: any, index: number) => (
                            <Grid item xs={12} md={6} key={index}>
                              <ScanResultCard
                                title={finding.title || `Finding #${index + 1}`}
                                description={finding.description || 'No description available'}
                                severity={finding.severity || 'info'}
                                details={[
                                  { label: 'Type', value: finding.type || 'N/A' },
                                  { label: 'Risk', value: finding.risk || 'N/A' },
                                ]}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Paper sx={{ p: 3, bgcolor: cobytesColors.gray100 }}>
                          <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                          </pre>
                        </Paper>
                      )}
                    </Box>
                  </TabPanel>
                  
                  <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Raw Output
                      </Typography>
                      <Paper sx={{ p: 3, bgcolor: cobytesColors.gray100, maxHeight: 600, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  </TabPanel>
                </Paper>
              </Box>
            )}

            {/* Auto-refresh Alert */}
            {(scan.status === 'running' || scan.status_name === 'running') && (
              <Alert 
                severity="info" 
                icon={<HourglassIcon />}
                sx={{ mt: 3, bgcolor: '#DBEAFE', color: cobytesColors.info }}
              >
                This scan is currently running. The page will automatically refresh every 3 seconds to show the latest status.
              </Alert>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default ScanStatus;