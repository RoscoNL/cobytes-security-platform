import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  RefreshOutlined,
  OpenInNewOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';

interface StoredScan {
  scanId: number;
  toolId: number;
  toolName: string;
  target: string;
  status?: string;
  progress?: number;
  createdAt: string;
}

const SecurityScans: React.FC = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<StoredScan[]>([]);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = () => {
    // Load scans from localStorage
    const storedScans = localStorage.getItem('security_scans');
    if (storedScans) {
      const parsedScans = JSON.parse(storedScans);
      // Sort by creation date, newest first
      parsedScans.sort((a: StoredScan, b: StoredScan) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setScans(parsedScans);
    }
  };

  const saveScan = (scan: StoredScan) => {
    const existingScans = JSON.parse(localStorage.getItem('pentesttools_scans') || '[]');
    const updatedScans = [scan, ...existingScans.filter((s: StoredScan) => s.scanId !== scan.scanId)];
    // Keep only last 50 scans
    if (updatedScans.length > 50) {
      updatedScans.splice(50);
    }
    localStorage.setItem('pentesttools_scans', JSON.stringify(updatedScans));
    loadScans();
  };

  const getStatusColor = (status?: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'finished':
      case 'completed':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'running':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Expose the saveScan method globally so it can be called from other components
  useEffect(() => {
    (window as any).savePentestToolsScan = saveScan;
    return () => {
      delete (window as any).savePentestToolsScan;
    };
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Recent PentestTools Scans
        </Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadScans}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate('/all-scanners-new')}
          >
            New Scan
          </Button>
        </Box>
      </Box>

      {scans.length === 0 ? (
        <Alert severity="info">
          No PentestTools scans yet. Click "New Scan" to start your first scan.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Scan ID</TableCell>
                <TableCell>Tool</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.scanId}>
                  <TableCell>{scan.scanId}</TableCell>
                  <TableCell>{scan.toolName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {scan.target}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={scan.status || 'Unknown'}
                      color={getStatusColor(scan.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(scan.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Status">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/scan-status/${scan.scanId}`)}
                      >
                        <VisibilityOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View in PentestTools">
                      <IconButton
                        size="small"
                        component="a"
                        href={`https://app.pentest-tools.com/scans/${scan.scanId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default SecurityScans;