import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Key as KeyIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: ''
  });

  // Security settings
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    scanComplete: true,
    weeklyReport: false,
    securityAlerts: true,
    marketingEmails: false
  });

  // API settings
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    webhookUrl: '',
    rateLimit: '100'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user settings from localStorage or API
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          company: userData.company || ''
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.name = profile.name;
        userData.email = profile.email;
        userData.company = profile.company;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Clear password fields
      setSecurity({
        ...security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleApiSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save API settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="success-message">
          Settings saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Profile" icon={<SecurityIcon />} iconPosition="start" />
            <Tab label="Security" icon={<KeyIcon />} iconPosition="start" />
            <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="API & Integrations" icon={<SecurityIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Profile Settings */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  data-testid="profile-name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleProfileSave}
                  disabled={loading}
                  data-testid="save-settings"
                >
                  Save Profile
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Settings */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={security.newPassword}
                  onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={security.twoFactorEnabled}
                      onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSecuritySave}
                  disabled={loading}
                >
                  Update Security Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Notification Settings */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Email Notifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.emailAlerts}
                      onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                    />
                  }
                  label="Email Alerts"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.scanComplete}
                      onChange={(e) => setNotifications({ ...notifications, scanComplete: e.target.checked })}
                    />
                  }
                  label="Scan Completion Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.weeklyReport}
                      onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                    />
                  }
                  label="Weekly Security Reports"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.securityAlerts}
                      onChange={(e) => setNotifications({ ...notifications, securityAlerts: e.target.checked })}
                    />
                  }
                  label="Critical Security Alerts"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.marketingEmails}
                      onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                    />
                  }
                  label="Marketing Communications"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleNotificationsSave}
                  disabled={loading}
                >
                  Save Notification Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* API Settings */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings({ ...apiSettings, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Contact support to generate an API key"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={apiSettings.webhookUrl}
                  onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                  placeholder="https://your-domain.com/webhook"
                  helperText="Receive real-time scan updates"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rate Limit</InputLabel>
                  <Select
                    value={apiSettings.rateLimit}
                    onChange={(e) => setApiSettings({ ...apiSettings, rateLimit: e.target.value })}
                    label="Rate Limit"
                  >
                    <MenuItem value="100">100 requests/hour</MenuItem>
                    <MenuItem value="500">500 requests/hour</MenuItem>
                    <MenuItem value="1000">1000 requests/hour</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleApiSave}
                  disabled={loading}
                >
                  Save API Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;