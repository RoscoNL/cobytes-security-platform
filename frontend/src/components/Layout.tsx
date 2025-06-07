import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { cobytesColors } from '../theme/cobytes-theme';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Security Dashboard', icon: <SecurityIcon />, path: '/security-dashboard' },
    { text: 'Scans', icon: <AssessmentIcon />, path: '/dashboard/scans' },
    { text: 'Reports', icon: <DescriptionIcon />, path: '/dashboard/reports' },
    { text: 'All Scanners', icon: <ScannerIcon />, path: '/dashboard/scanners' },
    { text: 'Pricing', icon: <PricingIcon />, path: '/dashboard/pricing' },
  ];

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
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: `${cobytesColors.orange}15`,
                  borderLeft: `3px solid ${cobytesColors.orange}`,
                  '&:hover': {
                    backgroundColor: `${cobytesColors.orange}25`,
                  },
                },
                '&:hover': {
                  backgroundColor: `${cobytesColors.orange}10`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? cobytesColors.orange : cobytesColors.gray700,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? cobytesColors.orange : cobytesColors.gray900,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
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
            New Scan
          </Button>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              color: cobytesColors.gray700,
              '&:hover': { color: cobytesColors.navy },
            }}
          >
            <LogoutIcon />
          </IconButton>
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