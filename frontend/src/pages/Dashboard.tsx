import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Scanner as ScannerIcon,
  Speed as SpeedIcon,
  Extension as IntegrationIcon,
  TrendingUp as TrendingUpIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { SecurityStatusIndicator, ScanProgressBar } from '../components/cobytes';
import { cobytesColors } from '../theme/cobytes-theme';
import scanService, { Scan } from '../services/scan.service';
import PentestToolsScans from '../components/PentestToolsScans';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    criticalFindings: 0,
    pendingScans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const scans = await scanService.getAllScans();
      setRecentScans(scans.slice(0, 5));
      
      const completed = scans.filter(s => s.status === 'completed');
      const pending = scans.filter(s => s.status === 'pending' || s.status === 'running');
      
      let criticalCount = 0;
      completed.forEach(scan => {
        if (scan.results) {
          criticalCount += scan.results.filter(r => r.severity === 'critical').length;
        }
      });
      
      setStats({
        totalScans: scans.length,
        completedScans: completed.length,
        criticalFindings: criticalCount,
        pendingScans: pending.length,
      });
    } catch (err) {
      console.log('Dashboard data not available');
      setRecentScans([]);
      setStats({
        totalScans: 0,
        completedScans: 0,
        criticalFindings: 0,
        pendingScans: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ color: cobytesColors.success }} />;
      case 'running':
        return <ScheduleIcon sx={{ color: cobytesColors.info }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: cobytesColors.danger }} />;
      case 'pending':
        return <WarningIcon sx={{ color: cobytesColors.warning }} />;
      default:
        return <ScheduleIcon sx={{ color: cobytesColors.gray400 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bgcolor: '#D1FAE5', color: cobytesColors.success };
      case 'running':
        return { bgcolor: '#DBEAFE', color: cobytesColors.info };
      case 'failed':
        return { bgcolor: '#FEE2E2', color: cobytesColors.danger };
      case 'pending':
        return { bgcolor: '#FEF3C7', color: cobytesColors.warning };
      default:
        return { bgcolor: cobytesColors.gray100, color: cobytesColors.gray700 };
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${cobytesColors.orange} 0%, ${cobytesColors.coral} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Welcome to Cobytes Security Platform
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              Professional security scanning for your websites, APIs, and infrastructure
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard/scans/new')}
              sx={{
                bgcolor: 'white',
                color: cobytesColors.orange,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Start New Scan
            </Button>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <SecurityIcon sx={{ fontSize: 120, opacity: 0.3 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Scans
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.totalScans}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${cobytesColors.orange}15`, width: 56, height: 56 }}>
                  <AssessmentIcon sx={{ color: cobytesColors.orange }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.success }}>
                    {stats.completedScans}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#D1FAE5', width: 56, height: 56 }}>
                  <CheckIcon sx={{ color: cobytesColors.success }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Critical Findings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.danger }}>
                    {stats.criticalFindings}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FEE2E2', width: 56, height: 56 }}>
                  <BugReportIcon sx={{ color: cobytesColors.danger }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cobytesColors.info }}>
                    {stats.pendingScans}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#DBEAFE', width: 56, height: 56 }}>
                  <ScheduleIcon sx={{ color: cobytesColors.info }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PentestTools Integration */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: cobytesColors.navy }}>
          Live Security Scans
        </Typography>
        <PentestToolsScans />
      </Box>

      {/* Recent Backend Scans */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Backend Scans
              </Typography>
              {recentScans.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SecurityIcon sx={{ fontSize: 48, color: cobytesColors.gray400, mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No scans yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Get started by creating your first scan
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SecurityIcon />}
                    onClick={() => navigate('/dashboard/scans/new')}
                    sx={{
                      bgcolor: cobytesColors.orange,
                      '&:hover': { bgcolor: cobytesColors.coral },
                    }}
                  >
                    Start First Scan
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentScans.map((scan, index) => (
                    <ListItem
                      key={scan.id}
                      sx={{
                        px: 0,
                        borderBottom: index < recentScans.length - 1 ? `1px solid ${cobytesColors.gray100}` : 'none',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/dashboard/scans/${scan.id}`)}
                    >
                      <ListItemAvatar>
                        {getStatusIcon(scan.status)}
                      </ListItemAvatar>
                      <ListItemText
                        primary={scan.target}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {scan.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • {new Date(scan.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={scan.status}
                          size="small"
                          sx={getStatusColor(scan.status)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
              {recentScans.length > 0 && (
                <Button
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/dashboard/scans')}
                  sx={{ mt: 2 }}
                >
                  View All Scans
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.3s',
                }}
                onClick={() => navigate('/all-scanners-new')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${cobytesColors.orange}15`, mr: 2 }}>
                      <ScannerIcon sx={{ color: cobytesColors.orange }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      PentestTools
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    40+ professional security scanners via API
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.3s',
                }}
                onClick={() => navigate('/dashboard/scans/new')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${cobytesColors.info}15`, mr: 2 }}>
                      <SpeedIcon sx={{ color: cobytesColors.info }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Quick Scan
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Fast vulnerability assessment
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.3s',
                }}
                onClick={() => navigate('/integration-status')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${cobytesColors.success}15`, mr: 2 }}>
                      <IntegrationIcon sx={{ color: cobytesColors.success }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Integration
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    API status and testing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;