import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import cobytesTheme from './theme/cobytes-theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Pricing from './pages/Pricing';
import FreeScan from './pages/FreeScan';
import Contact from './pages/Contact';
import AllScanners from './pages/AllScanners';
import ScanDemo from './pages/ScanDemo';
import HowTo from './pages/HowTo';

// Protected pages
import Dashboard from './pages/Dashboard';
import ScanList from './pages/ScanList';
import ScanCreate from './pages/ScanCreate';
import ScanDetail from './pages/ScanDetail';
import SecurityDashboard from './pages/SecurityDashboard';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// E-commerce pages
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';

// Error pages
import NotFound from './pages/NotFound';

import './App.css';

// Loading component
const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={cobytesTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Auth routes - no layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public routes with layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/products" element={<Products />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/free-scan" element={<FreeScan />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/all-scanners" element={<AllScanners />} />
              <Route path="/scan-demo" element={<ScanDemo />} />
              <Route path="/how-to" element={<HowTo />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/scans" element={
                <ProtectedRoute>
                  <ScanList />
                </ProtectedRoute>
              } />
              
              <Route path="/scans/new" element={
                <ProtectedRoute>
                  <ScanCreate />
                </ProtectedRoute>
              } />
              
              <Route path="/scans/:id" element={
                <ProtectedRoute>
                  <ScanDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/security-dashboard" element={
                <ProtectedRoute>
                  <SecurityDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* E-commerce routes */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              
              <Route path="/orders/:orderId/success" element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              } />
              
              {/* 404 and redirects */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;