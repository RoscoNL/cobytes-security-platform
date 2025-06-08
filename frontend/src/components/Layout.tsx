import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Scanner as ScannerIcon,
  Description as DescriptionIcon,
  AttachMoney as PricingIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  History as HistoryIcon,
  PlayArrow as StartScanIcon,
  GetApp as DownloadIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Receipt as OrdersIcon,
} from '@mui/icons-material';
import { cobytesColors } from '../theme/cobytes-theme';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  const publicMenuItems = [
    { text: 'Home', icon: <DashboardIcon />, path: '/', highlight: false },
    { text: 'Products', icon: <CartIcon />, path: '/products', highlight: false },
    { text: 'Pricing', icon: <PricingIcon />, path: '/pricing', highlight: false },
    { text: 'Free Demo', icon: <StartScanIcon />, path: '/scan-demo', highlight: false },
    { text: 'How It Works', icon: <DescriptionIcon />, path: '/how-to', highlight: false },
  ];

  const authenticatedMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', highlight: false },
    { text: 'Start New Scan', icon: <StartScanIcon />, path: '/dashboard/scans/new', highlight: true },
    { text: 'divider', icon: null, path: '', highlight: false },
    { text: 'My Scans', icon: <AssessmentIcon />, path: '/dashboard/scans', highlight: false },
    { text: 'Scan Reports', icon: <DownloadIcon />, path: '/dashboard/reports', highlight: false },
    { text: 'divider', icon: null, path: '', highlight: false },
    { text: 'Security Overview', icon: <SecurityIcon />, path: '/security-dashboard', highlight: false },
    { text: 'All Scanners', icon: <ScannerIcon />, path: '/dashboard/scanners', highlight: false },
    { text: 'divider', icon: null, path: '', highlight: false },
    { text: 'My Orders', icon: <OrdersIcon />, path: '/orders', highlight: false },
  ];

  const menuItems = isAuthenticated ? authenticatedMenuItems : publicMenuItems;

  const drawer = (
    <Box>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: cobytesColors.orange,
            textDecoration: 'none',
          }}
          component={Link}
          to="/dashboard"
        >
          Cobytes Security
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          item.text === 'divider' ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  backgroundColor: item.highlight ? `${cobytesColors.orange}10` : 'transparent',
                  '&.Mui-selected': {
                    backgroundColor: `${cobytesColors.orange}15`,
                    borderLeft: `3px solid ${cobytesColors.orange}`,
                    '&:hover': {
                      backgroundColor: `${cobytesColors.orange}25`,
                    },
                  },
                  '&:hover': {
                    backgroundColor: item.highlight ? `${cobytesColors.orange}20` : `${cobytesColors.orange}10`,
                  },
                  my: item.highlight ? 0.5 : 0,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: item.highlight ? cobytesColors.orange : location.pathname === item.path ? cobytesColors.orange : cobytesColors.gray700,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: item.highlight ? 600 : location.pathname === item.path ? 600 : 400,
                      color: item.highlight ? cobytesColors.orange : location.pathname === item.path ? cobytesColors.orange : cobytesColors.gray900,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: cobytesColors.gray100 }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: `1px solid ${cobytesColors.gray100}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Cobytes Security Platform'}
          </Typography>
          
          {!isAuthenticated ? (
            <>
              <Button
                variant="outlined"
                onClick={() => navigate('/cart')}
                startIcon={<CartIcon />}
                sx={{
                  borderColor: cobytesColors.orange,
                  color: cobytesColors.orange,
                  '&:hover': { 
                    borderColor: cobytesColors.coral,
                    bgcolor: `${cobytesColors.orange}10`,
                  },
                  mr: 2,
                }}
              >
                Cart
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: cobytesColors.orange,
                  '&:hover': { bgcolor: cobytesColors.coral },
                }}
              >
                Login
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/dashboard/scans/new')}
                sx={{
                  bgcolor: cobytesColors.orange,
                  '&:hover': { bgcolor: cobytesColors.coral },
                  mr: 2,
                }}
              >
                Start Scan
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  avatar={<Avatar sx={{ bgcolor: cobytesColors.navy }}>{user?.email?.[0]?.toUpperCase()}</Avatar>}
                  label={user?.email || 'User'}
                  onClick={handleMenu}
                  sx={{ cursor: 'pointer' }}
                />
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    My Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => { handleClose(); navigate('/orders'); }}>
                    <ListItemIcon><OrdersIcon fontSize="small" /></ListItemIcon>
                    My Orders
                  </MenuItem>
                  <MenuItem onClick={() => { handleClose(); navigate('/dashboard/scans'); }}>
                    <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
                    Scan History
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              bgcolor: 'background.paper',
              borderRight: `1px solid ${cobytesColors.gray100}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: { md: 240 },
          right: 0,
          bgcolor: 'background.paper',
          borderTop: `1px solid ${cobytesColors.gray100}`,
          py: 2,
          px: 3,
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Cobytes B.V. All rights reserved. | info@cobytes.nl | +31 (0)85 123 4567
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;