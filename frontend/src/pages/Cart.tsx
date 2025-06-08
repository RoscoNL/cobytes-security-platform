import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
  };
  quantity: number;
  price: number;
  configuration?: any;
}

interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  coupon_code?: string;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      if (response.error) {
        console.error('Error fetching cart:', response.error);
      } else if (response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cart) return;
    
    try {
      const response = await api.put(`/api/cart/${cart.id}/items/${itemId}`, {
        quantity,
      });
      if (response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!cart) return;
    
    try {
      const response = await api.delete(`/api/cart/${cart.id}/items/${itemId}`);
      if (response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const applyCoupon = async () => {
    if (!cart || !couponCode) return;
    
    try {
      const response = await api.post(`/api/cart/${cart.id}/coupon`, {
        couponCode,
      });
      if (response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
    }
  };

  const removeCoupon = async () => {
    if (!cart) return;
    
    try {
      const response = await api.delete(`/api/cart/${cart.id}/coupon`);
      if (response.data) {
        setCart(response.data);
      }
      setCouponCode('');
    } catch (error) {
      console.error('Error removing coupon:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const proceedToCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading cart...</Typography>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography color="text.secondary" paragraph>
            Add some security products to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
          >
            Browse Products
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/products')}
        sx={{ mb: 3 }}
      >
        Continue Shopping
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Shopping Cart
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {cart.items.map((item) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {formatPrice(item.price)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 2, minWidth: 40, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" sx={{ minWidth: 100, textAlign: 'right' }}>
                    {formatPrice(item.price * item.quantity)}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={() => removeItem(item.id)}
                    sx={{ ml: 2 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Divider />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>{formatPrice(cart.subtotal)}</Typography>
                </Box>
                
                {cart.discount_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Discount</Typography>
                    <Typography color="success.main">
                      -{formatPrice(cart.discount_amount)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax (21% VAT)</Typography>
                  <Typography>{formatPrice(cart.tax)}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(cart.total)}
                  </Typography>
                </Box>
              </Box>

              {!cart.coupon_code ? (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={applyCoupon}
                    disabled={!couponCode}
                  >
                    Apply Coupon
                  </Button>
                </Box>
              ) : (
                <Alert
                  severity="success"
                  onClose={removeCoupon}
                  sx={{ mt: 2 }}
                >
                  Coupon "{cart.coupon_code}" applied
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={proceedToCheckout}
                sx={{ mt: 3 }}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;