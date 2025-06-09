import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrderPayment: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  useEffect(() => {
    initializePayment();
  }, [orderId]);

  const initializePayment = async () => {
    try {
      const response = await api.post(`/orders/${orderId}/payment/initialize`);
      const { paymentUrl: url, invoiceCode } = response.data.data;
      
      if (url) {
        setPaymentUrl(url);
        // Redirect to MultiSafepay payment page after 2 seconds
        setTimeout(() => {
          window.location.href = url;
        }, 2000);
      } else {
        setError('Failed to get payment URL from MultiSafepay');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setError(error.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="h6">
            Preparing secure payment...
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            You will be redirected to MultiSafepay for secure payment
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/cart')}
            >
              Back to Cart
            </Button>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <PaymentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Redirecting to secure payment...
        </Typography>
        <Typography color="text.secondary" paragraph>
          You are being redirected to MultiSafepay to complete your payment securely.
        </Typography>
        <CircularProgress sx={{ mt: 3 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          If you are not redirected automatically,{' '}
          <a href={paymentUrl} style={{ color: 'inherit' }}>
            click here
          </a>
        </Typography>
      </Paper>
    </Container>
  );
};

export default OrderPayment;