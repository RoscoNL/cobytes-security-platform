import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  Chip,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from '@mui/material';
import { 
  CheckCircleOutlined, 
  PlayArrowOutlined, 
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { SecurityStatusIndicator } from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';
import scanService from '../services/scan.service';

interface DemoScan {
  id: string;
  target: string;
  type: string;
  status: string;
  progress: number;
  results: any[];
  created_at: string;
  completed_at: string;
}

const ScanDemo: React.FC = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<DemoScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<DemoScan | null>(null);

  useEffect(() => {
    loadCompletedScans();
  }, []);

  const loadCompletedScans = async () => {
    try {
      setLoading(true);
      
      // Try to get scans first
      let allScans: any[] = [];
      try {
        allScans = await scanService.getAllScans();
      } catch (error: any) {
        // If not authenticated, try to login with demo credentials and retry
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Not authenticated, attempting demo login...');
          try {
            await scanService.loginForDemo();
            allScans = await scanService.getAllScans();
          } catch (loginError) {
            console.warn('Demo login failed, showing empty state');
          }
        }
      }
      
      // Filter to show only completed scans with results
      const completedScans = allScans.filter((scan: any) => 
        scan.status === 'completed' && scan.results && scan.results.length > 0
      );
      setScans(completedScans);
      
      if (completedScans.length > 0) {
        setSelectedScan(completedScans[0]); // Show the first completed scan by default
      }
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <ErrorIcon sx={{ color: cobytesColors.danger }} />;
      case 'medium':
        return <WarningIcon sx={{ color: cobytesColors.warning }} />;
      case 'low':
        return <InfoIcon sx={{ color: cobytesColors.info }} />;
      default:
        return <SecurityIcon sx={{ color: cobytesColors.gray400 }} />;
    }
  };

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'danger' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Skeleton variant="text" width={400} height={48} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 3 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Real Scan Results Demo
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Live Results</strong> - Showing actual scan results from PentestTools API integration.
        </Alert>

        {scans.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                No Completed Scans Available
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                No completed scans with results found. Run a scan to see real results here.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowOutlined />}
                onClick={() => navigate('/scans/new')}
                sx={{ bgcolor: cobytesColors.orange }}
              >
                Start New Scan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Scan Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Completed Scans
              </Typography>
              <Grid container spacing={2}>
                {scans.map((scan) => (
                  <Grid item xs={12} md={6} key={scan.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedScan?.id === scan.id ? `2px solid ${cobytesColors.orange}` : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setSelectedScan(scan)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {scan.target}
                          </Typography>
                          <Chip
                            label={scan.type.toUpperCase()}
                            size="small"
                            sx={{ bgcolor: cobytesColors.gray100 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {scan.results?.length || 0} findings
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completed: {new Date(scan.completed_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Selected Scan Results */}
            {selectedScan && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        Scan Results: {selectedScan.target}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedScan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Scan
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/scans/${selectedScan.id}`)}
                    >
                      View Full Details
                    </Button>
                  </Box>

                  {/* Scan Stats */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: cobytesColors.orange }}>
                          {selectedScan.results?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Findings
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: cobytesColors.danger }}>
                          {selectedScan.results?.filter(r => r.severity === 'high' || r.severity === 'critical').length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          High/Critical
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: cobytesColors.warning }}>
                          {selectedScan.results?.filter(r => r.severity === 'medium').length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Medium
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: cobytesColors.info }}>
                          {selectedScan.results?.filter(r => r.severity === 'low' || r.severity === 'info').length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Low/Info
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Results List */}
                  {selectedScan.results && selectedScan.results.length > 0 ? (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Security Findings
                      </Typography>
                      {selectedScan.results.slice(0, 10).map((result, index) => (
                        <Accordion key={index} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <SecurityStatusIndicator severity={getSeverityColor(result.severity)} />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1">
                                  {result.title || result.description || `Finding ${index + 1}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Severity: {result.severity || 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {result.description || result.details || 'No additional details available.'}
                            </Typography>
                            {result.solution && (
                              <Alert severity="info">
                                <strong>Recommendation:</strong> {result.solution}
                              </Alert>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      ))}
                      
                      {selectedScan.results.length > 10 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Showing first 10 of {selectedScan.results.length} findings. 
                          <Button
                            size="small"
                            onClick={() => navigate(`/scans/${selectedScan.id}`)}
                            sx={{ ml: 1 }}
                          >
                            View All Results
                          </Button>
                        </Alert>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      This scan completed but no detailed findings are available.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How to Run New Scans
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon sx={{ color: cobytesColors.orange }} />
              </ListItemIcon>
              <ListItemText
                primary="Start New Scan"
                secondary="Go to All Scanners or use the New Scan button to create additional scans"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ViewIcon sx={{ color: cobytesColors.orange }} />
              </ListItemIcon>
              <ListItemText
                primary="Monitor Progress"
                secondary="Track real-time scan progress on the scan details page"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleOutlined sx={{ color: cobytesColors.success }} />
              </ListItemIcon>
              <ListItemText
                primary="View Results"
                secondary="Results appear here automatically when scans complete"
              />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrowOutlined />}
              onClick={() => navigate('/scans/new')}
              sx={{ 
                bgcolor: cobytesColors.orange,
                '&:hover': { bgcolor: cobytesColors.coral },
                mr: 2 
              }}
            >
              Start New Scan
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/all-scanners')}
            >
              Browse All Scanners
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default ScanDemo;