import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  PlayArrow as StartScanIcon,
} from '@mui/icons-material';
import { cobytesColors } from '../theme/cobytes-theme';
import { apiClient } from '../services/api';

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    scan_types: string[];
  };
  quantity: number;
  price: number;
  total: number;
  scans_total: number;
  scans_used: number;
  valid_until: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  paid_at?: string;
  items: OrderItem[];
  billing_name: string;
  billing_email: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('/orders');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const response = await fetch(`${apiClient.getBaseURL()}/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to download invoice');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateAvailableScans = (order: Order) => {
    if (order.payment_status !== 'paid') return 0;
    return order.items.reduce((acc, item) => {
      const available = item.scans_total - item.scans_used;
      return acc + (available > 0 ? available : 0);
    }, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading orders...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: cobytesColors.navy }}>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You haven't placed any orders yet.
            </Typography>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                onClick={() => navigate('/products')}
                sx={{
                  bgcolor: cobytesColors.orange,
                  '&:hover': { bgcolor: cobytesColors.coral },
                }}
              >
                Browse Products
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: cobytesColors.gray100 }}>
                <TableCell>Order Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Available Scans</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {order.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.payment_status}
                      color={getStatusColor(order.payment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>€{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {order.payment_status === 'paid' ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {calculateAvailableScans(order)} scans
                        </Typography>
                        {calculateAvailableScans(order) > 0 && (
                          <Button
                            size="small"
                            startIcon={<StartScanIcon />}
                            onClick={() => navigate('/dashboard/scans/new')}
                            sx={{ ml: 1 }}
                          >
                            Use
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrder(order)}
                      sx={{ color: cobytesColors.navy }}
                    >
                      <ViewIcon />
                    </IconButton>
                    {order.payment_status === 'paid' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadInvoice(order.id)}
                        sx={{ color: cobytesColors.orange }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              Order {selectedOrder.order_number}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order Date
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Status
                </Typography>
                <Chip
                  label={selectedOrder.payment_status}
                  color={getStatusColor(selectedOrder.payment_status)}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Items
              </Typography>
              <List>
                {selectedOrder.items.map((item) => (
                  <ListItem key={item.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.product.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity} × €{item.price.toFixed(2)} = €{item.total.toFixed(2)}
                          </Typography>
                          {selectedOrder.payment_status === 'paid' && (
                            <Typography variant="body2" color="primary">
                              Scans: {item.scans_used}/{item.scans_total} used
                              {item.valid_until && ` • Valid until ${new Date(item.valid_until).toLocaleDateString()}`}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Total
                </Typography>
                <Typography variant="h6" color="primary">
                  €{selectedOrder.total.toFixed(2)}
                </Typography>
              </Box>

              {selectedOrder.payment_status === 'paid' && calculateAvailableScans(selectedOrder) > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You have {calculateAvailableScans(selectedOrder)} scans available from this order.
                  <Button
                    size="small"
                    onClick={() => {
                      setDialogOpen(false);
                      navigate('/dashboard/scans/new');
                    }}
                    sx={{ ml: 2 }}
                  >
                    Start a scan
                  </Button>
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              {selectedOrder.payment_status === 'paid' && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadInvoice(selectedOrder.id)}
                  sx={{
                    bgcolor: cobytesColors.orange,
                    '&:hover': { bgcolor: cobytesColors.coral },
                  }}
                >
                  Download Invoice
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Orders;