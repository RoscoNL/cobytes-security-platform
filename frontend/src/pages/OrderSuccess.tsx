import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Order {
  id: number;
  order_number: string;
  total: number;
  payment_status: string;
  items: any[];
}

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error">{error || 'Order not found'}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon 
          sx={{ 
            fontSize: 80, 
            color: 'success.main', 
            mb: 3 
          }} 
        />
        
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Payment Successful!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Thank you for your order
        </Typography>

        <Box 
          sx={{ 
            bgcolor: 'grey.100', 
            p: 3, 
            borderRadius: 2, 
            my: 4,
            textAlign: 'left'
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Order Number
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {order.order_number}
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Total Paid
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatPrice(order.total)}
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Items Purchased
          </Typography>
          {order.items.map((item: any, index: number) => (
            <Typography key={index} variant="body2">
              • {item.product.name} ({item.quantity}x)
            </Typography>
          ))}
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          You can now start using your security scans. Check your email for 
          the receipt and further instructions.
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate(`/orders/${orderId}`)}
          >
            View Order Details
          </Button>
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderSuccess;