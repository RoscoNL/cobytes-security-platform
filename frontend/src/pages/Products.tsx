import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Tab,
  Tabs,
  Badge,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  features: string[];
  scan_types: string[];
  scan_credits: number;
  validity_days: number;
  is_featured: boolean;
  is_active: boolean;
}

interface Cart {
  id: number;
  items: any[];
  subtotal: number;
  total: number;
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      setCart(response.data.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      const response = await api.post('/api/cart/add', {
        productId,
        quantity: 1,
      });
      setCart(response.data.data);
      // Show success notification
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const categories = ['all', 'security_scan', 'bundle', 'subscription'] as const;
  const categoryLabels: Record<string, string> = {
    all: 'All Products',
    security_scan: 'Security Scans',
    bundle: 'Bundles',
    subscription: 'Subscriptions',
  };

  const filteredProducts = activeTab === 0 
    ? products 
    : products.filter(p => p.category === categories[activeTab]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Security Products
        </Typography>
        <IconButton
          color="primary"
          onClick={() => navigate('/cart')}
          size="large"
        >
          <Badge badgeContent={cartItemCount} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 4 }}
      >
        {categories.map((category, index) => (
          <Tab key={category} label={categoryLabels[category]} />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} md={6} lg={4} key={product.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                ...(product.is_featured && {
                  border: '2px solid',
                  borderColor: 'primary.main',
                })
              }}
            >
              {product.is_featured && (
                <Chip
                  label="Featured"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  }}
                />
              )}
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {product.name}
                </Typography>
                <Typography 
                  variant="h4" 
                  color="primary" 
                  gutterBottom
                  fontWeight="bold"
                >
                  {formatPrice(product.price)}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  paragraph
                >
                  {product.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {product.features.map((feature, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 0.5 
                      }}
                    >
                      <CheckIcon 
                        fontSize="small" 
                        color="success" 
                        sx={{ mr: 1 }} 
                      />
                      <Typography variant="body2">
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {product.category === 'subscription' && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 2, display: 'block' }}
                  >
                    Billed monthly • Cancel anytime
                  </Typography>
                )}
                {product.validity_days && product.category !== 'subscription' && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 2, display: 'block' }}
                  >
                    Valid for {product.validity_days} days
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => addToCart(product.id)}
                >
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Products;