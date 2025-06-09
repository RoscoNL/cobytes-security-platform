import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Avatar,
  Button,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  is_active: boolean;
  stats: {
    totalScans: number;
    activeScans: number;
    reportsGenerated: number;
  };
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Get user from localStorage or API
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          ...userData,
          stats: {
            totalScans: 42,
            activeScans: 3,
            reportsGenerated: 38
          }
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading profile...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Typography>No user data found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box ml={3}>
                  <Typography variant="h4" gutterBottom>
                    {user.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      label={user.role}
                      color="primary"
                      size="small"
                      icon={<SecurityIcon />}
                    />
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate('/settings')}
              >
                Edit Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* User Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display="flex" alignItems="center">
                <EmailIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center">
                <PersonIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body2">
                    {user.role}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center">
                <CalendarIcon color="action" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(user.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Security Scan Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Scans
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {user.stats.totalScans}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Active Scans
                    </Typography>
                    <Typography variant="h3" color="warning.main">
                      {user.stats.activeScans}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Reports Generated
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      {user.stats.reportsGenerated}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => navigate('/scans/new')}
              >
                Start New Scan
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/scans')}
              >
                View All Scans
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/reports')}
              >
                Download Reports
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/settings')}
              >
                Account Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;