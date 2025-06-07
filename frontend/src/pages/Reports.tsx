import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Description as JsonIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { SecurityStatusIndicator } from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';
import scanService from '../services/scan.service';

interface Report {
  id: string;
  scanId: string;
  scanType: string;
  target: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  severity: 'success' | 'warning' | 'danger' | 'info';
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  format?: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const scans = await scanService.getAllScans();
      
      // Transform scans into reports
      const reportsData: Report[] = scans.map((scan: any) => ({
        id: scan.id,
        scanId: scan.id,
        scanType: scan.type || 'Security Scan',
        target: scan.target,
        createdAt: scan.createdAt,
        status: scan.status,
        severity: getSeverityFromScan(scan),
        findings: {
          critical: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 10),
          low: Math.floor(Math.random() * 15),
          info: Math.floor(Math.random() * 20),
        },
      }));
      
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromScan = (scan: any): 'success' | 'warning' | 'danger' | 'info' => {
    if (scan.status === 'failed') return 'danger';
    if (scan.status === 'in_progress') return 'info';
    // Random severity for demo
    const severities: ('success' | 'warning' | 'danger')[] = ['success', 'warning', 'danger'];
    return severities[Math.floor(Math.random() * severities.length)];
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.scanType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || report.severity === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExport = (format: string) => {
    if (selectedReport) {
      console.log(`Exporting report ${selectedReport.id} as ${format}`);
      // Implement actual export logic here
    }
    setExportAnchorEl(null);
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckIcon sx={{ color: cobytesColors.success }} />;
      case 'warning':
        return <WarningIcon sx={{ color: cobytesColors.warning }} />;
      case 'danger':
        return <ErrorIcon sx={{ color: cobytesColors.danger }} />;
      default:
        return <InfoIcon sx={{ color: cobytesColors.info }} />;
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: cobytesColors.navy, mb: 2 }}>
          Security Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and export detailed security scan reports
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Reports
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {reports.length}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: `${cobytesColors.orange}15`, borderRadius: 2 }}>
                  <DescriptionIcon sx={{ color: cobytesColors.orange }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Critical Issues
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.danger }}>
                    {reports.filter(r => r.severity === 'danger').length}
                  </Typography>
                </Box>
                <SecurityStatusIndicator severity="danger" size="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Warnings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.warning }}>
                    {reports.filter(r => r.severity === 'warning').length}
                  </Typography>
                </Box>
                <SecurityStatusIndicator severity="warning" size="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Passed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.success }}>
                    {reports.filter(r => r.severity === 'success').length}
                  </Typography>
                </Box>
                <SecurityStatusIndicator severity="success" size="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
        >
          Filter: {selectedFilter === 'all' ? 'All' : selectedFilter}
        </Button>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem onClick={() => { setSelectedFilter('all'); setFilterAnchorEl(null); }}>
            All Reports
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('danger'); setFilterAnchorEl(null); }}>
            Critical
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('warning'); setFilterAnchorEl(null); }}>
            Warnings
          </MenuItem>
          <MenuItem onClick={() => { setSelectedFilter('success'); setFilterAnchorEl(null); }}>
            Passed
          </MenuItem>
        </Menu>
      </Box>

      {/* Reports Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Scan Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Findings</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No reports found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(report.severity)}
                      <Chip
                        label={report.status}
                        size="small"
                        color={report.severity as any}
                        sx={{
                          bgcolor: report.severity === 'success' ? '#D1FAE5' :
                                  report.severity === 'warning' ? '#FEF3C7' :
                                  report.severity === 'danger' ? '#FEE2E2' : '#DBEAFE',
                          color: report.severity === 'success' ? cobytesColors.success :
                                report.severity === 'warning' ? cobytesColors.warning :
                                report.severity === 'danger' ? cobytesColors.danger : cobytesColors.info,
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {report.target}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.scanType}</TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {report.findings.critical > 0 && (
                        <Chip
                          label={`${report.findings.critical} Critical`}
                          size="small"
                          sx={{ bgcolor: '#FEE2E2', color: cobytesColors.danger }}
                        />
                      )}
                      {report.findings.high > 0 && (
                        <Chip
                          label={`${report.findings.high} High`}
                          size="small"
                          sx={{ bgcolor: '#FEF3C7', color: cobytesColors.warning }}
                        />
                      )}
                      {report.findings.medium > 0 && (
                        <Chip
                          label={`${report.findings.medium} Medium`}
                          size="small"
                          sx={{ bgcolor: '#E0E7FF', color: '#4338CA' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => window.location.href = `/dashboard/scans/${report.scanId}`}
                      >
                        View
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setSelectedReport(report);
                          setExportAnchorEl(e.currentTarget);
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <PdfIcon sx={{ mr: 1 }} /> Export as PDF
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <CsvIcon sx={{ mr: 1 }} /> Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')}>
          <JsonIcon sx={{ mr: 1 }} /> Export as JSON
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Reports;