import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon
} from '@mui/icons-material';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simulate form submission
    try {
      // In a real app, this would send to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just show success
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Contact Us
      </Typography>
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
        Get in touch with our security experts
      </Typography>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Get in Touch
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Have questions about our security scanning services? We're here to help.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmailIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="subtitle2">Email</Typography>
                <Typography variant="body2" color="text.secondary">
                  info@cobytes.nl
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" mb={2}>
              <PhoneIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography variant="body2" color="text.secondary">
                  +31 (0)85 123 4567
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center">
              <LocationIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="subtitle2">Office</Typography>
                <Typography variant="body2" color="text.secondary">
                  Amsterdam, Netherlands
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Business Hours
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monday - Friday: 9:00 AM - 6:00 PM CET<br />
              Saturday - Sunday: Closed
            </Typography>
          </Box>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    data-testid="contact-name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    data-testid="contact-email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    data-testid="contact-subject"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Message"
                    name="message"
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    data-testid="contact-message"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    endIcon={<SendIcon />}
                    disabled={loading}
                    data-testid="contact-submit"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" data-testid="success-message">
          Message sent successfully! We'll get back to you soon.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Contact;