import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Language as WebsiteIcon,
  VpnKey as ApiIcon,
  NetworkCheck as NetworkIcon,
  Lock as SslIcon,
  Shield as WafIcon,
  Public as WordpressIcon,
  WaterDrop as DrupalIcon,
  Extension as JoomlaIcon,
  Scanner as DefaultIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material';
import { SecurityStatusIndicator, ScanProgressBar } from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';
import scanService, { Scan } from '../services/scan.service';
import { securityScannerProxyService } from '../services/security-scanner-proxy.service';

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

const ScanList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [scans, setScans] = useState<Scan[]>([]);
  const [pentestToolsScans, setPentestToolsScans] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your scans.');
        setScans([]);
        setLoading(false);
        return;
      }
      
      // Load backend scans
      const backendScans = await scanService.getAllScans();
      setScans(backendScans);
      
      // Try to load PentestTools scans for any scan with pentestToolsScanId
      const pentestScans = [];
      for (const scan of backendScans) {
        if (scan.securityScanId) {
          try {
            const ptScan = await securityScannerProxyService.getScanStatus(scan.securityScanId);
            pentestScans.push(ptScan);
          } catch (err) {
            console.error('Failed to load PentestTools scan:', err);
          }
        }
      }
      setPentestToolsScans(pentestScans);
      
    } catch (err: any) {
      console.error('Failed to load scans:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Optionally redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        setError('Failed to load scans. Please try again.');
      }
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadScans();
  };

  const handleDelete = async () => {
    if (!scanToDelete) return;

    try {
      await scanService.deleteScan(parseInt(scanToDelete));
      await loadScans();
      setDeleteDialogOpen(false);
      setScanToDelete(null);
    } catch (err: any) {
      setError('Failed to delete scan. Please try again.');
    }
  };

  const handleCancel = async (scanId: string) => {
    try {
      await scanService.cancelScan(parseInt(scanId));
      await loadScans();
    } catch (err: any) {
      setError('Failed to cancel scan. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'finished':
        return <CheckIcon sx={{ color: cobytesColors.success }} />;
      case 'running':
        return <RunningIcon sx={{ color: cobytesColors.warning }} />;
      case 'failed':
      case 'error':
        return <ErrorIcon sx={{ color: cobytesColors.danger }} />;
      case 'pending':
        return <PendingIcon sx={{ color: cobytesColors.info }} />;
      default:
        return <PendingIcon sx={{ color: cobytesColors.gray400 }} />;
    }
  };

  const getTypeIcon = (type: string) => {
    const iconProps = { sx: { fontSize: 24, color: cobytesColors.gray700 } };
    switch (type.toLowerCase()) {
      case 'subdomain':
        return <SearchIcon {...iconProps} />;
      case 'port_scan':
        return <NetworkIcon {...iconProps} />;
      case 'website':
        return <WebsiteIcon {...iconProps} />;
      case 'network':
        return <NetworkIcon {...iconProps} />;
      case 'api':
        return <ApiIcon {...iconProps} />;
      case 'ssl':
        return <SslIcon {...iconProps} />;
      case 'waf':
        return <WafIcon {...iconProps} />;
      case 'wordpress':
        return <WordpressIcon {...iconProps} />;
      case 'drupal':
        return <DrupalIcon {...iconProps} />;
      case 'joomla':
        return <JoomlaIcon {...iconProps} />;
      default:
        return <DefaultIcon {...iconProps} />;
    }
  };

  const getSeverity = (scan: Scan): 'success' | 'warning' | 'danger' => {
    if (!scan.results || scan.results.length === 0) return 'success';
    
    const criticalCount = scan.results.filter(r => r.severity === 'critical').length;
    const highCount = scan.results.filter(r => r.severity === 'high').length;
    
    if (criticalCount > 0) return 'danger';
    if (highCount > 0) return 'warning';
    return 'success';
  };

  const filteredScans = scans.filter((scan) => {
    const matchesFilter = filter === 'all' || scan.status === filter;
    const matchesSearch = scan.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderScanCard = (scan: Scan) => (
    <Card
      key={scan.id}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/dashboard/scans/${scan.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getTypeIcon(scan.type)}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {scan.target}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {scan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Scan
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityStatusIndicator severity={getSeverity(scan)} size="small" />
            <Chip
              icon={getStatusIcon(scan.status)}
              label={scan.status.toUpperCase()}
              size="small"
              sx={{
                bgcolor: scan.status === 'completed' ? '#D1FAE5' :
                        scan.status === 'running' ? '#FEF3C7' :
                        scan.status === 'failed' ? '#FEE2E2' : cobytesColors.gray100,
                color: scan.status === 'completed' ? cobytesColors.success :
                       scan.status === 'running' ? cobytesColors.warning :
                       scan.status === 'failed' ? cobytesColors.danger : cobytesColors.gray700,
              }}
            />
          </Box>
        </Box>

        {scan.status === 'running' && (
          <Box sx={{ mb: 2 }}>
            <ScanProgressBar progress={scan.progress} animated />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(scan.created_at).toLocaleString()}
          </Typography>
          {scan.status === 'completed' && scan.results && (
            <Typography variant="caption" color="text.secondary">
              {scan.results.length} findings
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/scans/${scan.id}`);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {scan.status === 'running' && (
            <Tooltip title="Cancel Scan">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(scan.id);
                }}
                sx={{ color: cobytesColors.warning }}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete Scan">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setScanToDelete(scan.id);
                setDeleteDialogOpen(true);
              }}
              sx={{ color: cobytesColors.danger }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} md={6} key={i}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))}
          </Grid>
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
              Security Scans
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              View and manage all your security scans in one place
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  color: cobytesColors.orange,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/scans/new')}
              sx={{
                background: `linear-gradient(135deg, ${cobytesColors.orange} 0%, ${cobytesColors.coral} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${cobytesColors.coral} 0%, ${cobytesColors.orange} 100%)`,
                },
              }}
            >
              New Scan
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search scans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          
          {isMobile ? (
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All ({scans.length})</MenuItem>
                <MenuItem value="pending">Pending ({scans.filter(s => s.status === 'pending').length})</MenuItem>
                <MenuItem value="running">Running ({scans.filter(s => s.status === 'running').length})</MenuItem>
                <MenuItem value="completed">Completed ({scans.filter(s => s.status === 'completed').length})</MenuItem>
                <MenuItem value="failed">Failed ({scans.filter(s => s.status === 'failed').length})</MenuItem>
                <MenuItem value="cancelled">Cancelled ({scans.filter(s => s.status === 'cancelled').length})</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={filter}
                onChange={(e, newValue) => setFilter(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={`All (${scans.length})`} value="all" />
                <Tab label={`Pending (${scans.filter(s => s.status === 'pending').length})`} value="pending" />
                <Tab label={`Running (${scans.filter(s => s.status === 'running').length})`} value="running" />
                <Tab label={`Completed (${scans.filter(s => s.status === 'completed').length})`} value="completed" />
                <Tab label={`Failed (${scans.filter(s => s.status === 'failed').length})`} value="failed" />
                <Tab label={`Cancelled (${scans.filter(s => s.status === 'cancelled').length})`} value="cancelled" />
              </Tabs>
            </Paper>
          )}
        </Box>

        {/* Scan Type Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Backend Scans" />
            <Tab label="PentestTools Scans" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Scans List */}
          {filteredScans.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 64, color: cobytesColors.gray400, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No scans found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {filter === 'all'
                  ? 'Get started by creating a new scan.'
                  : `No ${filter} scans at the moment.`}
              </Typography>
              {filter === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/scans/new')}
                  sx={{
                    bgcolor: cobytesColors.orange,
                    '&:hover': { bgcolor: cobytesColors.coral },
                  }}
                >
                  Create First Scan
                </Button>
              )}
            </Paper>
          ) : isMobile ? (
            <Grid container spacing={2}>
              {filteredScans.map((scan) => (
                <Grid item xs={12} key={scan.id}>
                  {renderScanCard(scan)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Findings</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredScans.map((scan) => (
                    <TableRow
                      key={scan.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/dashboard/scans/${scan.id}`)}
                    >
                      <TableCell>{getTypeIcon(scan.type)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {scan.target}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {scan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(scan.status)}
                          <Chip
                            label={scan.status.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: scan.status === 'completed' ? '#D1FAE5' :
                                      scan.status === 'running' ? '#FEF3C7' :
                                      scan.status === 'failed' ? '#FEE2E2' : cobytesColors.gray100,
                              color: scan.status === 'completed' ? cobytesColors.success :
                                     scan.status === 'running' ? cobytesColors.warning :
                                     scan.status === 'failed' ? cobytesColors.danger : cobytesColors.gray700,
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {scan.status === 'running' ? (
                          <Box sx={{ width: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={scan.progress}
                              sx={{
                                bgcolor: cobytesColors.gray100,
                                '& .MuiLinearProgress-bar': { bgcolor: cobytesColors.orange },
                              }}
                            />
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{new Date(scan.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {scan.status === 'completed' && scan.results ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SecurityStatusIndicator severity={getSeverity(scan)} size="small" />
                            <Typography variant="body2">
                              {scan.results.length}
                            </Typography>
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/scans/${scan.id}`);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {scan.status === 'running' && (
                            <Tooltip title="Cancel Scan">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(scan.id);
                                }}
                                sx={{ color: cobytesColors.warning }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Scan">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setScanToDelete(scan.id);
                                setDeleteDialogOpen(true);
                              }}
                              sx={{ color: cobytesColors.danger }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {pentestToolsScans.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 64, color: cobytesColors.gray400, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No PentestTools scans found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                PentestTools scans will appear here when you create them.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/all-scanners-new')}
                sx={{
                  bgcolor: cobytesColors.orange,
                  '&:hover': { bgcolor: cobytesColors.coral },
                }}
              >
                Browse PentestTools Scanners
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {pentestToolsScans.map((scan) => (
                <Grid item xs={12} md={6} key={scan.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`/scan-status/${scan.id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {scan.tool_id || 'PentestTools Scan'}
                        </Typography>
                        <Chip
                          label={(scan.status || scan.status_name || 'Unknown').toUpperCase()}
                          size="small"
                          color={scan.status === 'finished' ? 'success' : 'warning'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Target: {scan.target_id || 'N/A'}
                      </Typography>
                      {scan.progress !== undefined && (
                        <Box sx={{ mt: 2 }}>
                          <ScanProgressBar progress={scan.progress || 0} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Scan?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this scan? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ScanList;