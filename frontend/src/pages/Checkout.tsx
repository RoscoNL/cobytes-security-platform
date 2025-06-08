import React, { useState, useEffect } from 'react';
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Cart {
  id: number;
  items: any[];
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
}

interface BillingData {
  billing_name: string;
  billing_email: string;
  billing_company: string;
  billing_address: string;
  billing_city: string;
  billing_postal_code: string;
  billing_country: string;
  billing_vat_number: string;
  payment_method: string;
  agree_terms: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingData, setBillingData] = useState<BillingData>({
    billing_name: '',
    billing_email: '',
    billing_company: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'NL',
    billing_vat_number: '',
    payment_method: 'multisafepay',
    agree_terms: false,
  });

  const steps = ['Billing Information', 'Payment Method', 'Review & Confirm'];

  useEffect(() => {
    fetchCart();
    // Fetch user data if logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    }
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      if (response.error) {
        console.error('Error fetching cart:', response.error);
        navigate('/cart');
        return;
      }
      if (response.data) {
        setCart(response.data);
        if (!response.data || response.data.items.length === 0) {
          navigate('/cart');
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.error) {
        console.error('Error fetching user data:', response.error);
        return;
      }
      if (response.data) {
        const user = response.data;
        setBillingData(prev => ({
          ...prev,
          billing_name: user.name || '',
          billing_email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setBillingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateBillingInfo = () => {
    const required = [
      'billing_name',
      'billing_email',
      'billing_address',
      'billing_city',
      'billing_postal_code',
      'billing_country',
    ];
    
    for (const field of required) {
      if (!billingData[field as keyof BillingData]) {
        return false;
      }
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingData.billing_email)) {
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateBillingInfo()) {
      return;
    }
    
    if (activeStep === 1 && !billingData.payment_method) {
      return;
    }
    
    if (activeStep === steps.length - 1) {
      handleSubmitOrder();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmitOrder = async () => {
    if (!billingData.agree_terms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Create order
      const orderResponse = await api.post('/api/orders', {
        ...billingData,
        cart_id: cart?.id,
      });
      
      if (orderResponse.error) {
        alert(orderResponse.error);
        setProcessing(false);
        return;
      }
      
      const order = orderResponse.data;
      
      // Redirect to payment based on method
      if (billingData.payment_method === 'multisafepay') {
        navigate(`/orders/${order.id}/pay`);
      } else if (billingData.payment_method === 'invoice') {
        // For invoice, mark as pending and show success
        navigate(`/orders/${order.id}/success`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (loading || !cart) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading checkout...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {activeStep === 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Billing Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Full Name"
                      name="billing_name"
                      value={billingData.billing_name}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="Email Address"
                      name="billing_email"
                      value={billingData.billing_email}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company Name (Optional)"
                      name="billing_company"
                      value={billingData.billing_company}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Address"
                      name="billing_address"
                      value={billingData.billing_address}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="City"
                      name="billing_city"
                      value={billingData.billing_city}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="Postal Code"
                      name="billing_postal_code"
                      value={billingData.billing_postal_code}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Country"
                      name="billing_country"
                      value={billingData.billing_country}
                      onChange={handleInputChange}
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="NL">Netherlands</option>
                      <option value="BE">Belgium</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="GB">United Kingdom</option>
                      <option value="US">United States</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="VAT Number (Optional)"
                      name="billing_vat_number"
                      value={billingData.billing_vat_number}
                      onChange={handleInputChange}
                      helperText="For EU businesses only"
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {activeStep === 1 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Payment Method
                </Typography>
                <RadioGroup
                  name="payment_method"
                  value={billingData.payment_method}
                  onChange={handleInputChange}
                >
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                      value="multisafepay"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1">Online Payment</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pay securely with iDEAL, Credit Card, Bancontact, PayPal and more
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                      value="invoice"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1">Invoice</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pay within 30 days (Business customers only)
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </RadioGroup>
              </>
            )}

            {activeStep === 2 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Review Your Order
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    BILLING INFORMATION
                  </Typography>
                  <Typography>{billingData.billing_name}</Typography>
                  <Typography>{billingData.billing_email}</Typography>
                  {billingData.billing_company && (
                    <Typography>{billingData.billing_company}</Typography>
                  )}
                  <Typography>{billingData.billing_address}</Typography>
                  <Typography>
                    {billingData.billing_city}, {billingData.billing_postal_code}
                  </Typography>
                  <Typography>{billingData.billing_country}</Typography>
                  {billingData.billing_vat_number && (
                    <Typography>VAT: {billingData.billing_vat_number}</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    PAYMENT METHOD
                  </Typography>
                  <Typography>
                    {billingData.payment_method === 'multisafepay' && 'Online Payment (MultiSafepay)'}
                    {billingData.payment_method === 'bank_transfer' && 'Bank Transfer'}
                    {billingData.payment_method === 'invoice' && 'Invoice (NET 30)'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="agree_terms"
                      checked={billingData.agree_terms}
                      onChange={handleInputChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" rel="noopener">
                        Privacy Policy
                      </a>
                    </Typography>
                  }
                />
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={processing}
                endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
              >
                {activeStep === steps.length - 1 ? 'Place Order' : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            {cart.items.map((item: any) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {item.product.name} x {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    {formatPrice(item.price * item.quantity)}
                  </Typography>
                </Box>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2">{formatPrice(cart.subtotal)}</Typography>
            </Box>
            
            {cart.discount_amount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">Discount</Typography>
                <Typography variant="body2" color="success.main">
                  -{formatPrice(cart.discount_amount)}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Tax (21% VAT)</Typography>
              <Typography variant="body2">{formatPrice(cart.tax)}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">
                {formatPrice(cart.total)}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                After payment, you'll receive immediate access to your security scans.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;