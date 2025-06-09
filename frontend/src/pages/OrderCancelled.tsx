import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  ShoppingCart as ShoppingCartIcon,
  ContactSupport as ContactSupportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrderCancelled: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Try to fetch order number if possible
    if (orderId) {
      api.get(`/orders/${orderId}`)
        .then(response => {
          setOrderNumber(response.data.data.order_number);
        })
        .catch(() => {
          // Ignore errors - order might not be accessible
        });
    }
  }, [orderId]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CancelIcon 
          sx={{ 
            fontSize: 80, 
            color: 'error.main', 
            mb: 3 
          }} 
        />
        
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Payment Cancelled
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Your payment was cancelled or declined. No charges have been made to your account.
        </Typography>

        {orderNumber && (
          <Alert severity="info" sx={{ my: 3 }}>
            Order #{orderNumber} has been cancelled
          </Alert>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your items are still in your cart. You can try again or contact support if you need assistance.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ContactSupportIcon />}
            onClick={() => window.location.href = 'mailto:support@cobytes.nl'}
          >
            Contact Support
          </Button>
          <Button
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/cart')}
          >
            Return to Cart
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderCancelled;